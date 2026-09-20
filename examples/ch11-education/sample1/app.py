"""
牧童中学智慧教学平台 · 后端（index.html 配套）

启动：
  pip install -r requirements.txt
  python app.py

服务：
  http://localhost:1002/               已登录 → 教学平台，未登录 → 登录页

设计原则（见 PRD.md / SPEC.md）：
  客观题 = 确定性规则引擎（100% 可复现）
  主观题 = LLM 按 rubric 评分（经 agent-gateway 10050 统一出口）
  作业图片 OCR = 三供应商可切换：百炼 qwen-vl / 扣子 Coze / Dify（未配密钥自动降级）
  置信度 < 0.7 → 人工复核队列（HITL），改判回流 few-shot 库
  网关离线 → 批改自动降级（客观题照常，主观题启发式兜底）
"""

import base64
import json
import os
import re
import time
import logging
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

PORT = int(os.getenv("PORT", "1002"))
SECRET_KEY = os.getenv("SECRET_KEY", "mutong-edu-demo")
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.7"))   # 置信度阈值：低于此值转人工复核
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://127.0.0.1:10050")
GATEWAY_MODEL = os.getenv("GATEWAY_MODEL", "qwen-max")
GATEWAY_TIMEOUT = 30     # 网关超时（秒）
GATEWAY_RETRY = 2        # 重试次数
FEWSHOT_BUCKET_MAX = 20  # few-shot 库每桶上限（FIFO）

# ── 作业图片 OCR 供应商配置（环境变量注入，未配置密钥的供应商自动降级） ──
OCR_PROVIDER = os.getenv("OCR_PROVIDER", "bailian")     # 默认供应商：bailian / coze / dify
OCR_TIMEOUT = 30                                        # OCR 调用超时（秒）
MAX_IMAGE_BYTES = 4 * 1024 * 1024                       # 图片上限 4MB
# 百炼（阿里云 DashScope · qwen-vl 视觉模型，OpenAI 兼容协议）
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
DASHSCOPE_MODEL = os.getenv("DASHSCOPE_MODEL", "qwen-vl-max")
DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
# 扣子（Coze · Bot 对话 API，图片走 object_string 多模态消息）
COZE_API_TOKEN = os.getenv("COZE_API_TOKEN", "")
COZE_BOT_ID = os.getenv("COZE_BOT_ID", "")
COZE_BASE_URL = os.getenv("COZE_BASE_URL", "https://api.coze.cn")
# Dify（应用 Chat API，files 传 base64 图片；应用需启用视觉模型或接入 qwen-vl 工具）
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "")
DIFY_BASE_URL = os.getenv("DIFY_BASE_URL", "http://127.0.0.1:8080")

app.secret_key = SECRET_KEY

# 演示账号（教师）
DEMO_USERS = {
    "admin": "123456",    # 管理员
    "teacher": "123456",  # 教师（李敏）
}

