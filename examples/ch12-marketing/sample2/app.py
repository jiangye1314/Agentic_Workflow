"""
牧童商城 · 电商智慧运营平台 · 后端（index.html 配套）

启动：
  pip install -r requirements.txt
  python app.py

服务：
  http://localhost:1003/               已登录 → 电商运营平台，未登录 → 登录页

设计原则：
  推荐闭环三层：
    第 1 层 规则召回（偏好类目 + 在售 + 有货）——确定性，置信度恒 1.0
    第 2 层 LLM 排序 + 推荐理由（经 agent-gateway 10050 统一出口）
    第 3 层 置信度分流（只看 AI 排序层，< 0.7 转人工审核 HITL）
  人工审核确认 → 改判样本回流 few-shot 推荐库
  网关离线 → 推荐自动降级（启发式打分，置信度偏低更易进人工审核）
  定价底线（确定性）：建议价 < 成本 × 1.2 直接拒绝，不交给 AI
"""

import json
import os
import re
import time
import logging
import random
import urllib.request
from datetime import datetime
from typing import Any

from flask import Flask, request, jsonify, session, redirect, send_from_directory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ══════════════════════════════════════════════════
# 配置
# ══════════════════════════════════════════════════
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "db.json")
STATIC_DIR = os.path.join(BASE_DIR, "static")

PORT = int(os.getenv("PORT", "1003"))
SECRET_KEY = os.getenv("SECRET_KEY", "mutong-mall-demo")
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.7"))   # 推荐置信度阈值：低于此值转人工审核
PRICE_FLOOR_RATIO = 1.2      # 定价毛利底线：建议价不得低于成本 × 1.2
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://127.0.0.1:10050")
GATEWAY_MODEL = os.getenv("GATEWAY_MODEL", "qwen-max")
GATEWAY_TIMEOUT = 30
GATEWAY_RETRY = 2
FEWSHOT_BUCKET_MAX = 20

app.secret_key = SECRET_KEY

# 演示账号（运营）
DEMO_USERS = {
    "admin": "123456",     # 管理员
    "operator": "123456",  # 运营
}

