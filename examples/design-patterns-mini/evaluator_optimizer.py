"""评估-优化模式（Evaluator-Optimizer）：营销文案迭代的最小演示。

流程：生成 → 评估器按量规打分 → 不达标则带反馈重新生成，直到达标或超限。
要点：评估标准必须显式可检验；必须设置最大轮数防止循环失控（第 6 章）。
"""

import json
import os

from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ.get("OPENAI_BASE_URL") or None,
)
MODEL = os.environ.get("MODEL", "gpt-4o-mini")
MAX_ROUNDS = 3  # 护栏：最多迭代 3 轮

BRIEF = "为一款 39 元的便携榨汁杯写一条 50 字以内的小红书推广文案"


def chat(system: str, user: str) -> str:
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        temperature=0.7,
    )
    return resp.choices[0].message.content


def generate(brief: str, feedback: str = "") -> str:
    """生成器：带上一轮反馈重新创作。"""
    extra = f"\n上一轮评语（请针对性改进）：{feedback}" if feedback else ""
    return chat("你是小红书文案专家。文案要有场景感、有行动号召，不夸大功效。只输出文案。",
                brief + extra)


def evaluate(draft: str) -> dict:
    """评估器：显式量规 + 结构化结论。"""
    out = chat(
        "按量规评估文案：1)≤50字 2)有使用场景 3)有行动号召 4)无夸大功效词。"
        '输出 JSON：{"pass":true/false,"reason":"一句话说明"}',
        draft,
    )
    return json.loads(out[out.index("{"): out.rindex("}") + 1])


def main() -> None:
    feedback = ""
    for round_no in range(1, MAX_ROUNDS + 1):
        draft = generate(BRIEF, feedback)
        result = evaluate(draft)
        print(f"[第{round_no}轮] 文案：{draft}")
        print(f"          评估：{'通过' if result['pass'] else '不通过'} — {result['reason']}")
        if result["pass"]:
            return
        feedback = result["reason"]
    # 超限仍未达标：真实系统在此转人工，而非无限循环
    print(f"达到最大轮数 {MAX_ROUNDS}，输出当前最佳版本并标记「需人工复核」。")


if __name__ == "__main__":
    main()
