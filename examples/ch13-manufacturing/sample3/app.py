"""
牧童 · 物料看板后端（index.html 配套）

启动：
  pip install -r requirements.txt
  python app.py

服务：
  http://localhost:1001/pages/index.html   物料看板页面
  http://localhost:1001/apidocs                            Swagger 文档

包含：
  · POST /api/agent/analyze              百炼 Agent 分析
  · POST /api/agent/mutong/analyze         牧童 Agent 分析（流式代理）
  · POST /api/agent/deepseek/analyze     DeepSeek 分析（流式）
  · POST /api/agent/deepseek/analyze/sync DeepSeek 分析（同步）
  · POST /api/feishu/send                飞书消息推送
  · GET  /api/health[/agents]            健康检查
  · /api/hitl/*                          HITL 人工审批工作流

公式算数字，百炼写人话。公式不调百炼，百炼不算数学。
"""

import json
import os
import time
import logging
import requests as req
from datetime import datetime
from typing import Any
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, redirect
from flask_cors import CORS
from flasgger import Swagger
from openai import OpenAI
from httpx import Client as HttpxClient

load_dotenv()

# ---- 日志 ----
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

app.config["SWAGGER"] = {
    "title": "牧童 · 物料看板后端",
    "description": "百炼/牧童/DeepSeek Agent 分析 + 飞书消息推送 + HITL 人工审批",
    "version": "2.0.0",
    "uiversion": 3,
}
swagger = Swagger(app)

# ============================================================
# 百炼配置
# ============================================================
BAILIAN_API_KEY = os.getenv("BAILIAN_API_KEY", "")
BAILIAN_BASE_URL = os.getenv("BAILIAN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
BAILIAN_MODEL = os.getenv("BAILIAN_MODEL", "qwen-plus")

bailian_client = None
if BAILIAN_API_KEY:
    bailian_client = OpenAI(api_key=BAILIAN_API_KEY, base_url=BAILIAN_BASE_URL)
else:
    logger.warning("BAILIAN_API_KEY 未设置，Agent 分析将返回 mock 结果")

# ============================================================
# 牧童 Agent 配置
# ============================================================
MUTONG_AGENT_URL = os.getenv("MUTONG_AGENT_URL", "")
MUTONG_AGENT_KEY = os.getenv("MUTONG_AGENT_KEY", "")

# 无 Key 的内网 Agent（如 agent-03c724）：去掉 Authorization 头，避免 "鉴权失败"
def _no_auth_http_client():
    def _drop_auth(request):
        request.headers.pop("Authorization", None)
    return HttpxClient(event_hooks={"request": [_drop_auth]})

# 牧童 Agent 有 Key 时用默认 client（带 Authorization），无 Key 时用无认证 client
mutong_client = OpenAI(
    api_key=MUTONG_AGENT_KEY or "no-key",
    base_url=MUTONG_AGENT_URL,
    http_client=_no_auth_http_client() if not MUTONG_AGENT_KEY else None,
) if MUTONG_AGENT_URL else None

# ============================================================
# DeepSeek 配置
# ============================================================
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-pro")

deepseek_client = None
if DEEPSEEK_API_KEY:
    deepseek_client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
else:
    logger.warning("DEEPSEEK_API_KEY 未设置，DeepSeek 分析将返回 mock 结果")

# ============================================================
# 飞书配置
# ============================================================
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "")
FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "")
FEISHU_BASE = "https://open.feishu.cn"

# 目标用户 open_id（测试用，从 /api/user-list 获取）
FEISHU_DEFAULT_USER = os.getenv("FEISHU_USER_ID", "")

feishu_token_cache: dict[str, Any] = {"token": None, "expires_at": 0}