# ══════════════════════════════════════════════════
# 种子数据（首次启动写入 data/db.json，全部为虚构演示数据）
# ══════════════════════════════════════════════════
SEED = {
    "classes": [
        {"id": "C001", "name": "初三(1)班", "grade": "初三", "teacher": "李敏", "subject": "数学", "students": 42, "avg_score": 81.4, "tags": ["理科重点", "数学"]},
        {"id": "C002", "name": "初三(2)班", "grade": "初三", "teacher": "王芳", "subject": "语文", "students": 40, "avg_score": 78.9, "tags": ["文科", "语文"]},
        {"id": "C003", "name": "初三(3)班", "grade": "初三", "teacher": "陈刚", "subject": "英语", "students": 41, "avg_score": 76.2, "tags": ["英语"]},
        {"id": "C004", "name": "初二(1)班", "grade": "初二", "teacher": "刘洋", "subject": "数学", "students": 44, "avg_score": 79.8, "tags": ["数学"]},
        {"id": "C005", "name": "初二(2)班", "grade": "初二", "teacher": "周婷", "subject": "物理", "students": 43, "avg_score": 74.5, "tags": ["物理"]},
    ],
    "students": [
        {"id": "ST001", "name": "张一凡", "class_id": "C001", "class_name": "初三(1)班", "weak": "二次函数图像", "recent": 58, "trend": "down"},
        {"id": "ST002", "name": "李思琪", "class_id": "C001", "class_name": "初三(1)班", "weak": "几何证明", "recent": 72, "trend": "up"},
        {"id": "ST003", "name": "王浩然", "class_id": "C001", "class_name": "初三(1)班", "weak": "应用题建模", "recent": 85, "trend": "up"},
        {"id": "ST004", "name": "刘雨桐", "class_id": "C002", "class_name": "初三(2)班", "weak": "英语时态", "recent": 63, "trend": "flat"},
        {"id": "ST005", "name": "陈子墨", "class_id": "C002", "class_name": "初三(2)班", "weak": "文言实词", "recent": 69, "trend": "up"},
        {"id": "ST006", "name": "赵子轩", "class_id": "C003", "class_name": "初三(3)班", "weak": "文言实词", "recent": 61, "trend": "down"},
        {"id": "ST007", "name": "孙雨欣", "class_id": "C003", "class_name": "初三(3)班", "weak": "听力理解", "recent": 77, "trend": "up"},
        {"id": "ST008", "name": "周天佑", "class_id": "C004", "class_name": "初二(1)班", "weak": "因式分解", "recent": 55, "trend": "down"},
        {"id": "ST009", "name": "吴晨曦", "class_id": "C005", "class_name": "初二(2)班", "weak": "电路分析", "recent": 66, "trend": "flat"},
    ],
    "assignments": [
        {
            "id": "A001", "title": "二次函数单元测验", "subject": "数学", "class_name": "初三(1)班",
            "deadline": "2026-09-20 18:00", "status": "进行中", "submissions": 38,
            "questions": [
                {"qid": "q1", "type": "choice", "stem": "函数 y=(x-1)²+2 的顶点坐标是（　）", "score": 5, "answer": "B", "options": ["A. (1, -2)", "B. (1, 2)", "C. (-1, 2)", "D. (-1, -2)"]},
                {"qid": "q2", "type": "choice", "stem": "二次函数 y=x²-4x+3 与 x 轴交点个数是（　）", "score": 5, "answer": "C", "options": ["A. 0 个", "B. 1 个", "C. 2 个", "D. 3 个"]},
                {"qid": "q3", "type": "fill", "stem": "一元二次方程 x²-5x+6=0 的两个根分别是 __ 和 __", "score": 5, "answer": "2,3"},
                {"qid": "q4", "type": "math", "stem": "已知二次函数 y=x²-6x+8，求对称轴与顶点坐标（写出解题步骤）", "score": 10, "answer": "对称轴 x=3，顶点 (3,-1)", "rubric": "对称轴公式 4 分，顶点计算 6 分，步骤完整"},
                {"qid": "q5", "type": "short", "stem": "简述判别式 Δ=b²-4ac 的几何意义", "score": 5, "answer": "判别式大于 0 时抛物线与 x 轴有两个交点，等于 0 时相切（一个交点），小于 0 时无交点", "rubric": "三种情况各 1.5 分，语言准确 0.5 分"},
            ],
        },
        {
            "id": "A002", "title": "文言文阅读《岳阳楼记》", "subject": "语文", "class_name": "初三(2)班",
            "deadline": "2026-09-20 18:00", "status": "进行中", "submissions": 35,
            "questions": [
                {"qid": "q1", "type": "fill", "stem": "「先天下之忧而忧，__」补全名句", "score": 4, "answer": "后天下之乐而乐"},
                {"qid": "q2", "type": "short", "stem": "解释加点词「属予作文以记之」中「属」的意思", "score": 4, "answer": "通「嘱」，嘱托", "rubric": "通假字 2 分，释义 2 分"},
                {"qid": "q3", "type": "essay", "stem": "结合文章内容，分析作者「不以物喜，不以己悲」的胸襟（不少于 100 字）", "score": 12, "answer": "", "rubric": "内容理解 4 分、情感分析 4 分、语言表达 4 分"},
            ],
        },
        {
            "id": "A003", "title": "英语时态专项练习", "subject": "英语", "class_name": "初三(3)班",
            "deadline": "2026-09-19 20:00", "status": "已截止", "submissions": 40,
            "questions": [
                {"qid": "q1", "type": "choice", "stem": "She ___ to school every day.", "score": 5, "answer": "A", "options": ["A. walks", "B. walked", "C. is walking", "D. has walked"]},
                {"qid": "q2", "type": "fill", "stem": "I ___ (see) him yesterday.", "score": 5, "answer": "saw"},
                {"qid": "q3", "type": "choice", "stem": "They ___ the Great Wall twice so far.", "score": 5, "answer": "D", "options": ["A. visit", "B. visited", "C. are visiting", "D. have visited"]},
            ],
        },
    ],
    "submissions": [
        {
            "id": "S001", "assignment_id": "A001", "student": "张一凡", "class_name": "初三(1)班",
            "submitted_at": "2026-09-19 17:32", "status": "submitted",
            "answers": [
                {"qid": "q1", "answer": "B"},
                {"qid": "q2", "answer": "B"},
                {"qid": "q3", "answer": "2和3"},
                {"qid": "q4", "answer": "配方得 y=(x-3)²-1，所以对称轴是 x=3，顶点是 (3,-1)"},
                {"qid": "q5", "answer": "判别式反映方程根的情况"},
            ],
        },
        {
            "id": "S002", "assignment_id": "A001", "student": "李思琪", "class_name": "初三(1)班",
            "submitted_at": "2026-09-19 17:10", "status": "submitted",
            "answers": [
                {"qid": "q1", "answer": "B"},
                {"qid": "q2", "answer": "C"},
                {"qid": "q3", "answer": "2,3"},
                {"qid": "q4", "answer": "对称轴 x=3，顶点坐标 (3,-1)。配方：y=x²-6x+8=(x-3)²-1"},
                {"qid": "q5", "answer": "Δ>0 时与 x 轴有两个交点，Δ=0 时有一个交点（相切），Δ<0 时没有交点，反映抛物线与 x 轴的交点个数"},
            ],
        },
        {
            "id": "S003", "assignment_id": "A002", "student": "刘雨桐", "class_name": "初三(2)班",
            "submitted_at": "2026-09-19 16:48", "status": "submitted",
            "answers": [
                {"qid": "q1", "answer": "后天下之乐而乐"},
                {"qid": "q2", "answer": "嘱咐"},
                {"qid": "q3", "answer": "范仲淹面对贬谪不怨天尤人，而是心系天下百姓。他在文中写道先天下之忧而忧，后天下之乐而乐，把个人得失放在国家之后，表现了以天下为己任的博大胸襟。"},
            ],
        },
        {
            "id": "S004", "assignment_id": "A003", "student": "赵子轩", "class_name": "初三(3)班",
            "submitted_at": "2026-09-19 15:20", "status": "submitted",
            "answers": [
                {"qid": "q1", "answer": "A"},
                {"qid": "q2", "answer": "see"},
                {"qid": "q3", "answer": "D"},
            ],
        },
    ],
    "reviews": [],
    "mistakes": [
        {"id": "M001", "student": "张一凡", "class_name": "初三(1)班", "subject": "数学", "knowledge": "二次函数图像", "source": "二次函数单元测验 q2", "wrong": "B. 1 个", "right": "C. 2 个", "reason": "判别式 Δ=4>0 应为两个交点", "times": 2, "added_at": "2026-09-19"},
        {"id": "M002", "student": "刘雨桐", "class_name": "初三(2)班", "subject": "语文", "knowledge": "文言实词", "source": "文言文阅读《岳阳楼记》 q2", "wrong": "嘱咐", "right": "通「嘱」，嘱托", "reason": "未答出通假字", "times": 1, "added_at": "2026-09-19"},
        {"id": "M003", "student": "赵子轩", "class_name": "初三(3)班", "subject": "英语", "knowledge": "一般过去时", "source": "英语时态专项 q2", "wrong": "see", "right": "saw", "reason": "yesterday 提示过去时，动词未变形", "times": 3, "added_at": "2026-09-19"},
        {"id": "M004", "student": "周天佑", "class_name": "初二(1)班", "subject": "数学", "knowledge": "因式分解", "source": "因式分解练习 q3", "wrong": "x(x-2)=0 未解完", "right": "x=0 或 x=2", "reason": "未写出根", "times": 1, "added_at": "2026-09-18"},
    ],
    "resources": [
        {"id": "R001", "name": "二次函数复习课件.pptx", "subject": "数学", "grade": "初三", "size": "4.2 MB", "uploader": "李敏", "uploaded_at": "2026-09-10", "downloads": 86, "tags": ["课件", "复习"]},
        {"id": "R002", "name": "《岳阳楼记》朗读音频.mp3", "subject": "语文", "grade": "初三", "size": "8.6 MB", "uploader": "王芳", "uploaded_at": "2026-09-08", "downloads": 54, "tags": ["音频"]},
        {"id": "R003", "name": "英语时态思维导图.pdf", "subject": "英语", "grade": "初三", "size": "1.1 MB", "uploader": "陈刚", "uploaded_at": "2026-09-05", "downloads": 132, "tags": ["导图", "语法"]},
        {"id": "R004", "name": "电路分析实验视频.mp4", "subject": "物理", "grade": "初二", "size": "156 MB", "uploader": "周婷", "uploaded_at": "2026-09-03", "downloads": 41, "tags": ["实验", "视频"]},
    ],
}

