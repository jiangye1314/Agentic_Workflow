"""多智能体团队 · 第 4 章配套伪代码。

整理自本书第 4 章（约 p87–92），已修复排版误差。
核心构件：SharedWorkspace（共享工作空间）+ Agent（角色化智能体）。
三个案例：内容创作团队、产品开发团队、旅行规划专家。
注意：Agent.execute() 在本文件中为模拟输出，真实实现需接入大模型。
"""


class SharedWorkspace:
    """一个简单的共享工作空间，用于存储和检索任务产出物。"""

    def __init__(self):
        self.artifacts = {}

    def add(self, key, value):
        print(f"【工作空间】: 已添加产出物 '{key}'。")
        self.artifacts[key] = value

    def get(self, key):
        return self.artifacts.get(key)


class Agent:
    """一个简化的智能体，根据角色执行特定任务。"""

    def __init__(self, role):
        self.role = role

    def execute(self, task, input_data):
        print(f"--- 任务开始：【{self.role}】正在执行 '{task}' ---")
        # 在实际应用中，这里会调用大语言模型并提供具体的指令
        # 此处仅为模拟输出
        output = f"'{task}' 的产出物 (基于{str(input_data)[:100]}…)"
        print(f"--- 任务完成：【{self.role}】已生成结果。 ---")
        return output


# ── 案例一：内容创作团队 ────────────────────────────────────
def content_creation_team(content_brief: str):
    """
    :param content_brief: 初始内容需求，例如"撰写一篇关于AI在市场营销中应用的博客文章"。
    :return: 包含最终内容的字典。
    """
    # 1. 初始化共享工作空间，作为团队协作的中心枢纽
    workspace = SharedWorkspace()
    workspace.add("content_brief", content_brief)

    # 2. 创建专业化智能体，并赋予它们独特的角色
    strategist = Agent(role="策略师")
    researcher = Agent(role="研究员")
    writer = Agent(role="作家")
    fact_checker = Agent(role="事实核查员")
    editor = Agent(role="编辑")

    # 3. 协作流程：任务按明确的逻辑顺序执行
    # 第一步：策略师分析需求，制定内容策略和大纲
    content_strategy = strategist.execute(
        task="分析内容需求，定义目标受众、关键信息和文章大纲",
        input_data=workspace.get("content_brief"),
    )
    workspace.add("content_strategy", content_strategy)

    # 第二步：研究员根据策略，收集相关资料、数据和案例
    research_materials = researcher.execute(
        task="根据策略和主题，收集最新的行业报告、统计数据和成功案例",
        input_data=workspace.get("content_strategy"),
    )
    workspace.add("research_materials", research_materials)

    # 第三步：作家基于策略和研究资料，创作初稿
    first_draft = writer.execute(
        task="创作内容初稿，确保结构清晰、论点明确",
        input_data={
            "strategy": workspace.get("content_strategy"),
            "research": workspace.get("research_materials"),
        },
    )
    workspace.add("first_draft", first_draft)

    # 第四步：事实核查员验证初稿中的数据和信息的准确性
    fact_check_report = fact_checker.execute(
        task="验证初稿中的所有事实、数据来源和引用的准确性，并生成核查报告",
        input_data=workspace.get("first_draft"),
    )
    workspace.add("fact_check_report", fact_check_report)

    # 第五步：编辑根据初稿和核查报告，进行润色、校对，完成最终版本
    final_content = editor.execute(
        task="润色语言、调整结构、修复语法错误，并整合事实核查建议，输出最终稿件",
        input_data={
            "draft": workspace.get("first_draft"),
            "report": workspace.get("fact_check_report"),
        },
    )
    return {"final_content": final_content, "workspace": workspace.artifacts}


# 运行示例
# final_product = content_creation_team("撰写一篇关于AI在市场营销中应用的博客文章")
# print("\n最终产出:", final_product['final_content'])