def feishu_api(method: str, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
    """调飞书开放 API"""
    url = f"{FEISHU_BASE}{path}"
    headers = {"Content-Type": "application/json; charset=utf-8"}
    if feishu_token_cache["token"]:
        headers["Authorization"] = f"Bearer {feishu_token_cache['token']}"

    try:
        if method == "GET":
            resp = req.get(url, headers=headers, timeout=30)
        elif method == "POST":
            resp = req.post(url, headers=headers, json=body, timeout=30)
        elif method == "PATCH":
            resp = req.patch(url, headers=headers, json=body, timeout=30)
        elif method == "DELETE":
            resp = req.delete(url, headers=headers, json=body, timeout=30)
        else:
            return {"status": 405, "data": {"error": f"不支持的 HTTP 方法: {method}"}}
        return {"status": resp.status_code, "data": resp.json() if resp.text else {}}
    except req.RequestException as e:
        logger.error(f"飞书 API 请求失败: {e}")
        return {"status": 500, "data": {"error": str(e)}}


def feishu_get_token():
    """获取 tenant_access_token，带缓存"""
    now = time.time()
    if feishu_token_cache["token"] and now < feishu_token_cache["expires_at"] - 60:
        return feishu_token_cache["token"]

    r = feishu_api("POST", "/open-apis/auth/v3/tenant_access_token/internal",
                    body={"app_id": FEISHU_APP_ID, "app_secret": FEISHU_APP_SECRET})
    data = r.get("data", {})
    if data.get("tenant_access_token"):
        feishu_token_cache["token"] = data["tenant_access_token"]
        feishu_token_cache["expires_at"] = now + data.get("expire", 7200)
        logger.info(f"[飞书] Token 获取成功")
        return feishu_token_cache["token"]
    raise Exception(f"飞书 Token 获取失败: {data}")


def feishu_send_message(receive_id_type, receive_id, msg_type, content):
    """发送飞书消息"""
    feishu_get_token()  # 先确保 token 在缓存中
    body = {"receive_id": receive_id, "msg_type": msg_type, "content": content}
    return feishu_api("POST",
                      f"/open-apis/im/v1/messages?receive_id_type={receive_id_type}",
                      body=body)


def feishu_send_card(receive_id_type, receive_id, card_json):
    """发送飞书卡片消息"""
    return feishu_send_message(receive_id_type, receive_id, "interactive",
                               json.dumps(card_json, ensure_ascii=False))


# ============================================================
# HITL — 人工审批工作流（生产数据 → 牧童 Agent → 飞书卡片审批）
# 本地环境无法接收飞书卡片回调 → 卡片按钮用 URL 链接模式打开本地审批页
# ============================================================
import threading
import uuid as _uuid

_HITL_LOCK = threading.Lock()
_HITL_ACTIVE = {}    # approval_id → item（运行中/等待审批）
_HITL_HISTORY = []   # 已完成记录（含审批结果，最多 30 条）

HITL_TIMEOUT_SECONDS = 600  # 审批超时（秒），超时自动驳回
HITL_MUTONG_TIMEOUT = 60      # 牧童 Agent 调用超时（秒）


def _hitl_add_timeline(item, msg):
    item["timeline"].append({"time": datetime.now().strftime("%H:%M:%S"), "msg": msg})


def _hitl_risk_from_text(text: str) -> str:
    """从 牧童 分析文本中解析风险等级"""
    t = text or ""
    if any(k in t for k in ("🔴", "紧急", "P0", "critical", "立即", "停线")):
        return "high"
    if any(k in t for k in ("🟡", "需关注", "关注", "warn", "告警")):
        return "medium"
    return "low"


def _hitl_call_mutong(prompt: str):
    """同步调用 牧童 Agent，失败返回 None"""
    if not mutong_client:
        return None
    try:
        resp = mutong_client.chat.completions.create(
            model="default",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            timeout=HITL_MUTONG_TIMEOUT,
        )
        return resp.choices[0].message.content
    except Exception as e:
        logger.error(f"[HITL] 牧童 Agent 调用失败: {e}")
        return None


def _hitl_build_approval_card(item: dict[str, Any]) -> dict[str, Any]:
    """构造飞书审批卡片——按钮为 URL 链接（本地环境无法接收飞书回调）"""
    aid = item["approval_id"]
    base = item.get("base_url", "http://localhost:1001")
    m = item["material"]
    approve_url = f"{base}hitl/page/approve/{aid}"
    reject_url = f"{base}hitl/page/reject/{aid}"
    risk_label = {"high": "🔴 紧急", "medium": "🟡 需关注", "low": "🟢 正常"}[item["risk"]]
    return {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": "⏸️ 人工审批 · 生产物料处置"},
            "template": "red" if item["risk"] == "high" else "orange",
        },
        "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": (
                f"**物料：**{m.get('name', '?')}（{m.get('pn', '')}）\n"
                f"**供应商：**{m.get('supplier', '')}\n"
                f"**库存状态：**当前 {m.get('stock', '?')} {m.get('unit', '')}，"
                f"预计 {m.get('exhaustion', '?')} 耗尽\n"
                f"**风险等级：**{risk_label}"
            )}},
            {"tag": "hr"},
            {"tag": "div", "text": {"tag": "lark_md", "content": f"**牧童 Agent 分析摘要：**\n{item['analysis'][:300]}"}},
            {"tag": "hr"},
            {"tag": "div", "text": {"tag": "lark_md", "content": "点击下方按钮，在浏览器中完成审批：\n**通过** = 按 Agent 建议生成处置指令\n**驳回** = 取消方案，可填写驳回意见"}},
            {"tag": "action", "actions": [
                {"tag": "button", "text": {"tag": "plain_text", "content": "✅ 通过审批"},
                 "type": "primary", "url": approve_url},
                {"tag": "button", "text": {"tag": "plain_text", "content": "❌ 驳回审批"},
                 "type": "danger", "url": reject_url},
            ]},
        ],
    }


def _hitl_notify_feishu(item: dict[str, Any]):
    """推送飞书审批卡片；失败不阻塞主流程（平台页面仍可审批）"""
    try:
        card = _hitl_build_approval_card(item)
        r = feishu_send_card("open_id", FEISHU_DEFAULT_USER, card)
        code = r.get("data", {}).get("code")
        if code == 0:
            logger.info(f"[HITL] 飞书审批卡片已发送 → {FEISHU_DEFAULT_USER}")
            _hitl_add_timeline(item, "📨 飞书审批卡片已发送")
        else:
            logger.warning(f"[HITL] 飞书卡片发送失败: {r.get('data', {})}")
            _hitl_add_timeline(item, "⚠️ 飞书卡片发送失败（可在平台页面审批）")
    except Exception as e:
        logger.warning(f"[HITL] 飞书通知异常: {e}")
        _hitl_add_timeline(item, "⚠️ 飞书不可用（可在平台页面审批）")


def _hitl_execute(item: dict[str, Any]):
    """审批通过后：牧童 Agent 生成最终处置指令 + 推飞书结果"""
    _hitl_add_timeline(item, "✅ 人工审批通过，生成处置指令...")
    m = item["material"]
    prompt = (
        f"人工审批已通过。请基于你的分析结果，生成最终处置指令。\n"
        f"物料：{m.get('name')}（{m.get('pn')}）\n"
        f"要求：按步骤列出执行动作、责任工位、预计耗时。"
    )
    result = _hitl_call_mutong(prompt)
    if not result:
        result = "（牧童 Agent 不可用）按分析建议执行：推料救急 → 确认在途 → 复盘根因"
    item["execute_result"] = result
    item["status"] = "done"
    _hitl_add_timeline(item, "📋 处置指令已生成")
    try:
        feishu_send_message("open_id", FEISHU_DEFAULT_USER, "text", json.dumps({
            "text": (f"✅ HITL 审批通过 · {m.get('name')}（{m.get('pn')}）\n\n"
                     f"处置指令：\n{result[:500]}\n\n审批意见：{item.get('comment') or '无'}")
        }, ensure_ascii=False))
        _hitl_add_timeline(item, "📨 处置指令已推送飞书")
    except Exception as e:
        logger.warning(f"[HITL] 结果推送失败: {e}")


