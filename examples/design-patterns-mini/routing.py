"""路由模式（Routing）：智能客服消息分流的最小演示。

流程：LLM 意图分类 → 按类别分发到专用处理函数。
要点：分类器只负责"判断"，各分支用各自的提示词/工具做"专精处理"。
真实系统中，各分支还可挂不同工具与知识库（见 prompts/04、05 模板）。
"""

import json
import os

from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ.get("OPENAI_BASE_URL") or None,
)
MODEL = os.environ.get("MODEL", "gpt-4o-mini")

MESSAGES = [
    "我昨天下的单怎么还没发货？订单号 A1024",
    "你们的会员年费是多少钱？",
    "我要投诉！收到的货是坏的，客服电话还打不通！",
]


def chat(system: str, user: str) -> str:
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        temperature=0.2,
    )
    return resp.choices[0].message.content


def classify(message: str) -> str:
    """意图分类：只输出类别标签，便于程序路由。"""
    label = chat(
        "把用户消息分类为：order_query / product_qa / complaint。"
        "只输出标签本身，不要任何解释。",
        message,
    ).strip()
    return label if label in {"order_query", "product_qa", "complaint"} else "fallback"


def handle_order_query(message: str) -> str:
    # 真实系统：此处先调用订单查询工具，再基于结果回答
    return chat("你是订单客服。说明你会查询订单状态并回复（本演示未接真实订单系统），"
                "语气简洁专业。", message)


def handle_product_qa(message: str) -> str:
    # 真实系统：此处接知识库 RAG（见 prompts/05-knowledge-rag.md）
    return chat("你是产品顾问。基于常识友好地回答，不确定的价格信息提示以官网为准。", message)


def handle_complaint(message: str) -> str:
    # 高风险分支：安抚 + 收集信息 + 标记转人工
    reply = chat("你是客服主管。先安抚情绪，再确认订单号与问题，告知将转人工专员跟进。",
                 message)
    return reply + "\n[系统] 已创建人工工单，优先级：高。"


HANDLERS = {
    "order_query": handle_order_query,
    "product_qa": handle_product_qa,
    "complaint": handle_complaint,
}


def main() -> None:
    for msg in MESSAGES:
        label = classify(msg)
        handler = HANDLERS.get(label)
        reply = handler(msg) if handler else "抱歉没理解您的问题，为您转接人工客服。"
        print(f"用户：{msg}\n意图：{label}\n回复：{reply}\n")


if __name__ == "__main__":
    main()
