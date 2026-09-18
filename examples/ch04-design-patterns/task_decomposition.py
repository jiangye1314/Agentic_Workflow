"""任务分解模式（Task Decomposition）· 第 4 章配套伪代码。

整理自本书第 4 章（约 p80–82），已修复排版误差。
包含：分解提示模板、线性分解流程、递归分解。
"""

# ── 分解提示模板（可直接放入提示词中使用）────────────────────
DECOMPOSITION_PROMPT_TEMPLATE = """
任务：[复杂任务描述]
请将上述任务分解为更小的子任务：
1. 首先，分析这个任务的主要组成部分。
2. 将任务分解为3~5个明确的子任务。
3. 对每个子任务，说明：
   - 子任务目标
   - 所需信息或资源
   - 预期输出
4. 确定子任务之间的依赖关系和执行顺序。
然后，按照分解计划依次执行每个子任务，最后整合结果。
"""


# ── 线性分解流程 ───────────────────────────────────────────
def decomposition_process(complex_task, model):
    # 构建分解提示
    decomposition_prompt = f"""
复杂任务：{complex_task}
请将任务分解为多个子任务，对每个子任务：
1) 提供简短描述
2) 列出所需输入
3) 说明预期输出
4) 标明与其他子任务的依赖关系
"""
    # 获取分解计划
    decomposition_plan = model.generate(decomposition_prompt)
    # 解析分解计划，提取子任务
    subtasks = parse_subtasks(decomposition_plan)
    # 按照依赖关系排序子任务
    ordered_subtasks = order_by_dependency(subtasks)

    # 执行子任务
    subtask_results = {}
    for subtask in ordered_subtasks:
        # 准备子任务输入（可能依赖其他子任务的结果）
        subtask_input = prepare_subtask_input(subtask, subtask_results)
        # 构建子任务提示
        subtask_prompt = f"""
子任务：{subtask['description']}
输入：{subtask_input}
请完成该子任务并给出预期输出。
"""
        # 执行子任务
        subtask_result = model.generate(subtask_prompt)
        subtask_results[subtask["id"]] = subtask_result

    # 整合子任务结果
    integration_prompt = f"""
原始复杂任务：{complex_task}
各子任务结果：
{format_subtask_results(subtask_results)}
请整合以上结果，形成最终解决方案。
"""
    final_solution = model.generate(integration_prompt)
    return final_solution


# ── 递归分解（子任务仍复杂则继续拆）─────────────────────────
def recursive_decomposition(task, model, max_depth=3, current_depth=0):
    # 如果达到最大递归深度或任务足够简单，直接解决
    if current_depth >= max_depth or is_simple_enough(task):
        return solve_directly(task, model)

    # 分解任务
    subtasks = decompose_task(task, model)

    # 递归解决每个子任务
    subtask_results = {}
    for subtask_id, subtask in subtasks.items():
        subtask_results[subtask_id] = recursive_decomposition(
            subtask, model, max_depth, current_depth + 1
        )

    # 整合结果
    return integrate_results(task, subtask_results, model)