# ══════════════════════════════════════════════════
# 种子数据（首次启动写入 data/db.json，全部为虚构演示数据；与 static/js/mock-data.js 同构）
# ══════════════════════════════════════════════════
SEED = {
    "categories": [
        {"id": "CA01", "name": "数码家电", "products": 86, "level": 1},
        {"id": "CA02", "name": "服饰鞋包", "products": 132, "level": 1},
        {"id": "CA03", "name": "美妆个护", "products": 74, "level": 1},
        {"id": "CA04", "name": "食品生鲜", "products": 58, "level": 1},
        {"id": "CA05", "name": "家居生活", "products": 61, "level": 1},
    ],
    "products": [
        {"id": "P001", "name": "无线降噪耳机 Pro", "category": "数码家电", "price": 899, "stock": 320, "alert_line": 50, "sales": 12480, "rating": 4.8, "status": "在售", "tags": ["爆款", "数码"]},
        {"id": "P002", "name": "智能手环 6 代", "category": "数码家电", "price": 249, "stock": 860, "alert_line": 100, "sales": 28500, "rating": 4.6, "status": "在售", "tags": ["热卖"]},
        {"id": "P003", "name": "机械键盘 87 键", "category": "数码家电", "price": 399, "stock": 210, "alert_line": 60, "sales": 8120, "rating": 4.7, "status": "在售", "tags": ["客制化"]},
        {"id": "P004", "name": "便携榨汁杯", "category": "家居生活", "price": 129, "stock": 45, "alert_line": 80, "sales": 16400, "rating": 4.4, "status": "在售", "tags": ["低库存"]},
        {"id": "P005", "name": "家居香薰套装", "category": "家居生活", "price": 168, "stock": 540, "alert_line": 80, "sales": 6320, "rating": 4.5, "status": "在售", "tags": ["礼盒"]},
        {"id": "P006", "name": "轻羽绒连帽外套", "category": "服饰鞋包", "price": 459, "stock": 380, "alert_line": 60, "sales": 9320, "rating": 4.6, "status": "在售", "tags": ["秋冬"]},
        {"id": "P007", "name": "复古慢跑鞋", "category": "服饰鞋包", "price": 329, "stock": 260, "alert_line": 60, "sales": 11750, "rating": 4.5, "status": "在售", "tags": []},
        {"id": "P008", "name": "氨基酸洗面奶", "category": "美妆个护", "price": 89, "stock": 1500, "alert_line": 200, "sales": 35200, "rating": 4.7, "status": "在售", "tags": ["复购"]},
        {"id": "P009", "name": "控油洗发水 500ml", "category": "美妆个护", "price": 79, "stock": 96, "alert_line": 100, "sales": 21050, "rating": 4.4, "status": "在售", "tags": ["低库存"]},
        {"id": "P010", "name": "精品挂耳咖啡礼盒", "category": "食品生鲜", "price": 118, "stock": 430, "alert_line": 60, "sales": 4860, "rating": 4.8, "status": "在售", "tags": ["礼盒"]},
        {"id": "P011", "name": "低糖燕麦片 1kg", "category": "食品生鲜", "price": 49, "stock": 720, "alert_line": 100, "sales": 18200, "rating": 4.5, "status": "在售", "tags": []},
        {"id": "P012", "name": "智能投影仪 mini", "category": "数码家电", "price": 1599, "stock": 8, "alert_line": 30, "sales": 3120, "rating": 4.6, "status": "在售", "tags": ["低库存", "新品"]},
    ],
    "orders": [
        {"id": "O240918001", "user": "林晓", "amount": 899, "status": "已支付", "items": 1, "created_at": "2026-09-20 07:30"},
        {"id": "O240918002", "user": "陈雨", "amount": 129, "status": "已支付", "items": 2, "created_at": "2026-09-20 07:29"},
        {"id": "O240918003", "user": "赵轩", "amount": 249, "status": "待支付", "items": 1, "created_at": "2026-09-20 07:28"},
        {"id": "O240918004", "user": "王涵", "amount": 399, "status": "已发货", "items": 1, "created_at": "2026-09-20 07:12"},
        {"id": "O240918005", "user": "孙悦", "amount": 168, "status": "售后中", "items": 1, "created_at": "2026-09-20 06:55"},
        {"id": "O240918006", "user": "周宁", "amount": 459, "status": "已完成", "items": 1, "created_at": "2026-09-19 22:40"},
        {"id": "O240918007", "user": "吴桐", "amount": 89, "status": "已完成", "items": 3, "created_at": "2026-09-19 21:15"},
        {"id": "O240918008", "user": "郑凯", "amount": 118, "status": "已退款", "items": 1, "created_at": "2026-09-19 20:02"},
    ],
    "portraits": [
        {"id": "U001", "name": "林晓", "age": 28, "city": "杭州", "tags": ["数码", "音频"], "price_band": "300-1500", "recent_view": "无线降噪耳机 Pro", "order_cnt": 23, "prefer": ["数码家电"]},
        {"id": "U002", "name": "陈雨", "age": 35, "city": "上海", "tags": ["家居", "品质"], "price_band": "100-500", "recent_view": "家居香薰套装", "order_cnt": 41, "prefer": ["家居生活", "美妆个护"]},
        {"id": "U003", "name": "赵轩", "age": 24, "city": "深圳", "tags": ["运动", "性价比"], "price_band": "100-400", "recent_view": "智能手环 6 代", "order_cnt": 9, "prefer": ["数码家电"]},
        {"id": "U004", "name": "王涵", "age": 31, "city": "北京", "tags": ["办公", "键鼠"], "price_band": "200-800", "recent_view": "机械键盘 87 键", "order_cnt": 17, "prefer": ["数码家电"]},
    ],
    "rec_reviews": [],
    "payments": [
        {"id": "REC001", "channel_no": "WX20260920073012", "amount": 899, "inner_order": "O240918001", "status": "一致", "note": ""},
        {"id": "REC002", "channel_no": "WX20260920072955", "amount": 129, "inner_order": "O240918002", "status": "一致", "note": ""},
        {"id": "REC003", "channel_no": "ALI20260920071503", "amount": 249, "inner_order": "—", "status": "长款", "note": "渠道有、内部无（疑似支付回调延迟）"},
        {"id": "REC004", "channel_no": "WX20260920065841", "amount": 399, "inner_order": "O240918004", "status": "一致", "note": ""},
        {"id": "REC005", "channel_no": "ALI20260920064020", "amount": 168, "inner_order": "—", "status": "金额不符", "note": "渠道 168 / 内部 128（优惠券未同步）"},
    ],
    "aftersales": [
        {"id": "AS001", "order_id": "O240918005", "user": "孙悦", "product": "家居香薰套装", "type": "退货退款", "reason": "礼盒外包装破损", "status": "审核中", "created_at": "2026-09-20 07:05"},
        {"id": "AS002", "order_id": "O240918008", "user": "郑凯", "product": "精品挂耳咖啡礼盒", "type": "仅退款", "reason": "临期商品", "status": "退款中", "created_at": "2026-09-19 20:30"},
        {"id": "AS003", "order_id": "O240917112", "user": "何静", "product": "复古慢跑鞋", "type": "换货", "reason": "尺码偏小", "status": "已完成", "created_at": "2026-09-18 15:22"},
        {"id": "AS004", "order_id": "O240917089", "user": "罗浩", "product": "智能手环 6 代", "type": "退货退款", "reason": "功能与描述不符", "status": "已驳回", "created_at": "2026-09-18 11:47"},
    ],
    "campaigns": [
        {"id": "CP001", "name": "数码家电超级品牌日", "type": "满减", "rule": "满 999 减 150", "scope": "数码家电类目", "start": "2026-09-20", "end": "2026-09-22", "status": "进行中"},
        {"id": "CP002", "name": "便携榨汁杯秒杀", "type": "秒杀", "rule": "129 → 99（限量 500 件）", "scope": "P004 单品", "start": "2026-09-20 10:00", "end": "2026-09-20 12:00", "status": "未开始"},
        {"id": "CP003", "name": "新人有礼", "type": "优惠券", "rule": "无门槛 15 元券", "scope": "全场", "start": "2026-09-01", "end": "2026-09-30", "status": "进行中"},
        {"id": "CP004", "name": "秋冬换新季", "type": "满减", "rule": "满 300 减 40", "scope": "服饰鞋包类目", "start": "2026-09-15", "end": "2026-09-30", "status": "进行中"},
    ],
    "pricings": [
        {"id": "PR001", "product_id": "P012", "product_name": "智能投影仪 mini", "cost": 980, "suggest_min": 1499, "suggest_max": 1699, "margin": "42.3%", "status": "已生成", "created_at": "2026-09-19 18:40"},
        {"id": "PR002", "product_id": "P001", "product_name": "无线降噪耳机 Pro", "cost": 520, "suggest_min": 849, "suggest_max": 949, "margin": "39.0%", "status": "已生成", "created_at": "2026-09-19 10:12"},
    ],
    "fewshot": {},
}