def _hitl_finish(item: dict[str, Any]):
    item["finished_at"] = datetime.now().strftime("%H:%M:%S")
    with _HITL_LOCK:
        _HITL_ACTIVE.pop(item["approval_id"], None)
        _HITL_HISTORY.append(item)
        if len(_HITL_HISTORY) > 30:
            _HITL_HISTORY.pop(0)


def _hitl_register(item: dict[str, Any]):
    """流程启动时注册到活动队列（运行中也可见）"""
    with _HITL_LOCK:
        _HITL_ACTIVE[item["approval_id"]] = item


def _hitl_worker(item: dict[str, Any]):
    """后台线程：牧童 分析 → 风险判定 → 人工审批 → 处置"""
    try:
        m = item["material"]
        _hitl_add_timeline(item, "启动 HITL 流程：生产数据已提交")

        # 1. 牧童 Agent 分析
        prompt = build_mutong_prompt(m, item.get("context", ""))
        analysis = _hitl_call_mutong(prompt)
        if not analysis:
            analysis = _mock_analysis(m)
            _hitl_add_timeline(item, "⚠️ 牧童 Agent 不可用，使用规则引擎兜底分析")
        item["analysis"] = analysis
        _hitl_add_timeline(item, "牧童 Agent 分析完成")

        # 2. 风险判定：文本分析 + 耗尽时间双保险
        risk = _hitl_risk_from_text(analysis)
        ex_min = m.get("exhaustionMinutes", 999)
        if ex_min <= 30:
            risk = "high"
        elif ex_min < 120 and risk == "low":
            risk = "medium"
        item["risk"] = risk
        _hitl_add_timeline(item, f"风险判定：{'高' if risk == 'high' else '中' if risk == 'medium' else '低'}")

        # 3. 低风险 → 自动通过；中高风险 → 人工审批
        if risk == "low":
            item["approval_status"] = "auto_approved"
            _hitl_add_timeline(item, "🟢 低风险，自动通过（无需人工）")
            _hitl_execute(item)
            _hitl_finish(item)
            return

        item["approval_status"] = "waiting"
        item["event"] = threading.Event()
        _hitl_add_timeline(item, "⏸️ 进入人工审批，等待确认...")

        # 4. 飞书卡片 + 等待审批
        _hitl_notify_feishu(item)
        item["event"].wait(HITL_TIMEOUT_SECONDS)
        if item["result"] is None:
            item["result"] = {"approved": False}
            item["comment"] = item.get("comment") or "审批超时，自动驳回"
            _hitl_add_timeline(item, "⏰ 审批超时，自动驳回")

        # 5. 处置
        if item["result"].get("approved"):
            item["approval_status"] = "approved"
            _hitl_execute(item)
        else:
            item["approval_status"] = "rejected"
            item["status"] = "done"
            _hitl_add_timeline(item, "❌ 审批驳回，处置方案已取消")
            try:
                feishu_send_message("open_id", FEISHU_DEFAULT_USER, "text", json.dumps({
                    "text": f"❌ HITL 审批驳回 · {m.get('name')}（{m.get('pn')}）\n\n驳回意见：{item.get('comment') or '无'}\n处置方案已取消。"
                }, ensure_ascii=False))
            except Exception:
                pass
        _hitl_finish(item)
    except Exception as e:
        logger.error(f"[HITL] 工作流异常: {e}")
        item["status"] = "error"
        item["error"] = str(e)
        _hitl_finish(item)


# ═══ HITL 审批页面（飞书卡片按钮的 URL 目标）═══

