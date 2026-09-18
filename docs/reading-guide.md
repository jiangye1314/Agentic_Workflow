# 分角色阅读路线

本书面向四类读者。以下路线把「书中章节」与「本仓库资源」串起来，帮助不同背景的读者用最少时间获得最大收益。

## AI 技术工程师

目标：掌握 Agent 核心——工作流的设计与实现，从理论到编码实战。

1. **打底**：第 2 章（[导读](../chapters/ch02-workflow-basics/)）、第 3 章（[导读](../chapters/ch03-agent-workflow-overview/)），统一术语与心智模型。
2. **核心**：第 4 章设计模式（[导读](../chapters/ch04-design-patterns/)），配合 [examples/design-patterns-mini](../examples/design-patterns-mini/) 亲手跑通链式、路由、评估-优化三种模式。
3. **方法论**：第 5 章（[导读](../chapters/ch05-industry-methods/)）对照 Anthropic / Google 的工程建议；第 6 章（[导读](../chapters/ch06-agent-engineering/)）掌握评估与优化清单。
4. **落地**：第 7 章（[导读](../chapters/ch07-agent-platforms/)）做平台选型，用 [templates/](../templates/) 中的规格模板描述你的第一个生产级工作流。
5. **进阶**：从 [docs/public-cases.md](public-cases.md) 挑选一个同行业公开案例做拆解练习。

## AI 开发者与产品经理

目标：具备从需求分析到产品设计的 AI 视角。

1. 第 1 章（[导读](../chapters/ch01-business-process/)）理解业务流程分类与价值。
2. 第 3 章（[导读](../chapters/ch03-agent-workflow-overview/)）弄清智能体工作流与传统工作流的区别。
3. 第 7 章（[导读](../chapters/ch07-agent-platforms/)）：Dify / 扣子 / FastGPT 对比与选型建议；直接使用 [prompts/](../prompts/) 六大提示词框架模板。
4. 第 10 章（[导读](../chapters/ch10-agent-landscape/)）：了解通用与垂直智能体产品形态，做竞品参照。
5. 从第 11～13 章中挑与你业务最接近的一章，按方案卡梳理需求清单。

## 期望在业务中落地 AI 的技术团队

目标：规避技术陷阱与决策误区，明确实施路径。

1. [chapter-map.md](chapter-map.md)：先对全书与仓库资源有全局认识。
2. 第 6 章（[导读](../chapters/ch06-agent-engineering/)）：设计原则、常见挑战、评估优化——上线前必读。
3. 第 7 章（[导读](../chapters/ch07-agent-platforms/)）：平台对比 + 部署与成本效益分析。
4. 第 11～13 章（[教育](../chapters/ch11-education/) / [营销](../chapters/ch12-marketing/) / [制造](../chapters/ch13-manufacturing/)）：按行业方案卡制定自己的行动路线图。
5. 上线前对照 [templates/human-review-checklist.md](../templates/human-review-checklist.md) 与 [templates/eval-dataset-template.jsonl](../templates/eval-dataset-template.jsonl) 建立评估与复核机制。

## 对自动化流程感兴趣的从业者（非技术背景）

目标：看懂 AI 如何赋能业务流程，把握落地机会。

1. 第 1、2 章导读：用通俗语言理解流程与工作流。
2. 第 9 章（[导读](../chapters/ch09-office-automation/)）：多维表格等零代码工具的跨系统业务流。
3. 第 10 章（[导读](../chapters/ch10-agent-landscape/)）：看看通用/垂直智能体已经能做什么。
4. [resources/](../resources/)：按平台实践文档动手搭建第一个应用（多数平台支持零代码）。
5. 遇到术语回到对应章节导读的「关键概念速查」。