# ── 案例二：产品开发团队 ────────────────────────────────────
def product_development_team(product_brief: str):
    """
    :param product_brief: 初始产品需求，例如"为我们的电商App开发一个用户评论和评分功能"。
    :return: 最终交付的产品及相关文档。
    """
    # 1. 初始化项目空间
    workspace = SharedWorkspace()
    workspace.add("product_brief", product_brief)

    # 2. 创建智能体团队
    pm = Agent(role="产品经理")
    ux_designer = Agent(role="用户体验设计师")
    architect = Agent(role="架构师")
    developer = Agent(role="开发者")
    qa_engineer = Agent(role="测试工程师")
    project_manager = Agent(role="项目经理")

    # 3. 模拟开发流程
    # 项目启动
    project_plan = project_manager.execute(task="制定项目计划和时间表", input_data=product_brief)
    workspace.add("project_plan", project_plan)

    # 需求与设计
    prd = pm.execute(task="撰写PRD", input_data=product_brief)
    workspace.add("prd", prd)
    ux_design = ux_designer.execute(
        task="根据PRD设计UI（用户界面）/UX（用户体验）原型",
        input_data=workspace.get("prd"),
    )
    workspace.add("ux_design", ux_design)
    tech_arch = architect.execute(task="设计技术架构和API", input_data=workspace.get("prd"))
    workspace.add("tech_architecture", tech_arch)

    # 开发与测试
    source_code = developer.execute(
        task="根据设计文档编写功能代码",
        input_data={
            "prd": workspace.get("prd"),
            "design": workspace.get("ux_design"),
            "architecture": workspace.get("tech_architecture"),
        },
    )
    workspace.add("source_code", source_code)
    test_report = qa_engineer.execute(
        task="对代码进行单元测试、集成测试和UI测试",
        input_data=workspace.get("source_code"),
    )
    workspace.add("test_report", test_report)

    # 此处可加入一个循环，用于处理Bug修复和回归测试
    # …
    final_product = f"已发布的【{product_brief}】功能代码和文档"
    return {"final_product": final_product, "workspace": workspace.artifacts}


# ── 案例三：旅行规划专家（含人机交互节点）────────────────────
def travel_planning_expert(user_request: dict):
    """
    :param user_request: 包含用户偏好的字典,
        例如{"interest": "探索古代文明", "budget": "中等", "duration": "7天"}
    :return: 包含完整行程规划的字典。
    """
    workspace = SharedWorkspace()
    workspace.add("user_request", user_request)

    # 1. 创建专家智能体
    destination_expert = Agent(role="目的地推荐专家")
    booking_expert = Agent(role="机票酒店专家")
    itinerary_planner = Agent(role="行程规划专家")

    # 2. 启动规划流程
    # 第一步：推荐目的地
    suggested_destinations = destination_expert.execute(
        task="根据用户偏好推荐3个目的地",
        input_data=workspace.get("user_request"),
    )
    workspace.add("suggested_destinations", suggested_destinations)

    # (在真实应用中，此处会有人机交互，让用户选择一个目的地)
    chosen_destination = "埃及开罗"  # 模拟用户选择
    workspace.add("chosen_destination", chosen_destination)
    print(f"用户选择了: {chosen_destination}")

    # 第二步：查询机票和酒店
    booking_options = booking_expert.execute(
        task="查找前往目的地的最佳机票和酒店选项",
        input_data={
            "destination": workspace.get("chosen_destination"),
            "request": workspace.get("user_request"),
        },
    )
    workspace.add("booking_options", booking_options)

    # 第三步：制定详细行程
    final_itinerary = itinerary_planner.execute(
        task="创建详细的每日行程规划，并格式化为PDF样式",
        input_data={
            "destination_info": workspace.get("chosen_destination"),
            "booking_info": workspace.get("booking_options"),
            "request": workspace.get("user_request"),
        },
    )
    workspace.add("final_itinerary_pdf", final_itinerary)
    return {"final_plan": final_itinerary, "workspace": workspace.artifacts}
