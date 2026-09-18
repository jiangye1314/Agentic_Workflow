# 章节与仓库资源对照表

> 一页看全：每一章对应的导读、模板、提示词与平台资源。

| 章节 | 主题 | 章节导读 | 模板 / 示例 | 平台资源 |
| --- | --- | --- | --- | --- |
| 第 1 章 | 业务流程概述 | [ch01](../chapters/ch01-business-process/) | — | — |
| 第 2 章 | 认识工作流 | [ch02](../chapters/ch02-workflow-basics/) | [workflow-spec.yaml](../templates/workflow-spec.yaml) | — |
| 第 3 章 | 智能体工作流概述 | [ch03](../chapters/ch03-agent-workflow-overview/) | [agent-card.md](../templates/agent-card.md)、[multi-agent-team.yaml](../templates/multi-agent-team.yaml) | — |
| 第 4 章 | 核心设计模式 | [ch04](../chapters/ch04-design-patterns/) ★ | [design-patterns-mini 代码](../examples/design-patterns-mini/)、[本章伪代码](../examples/ch04-design-patterns/)、[research-agent.yaml](../templates/research-agent.yaml) | — |
| 第 5 章 | 工业界构建方法（Anthropic / Google） | [ch05](../chapters/ch05-industry-methods/) | [multi-agent-team.yaml](../templates/multi-agent-team.yaml)、[Agent 演进伪代码](../examples/ch05-agent-evolution/) | [public-cases.md](public-cases.md) |
| 第 6 章 | Agent 系统工程实践 | [ch06](../chapters/ch06-agent-engineering/) ★ | [eval-dataset-template.jsonl](../templates/eval-dataset-template.jsonl)、[human-review-checklist.md](../templates/human-review-checklist.md) | — |
| 第 7 章 | 企业级智能体平台（Dify / 扣子 / FastGPT） | [ch07](../chapters/ch07-agent-platforms/) ★ | [prompts/ 六大框架](../prompts/)、[书中提示词模板](../prompts/book-templates/)、[MCP 配置](../examples/ch07-platform-configs/) | [dify](../resources/dify-practice.md)、[coze](../resources/coze-practice.md)、[fastgpt](../resources/fastgpt-practice.md)、[选型矩阵](../resources/platform-template-matrix.md) |
| 第 8 章 | 工作流编排引擎 | [ch08](../chapters/ch08-workflow-engines/) | [workflow-spec.yaml](../templates/workflow-spec.yaml)、[n8n 部署](../examples/ch08-n8n/) | [n8n](../resources/n8n-practice.md)、[rpa](../resources/rpa-practice.md) |
| 第 9 章 | 办公自动化 | [ch09](../chapters/ch09-office-automation/) | — | [feishu-bitable](../resources/feishu-bitable-practice.md)、[comfyui](../resources/comfyui-practice.md) |
| 第 10 章 | 智能体全景（通用 / 垂直） | [ch10](../chapters/ch10-agent-landscape/) | — | [public-cases.md](public-cases.md) |
| 第 11 章 | 教育行业实践 | [ch11](../chapters/ch11-education/) ★ | [education-tutor-agent.md](../templates/education-tutor-agent.md) | [dify](../resources/dify-practice.md) |
| 第 12 章 | 智能化营销实践 | [ch12](../chapters/ch12-marketing/) ★ | [marketing-content-pipeline.yaml](../templates/marketing-content-pipeline.yaml)、[customer-service-agent.yaml](../templates/customer-service-agent.yaml)、[本章案例素材](../examples/ch12-marketing/) | [coze](../resources/coze-practice.md) |
| 第 13 章 | 传统制造业转型实践 | [ch13](../chapters/ch13-manufacturing/) ★ | [manufacturing-rag-agent.yaml](../templates/manufacturing-rag-agent.yaml)、[rag-workflow.yaml](../templates/rag-workflow.yaml)、[本章配套代码](../examples/ch13-manufacturing/) | [fastgpt](../resources/fastgpt-practice.md) |

★ 表示配套内容更完整的重点章节。

## 跨章节资源

- [prompts/](../prompts/)：六大提示词框架模板（源自第 7.5 节，全书通用）。
- [templates/](../templates/)：平台无关的 Agent / 工作流规格模板，可改写为 Dify、FastGPT、n8n 等平台配置。
- [docs/errata.md](errata.md)：勘误表。
- [docs/reading-guide.md](reading-guide.md)：分角色阅读路线。