# ══════════════════════════════════════════════════
# JSON 存储（演示版：内存 + 落盘）
# ══════════════════════════════════════════════════
db: "dict[str, Any]" = {}  # 启动时由 load_db() 填充


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


def _next_id(coll, prefix):
    max_n = 0
    for it in db.get(coll, []):
        tail = str(it.get("id", "")).replace(prefix, "")
        if tail.isdigit():
            max_n = max(max_n, int(tail))
    return f"{prefix}{max_n + 1:03d}"


# ══════════════════════════════════════════════════
# 批改引擎：第 1 层 规则引擎（确定性）
# ══════════════════════════════════════════════════
def norm_answer(s):
    """答案规范化：去空格、全半角统一、「和/与/及」视为分隔符、小写"""
    s = str(s).replace("　", " ").replace(" ", "")
    for sep in ("和", "与", "及", "、", "，"):
        s = s.replace(sep, ",")
    return s.lower()


def grade_objective(q, stu_ans):
    """客观题规则比对：一致得满分，否则 0 分。置信度恒为 1.0"""
    ok = norm_answer(stu_ans) == norm_answer(q["answer"])
    return {
        "qid": q["qid"], "grader": "rules",
        "score": q["score"] if ok else 0, "max": q["score"],
        "correct": ok, "confidence": 1.0,
        "reasoning": "与标准答案一致" if ok else f"标准答案「{q['answer']}」，学生答案「{stu_ans}」",
    }


