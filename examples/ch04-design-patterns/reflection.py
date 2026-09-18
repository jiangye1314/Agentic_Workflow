"""反思模式（Reflection）三种形态 · 第 4 章配套伪代码。

整理自本书第 4 章（约 p66–68），已修复排版产生的缩进/字符误差。
`model.generate()` 与 `agent.generate()` 为抽象接口，本文件不可直接运行。
"""

# ── 形态一：单次反思（生成 → 批判 → 精炼）────────────────────
initial_prompt = "请生成一篇关于RAG模式的介绍。"
initial_output = model.generate(initial_prompt)

critique_prompt = f"""
请对以下内容进行批判性审查，并给出改进后的版本：

{initial_output}

审查维度：
1. 准确性：是否存在任何事实错误或误导性陈述？
2. 清晰度：语言是否清晰、简洁、易于理解？
3. 连贯性：文本逻辑是否通顺？
4. 完整性：是否遗漏了任何关键信息？
"""
final_output = model.generate(critique_prompt)


# ── 形态二：迭代反思（带退出条件的循环）──────────────────────
def iterative_reflection(task, max_iterations=3):
    # 初始生成
    current_solution = agent.generate(f"解决以下任务：{task}")

    for i in range(max_iterations):
        print(f"--- 迭代 {i + 1} ---")

        # 自我批判
        critique_prompt = f"""
任务：{task}
当前解决方案：{current_solution}
请指出其中存在的问题。
"""
        critique = agent.generate(critique_prompt)
        print(f"批判：{critique}")

        # 精炼和改进
        refinement_prompt = f"""
任务：{task}
当前解决方案：{current_solution}
批判：{critique}
请基于批判意见改进解决方案。
"""
        new_solution = agent.generate(refinement_prompt)

        # 检查是否达到目标或没有显著改进，如果是，则退出循环
        if is_solution_good_enough(new_solution) or no_significant_change(
            current_solution, new_solution
        ):
            return new_solution
        current_solution = new_solution

    return current_solution


# ── 形态三：多智能体反思（角色分工的反思）────────────────────
def multi_agent_reflection(task, initial_output, model):
    # 创建者智能体生成初始输出
    creator_output = initial_output

    # 评论者智能体提供批评
    critic_prompt = f"你是一位严格的评论者。请批判性评估以下输出：\n{creator_output}"
    critic_feedback = model.generate(critic_prompt)

    # 改进者智能体提供具体改进建议
    improver_prompt = f"你是一位改进专家。基于以下评论，提供具体改进建议：\n{critic_feedback}"
    improvement_suggestions = model.generate(improver_prompt)

    # 整合者智能体生成最终改进版本
    integrator_prompt = f"""
原始输出：{creator_output}
评论：{critic_feedback}
改进建议：{improvement_suggestions}
请整合以上信息，输出最终改进版本。
"""
    final_output = model.generate(integrator_prompt)
    return final_output
