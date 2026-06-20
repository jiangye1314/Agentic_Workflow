# Agent / Workflow 模板目录

本目录提供可复制到 `examples/` 的通用模板。模板偏结构化配置，不绑定特定平台；可按 Dify、FastGPT、n8n、RAGFlow、OpenAI Agents SDK、LangGraph 或 AutoGen 等框架改写。

## 模板列表

| 文件 | 用途 |
| --- | --- |
| `agent-card.md` | 单个 Agent 的角色、工具、权限、评估定义 |
| `workflow-spec.yaml` | 通用工作流规格 |
| `rag-workflow.yaml` | RAG 问答工作流 |
| `multi-agent-team.yaml` | 多智能体团队模板 |
| `research-agent.yaml` | 研究分析型 Agent 模板 |
| `customer-service-agent.yaml` | 客服/售后 Agent 模板 |
| `education-tutor-agent.md` | 教育辅导/作文批改 Agent 模板 |
| `marketing-content-pipeline.yaml` | 营销素材生成工作流模板 |
| `manufacturing-rag-agent.yaml` | 制造业知识问答/运营扫描模板 |
| `human-review-checklist.md` | 人工复核清单 |
| `eval-dataset-template.jsonl` | 评估数据集样例 |

## 使用建议

1. 先复制模板到 `examples/<case-name>/`。
2. 删除不需要的字段。
3. 补充示例数据和评估集。
4. 所有高风险场景必须保留人工复核。