# ══════════════════════════════════════════════════
# 批改引擎：第 2 层 主观题（LLM via 网关，失败启发式兜底）
# ══════════════════════════════════════════════════
def _gateway_chat(messages, timeout=GATEWAY_TIMEOUT):
    """经 agent-gateway 调用 LLM；网关不可达返回 None（触发降级）"""
    body = json.dumps({
        "model": GATEWAY_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 500,
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


# ══════════════════════════════════════════════════
# OCR 供应商：作业图片 → 文本（百炼 qwen-vl / 扣子 / Dify，可切换）
# ══════════════════════════════════════════════════
OCR_TEXT_PROMPT = "请识别图片中的学生作业内容，只输出识别到的文字，不要解释。"

FALLBACK_OCR_TEXT = (
    "（演示降级文本 · 未调用真实 OCR）\n"
    "解：设抛物线的解析式为 y = a(x - 1)² + 2。\n"
    "将点 (0, 3) 代入得 3 = a + 2，解得 a = 1。\n"
    "因此二次函数解析式为 y = (x - 1)² + 2。"
)


def _ocr_http_json(url, payload, headers, method="POST"):
    """统一 HTTP JSON 调用，返回解析后的 JSON"""
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=OCR_TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _ocr_bailian(image_b64):
    """阿里云百炼 qwen-vl：OpenAI 兼容 chat/completions，多模态 content 传 data URL"""
    data = _ocr_http_json(
        DASHSCOPE_BASE_URL,
        {
            "model": DASHSCOPE_MODEL,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                    {"type": "text", "text": OCR_TEXT_PROMPT},
                ],
            }],
        },
        {"Authorization": f"Bearer {DASHSCOPE_API_KEY}", "Content-Type": "application/json"},
    )
    return data["choices"][0]["message"]["content"]


def _ocr_coze(image_b64):
    """扣子 Coze：v3 会话接口（object_string 多模态消息）→ 拉取回答"""
    headers = {"Authorization": f"Bearer {COZE_API_TOKEN}", "Content-Type": "application/json"}
    content = json.dumps([
        {"type": "text", "text": OCR_TEXT_PROMPT},
        {"type": "image", "file_url": f"data:image/jpeg;base64,{image_b64}"},
    ], ensure_ascii=False)
    data = _ocr_http_json(
        f"{COZE_BASE_URL}/v3/chat",
        {
            "bot_id": COZE_BOT_ID,
            "user_id": "sample1-teacher",
            "stream": False,
            "auto_save_history": True,
            "additional_messages": [
                {"role": "user", "content": content, "content_type": "object_string"},
            ],
        },
        headers,
    )
    chat_id = data["data"]["id"]
    conv_id = data["data"]["conversation_id"]
    msgs = _ocr_http_json(
        f"{COZE_BASE_URL}/v3/chat/message/list?conversation_id={conv_id}&chat_id={chat_id}",
        None,
        headers,
        method="GET",
    )
    for m in msgs.get("data", []):
        if m.get("type") == "answer" and m.get("content"):
            return m["content"]
    return None


def _ocr_dify(image_b64):
    """Dify：应用 Chat API，files 传 base64 图片（transfer_method=base64）"""
    data = _ocr_http_json(
        f"{DIFY_BASE_URL.rstrip('/')}/v1/chat-messages",
        {
            "inputs": {},
            "query": OCR_TEXT_PROMPT,
            "response_mode": "blocking",
            "user": "sample1-teacher",
            "files": [{"type": "image", "transfer_method": "base64", "upload_file_id": image_b64}],
        },
        {"Authorization": f"Bearer {DIFY_API_KEY}", "Content-Type": "application/json"},
    )
    return data.get("answer") or None


# 供应商注册表：id / 展示名 / 就绪判断 / 所需环境变量
OCR_PROVIDERS = {
    "bailian": {
        "name": "百炼 qwen-vl", "model": DASHSCOPE_MODEL,
        "ready": bool(DASHSCOPE_API_KEY), "env": "DASHSCOPE_API_KEY",
        "desc": "阿里云百炼视觉模型，OpenAI 兼容协议",
    },
    "coze": {
        "name": "扣子 Coze", "model": COZE_BOT_ID or "Bot 对话",
        "ready": bool(COZE_API_TOKEN and COZE_BOT_ID), "env": "COZE_API_TOKEN + COZE_BOT_ID",
        "desc": "扣子 Bot 多模态会话，object_string 图片消息",
    },
    "dify": {
        "name": "Dify", "model": DIFY_BASE_URL,
        "ready": bool(DIFY_API_KEY), "env": "DIFY_API_KEY",
        "desc": "Dify 应用 Chat API，files 传 base64 图片",
    },
}


def _call_provider(provider, image_b64):
    if provider=="bailian": return _ocr_bailian(image_b64)
    if provider=="coze": return _ocr_coze(image_b64)
    return _ocr_dify(image_b64)


