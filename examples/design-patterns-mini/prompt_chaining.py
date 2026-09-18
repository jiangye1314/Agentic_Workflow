"""链式模式（Prompt Chaining）：英语作文批改的最小演示。

流程：LLM 打分(步骤1) → LLM 校验评语质量(步骤2) → 不合格则润色(步骤3)。
要点：把一个大任务拆成有校验点的顺序步骤，步间传递结构化数据。
"""

import json
import os

from openai import OpenAI

client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ.get("OPENAI_BASE_URL") or None,
)
MODEL = os.environ.get("MODEL", "gpt-4o-mini")

ESSAY = (
    "Last weekend I go to the park with my friends. We played football and "
    "having a picnic there. The weather is sunny and we all feel very happily."
)


def chat(system: str, user: str) -> str:
    """统一的聊天调用。"""
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        temperature=0.3,
    )
    return resp.choices[0].message.content


def step1_grade(essay: str) -> dict:
    """步骤1：按量规打分并给出评语草稿。"""
    out = chat(
        "你是资深初中英语教师。按词汇、语法、结构、内容四项（各25分）批改作文，"
        '输出 JSON：{"scores":{"词汇":n,...},"total":n,"feedback":"给学生的评语"}',
        f"作文：\n{essay}",
    )
    return json.loads(out[out.index("{"): out.rindex("}") + 1])


def step2_check(result: dict) -> dict:
    """步骤2：校验评语质量（校验点=链式模式的精髓）。"""
    out = chat(
        "检查这份批改结果：分数与评语是否一致、语法错误是否都指出、"
        '语气是否鼓励为主。输出 JSON：{"pass":true/false,"issues":["..."]}',
        json.dumps(result, ensure_ascii=False),
    )
    return json.loads(out[out.index("{"): out.rindex("}") + 1])


def step3_polish(result: dict, issues: list) -> str:
    """步骤3：带问题反馈润色评语。"""
    return chat(
        "根据质检意见润色评语，保持分数不变，语气鼓励、建议可执行。只输出评语。",
        f"批改结果：{json.dumps(result, ensure_ascii=False)}\n质检意见：{issues}",
    )


def main() -> None:
    result = step1_grade(ESSAY)
    print(f"[步骤1] 总分 {result['total']}：{result['feedback']}")

    check = step2_check(result)
    print(f"[步骤2] 质检通过={check['pass']}，问题={check.get('issues')}")

    feedback = result["feedback"] if check["pass"] else step3_polish(result, check.get("issues", []))
    print(f"[最终评语] {feedback}")


if __name__ == "__main__":
    main()