HITL_PAGE_HTML = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HITL 人工审批 · 牧童电动车</title>
<style>
  body{font-family:system-ui,-apple-system;max-width:640px;margin:40px auto;padding:20px;background:#f5f6f8}
  .card{border-radius:12px;padding:24px;border-left:4px solid #dc2626;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  h1{font-size:20px;margin-bottom:16px} pre{background:#f3f4f6;padding:12px;border-radius:8px;font-size:14px;white-space:pre-wrap}
  .meta{font-size:14px;color:#374151;line-height:1.8}
  .actions{margin-top:20px;display:flex;gap:12px}
  button{padding:10px 24px;border:none;border-radius:8px;font-size:16px;cursor:pointer;color:white}
  .approve{background:#16a34a}.reject{background:#dc2626}
  textarea{width:100%;margin-top:12px;border:1px solid #d1d5db;border-radius:8px;padding:8px;font-size:14px;box-sizing:border-box}
  .result{display:none;margin-top:20px;padding:16px;border-radius:8px;font-size:18px}
  .result.ok{display:block;background:#dcfce7;color:#166534}
  .result.no{display:block;background:#fef2f2;color:#991b1b}
</style></head><body>
<div class="card">
  <h1>{{ title }}</h1>
  <div class="meta">
    <strong>物料：</strong>{{ material_name }}（{{ material_pn }}）<br>
    <strong>风险等级：</strong>{{ risk_label }}<br>
    <strong>审批 ID：</strong>{{ approval_id }}<br>
    <strong>牧童 Agent 分析：</strong>
  </div>
  <pre>{{ summary }}</pre>
  <div id="actions">
    <textarea id="comment" rows="2" placeholder="审批意见（选填，驳回时建议填写）"></textarea>
    <div class="actions">
      <button class="approve" onclick="submit('approve')">✅ 通过审批</button>
      <button class="reject" onclick="submit('reject')">❌ 驳回审批</button>
    </div>
  </div>
</div>
<div class="result" id="result"></div>
<script>
async function submit(action){
  const btns=document.querySelectorAll('button');btns.forEach(b=>b.disabled=true);
  const resp=await fetch('/api/hitl/'+action,{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({approval_id:'{{ approval_id }}',comment:document.getElementById('comment').value})});
  const r=document.getElementById('result');
  if(resp.ok){r.className='result ok';r.textContent=action==='approve'?'✅ 已通过：处置指令已生成并推送飞书':'❌ 已驳回：处置方案已取消';}
  else{r.className='result no';r.textContent='处理失败，请重试';btns.forEach(b=>b.disabled=false);}
}
</script></body></html>"""


@app.route("/api/hitl/start", methods=["POST"])
def hitl_start():
    """启动 HITL 流程：生产数据 → 牧童 Agent → 人工审批（飞书卡片 + 页面审批）
    ---
    tags: [HITL]
    description: |
      接收生产线物料数据，后台线程调用 牧童 Agent 分析并判定风险等级：
      - low：自动通过，直接生成处置指令
      - medium/high：发送飞书审批卡片（按钮打开本服务审批页面）+ 平台页面可同步审批
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [material]
          properties:
            material:
              type: object
              required: [name, stock, unit, burnRate, exhaustionMinutes]
            context: {type: string, description: 附加上下文}
    """
    data = request.get_json(silent=True) or {}
    material = data.get("material")
    if not material or not material.get("name"):
        return jsonify({"code": -1, "message": "缺少 material 数据"}), 400

    approval_id = _uuid.uuid4().hex[:8]
    item = {
        "approval_id": approval_id,
        "material": material,
        "context": data.get("context", ""),
        "base_url": request.host_url.rstrip("/") + "/",
        "analysis": "",
        "risk": "low",
        "approval_status": "pending",
        "status": "running",
        "event": None,
        "result": None,
        "comment": "",
        "execute_result": "",
        "timeline": [],
        "started_at": datetime.now().strftime("%H:%M:%S"),
    }
    threading.Thread(target=_hitl_worker, args=(item,), daemon=True).start()
    _hitl_register(item)
    logger.info(f"[HITL] 流程已启动: {approval_id} 物料 {material.get('name')}")
    return jsonify({"code": 0, "data": {"approval_id": approval_id, "message": "HITL 流程已启动"}})


@app.route("/api/hitl/pending", methods=["GET"])
def hitl_pending():
    """查询活动流程列表（含运行中和待审批）"""
    with _HITL_LOCK:
        items = [{
            "approval_id": aid,
            "material_name": it["material"].get("name", ""),
            "material_pn": it["material"].get("pn", ""),
            "risk": it["risk"],
            "approval_status": it["approval_status"],
            "analysis": it["analysis"][:200],
            "started_at": it["started_at"],
        } for aid, it in _HITL_ACTIVE.items()]
    waiting = [i for i in items if i["approval_status"] == "waiting"]
    return jsonify({"pending": items, "waiting": len(waiting), "count": len(items)})


@app.route("/api/hitl/approve", methods=["POST"])
def hitl_approve():
    """通过审批"""
    data = request.get_json(silent=True) or {}
    aid = data.get("approval_id", "")
    with _HITL_LOCK:
        item = _HITL_ACTIVE.get(aid)
    if not item or item["approval_status"] != "waiting":
        return jsonify({"error": f"审批项 {aid} 不存在或已处理"}), 404
    item["result"] = {"approved": True}
    item["comment"] = data.get("comment", "")
    item["event"].set()
    logger.info(f"[HITL] 审批通过: {aid}")
    return jsonify({"status": "ok", "message": "已通过"})


@app.route("/api/hitl/reject", methods=["POST"])
def hitl_reject():
    """驳回审批"""
    data = request.get_json(silent=True) or {}
    aid = data.get("approval_id", "")
    with _HITL_LOCK:
        item = _HITL_ACTIVE.get(aid)
    if not item or item["approval_status"] != "waiting":
        return jsonify({"error": f"审批项 {aid} 不存在或已处理"}), 404
    item["result"] = {"approved": False}
    item["comment"] = data.get("comment", "")
    item["event"].set()
    logger.info(f"[HITL] 审批驳回: {aid}")
    return jsonify({"status": "ok", "message": "已驳回"})


@app.route("/api/hitl/status/<aid>", methods=["GET"])
def hitl_status(aid):
    """查询单个流程状态"""
    with _HITL_LOCK:
        item = _HITL_ACTIVE.get(aid)
        if not item:
            for h in _HITL_HISTORY:
                if h["approval_id"] == aid:
                    item = h
                    break
    if not item:
        return jsonify({"error": "流程不存在"}), 404
    return jsonify({
        "approval_id": aid,
        "status": item["status"],
        "approval_status": item["approval_status"],
        "risk": item["risk"],
        "analysis": item["analysis"],
        "execute_result": item["execute_result"],
        "comment": item["comment"],
        "timeline": item["timeline"],
    })


@app.route("/api/hitl/history", methods=["GET"])
def hitl_history():
    """查询 HITL 历史记录"""
    with _HITL_LOCK:
        items = [{
            "approval_id": it["approval_id"],
            "material_name": it["material"].get("name", ""),
            "risk": it["risk"],
            "approval_status": it["approval_status"],
            "started_at": it["started_at"],
            "finished_at": it.get("finished_at", ""),
        } for it in _HITL_HISTORY]
    return jsonify({"history": items, "count": len(items)})


@app.route("/hitl/page/approve/<aid>")
def hitl_approve_page(aid):
    """飞书卡片「通过」按钮打开的审批页面"""
    return _hitl_render_page(aid, "approve")


@app.route("/hitl/page/reject/<aid>")
def hitl_reject_page(aid):
    """飞书卡片「驳回」按钮打开的审批页面"""
    return _hitl_render_page(aid, "reject")


def _hitl_render_page(aid, default_action):
    from flask import render_template_string
    with _HITL_LOCK:
        item = _HITL_ACTIVE.get(aid)
    if not item:
        return f"<h1>审批项 {aid} 已处理或不存在</h1>", 404
    risk_label = {"high": "🔴 紧急", "medium": "🟡 需关注", "low": "🟢 正常"}[item["risk"]]
    title = "✅ 审批确认 — 通过后生成处置指令" if default_action == "approve" else "❌ 审批确认 — 驳回后取消处置方案"
    return render_template_string(
        HITL_PAGE_HTML,
        title=title,
        material_name=item["material"].get("name", ""),
        material_pn=item["material"].get("pn", ""),
        risk_label=risk_label,
        approval_id=aid,
        summary=item["analysis"],
    )


# ============================================================
# 百炼 Prompt
# ============================================================

SYSTEM_PROMPT = """你是一个制造企业物料管理顾问 Agent。你的任务是根据输入的物料数据，分析物料供应风险，给出可执行的建议。

规则：
1. 不要重复输入数据中的数字——数字已经展示在页面上，你只需要分析"为什么"和"怎么办"
2. 如果物料已耗尽（存量=0或负数），给出紧急响应方案：如何最快恢复、受影响的工位范围
3. 如果即将耗尽（预测时间 < 60 分钟），判断在途订单是否来得及、是否需要人工应急、是否从邻近产线调拨
4. 如果预测时间在 1-8 小时之间，关注消耗趋势是否异常、供应商近期表现、排产变化
5. 建议必须具体可执行——不是"加强管理"这种空话，而是"从2号线调拨10件"这种动作
6. 语气：直接、简洁、不废话。车间现场没时间看长篇大论。

输出格式：
用 3-5 条要点输出，每条包含一个判断依据和一个建议动作。"""


def build_prompt(material, context=""):
    m = material
    facts = f"""物料：{m.get('name', '?')}（{m.get('pn', '?')}）
供应商：{m.get('supplier', '?')}
线边存量：{m.get('stock', '?')} {m.get('unit', '?')}
消耗速率：{m.get('burnRate', '?')} {m.get('unit', '?')}/h（近 15 分钟加权平均）
预测耗尽：{m.get('exhaustion', '?')}
在途订单：{m.get('inTransit', '无')}"""
    if context:
        facts += f"\n\n附加上下文（来自车间飞书群、历史记录等非结构化信息）：\n{context}"
    facts += "\n\n请基于以上信息，分析该物料当前的供应风险，给出具体可执行的建议。"
    return facts


def build_mutong_prompt(material, context=""):
    """为 牧童 Agent 构建丰富的分析 Prompt（所有数据放在 user message 中，不依赖 system prompt）"""
    m = material
    # 直接指令 + 完整数据，Agent 有自己的内置设定
    facts = f"""你是二轮电动车生产物料风险检测专家。MES 系统触发了一条物料告警，请立即进行深度分析。

【告警物料】
- 物料名称：{m.get('name', '?')}（料号 {m.get('pn', '?')}）
- 供应商：{m.get('supplier', '?')}
- 当前线边存量：{m.get('stock', '?')} {m.get('unit', '?')}
- 消耗速率：{m.get('burnRate', '?')} {m.get('unit', '?')}/h
- 预测耗尽时间：{m.get('exhaustion', '?')}
- 在途订单：{m.get('inTransit', '无')}"""

    if context:
        facts += f"\n\n{context}"

    facts += "\n\n请直接分析，从趋势异常、跨产线调拨可能、供应商系统性风险、工段连锁影响四个维度给出判断和具体建议。"
    return facts


def _mock_analysis(material):
    name = material.get("name", "?")
    ex_min = material.get("exhaustionMinutes", 0)
    sp = material.get("supplier", "?")
    tr = material.get("inTransit", "")

    if ex_min <= 0:
        return f"【紧急】{name} 已耗尽\n1. 确认当前工位是否停线\n2. 主仓库存充足 → 人工推料 3 分钟可达（AGV 10 分钟+）\n3. {'在途 ' + tr + ' → 联系加急' if tr else '无在途 → 立即采购'}\n执行顺序：推料救急 → 确认在途/下单 → 复盘根因"
    if ex_min < 60:
        return f"【告警】{name} 预计 {ex_min:.0f} 分钟后耗尽\n1. {'在途 ' + tr + ' → 可能撑不到' if tr else '无在途 → 必须立即补货'}\n2. 查邻近产线同物料库存\n3. 建议人工应急推料（AGV 今日已有延迟预警）\n执行：人工推料 → 确认在途 → 视情况降速或调拨"
    if ex_min < 480:
        return f"【预警】{name} 预计 {ex_min/60:.1f} 小时后耗尽\n1. 消耗速率较昨日偏高，检查排产\n2. {'在途订单时间尚可' if tr else '无在途，建议补货'}\n3. 供应商 {sp} 近期交付需关注\n4. 暂不紧急，通知物流班长关注"
    return f"【正常】{name} 库存充足\n供应稳定，无需关注。"


# ============================================================
# 登录认证（书稿演示：session 会话 + 演示账号，见 .env.example）
# ============================================================
app.secret_key = os.getenv("SECRET_KEY", "mutong-mes-demo")
DEMO_USERNAME = os.getenv("DEMO_USERNAME", "admin")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "123456")


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """登录：校验演示账号并建立 session"""
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    if username == DEMO_USERNAME and password == DEMO_PASSWORD:
        session["user"] = username
        return jsonify({"code": 0, "message": "登录成功", "data": {"username": username}})
    return jsonify({"code": -1, "message": "用户名或密码错误"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    """退出登录"""
    session.pop("user", None)
    return jsonify({"code": 0, "message": "已退出登录"})


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    """当前登录状态"""
    user = session.get("user")
    return jsonify({"code": 0, "data": {"logged_in": bool(user), "username": user}})


@app.before_request
def _require_login_for_pages():
    """/pages/ 下页面需登录（登录页本身除外），未登录跳登录页"""
    if request.path.startswith("/pages/") and request.path != "/pages/login.html":
        if not session.get("user"):
            return redirect("/pages/login.html")
    return None


# ============================================================
# 首页
# ============================================================

@app.route("/")
def index():
    """入口：未登录进登录页，已登录进制造控制台（首页）"""
    if not session.get("user"):
        return redirect("/pages/login.html")
    from flask import send_from_directory
    return send_from_directory(PAGES_DIR, "console.html")


# ============================================================
# API：百炼 Agent 分析
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():
    """健康检查
    ---
    tags: [系统]
    responses:
      200:
        description: 服务状态
    """
    return jsonify({
        "status": "ok",
        "bailian_configured": bool(BAILIAN_API_KEY),
        "bailian_model": BAILIAN_MODEL if BAILIAN_API_KEY else "mock",
        "feishu_configured": bool(FEISHU_APP_ID and FEISHU_APP_SECRET),
        "feishu_user": FEISHU_DEFAULT_USER,
    })


@app.route("/api/health/agents", methods=["GET"])
def health_agents():
    """代理检测所有上游服务（解决浏览器跨域限制）
    ---
    tags: [系统]
    description: |
      从服务端检测百炼、飞书、牧童 Agent 的连通性。
      浏览器无法直接跨域请求 牧童 Agent，由后端代理检测。
    responses:
      200:
        description: 各服务连通状态
    """
    import urllib.request as ur

    def check_bailian():
        if not bailian_client:
            return False
        try:
            r = bailian_client.chat.completions.create(
                model=BAILIAN_MODEL, messages=[{"role": "user", "content": "ping"}],
                max_tokens=2, temperature=0,
            )
            return bool(r.choices[0].message.content)
        except Exception:
            return False

    def check_feishu():
        try:
            feishu_get_token()
            return True
        except Exception:
            return False

    def check_mutong_agent():
        mutong_url = os.getenv("MUTONG_AGENT_URL", "")
        mutong_key = os.getenv("MUTONG_AGENT_KEY", "")
        if not mutong_url:
            return False
        try:
            data = json.dumps({
                "model": "default",
                "messages": [{"role": "user", "content": "ping"}],
                "stream": True, "max_tokens": 2,
            }).encode("utf-8")
            headers = {"Content-Type": "application/json"}
            if mutong_key:
                headers["Authorization"] = f"Bearer {mutong_key}"
            req = ur.Request(
                f"{mutong_url}/chat/completions",
                data=data,
                headers=headers,
            )
            with ur.urlopen(req, timeout=10) as resp:
                return resp.status == 200
        except Exception as e:
            logger.warning(f"[Health] 牧童 Agent 检测失败: {e}")
            return False

    return jsonify({
        "bailian": check_bailian(),
        "feishu": check_feishu(),
        "mutong_agent": check_mutong_agent(),
    })


@app.route("/api/agent/analyze", methods=["POST"])
def analyze():
    """百炼 Agent 物料风险分析
    ---
    tags: [百炼 Agent]
    description: |
      接收公式层计算好的结构化物料数据 + 非结构化上下文，
      拼 Prompt 调用百炼大模型，返回物料供应风险分析和建议。

      公式算数字，百炼写人话。
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [material]
          properties:
            material:
              type: object
              required: [name, stock, unit, burnRate, exhaustionMinutes]
              properties:
                name: {type: string, description: 物料名称, example: "锂电池包"}
                pn: {type: string, description: 料号, example: "BAT-LI-72V24AH"}
                supplier: {type: string, description: 供应商, example: "华锂新能源"}
                stock: {type: number, description: 线边存量, example: 3}
                unit: {type: string, description: 单位, example: "组"}
                burnRate: {type: number, description: "消耗速率（单位/h，近15分钟加权）", example: 52.0}
                exhaustion: {type: string, description: 预测耗尽时间（可读）, example: "2min"}
                exhaustionMinutes: {type: number, description: 预测耗尽时间（分钟）, example: 3.5}
                inTransit: {type: string, description: 在途订单信息, example: "300组，ETA 06-17"}
            context: {type: string, description: 非结构化附加上下文, example: "今日飞书物流群提到 AGV 2号车导航头脏了"}
    responses:
      200:
        description: 分析成功
    """
    data = request.get_json(silent=True)
    if not data or "material" not in data:
        return jsonify({"code": -1, "message": "缺少 material 字段"}), 400

    material = data["material"]
    context = data.get("context", "")
    prompt = build_prompt(material, context)

    if not bailian_client:
        return jsonify({"code": 0, "data": {
            "analysis": _mock_analysis(material),
            "trace_id": f"mock-{int(time.time()*1000)}",
            "model": "mock", "elapsed": 0.3,
        }})

    try:
        t0 = time.time()
        resp = bailian_client.chat.completions.create(
            model=BAILIAN_MODEL,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
            temperature=0.3, max_tokens=800,
        )
        elapsed = round(time.time() - t0, 2)
        analysis = resp.choices[0].message.content
        trace_id = resp.id if hasattr(resp, "id") else f"trace-{int(t0*1000)}"
        return jsonify({"code": 0, "data": {
            "analysis": analysis, "trace_id": trace_id,
            "model": BAILIAN_MODEL, "elapsed": elapsed,
            "usage": {
                "prompt_tokens": resp.usage.prompt_tokens if resp.usage else 0,
                "completion_tokens": resp.usage.completion_tokens if resp.usage else 0,
            }
        }})
    except Exception as e:
        return jsonify({
            "code": -1, "message": f"百炼调用失败: {str(e)}",
            "data": {"analysis": _mock_analysis(material), "trace_id": f"err-{int(time.time()*1000)}", "model": BAILIAN_MODEL + " (fallback mock)", "elapsed": 0}
        }), 500


# ============================================================
# API：牧童 Agent 物料分析（代理调用，解决浏览器跨域）
# ============================================================

@app.route("/api/agent/mutong/analyze", methods=["POST"])
def mutong_agent_analyze():
    """牧童 Agent 物料风险分析（流式代理）
    ---
    tags: [牧童 Agent]
    description: |
      代理调用 牧童 Agent 平台智能体进行物料分析。
      前端因跨域限制无法直接调 牧童 Agent，由 Flask 后端代理转发。
      返回 SSE 流式响应。
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [material]
          properties:
            material:
              type: object
              required: [name, stock, unit, burnRate, exhaustionMinutes]
              properties:
                name: {type: string, description: 物料名称}
                pn: {type: string, description: 料号}
                supplier: {type: string, description: 供应商}
                stock: {type: number, description: 线边存量}
                unit: {type: string, description: 单位}
                burnRate: {type: number, description: 消耗速率}
                exhaustion: {type: string, description: 预测耗尽时间}
                exhaustionMinutes: {type: number, description: 预测耗尽分钟数}
                inTransit: {type: string, description: 在途订单}
            context: {type: string, description: 附加上下文}
    responses:
      200:
        description: SSE 流式分析结果
    """
    from flask import Response as FlaskResponse

    data = request.get_json(silent=True)
    if not data or "material" not in data:
        return jsonify({"code": -1, "message": "缺少 material 字段"}), 400

    material = data["material"]
    context = data.get("context", "")

    prompt = build_mutong_prompt(material, context)

    if not mutong_client:
        return jsonify({
            "code": -1,
            "message": "MUTONG_AGENT_KEY 未配置，无法调用 牧童 Agent",
        }), 503

    _mutong = mutong_client

    def generate():
        try:
            stream = _mutong.chat.completions.create(
                model="default",
                # 牧童 Agent 有自己的内置设定，不传 system prompt
                # 所有分析指令和数据都放在 user message 中
                messages=[
                    {"role": "user", "content": prompt},
                ],
                stream=True,
                temperature=0.3,
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"[牧童 Agent] 调用失败: {e}")
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return FlaskResponse(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ============================================================
# API：DeepSeek Agent 分析
# ============================================================

@app.route("/api/agent/deepseek/analyze", methods=["POST"])
def deepseek_analyze():
    """DeepSeek V4 Pro 物料风险分析
    ---
    tags: [DeepSeek Agent]
    description: 调用 DeepSeek V4 Pro 大模型进行物料供应风险分析，返回流式 SSE
    """
    from flask import Response as FlaskResponse

    data = request.get_json(silent=True)
    if not data or "material" not in data:
        return jsonify({"code": -1, "message": "缺少 material 字段"}), 400

    material = data["material"]
    context = data.get("context", "")
    prompt = build_prompt(material, context)

    def generate():
        if not deepseek_client:
            mock = _mock_analysis(material)
            yield f"data: {json.dumps({'content': mock}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'done': True, 'elapsed': 0, 'model': 'mock'}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
            return
        try:
            t0 = time.time()
            stream = deepseek_client.chat.completions.create(
                model=DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
                temperature=0.3,
                max_tokens=800,
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
            elapsed = round(time.time() - t0, 2)
            yield f"data: {json.dumps({'done': True, 'elapsed': elapsed, 'model': DEEPSEEK_MODEL}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"[DeepSeek] 调用失败: {e}")
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return FlaskResponse(generate(), mimetype="text/event-stream")


@app.route("/api/agent/deepseek/analyze/sync", methods=["POST"])
def deepseek_analyze_sync():
    """DeepSeek V4 Pro 物料风险分析（同步）
    ---
    tags: [DeepSeek Agent]
    """
    data = request.get_json(silent=True)
    if not data or "material" not in data:
        return jsonify({"code": -1, "message": "缺少 material 字段"}), 400

    material = data["material"]
    context = data.get("context", "")
    prompt = build_prompt(material, context)

    _ds = deepseek_client
    if not _ds:
        return jsonify({"code": 0, "data": {
            "analysis": _mock_analysis(material),
            "trace_id": f"mock-{int(time.time()*1000)}",
            "model": "mock", "elapsed": 0.3,
        }})

    try:
        t0 = time.time()
        resp = _ds.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        elapsed = round(time.time() - t0, 2)
        analysis = resp.choices[0].message.content
        return jsonify({
            "code": 0,
            "data": {
                "analysis": analysis,
                "trace_id": resp.id if hasattr(resp, "id") else f"ds-{int(t0*1000)}",
                "model": DEEPSEEK_MODEL,
                "elapsed": elapsed,
                "usage": {
                    "prompt_tokens": resp.usage.prompt_tokens if resp.usage else 0,
                    "completion_tokens": resp.usage.completion_tokens if resp.usage else 0,
                    "total_tokens": resp.usage.total_tokens if resp.usage else 0,
                },
            },
        })
    except Exception as e:
        logger.error(f"[DeepSeek] 同步调用失败: {e}")
        return jsonify({"code": -1, "message": f"DeepSeek 调用失败: {str(e)}"}), 500


# ============================================================
# API：飞书消息推送
# ============================================================

@app.route("/api/feishu/send", methods=["POST"])
def feishu_send():
    """飞书消息推送
    ---
    tags: [飞书]
    description: |
      向指定用户或群聊发送飞书消息。支持文本消息和卡片消息。

      **接收人 ID 类型：**
      - `open_id` — 用户 open_id（从 /api/user-list 获取）
      - `chat_id` — 群聊 ID（从 /api/chat-list 获取）
      - `user_id` — 用户 user_id

      **使用方式：**
      1. 先调 GET /api/user-list 获取可推送的用户
      2. 再调此接口发送消息
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [receive_id_type, receive_id]
          properties:
            receive_id_type:
              type: string
              description: 接收人 ID 类型
              enum: [open_id, chat_id, user_id]
              example: "open_id"
            receive_id:
              type: string
              description: 接收人 ID
              example: "ou_5f21b96e0709ced8aecd1ca3f87956da"
            msg_type:
              type: string
              description: 消息类型
              enum: [text, card]
              default: text
            text:
              type: string
              description: 文本消息内容（msg_type=text 时必填）
              example: "物料告警：锂电池包存量不足"
            card:
              type: object
              description: 飞书卡片 JSON（msg_type=card 时必填），见飞书卡片文档
            title:
              type: string
              description: 卡片消息标题（使用内置物料告警卡片模板时填写）
              example: "🔴 物料告警 · 总装一线"
            level:
              type: string
              description: 告警级别（使用内置模板时填写）
              enum: [critical, warn, info]
            material_name:
              type: string
              description: 物料名称（使用内置模板时填写）
            material_pn:
              type: string
              description: 物料料号（使用内置模板时填写）
            stock_info:
              type: string
              description: 库存信息（使用内置模板时填写）
              example: "当前 3 组，预计 2min 耗尽"
            suggestion:
              type: string
              description: Agent 建议摘要（使用内置模板时填写）
    responses:
      200:
        description: 发送成功，返回 message_id
    """
    data = request.get_json(silent=True) or {}
    receive_id_type = data.get("receive_id_type", "open_id")
    receive_id = data.get("receive_id") or FEISHU_DEFAULT_USER
    msg_type = data.get("msg_type", "text")

    try:
        # 如果传了 title，使用内置物料告警卡片模板
        if data.get("title") and data.get("material_name"):
            card = _build_material_alert_card(data)
            result = feishu_send_card(receive_id_type, receive_id, card)
        elif msg_type == "card" and data.get("card"):
            result = feishu_send_card(receive_id_type, receive_id, data["card"])
        else:
            text = data.get("text", "")
            if not text:
                return jsonify({"error": "缺少 text 或 card 参数"}), 400
            result = feishu_send_message(receive_id_type, receive_id, "text",
                                         json.dumps({"text": text}, ensure_ascii=False))

        logger.info(f"[飞书] 消息已发送 → {receive_id}")
        return jsonify({
            "code": 0 if result.get("data", {}).get("code") == 0 else -1,
            "data": result.get("data", {}).get("data", {}),
            "message": "发送成功" if result.get("data", {}).get("code") == 0 else str(result.get("data")),
        })
    except Exception as e:
        logger.error(f"[飞书] 发送失败: {e}")
        return jsonify({"code": -1, "message": str(e)}), 500


def _build_material_alert_card(data):
    """构造物料告警卡片"""
    level = data.get("level", "warn")
    color_map = {"critical": "red", "warn": "yellow", "info": "blue"}
    color = color_map.get(level, "yellow")

    return {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": data.get("title", "物料告警")},
            "template": color,
        },
        "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": f"**物料：**{data.get('material_name', '?')}（{data.get('material_pn', '')}）"}},
            {"tag": "div", "text": {"tag": "lark_md", "content": f"**库存状态：**{data.get('stock_info', '')}"}},
            {"tag": "hr"},
            {"tag": "div", "text": {"tag": "lark_md", "content": f"**牧童 Agent 建议：**\n{data.get('suggestion', '请查看详情')}"}},
            {"tag": "hr"},
            {
                "tag": "action",
                "actions": [
                    {"tag": "button", "text": {"tag": "plain_text", "content": "查看物料详情"},
                     "type": "primary", "url": data.get("detail_url", "http://localhost:1001")},
                    {"tag": "button", "text": {"tag": "plain_text", "content": "确认已处理"},
                     "type": "default", "value": json.dumps({"action": "ack", "material": data.get("material_pn", "")}) if "json" in dir() else "{}"},
                ],
            },
        ],
    }


# ============================================================
# 静态页面服务
# ============================================================

PAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


@app.route("/pages/<path:filename>")
def serve_page(filename):
    """Serve static HTML pages"""
    from flask import send_from_directory
    return send_from_directory(PAGES_DIR, filename)


# ============================================================
# 启动
# ============================================================
if __name__ == "__main__":
    import unicodedata

    port = int(os.getenv("PORT", 1001))
    bailian = BAILIAN_MODEL if BAILIAN_API_KEY else "未配置（mock 兜底）"
    mutong = "已配置" if MUTONG_AGENT_URL else "未配置（跳过该通道）"
    deepseek = DEEPSEEK_MODEL if DEEPSEEK_API_KEY else "未配置（mock 兜底）"
    feishu = f"App {FEISHU_APP_ID[:8]}... 已配置" if FEISHU_APP_ID else "未配置（仅页面审批）"

    def _w(s: str) -> int:
        return sum(2 if unicodedata.east_asian_width(c) in ("W", "F") else 1 for c in s)

    def _row(text: str) -> str:
        return f"║  {text}{' ' * max(0, 38 - _w(text))}║"

    rows = [
        "牧童 · 物料看板后端",
        "─" * 38,
        f"端口       {port}",
        f"百炼       {bailian}",
        f"牧童 Agent  {mutong}",
        f"DeepSeek   {deepseek}",
        f"飞书       {feishu}",
        "",
        "页面",
        f"    localhost:{port}/pages/index.html",
        "Swagger",
        f"    localhost:{port}/apidocs",
    ]
    print("\n".join(
        ["╔" + "═" * 40 + "╗"] + [_row(r) for r in rows] + ["╚" + "═" * 40 + "╝"]
    ))
    app.run(host="0.0.0.0", port=port, debug=True)