def ocr_recognize(image_b64, provider=None):
    """统一 OCR 入口：按供应商调用，未配置/失败返回 (text, degraded, reason)"""
    provider = provider or OCR_PROVIDER
    spec = OCR_PROVIDERS.get(provider)
    if not spec:
        return None, True, f"未知供应商 {provider}"
    if not spec["ready"]:
        return FALLBACK_OCR_TEXT, True, f"未配置 {spec['env']}，返回演示降级文本"
    try:
        text = _call_provider(provider, image_b64)
        if not text:
            return FALLBACK_OCR_TEXT, True, "供应商返回为空"
        return text, False, ""
    except Exception as e:
        logger.warning(f"OCR[{provider}] 调用失败: {e}")
        return FALLBACK_OCR_TEXT, True, f"调用失败：{str(e)[:120]}"


def grade_subjective(q, stu_ans, fewshots):
    """主观题：LLM 按 rubric 评分，返回 JSON；网关离线时启发式兜底"""
    system_prompt = (
        "你是阅卷教师。按评分标准给学生的答案打分。"
        "只输出 JSON，格式：{\"score\": 整数, \"reasoning\": \"一句话依据\", \"confidence\": 0~1 小数}。"
        "confidence 表示你对给分的把握程度。"
    )
    if fewshots:
        samples = "\n".join(
            f"样例{i+1}：学生答案「{s['stu_ans']}」给分 {s['teacher_score']} 分"
            for i, s in enumerate(fewshots[:3])
        )
        system_prompt += f"\n\n参考以下教师改判样例：\n{samples}"
    user_prompt = (
        f"题目：{q['stem']}\n"
        f"满分：{q['score']} 分\n"
        f"评分标准：{q.get('rubric') or q.get('answer') or '无'}\n"
        f"学生答案：{stu_ans}\n"
        "请打分。"
    )
    raw = _gateway_chat([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ])
    if raw:
        try:
            # 容忍 LLM 输出 JSON 前后缀
            m = re.search(r"\{.*\}", raw, re.S)
            parsed = json.loads(m.group(0)) if m else {}
            score = max(0, min(q["score"], int(parsed.get("score", 0))))
            conf = max(0.1, min(1.0, float(parsed.get("confidence", 0.7))))
            return score, conf, parsed.get("reasoning", "LLM 按 rubric 评分"), GATEWAY_MODEL
        except Exception as e:
            logger.warning(f"LLM 输出解析失败，改用启发式: {e}")
    # ── 降级：启发式（确定性伪 AI，保证离线可演示） ──
    L = len(stu_ans.strip())
    if q["type"] == "short":
        ratio = 0.8 if L >= 10 else (0.6 if L >= 4 else 0.2)
    elif q["type"] == "math":
        ratio = 0.85 if L > 15 else 0.6
    else:
        ratio = 0.7 if L >= 60 else 0.4
    score = round(q["score"] * ratio)
    conf = 0.55 + 0.1 * ratio
    return score, round(conf, 2), "网关离线，启发式兜底给分（确定性伪 AI）", "heuristic"


# ══════════════════════════════════════════════════
# 批改引擎：第 3 层 置信度分流 + few-shot 库
# ══════════════════════════════════════════════════
def _fewshot_bucket(knowledge):
    """few-shot 库按知识点分桶（内存，每桶 ≤ FEWSHOT_BUCKET_MAX 条 FIFO）"""
    db.setdefault("fewshot", {})
    bucket = db["fewshot"].setdefault(knowledge, [])
    return bucket


def _append_fewshot(bucket, sample):
    bucket.append(sample)
    if len(bucket) > FEWSHOT_BUCKET_MAX:
        bucket.pop(0)
    save_db()


def run_grading(submission):
    """完整批改：规则 → AI → 置信度分流 → 错题归集"""
    asg = next((a for a in db["assignments"] if a["id"] == submission["assignment_id"]), None)
    if not asg:
        return {"error": "作业不存在"}, 404

    items, total, ai_confs = [], 0, []
    answers = {a["qid"]: str(a.get("answer", "")) for a in submission.get("answers", [])}

    for q in asg["questions"]:
        stu_ans = answers.get(q["qid"], "")
        if q["type"] in ("choice", "fill"):
            item = grade_objective(q, stu_ans)
            if not item["correct"]:
                _add_mistake(submission, asg, q, stu_ans)
        else:
            knowledge = asg["subject"] + "·" + q["qid"]
            score, conf, reasoning, model = grade_subjective(
                q, stu_ans, _fewshot_bucket(knowledge))
            item = {
                "qid": q["qid"], "grader": "ai",
                "score": score, "max": q["score"], "correct": None,
                "confidence": conf, "reasoning": reasoning,
                "via": model, "model": model,
            }
            ai_confs.append(float(conf))
        items.append(item)
        total += int(item["score"])

    # 置信度只看 AI 主观题：客观题规则引擎 100% 确定，不参与稀释
    avg_conf = round(sum(ai_confs) / len(ai_confs), 2) if ai_confs else 1.0
    status = "pending_review" if avg_conf < CONF_THRESHOLD else "graded"
    result = {
        "id": "G-" + submission["id"],
        "submission_id": submission["id"],
        "student": submission["student"],
        "class_name": submission.get("class_name", ""),
        "assignment": asg["title"],
        "assignment_id": asg["id"],
        "score": total,
        "max": sum(q["score"] for q in asg["questions"]),
        "confidence": avg_conf,
        "status": status,
        "low_items": [i["qid"] for i in items if i["confidence"] < CONF_THRESHOLD],
        "items": items,
        "created_at": now_str(),
    }

    # 回写提交状态
    submission["status"] = status
    submission["grade"] = result
    if status == "pending_review":
        # 入复核队列：队列内状态用 pending（待复核）/ confirmed（已确认）
        review_item = dict(result)
        review_item["status"] = "pending"
        review_item["ai_score"] = total
        db["reviews"].insert(0, review_item)
    save_db()
    logger.info(f"批改完成 {submission['id']}: {total} 分, 置信度 {avg_conf}, {status}")
    return result, 200