# ══════════════════════════════════════════════════
# JSON 存储（演示版：内存 + 落盘）
# ══════════════════════════════════════════════════
db: "dict[str, Any]" = {}


def load_db():
    global db
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(DB_FILE):
        with open(DB_FILE, encoding="utf-8") as f:
            db = json.load(f)
        logger.info(f"数据已加载：{DB_FILE}")
    else:
        db = json.loads(json.dumps(SEED))
        save_db()
        logger.info("首次启动，已写入种子数据")


def save_db():
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ══════════════════════════════════════════════════
# 推荐引擎：第 2 层 LLM 排序（经 agent-gateway，失败启发式兜底）
# ══════════════════════════════════════════════════
def _gateway_chat(messages, timeout=GATEWAY_TIMEOUT):
    """经 agent-gateway 调用 LLM；网关不可达返回 None（触发降级）"""
    body = json.dumps({
        "model": GATEWAY_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 800,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{GATEWAY_URL}/v1/chat/completions",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    for attempt in range(GATEWAY_RETRY + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            if attempt >= GATEWAY_RETRY:
                logger.warning(f"网关调用失败（重试 {GATEWAY_RETRY} 次）: {e}")
                return None
            time.sleep(0.5)
    return None


def _heuristic_rank(user, candidates):
    """降级：启发式打分 + 模板推荐理由（确定性伪 AI，置信度偏低更易进人工审核）"""
    items = []
    for p in candidates[:4]:
        tag_hit = any(t in user.get("tags", []) for t in p.get("tags", []))
        score = round(p["price"] * 0.6) + (10 if tag_hit else 0) + p["rating"] * 5
        # 置信度：标签命中 +0.15，评分高于 4.4 逐档加分——不同画像自然呈现过线/入队两个分支
        conf = round(0.60 + (0.15 if tag_hit else 0.0) + (p["rating"] - 4.4) * 0.25, 2)
        reason = (
            f"与你偏好的「{'、'.join(user.get('tags', []))}」高度匹配，同类用户复购率高"
            if tag_hit
            else f"同价位段好评 {p['rating']}，与你的浏览记录相关"
        )
        items.append({
            "product_id": p["id"], "name": p["name"], "price": p["price"],
            "reason": reason, "confidence": conf, "score": score,
            "via": "heuristic",
        })
    return items


def _rank_by_llm(user, candidates, fewshots):
    """LLM 排序 + 推荐理由；网关离线时启发式兜底"""
    prod_lines = "\n".join(
        f"{p['id']} | {p['name']} | 价格 {p['price']} | 标签 {','.join(p.get('tags', []))} | 评分 {p['rating']}"
        for p in candidates
    )
    system_prompt = (
        "你是电商推荐运营专家。根据用户画像对候选商品排序，并为每件商品生成一句个性化推荐理由。"
        '只输出 JSON，格式：{"items":[{"product_id":"P001","reason":"一句话理由","confidence":0.85}]}。'
        "confidence 表示你对「该商品适合该用户」的把握程度（0~1）。"
    )
    if fewshots:
        samples = "\n".join(
            f"样例{i+1}：商品 {s.get('product_name')} 理由「{s.get('reason')}」"
            for i, s in enumerate(fewshots[:3])
        )
        system_prompt += f"\n\n参考以下运营审核通过的推荐样例：\n{samples}"
    user_prompt = (
        f"用户画像：{user['name']}，偏好类目 {','.join(user['prefer'])}，"
        f"兴趣标签 {','.join(user['tags'])}，价格带 {user['price_band']}\n"
        f"候选商品：\n{prod_lines}\n"
        "请排序并生成推荐理由。"
    )
    raw = _gateway_chat([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ])
    if raw:
        try:
            m = re.search(r"\{.*\}", raw, re.S)
            parsed = json.loads(m.group(0)) if m else {}
            pmap = {p["id"]: p for p in candidates}
            items = []
            for it in parsed.get("items", [])[:4]:
                p = pmap.get(it.get("product_id"))
                if not p:
                    continue
                conf = max(0.1, min(1.0, float(it.get("confidence", 0.7))))
                items.append({
                    "product_id": p["id"], "name": p["name"], "price": p["price"],
                    "reason": str(it.get("reason", "综合评分与偏好匹配")),
                    "confidence": round(conf, 2),
                    "score": round(p["price"] * 0.6) + p["rating"] * 5,
                    "via": GATEWAY_MODEL,
                })
            if items:
                return items
        except Exception as e:
            logger.warning(f"LLM 输出解析失败，改用启发式: {e}")
    return _heuristic_rank(user, candidates)


# ══════════════════════════════════════════════════
# 推荐引擎：三层编排 + few-shot 库
# ══════════════════════════════════════════════════
def _fewshot_bucket(key):
    db.setdefault("fewshot", {})
    bucket = db["fewshot"].setdefault(key, [])
    return bucket


def _append_fewshot(bucket, sample):
    bucket.append(sample)
    if len(bucket) > FEWSHOT_BUCKET_MAX:
        bucket.pop(0)
    save_db()


def run_recommend(user_id):
    """完整推荐：规则召回 → LLM 排序 → 置信度分流 →（低置信度）入人工审核队列"""
    user = next((p for p in db["portraits"] if p["id"] == user_id), None) or db["portraits"][0]

    # ── 第 1 层：确定性规则召回（类目偏好 + 在售 + 有货），置信度恒 1.0 ──
    recalled = [
        p for p in db["products"]
        if p["category"] in user["prefer"] and p["status"] == "在售" and p["stock"] > 0
    ]
    rules_conf = 1.0

    # ── 第 2 层：LLM 排序 + 推荐理由（few-shot 来自人工审核回流，按偏好类目分桶共享） ──
    bucket_key = user["prefer"][0] if user.get("prefer") else "通用"
    fewshots = db.get("fewshot", {}).get(bucket_key, [])
    items = _rank_by_llm(user, recalled[:6], fewshots)

    # ── 第 3 层：置信度分流（只看 AI 排序层，规则召回恒 1.0 不稀释） ──
    ai_confs = [i["confidence"] for i in items]
    avg_conf = round(sum(ai_confs) / len(ai_confs), 2) if ai_confs else 1.0
    status = "pending_review" if avg_conf < CONF_THRESHOLD else "graded"

    result = {
        "id": "R-" + str(int(time.time() * 1000)),
        "user_id": user["id"], "user_name": user["name"],
        "recalled": [{"product_id": p["id"], "name": p["name"], "category": p["category"]} for p in recalled],
        "items": items,
        "rules_conf": rules_conf,
        "confidence": avg_conf,
        "status": status,
        "low_items": [i["product_id"] for i in items if i["confidence"] < CONF_THRESHOLD],
        "created_at": now_str(),
    }
    if status == "pending_review":
        db["rec_reviews"].insert(0, result)
    save_db()
    logger.info(f"推荐完成 {user['id']}: 召回 {len(recalled)} 件, 置信度 {avg_conf}, {status}, via {items[0]['via'] if items else '-'}")
    return result


# ══════════════════════════════════════════════════
# 登录认证（session + 演示账号）
# ══════════════════════════════════════════════════
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    if DEMO_USERS.get(username) == password:
        session["user"] = username
        session["role"] = "admin" if username == "admin" else "operator"
        return jsonify({"code": 0, "message": "登录成功", "data": {"username": username}})
    return jsonify({"code": -1, "message": "用户名或密码错误"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.pop("user", None)
    session.pop("role", None)
    return jsonify({"code": 0, "message": "已退出登录"})


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    return jsonify({"code": 0, "data": {
        "logged_in": bool(session.get("user")),
        "username": session.get("user"),
        "role": session.get("role"),
    }})


@app.before_request
def _require_login():
    """API 与主页面需登录；登录页、静态资源放行"""
    p = request.path
    if p in ("/api/auth/login", "/api/auth/me"):
        return None
    if p.startswith("/static/") or p.startswith("/css/") or p.startswith("/js/") or p.startswith("/vendor/"):
        return None
    if p in ("/login", "/login.html"):
        return None
    if not session.get("user"):
        if p.startswith("/api/"):
            return jsonify({"code": -1, "message": "未登录"}), 401
        return redirect("/login")
    return None


# ══════════════════════════════════════════════════
# 页面路由
# ══════════════════════════════════════════════════
@app.route("/login")
def login_page():
    return send_from_directory(STATIC_DIR, "login.html")


@app.route("/")
def index_page():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(os.path.join(STATIC_DIR, "css"), filename)


@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(os.path.join(STATIC_DIR, "js"), filename)


@app.route("/vendor/<path:filename>")
def serve_vendor(filename):
    return send_from_directory(os.path.join(STATIC_DIR, "vendor"), filename)


# ══════════════════════════════════════════════════
# API：大屏 / 商品 / 分类 / 库存 / 订单 / 实时
# ══════════════════════════════════════════════════
@app.route("/api/stats/overview", methods=["GET"])
def stats_overview():
    pending = sum(1 for r in db["rec_reviews"] if r.get("status") == "pending_review")
    return jsonify({
        "mall": "牧童商城",
        "gmv_today": 4862300,
        "orders_today": 3821,
        "conv_rate": 3.42,
        "avg_order": 1272.5,
        "uv_today": 111725,
        "refund_rate": 1.8,
        "products_on_sale": sum(1 for p in db["products"] if p["status"] == "在售"),
        "rec_ctr": 12.6,
        "pending_review": pending,
        "gateway": f"agent-gateway · {GATEWAY_URL.replace('http://', '')}",
    })


@app.route("/api/products", methods=["GET"])
def api_products():
    return jsonify(db["products"])


@app.route("/api/categories", methods=["GET"])
def api_categories():
    return jsonify(db["categories"])


@app.route("/api/inventory", methods=["GET"])
def api_inventory():
    return jsonify([p for p in db["products"] if p["stock"] <= p["alert_line"]])


@app.route("/api/orders", methods=["GET"])
def api_orders():
    return jsonify(db["orders"])


@app.route("/api/realtime", methods=["GET"])
def api_realtime():
    feed = [
        {"ts": "07:30:12", "user": "林*", "item": "无线降噪耳机 Pro", "amount": 899},
        {"ts": "07:29:55", "user": "陈*", "item": "便携榨汁杯", "amount": 129},
        {"ts": "07:29:31", "user": "赵*", "item": "智能手环 6 代", "amount": 249},
        {"ts": "07:28:47", "user": "王*", "item": "机械键盘 87 键", "amount": 399},
        {"ts": "07:28:02", "user": "孙*", "item": "家居香薰套装", "amount": 168},
    ]
    return jsonify(feed)


@app.route("/api/payment", methods=["GET"])
def api_payment():
    return jsonify(db["payments"])


@app.route("/api/aftersale", methods=["GET"])
def api_aftersale():
    return jsonify(db["aftersales"])


@app.route("/api/campaign", methods=["GET"])
def api_campaign():
    return jsonify(db["campaigns"])


# ══════════════════════════════════════════════════
# API：推荐闭环（三层 + 人工审核 HITL + few-shot 回流）
# ══════════════════════════════════════════════════
@app.route("/api/recommend", methods=["POST"])
def api_recommend():
    data = request.get_json(silent=True) or {}
    user_id = str(data.get("user_id", "U001"))
    return jsonify(run_recommend(user_id))


@app.route("/api/recommend/reviews", methods=["GET"])
def api_rec_reviews():
    return jsonify(db["rec_reviews"])


@app.route("/api/recommend/reviews/<rid>", methods=["PUT"])
def api_rec_review_confirm(rid):
    """人工审核确认：改判（换商品/改理由）回流 few-shot 推荐库"""
    data = request.get_json(silent=True) or {}
    rv = next((r for r in db["rec_reviews"] if r["id"] == rid), None)
    if not rv:
        return jsonify({"error": "审核单不存在"}), 404
    rv["status"] = "confirmed"
    rv["adjust"] = data.get("adjustments", [])
    rv["confirmed_by"] = data.get("confirmed_by", session.get("user", "运营"))
    rv["confirmed_at"] = now_str()
    # 回流：审核确认的推荐项 → few-shot 库（按用户偏好类目分桶，同类用户共享经验）
    user = next((p for p in db["portraits"] if p["id"] == rv.get("user_id")), None)
    bucket_key = (user or {}).get("prefer", ["通用"])[0]
    bucket = _fewshot_bucket(bucket_key)
    for adj in rv.get("adjust", []):
        _append_fewshot(bucket, {
            "product_id": adj.get("product_id", ""),
            "product_name": adj.get("name", ""),
            "reason": adj.get("reason", ""),
            "ts": now_str(),
        })
    save_db()
    logger.info(f"推荐审核确认 {rid}：{len(rv.get('adjust', []))} 条回流 few-shot 库")
    return jsonify({"ok": True})


# ══════════════════════════════════════════════════
# API：画像 / 漏斗 / AB / 销售
# ══════════════════════════════════════════════════
@app.route("/api/portrait", methods=["GET"])
def api_portrait():
    return jsonify(db["portraits"])


@app.route("/api/funnel", methods=["GET"])
def api_funnel():
    return jsonify({
        "stages": [
            {"name": "曝光", "value": 486200, "rate": 100},
            {"name": "点击", "value": 61261, "rate": 12.6},
            {"name": "加购", "value": 18378, "rate": 3.78},
            {"name": "下单", "value": 11090, "rate": 2.28},
            {"name": "支付", "value": 9354, "rate": 1.92},
        ]
    })


@app.route("/api/abtest", methods=["GET"])
def api_abtest():
    return jsonify({
        "experiments": [
            {"id": "AB-01", "name": "首页推荐位样式 A/B", "status": "进行中", "a": {"name": "A 双列瀑布流", "ctr": 11.2, "cvr": 2.1}, "b": {"name": "B 单列大图", "ctr": 14.8, "cvr": 2.9}, "winner": "B", "confidence": 0.96},
            {"id": "AB-02", "name": "加购按钮文案", "status": "进行中", "a": {"name": "A 加入购物车", "ctr": 9.4, "cvr": 2.2}, "b": {"name": "B 立即购买", "ctr": 9.1, "cvr": 2.4}, "winner": None, "confidence": 0.71},
            {"id": "AB-03", "name": "新人优惠券面额", "status": "已结束", "a": {"name": "A 满 199-20", "ctr": 10.1, "cvr": 1.8}, "b": {"name": "B 无门槛 15 元", "ctr": 12.9, "cvr": 2.6}, "winner": "B", "confidence": 0.99},
        ]
    })


@app.route("/api/sales", methods=["GET"])
def api_sales():
    return jsonify({
        "trend": [312, 356, 341, 402, 438, 417, 486, 523, 498, 562, 601, 634],
        "category_share": [
            {"name": "数码家电", "value": 34.2},
            {"name": "服饰鞋包", "value": 26.8},
            {"name": "美妆个护", "value": 15.4},
            {"name": "食品生鲜", "value": 12.1},
            {"name": "家居生活", "value": 11.5},
        ]
    })


# ══════════════════════════════════════════════════
# API：定价助手（毛利底线确定性校验 + LLM 建议区间）
# ══════════════════════════════════════════════════
@app.route("/api/pricing", methods=["GET"])
def api_pricing_list():
    return jsonify(db["pricings"])


@app.route("/api/pricing", methods=["POST"])
def api_pricing_create():
    data = request.get_json(silent=True) or {}
    cost = float(data.get("cost") or 0)
    product_id = str(data.get("product_id", ""))
    p = next((x for x in db["products"] if x["id"] == product_id), None)
    if not cost or not p:
        return jsonify({"error": "缺少商品或成本"}), 400
    # 毛利底线（确定性规则）：建议价不得低于成本 × 1.2，违者拒绝、不交给 AI
    floor = cost * PRICE_FLOOR_RATIO
    if floor > p["price"]:
        return jsonify({
            "rejected": True,
            "floor": round(floor),
            "reason": f"成本价 {cost} × {PRICE_FLOOR_RATIO} = {round(floor)}，高于现价 {p['price']}，低于毛利底线",
        })
    # 底线之上：LLM 建议价区间（离线时启发式）
    raw = _gateway_chat([
        {"role": "system", "content": "你是电商定价专家。综合成本、竞品价、销量弹性给出建议价区间，只输出 JSON：{\"min\": 数字, \"max\": 数字, \"reason\": \"一句话\"}。"},
        {"role": "user", "content": f"商品：{p['name']}，成本 {cost}，现价 {p['price']}，销量 {p['sales']}，评分 {p['rating']}。毛利底线 {round(floor)}。"},
    ])
    s_min, s_max = round(cost * 1.35), round(cost * 1.55)
    if raw:
        try:
            m = re.search(r"\{.*\}", raw, re.S)
            parsed = json.loads(m.group(0)) if m else {}
            cand_min, cand_max = int(parsed.get("min", s_min)), int(parsed.get("max", s_max))
            if cand_max > cand_min >= round(floor):
                s_min, s_max = cand_min, cand_max
        except Exception:
            pass
    item = {
        "id": "PR-" + str(int(time.time() * 1000)),
        "product_id": p["id"], "product_name": p["name"], "cost": cost,
        "suggest_min": s_min, "suggest_max": s_max,
        "margin": f"{(s_min - cost) / s_min * 100:.1f}%",
        "status": "已生成", "created_at": now_str(),
    }
    db["pricings"].insert(0, item)
    save_db()
    return jsonify(item)


# ══════════════════════════════════════════════════
# API：网关（统一 AI 出口）
# ══════════════════════════════════════════════════
def _gateway_health():
    try:
        req = urllib.request.Request(f"{GATEWAY_URL}/health", method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False


@app.route("/api/gateway/info", methods=["GET"])
def api_gateway_info():
    online = _gateway_health()
    return jsonify({
        "url": GATEWAY_URL,
        "model": GATEWAY_MODEL,
        "status": "online" if online else "offline",
        "qpm": {"used": 312, "limit": 1000},
        "latency": {"p50": 186, "p95": 486},
        "uptime": "99.96%",
        "degraded": not online,
        "routes": [
            {"path": "/v1/chat/completions", "desc": "LLM 对话补全（推荐理由 / 客服 / 定价）", "ok": online},
            {"path": "/v1/embeddings", "desc": "向量化（商品标题 / 用户兴趣）", "ok": online},
            {"path": "/asr", "desc": "语音转写（客服质检）", "ok": online},
        ],
    })


@app.route("/api/gateway/chat", methods=["POST"])
def api_gateway_chat():
    """统一 AI 对话出口（客服等）：经 agent-gateway 路由，离线时降级话术"""
    data = request.get_json(silent=True) or {}
    messages = data.get("messages") or []
    last_text = ""
    if messages:
        last_text = str(messages[-1].get("content", "")).strip()
    if not last_text:
        return jsonify({"error": "缺少 messages"}), 400
    system_prompt = (
        "你是牧童商城智能客服。回答商品咨询、售后政策、活动规则，简洁实用。"
        "涉及价格承诺、退款金额的对话必须引导转人工。"
    )
    reply = _gateway_chat([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": last_text},
    ])
    if reply is None:
        return jsonify({
            "reply": "agent-gateway 不可达（127.0.0.1:10050），客服已降级：请稍后重试，或转人工客服（在线 9:00-22:00）。",
            "degraded": True,
        })
    return jsonify({"reply": reply, "model": GATEWAY_MODEL})


# ══════════════════════════════════════════════════
# 启动
# ══════════════════════════════════════════════════
if __name__ == "__main__":
    load_db()
    print("=" * 56)
    print("  牧童商城 · 电商智慧运营平台 · 后端")
    print("=" * 56)
    print(f"  平台主页   http://localhost:{PORT}/")
    print(f"  登录页     http://localhost:{PORT}/login")
    print(f"  演示账号   admin / 123456（管理员）")
    print(f"             operator / 123456（运营）")
    print(f"  AI 出口    {GATEWAY_URL}（离线自动降级）")
    print(f"  推荐置信度阈值 {CONF_THRESHOLD}（低于此值转人工审核）")
    print(f"  定价毛利底线   成本 × {PRICE_FLOOR_RATIO}")
    print("=" * 56)
    app.run(host="0.0.0.0", port=PORT, debug=False)
