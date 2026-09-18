# 智能体工作流设计：方法与实践 · 配套资源库

> 《智能体工作流设计：方法与实践》官方配套仓库
> 作者：绛烨、吕昭波 ｜ 机械工业出版社（智能系统与技术丛书）｜ ISBN 978-7-111-81535-8

本仓库为读者提供与全书配套的**章节导读、提示词模板库、工作流/Agent 模板、平台实践资源、公开案例索引与勘误表**，帮助你在阅读之外快速动手实践。

## 快速导航

### 按读者角色

| 你是 | 推荐阅读路线 |
| --- | --- |
| AI 技术工程师 | [docs/reading-guide.md](docs/reading-guide.md) → 第 4～6 章导读 → [examples/](examples/) |
| AI 开发者 / 产品经理 | 第 1～3 章导读 → 第 7 章平台选型 → [prompts/](prompts/) |
| 落地 AI 的技术团队 | [docs/chapter-map.md](docs/chapter-map.md) → 第 11～13 章行业方案 → [templates/](templates/) |
| 业务流程从业者 | 第 1～3 章导读 → 第 9～10 章导读 → [resources/](resources/) |

详细的分角色阅读路线见 [docs/reading-guide.md](docs/reading-guide.md)。

### 按全书章节

| 篇章 | 章节 | 配套导读 | 配套资源 |
| --- | --- | --- | --- |
| 第一篇 基础知识 | 第 1 章 业务流程概述 | [导读](chapters/ch01-business-process/) | — |
| | 第 2 章 认识工作流 | [导读](chapters/ch02-workflow-basics/) | [workflow-spec 模板](templates/workflow-spec.yaml) |
| | 第 3 章 智能体工作流概述 | [导读](chapters/ch03-agent-workflow-overview/) | [agent-card 模板](templates/agent-card.md) |
| 第二篇 方法论 | 第 4 章 核心设计模式 | [导读](chapters/ch04-design-patterns/) ★ | [最小代码示例](examples/design-patterns-mini/) |
| | 第 5 章 工业界构建方法 | [导读](chapters/ch05-industry-methods/) | [multi-agent-team 模板](templates/multi-agent-team.yaml)、[Agent 演进伪代码](examples/ch05-agent-evolution/) |
| | 第 6 章 Agent 系统工程实践 | [导读](chapters/ch06-agent-engineering/) ★ | [评估集模板](templates/eval-dataset-template.jsonl)、[人工复核清单](templates/human-review-checklist.md) |
| 第三篇 技术实现 | 第 7 章 企业级智能体平台 | [导读](chapters/ch07-agent-platforms/) ★ | [prompts/](prompts/)、[书中提示词模板](prompts/book-templates/)、[MCP 配置](examples/ch07-platform-configs/)、[resources/platform-template-matrix.md](resources/platform-template-matrix.md) |
| | 第 8 章 工作流编排引擎 | [导读](chapters/ch08-workflow-engines/) | [resources/n8n-practice.md](resources/n8n-practice.md)、[n8n 部署命令](examples/ch08-n8n/) |
| | 第 9 章 办公自动化 | [导读](chapters/ch09-office-automation/) | [resources/feishu-bitable-practice.md](resources/feishu-bitable-practice.md) |
| | 第 10 章 智能体全景 | [导读](chapters/ch10-agent-landscape/) | [docs/public-cases.md](docs/public-cases.md) |
| 第四篇 实践 | 第 11 章 教育行业 | [导读](chapters/ch11-education/) ★ | [education-tutor-agent 模板](templates/education-tutor-agent.md) |
| | 第 12 章 智能化营销 | [导读](chapters/ch12-marketing/) ★ | [marketing-content-pipeline 模板](templates/marketing-content-pipeline.yaml)、[本章案例素材](examples/ch12-marketing/) |
| | 第 13 章 传统制造业转型 | [导读](chapters/ch13-manufacturing/) ★ | [manufacturing-rag-agent 模板](templates/manufacturing-rag-agent.yaml)、[本章配套代码](examples/ch13-manufacturing/) |

★ 表示配套内容更完整的重点章节。完整的章节-资源对照见 [docs/chapter-map.md](docs/chapter-map.md)。

## 仓库目录说明

| 目录 | 内容 |
| --- | --- |
| [chapters/](chapters/) | 13 章导读：本章要点、关键概念、动手练习、延伸阅读 |
| [prompts/](prompts/) | 六大提示词框架（对应第 7.5 节）的即用模板库 |
| [templates/](templates/) | 平台无关的 Agent / 工作流结构化模板（YAML/Markdown） |
| [resources/](resources/) | Dify、FastGPT、扣子、n8n、RPA、多维表格、ComfyUI 平台实践文档 |
| [examples/](examples/) | 可运行演示（design-patterns-mini）+ 各章配套伪代码/案例（ch04/ch05/ch07/ch08/ch12/ch13） |
| [docs/](docs/) | 阅读路线、章节映射、[勘误表](docs/errata.md)、[公开案例库](docs/public-cases.md) |

## 反馈与交流

- **勘误**：查看 [docs/errata.md](docs/errata.md)，通过 [Issue 勘误模板](.github/ISSUE_TEMPLATE/errata-report.md) 提交
- **电子邮件**：ycw2309280700@126.com
- **GitHub Issues**：[提交 Issue](https://github.com/jiangye1314/Agentic_Workflow/issues)
- **社群**：关注公众号「AIGC新知」「沐然云计算」，后台回复「加入社群」

参与贡献请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可与边界

- 本仓库内容以 [LICENSE](LICENSE) 为准；第三方平台与项目请以各自许可证和服务条款为准。
- 高风险业务场景（金融、法律、医疗、教育未成年人等）必须保留权限控制、日志、人工复核与回滚机制，模板中已内置相关字段，请勿删除。