def _add_mistake(submission, asg, q, stu_ans):
    """客观题答错 → 自动归集错题本（同题重复错误次数累加）"""
    for m in db["mistakes"]:
        if m["student"] == submission["student"] and m["source"].endswith(q["qid"]):
            m["times"] += 1
            return
    db["mistakes"].insert(0, {
        "id": _next_id("mistakes", "M"),
        "student": submission["student"],
        "class_name": submission.get("class_name", ""),
        "subject": asg["subject"],
        "knowledge": asg["subject"] + "·" + q["qid"],
        "source": asg["title"] + " " + q["qid"],
        "wrong": stu_ans,
        "right": q["answer"],
        "reason": f"与标准答案不一致（客观题规则引擎判定）",
        "times": 1,
        "added_at": datetime.now().strftime("%Y-%m-%d"),
    })


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
        session["role"] = "admin" if username == "admin" else "teacher"
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
    if p == "/login" or p == "/login.html":
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
    """登录页（学校风格）"""
    return send_from_directory(STATIC_DIR, "login.html")


@app.route("/")
def index_page():
    """教学平台主页"""
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/css/<path:filename>")
def serve_css(filename):
    """样式（index.html 相对路径引用）"""
    return send_from_directory(os.path.join(STATIC_DIR, "css"), filename)


@app.route("/js/<path:filename>")
def serve_js(filename):
    """脚本（index.html 相对路径引用）"""
    return send_from_directory(os.path.join(STATIC_DIR, "js"), filename)


@app.route("/vendor/<path:filename>")
def serve_vendor(filename):
    """本地化 Vue（index.html 相对路径引用）"""
    return send_from_directory(os.path.join(STATIC_DIR, "vendor"), filename)


# ══════════════════════════════════════════════════
# API：总览 / 班级 / 学生 / 资源
# ══════════════════════════════════════════════════
@app.route("/api/stats/overview", methods=["GET"])
def stats_overview():
    pending = sum(1 for r in db["reviews"] if r.get("status") == "pending")
    graded = sum(1 for s in db["submissions"] if s.get("status") not in ("submitted",))
    return jsonify({
        "school": "牧童中学",
        "classes": len(db["classes"]),
        "students": len(db["students"]),
        "assignments_active": sum(1 for a in db["assignments"] if a["status"] == "进行中"),
        "submissions_today": 46,
        "graded": graded,
        "pending_review": pending,
        "avg_score": 82.5,
        "ai_accuracy": 94.2,
        "gateway": f"agent-gateway · {GATEWAY_URL.replace('http://', '')}",
    })


@app.route("/api/classes", methods=["GET"])
def api_classes():
    return jsonify(db["classes"])


@app.route("/api/students", methods=["GET"])
def api_students():
    class_id = request.args.get("class_id", "")
    students = db["students"]
    if class_id:
        students = [s for s in students if s["class_id"] == class_id]
    return jsonify(students)


@app.route("/api/resources", methods=["GET"])
def api_resources():
    return jsonify(db["resources"])


# ══════════════════════════════════════════════════
# API：作业 / 提交 / 批改 / 复核
# ══════════════════════════════════════════════════
@app.route("/api/assignments", methods=["GET"])
def api_assignments():
    return jsonify(db["assignments"])


@app.route("/api/assignments", methods=["POST"])
def api_assignments_create():
    data = request.get_json(silent=True) or {}
    if not data.get("title") or not data.get("questions"):
        return jsonify({"error": "缺少 title 或 questions"}), 400
    item = {
        "id": _next_id("assignments", "A"),
        "title": data["title"],
        "subject": data.get("subject", "数学"),
        "class_name": data.get("class_name", ""),
        "deadline": data.get("deadline", ""),
        "status": "进行中",
        "submissions": 0,
        "questions": data["questions"],
        "created_at": datetime.now().strftime("%Y-%m-%d"),
    }
    db["assignments"].insert(0, item)
    save_db()
    return jsonify({"ok": True, "item": item})


@app.route("/api/submissions", methods=["GET"])
def api_submissions():
    return jsonify(db["submissions"])


@app.route("/api/submissions", methods=["POST"])
def api_submissions_create():
    data = request.get_json(silent=True) or {}
    item = {
        "id": _next_id("submissions", "S"),
        "assignment_id": data.get("assignment_id", ""),
        "student": data.get("student", "学生"),
        "class_name": data.get("class_name", ""),
        "submitted_at": now_str(),
        "status": "submitted",
        "answers": data.get("answers", []),
    }
    db["submissions"].insert(0, item)
    save_db()
    return jsonify({"ok": True, "item": item})


