# 平台选型与模板映射矩阵

本矩阵用于把公开项目实践转化为本仓库的 `examples/` 和 `templates/` 内容。

## 平台选型

| 需求 | 优先平台 | 适合模板 | 说明 |
| --- | --- | --- | --- |
| 企业知识库问答 | Dify / FastGPT / RAGFlow | `rag-workflow.yaml` | 重点是文档解析、权限过滤、引用和评估 |
| 快速 Bot 原型 | Coze / Dify | `agent-card.md` | 适合验证角色、工具、知识库和渠道发布 |
| 跨系统自动化 | n8n | `workflow-spec.yaml` | 适合 webhook、定时任务、通知、同步、轻量 ETL |
| 桌面或浏览器重复流程 | RPA | `workflow-spec.yaml` + `human-review-checklist.md` | 适合后台录入、文件下载、报表处理 |
| 多维表格状态管理 | 飞书多维表格 | `workflow-spec.yaml` | 适合线索池、项目看板、内容排期、周报 |
| 营销视觉素材 | ComfyUI | `marketing-content-pipeline.yaml` | 适合图片生成、封面图、商品图、品牌素材 |
| 多智能体协作 | AutoGen / Dify / Coze / LangGraph | `multi-agent-team.yaml` | 先定义角色、状态、评价和人审，不要盲目增加 Agent |

## 案例优先级建议

### P0：最适合先做

1. `examples/dify-knowledge-assistant/`
2. `examples/n8n-ai-summary-flow/`
3. `examples/feishu-bitable-lead-pipeline/`
4. `examples/comfyui-marketing-visuals/`

这些案例业务边界清楚，输入输出容易脱敏，读者也容易复现。

### P1：适合第二批

1. `examples/fastgpt-private-doc-qa/`
2. `examples/rpa-spreadsheet-automation/`
3. `examples/coze-knowledge-tool-bot/`

这些案例需要更多环境准备、权限说明或平台配置说明。

### P2：谨慎展示

1. 金融投资建议 Agent
2. 法律意见自动生成 Agent
3. 医疗诊断 Agent
4. 完全无人监管的 RPA 写操作

这些案例必须使用模拟数据，并明确人工审核、权限和免责声明。

## 标准案例目录结构

```text
examples/<platform-case-name>/
  README.md
  workflow.example.yaml
  agent-card.md
  env.example
  sample-data/
  evaluation/
    eval-set.sample.jsonl
  human-review-checklist.md
  references.md
```

## 每个案例 README 应包含

- 业务目标
- 输入与输出
- 平台依赖
- 快速运行方式
- 工作流步骤
- 权限与数据边界
- 评估指标
- 人工复核点
- 参考链接

## 模板沉淀原则

1. 平台导出文件放在 `examples/`，平台无关结构放在 `templates/`。
2. 涉及第三方项目时只保留链接和配置说明，不复制大段源码。
3. 密钥、真实客户数据、内部文档不得进入仓库。
4. 每个案例都要至少包含一个评估样例和一个人工复核清单。
