"""Agent 能力四级演进 · 第 5 章配套伪代码。

整理自本书第 5 章（约 p104–107），已修复排版误差。
`llm.generate()`、`call_tool()`、`Agent`、`SharedWorkspace` 为抽象接口，不可直接运行。
四个函数逐级递进，展示从单轮问答到多智能体系统的架构演进。
"""


# ── L1：单智能体（单轮问答）────────────────────────────────
def single_agent(user_input, context):
    prompt = f"""
Context: {context}
User input: {user_input}
Please respond to the user's input based on the context.
"""
    response = llm.generate(prompt)
    return response


# ── L2：工具增强智能体（先决策，再调用）─────────────────────
def tool_augmented_agent(user_input, context, available_tools):
    # 第一步：决策是否使用工具
    prompt_for_decision = f"""
Context: {context}
User input: {user_input}
Available tools:
{format_tools(available_tools)}
First, decide if you need to use any tools to respond to the user.
If yes, specify which tool to use and with what parameters in a structured format.
If no, respond directly.
"""
    decision = llm.generate(prompt_for_decision)

    if "USE_TOOL" in decision:
        # 第二步：调用工具并基于结果生成最终回复
        tool_name, tool_params = parse_tool_call(decision)
        tool_result = call_tool(tool_name, tool_params)
        prompt_for_final_response = f"""
Context: {context}
User input: {user_input}
You used the tool '{tool_name}' and got the following result:
{tool_result}
Please provide your final response to the user based on this result.
"""
        final_response = llm.generate(prompt_for_final_response)
        return final_response
    else:
        return decision


# ── L3：ReAct 智能体（思考→行动→观察 循环）──────────────────
def react_agent(user_input, context, available_tools, max_steps=5):
    # 初始化“思考→行动→观察”链
    prompt_history = f"""
Context: {context}
User input: {user_input}
Available tools: {format_tools(available_tools)}
Solve the user's request step by step.
"""
    for step in range(max_steps):
        # 1. 思考 + 2. 行动
        prompt_for_next_step = (
            prompt_history
            + "\nThought: Let me reason about the current state and what to do next."
            + "\nAction: [Specify your action here: use a tool or respond to the user]"
        )
        response = llm.generate(prompt_for_next_step)
        thought, action = parse_response(response)

        if action.type == "TOOL_USE":
            # 3. 观察
            observation = call_tool(action.tool_name, action.tool_params)
            prompt_history += (
                f"\nThought: {thought}\nAction: {action}\nObservation: {observation}"
            )
        else:  # 最终回复
            return action.content

    # 如果达到最大步数仍未结束，则生成总结性回复
    return generate_summary_response(prompt_history)


# ── L4：多智能体系统（角色分工 + 共享工作空间）───────────────
def multi_agent_system(user_input, context):
    # 初始化共享工作空间
    workspace = SharedWorkspace()
    workspace.add("user_input", user_input)

    # 定义智能体团队
    planner = Agent("planner", planning_prompt_template)
    researcher = Agent("researcher", research_prompt_template)
    writer = Agent("writer", writing_prompt_template)
    critic = Agent("critic", critique_prompt_template)

    # 编排协作流程
    plan = planner.execute(workspace)
    workspace.add("plan", plan)

    research_results = researcher.execute(workspace)
    workspace.add("research_results", research_results)

    draft = writer.execute(workspace)
    workspace.add("draft", draft)

    critique = critic.execute(workspace)
    workspace.add("critique", critique)

    # 根据评审结果进行最终修订或直接输出
    if critique.requires_revision:
        workspace.add("critique_feedback", critique.content)
        final_response = writer.execute(workspace, task="revise_based_on_critique")
    else:
        final_response = draft

    return final_response