@app.route("/api/grade", methods=["POST"])
def api_grade():
    """AI 批改：规则引擎 → LLM 评分 → 置信度分流"""
    data = request.get_json(silent=True) or {}
    sid = data.get("submission_id", "")
    sub = next((s for s in db["submissions"] if s["id"] == sid), None)
    if not sub:
        return jsonify({"error": "提交不存在"}), 404
    result, code = run_grading(sub)
    return jsonify(result), code


@app.route("/api/reviews", methods=["GET"])
def api_reviews():
    return jsonify(db["reviews"])


@app.route("/api/reviews/<rid>", methods=["PUT"])
def api_review_confirm(rid):
    """人工复核确认：成绩发布 + 改判样本回流 few-shot 库"""
    data = request.get_json(silent=True) or {}
    rv = next((r for r in db["reviews"] if r["id"] == rid), None)
    if not rv:
        return jsonify({"error": "复核单不存在"}), 404
    rv["status"] = "confirmed"
    rv["confirmed_at"] = now_str()
    rv["teacher_adjust"] = data.get("adjustments", {})
    rv["confirmed_by"] = data.get("confirmed_by", session.get("user", ""))
    # 回流：教师改判的 AI 题 → few-shot 库
    adjustments = data.get("adjustments", {})
    asg = next((a for a in db["assignments"] if a["id"] == rv.get("assignment_id")), None)
    for it in rv.get("items", []):
        if it["grader"] != "ai" or it["qid"] not in adjustments:
            continue
        if int(adjustments[it["qid"]]) == it["score"]:
            continue
        q = next((x for x in asg["questions"] if x["qid"] == it["qid"]), None) if asg else None
        sub = next((s for s in db["submissions"] if s["id"] == rv["submission_id"]), None)
        stu_ans = ""
        if sub:
            stu_ans = next((a["answer"] for a in sub.get("answers", []) if a["qid"] == it["qid"]), "")
        bucket = _fewshot_bucket((asg or {}).get("subject", "通用") + "·" + it["qid"])
        _append_fewshot(bucket, {
            "q": (q or {}).get("stem", ""),
            "rubric": (q or {}).get("rubric", ""),
            "stu_ans": stu_ans,
            "ai_score": it["score"],
            "teacher_score": int(adjustments[it["qid"]]),
            "ts": now_str(),
        })
        logger.info(f"few-shot 回流: {it['qid']} AI {it['score']} → 教师 {adjustments[it['qid']]}")
    # 复核后成绩发布：更新提交状态
    sub = next((s for s in db["submissions"] if s["id"] == rv["submission_id"]), None)
    if sub:
        sub["status"] = "graded"
        if sub.get("grade"):
            sub["grade"]["status"] = "graded"
            sub["grade"]["teacher_adjust"] = adjustments
    save_db()
    return jsonify({"ok": True})


# ══════════════════════════════════════════════════
# API：错题 / 质检 / 学情
# ══════════════════════════════════════════════════
@app.route("/api/mistakes", methods=["GET"])
def api_mistakes():
    return jsonify(db["mistakes"])


@app.route("/api/quality", methods=["GET"])
def api_quality():
    return jsonify({
        "total_checked": 128,
        "deviation_over5": 3,
        "sample_rate": 0.10,
        "accuracy": 97.7,
        "recent": [
            {"id": "QC-001", "assignment": "二次函数单元测", "teacher": "李敏", "checked": 20, "deviation": 1.2, "result": "通过", "ts": "09-19 16:30"},
            {"id": "QC-002", "assignment": "文言文阅读练习", "teacher": "王芳", "checked": 16, "deviation": 6.8, "result": "超标", "ts": "09-19 15:10"},
            {"id": "QC-003", "assignment": "英语完形填空", "teacher": "陈刚", "checked": 12, "deviation": 0.9, "result": "通过", "ts": "09-18 17:45"},
        ],
    })


@app.route("/api/learning", methods=["GET"])
def api_learning():
    return jsonify({
        "knowledge": [
            {"name": "一元二次方程", "mastery": 78, "trend": "up"},
            {"name": "二次函数图像", "mastery": 62, "trend": "down"},
            {"name": "韦达定理", "mastery": 71, "trend": "up"},
            {"name": "圆的方程", "mastery": 85, "trend": "flat"},
            {"name": "三角函数", "mastery": 66, "trend": "up"},
        ],
        "weak_students": [
            {"name": "张一凡", "class_name": "初三(1)班", "weak": "二次函数图像", "score": 58},
            {"name": "刘雨桐", "class_name": "初三(2)班", "weak": "英语时态", "score": 63},
            {"name": "赵子轩", "class_name": "初三(3)班", "weak": "文言实词", "score": 61},
        ],
        "trend": [72, 74, 73, 76, 78, 80],
    })


# ══════════════════════════════════════════════════
# API：作业图片 OCR（百炼 qwen-vl / 扣子 / Dify，可切换）
# ══════════════════════════════════════════════════
@app.route("/api/ocr/providers", methods=["GET"])
def api_ocr_providers():
    """列出 OCR 供应商：id / 名称 / 就绪状态 / 所需环境变量"""
    return jsonify([
        {
            "id": pid, "name": spec["name"], "model": spec["model"],
            "ready": spec["ready"], "env": spec["env"], "desc": spec["desc"],
            "current": pid == OCR_PROVIDER,
        }
        for pid, spec in OCR_PROVIDERS.items()
    ])


@app.route("/api/ocr/recognize", methods=["POST"])
def api_ocr_recognize():
    """作业图片 OCR 识别：JSON {"image": base64} 或 multipart file 上传"""
    provider = request.args.get("provider", "")
    image_b64 = ""
    if request.files and "file" in request.files:
        raw = request.files["file"].read()
        if len(raw) > MAX_IMAGE_BYTES:
            return jsonify({"error": "图片超过 4MB 上限"}), 413
        image_b64 = base64.b64encode(raw).decode("ascii")
    else:
        data = request.get_json(silent=True) or {}
        image_b64 = str(data.get("image", "")).strip()
        if image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]
    if not image_b64:
        return jsonify({"error": "缺少图片（image base64 或 file 上传）"}), 400
    if len(image_b64) > MAX_IMAGE_BYTES * 4 // 3 + 4096:
        return jsonify({"error": "图片超过 4MB 上限"}), 413
    if provider and provider not in OCR_PROVIDERS:
        return jsonify({"error": f"未知供应商 {provider}，可选 {list(OCR_PROVIDERS)}"}), 400
    text, degraded, reason = ocr_recognize(image_b64, provider or None)
    if text is None:
        return jsonify({"error": reason}), 500
    spec = OCR_PROVIDERS[provider or OCR_PROVIDER]
    return jsonify({
        "provider": provider or OCR_PROVIDER,
        "provider_name": spec["name"],
        "model": spec["model"],
        "text": text,
        "degraded": degraded,
        "reason": reason,
    })


# ══════════════════════════════════════════════════
# API：网关（统一 AI 出口）
# ══════════════════════════════════════════════════
def _gateway_health():
    """探测 agent-gateway 健康状态"""
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
        "name": "agent-gateway",
        "url": GATEWAY_URL,
        "status": "online" if online else "offline",
        "version": "1.3.0",
        "models": ["qwen-max", "qwen-plus", "qwen-turbo", "qwen3-omni"],
        "routes": [
            {"path": "/v1/chat/completions", "desc": "通用对话（OpenAI 兼容）", "ok": online},
            {"path": "/v1/embeddings", "desc": "文本向量化（RAG 检索）", "ok": online},
            {"path": "/asr", "desc": "语音转写（会议纪要）", "ok": online},
            {"path": "/health", "desc": "健康检查", "ok": online},
        ],
        "qpm": {"used": 128, "limit": 600},
        "latency": {"p50": 420, "p95": 980},
        "uptime": "99.96%",
        "degraded": not online,
    })


@app.route("/api/gateway/chat", methods=["POST"])
def api_gateway_chat():
    """统一 AI 对话出口：所有 AI 能力经此转发到 agent-gateway"""
    data = request.get_json(silent=True) or {}
    question = str(data.get("question", "")).strip()
    if not question:
        return jsonify({"error": "缺少 question"}), 400
    mode = data.get("mode", "")
    if mode == "rag":
        system_prompt = "你是教学资料库问答助手。回答要有依据，并在末尾列出参考来源（教材章节或资源名）。"
    elif "教案" in question:
        system_prompt = "你是教研员，请生成结构化教案：教学目标 / 重难点 / 教学过程 / 板书设计 / 课后作业。"
    else:
        system_prompt = "你是牧童中学的 AI 助教，回答教师的教学问题，简洁实用。"
    reply = _gateway_chat([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ])
    if reply is None:
        return jsonify({
            "reply": "agent-gateway 不可达（127.0.0.1:10050）。AI 能力已降级：批改走规则引擎 + 启发式兜底，此处暂无法调用 LLM。",
            "degraded": True,
        })
    return jsonify({"reply": reply, "model": GATEWAY_MODEL})


# ══════════════════════════════════════════════════
# 启动
# ══════════════════════════════════════════════════
if __name__ == "__main__":
    load_db()
    print("=" * 52)
    print("  牧童中学智慧教学平台 · 后端")
    print("=" * 52)
    print(f"  平台主页   http://localhost:{PORT}/")
    print(f"  登录页     http://localhost:{PORT}/login")
    print(f"  演示账号   admin / 123456（管理员）")
    print(f"             teacher / 123456（教师）")
    print(f"  AI 出口    {GATEWAY_URL}（离线自动降级）")
    print(f"  OCR 供应商 {OCR_PROVIDER}（可选 {list(OCR_PROVIDERS)}，未配密钥自动降级）")
    print(f"  置信度阈值 {CONF_THRESHOLD}（低于此值转人工复核）")
    print("=" * 52)
    app.run(host="0.0.0.0", port=PORT, debug=False)
