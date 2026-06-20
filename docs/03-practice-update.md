# 优质 Agent / Workflow 实践案例库

同步日期：2026-06-20

本文件不复述书稿章节内容，而是整理互联网公开的优质 Agent / Workflow 实践案例。筛选标准：

- 有官方来源、论文、项目仓库或可信公开材料。
- 能抽象出可复用的工作流设计方法。
- 不只展示“用了大模型”，还包含评估、人工复核、权限、安全或上线机制。
- 高风险行业案例必须保留边界说明。

## 推荐案例总览

| 案例 | 场景 | 可借鉴点 | 风险边界 |
| --- | --- | --- | --- |
| Morgan Stanley AI Assistant / Debrief | 金融顾问知识检索、会议总结 | eval 驱动上线、内部知识库检索、CRM 写回、人工复核 | 不生成直接投资建议；金融合规和数据隔离优先 |
| Klarna AI Assistant | 客服、购物助手、多语言服务 | 客服任务自动化、退款退货、重复咨询减少、24/7 多语言支持 | 需监控用户满意度、错误处理、人工兜底 |
| Khan Academy Khanmigo | 教育 AI 导师与教师工具 | 有限试点、学习陪伴、教师辅助、教育安全边界 | 未成年人数据、错误答案、教师复核 |
| Harvey | 法律专业模型定制 | 面向律师的专业模型、文档分析、法律工作流辅助 | 不替代律师法律意见；需审核、权限、客户保密 |
| RAGFlow | 企业文档 RAG 与 Agent 上下文层 | 深度文档解析、可追溯引用、混合检索、RAG+Agent | RAG 只能降低幻觉风险，不能保证答案正确 |
| AutoGen Studio | 多智能体原型设计与调试 | 可视化构建、调试、评估、多智能体规格化 | 原型不等于生产；需权限、日志、成本控制 |
| Minerva CQ | 实时客服坐席辅助 | 实时转写、意图识别、情绪识别、动态 workflow | 论文案例，部署效果需按行业和系统环境复核 |

## 案例 1：Morgan Stanley 的金融顾问 AI 工作流

来源：OpenAI customer story, Morgan Stanley uses AI evals to shape the future of financial services.

### 核心工作流

1. 内部知识库接入：把金融顾问需要检索的研究、流程和知识文档纳入检索体系。
2. Evals 先行：上线前用真实业务问题、专家评分和回归测试评估模型表现。
3. 顾问问答助手：帮助顾问快速检索内部知识，不直接面向客户给出无审核建议。
4. 会议总结 Debrief：在客户同意的前提下处理 Zoom 记录，生成客户 notes 和 follow-up 草稿。
5. CRM 写回：将人工确认后的输出进入客户关系系统。
6. 持续测试：使用样本问题做日常质量回归。

### 值得借鉴

- 先做 eval，再扩展 use case。
- 高风险行业必须保留专家反馈和人工确认。
- RAG 系统的成功不只靠检索，还靠评估数据集、回归测试和质量控制。

### 可落地为仓库示例

```text
examples/finance-advisor-assistant/
  README.md
  eval-dataset.sample.jsonl
  retrieval-config.example.yaml
  meeting-summary-template.md
  human-review-checklist.md
```

## 案例 2：Klarna 的客服与购物 AI Assistant

来源：OpenAI customer story, Klarna.

### 核心工作流

1. 多语言客户咨询入口。
2. 意图识别：退款、退货、订单状态、购物建议等。
3. 业务系统调用：根据权限查询订单或执行流程。
4. 自动回答或执行低风险操作。
5. 复杂/争议/高价值问题转人工。
6. 持续监控重复咨询率、解决时长和用户满意度。

### 值得借鉴

- 客服 AI 适合从高频、规则明确、可回滚的问题开始。
- 指标应同时看效率和质量：解决率、重复咨询、满意度、转人工率。
- 需要人工兜底，不宜把“自动化客服”写成完全替代客服团队。

### 可落地为仓库示例

```text
examples/customer-service-agent/
  intent-schema.md
  refund-workflow.yaml
  escalation-rules.md
  qa-eval-set.jsonl
```

## 案例 3：Khan Academy Khanmigo 的教育 AI 试点

来源：OpenAI customer story, Khan Academy.

### 核心工作流

1. 学生提出问题。
2. AI 以启发式方式引导，而不是直接给答案。
3. 对教师提供备课、活动设计、反馈草稿等辅助。
4. 有限试点、逐步扩大，持续观察教学效果与错误风险。
5. 对未成年人数据和课堂使用设置安全边界。

### 值得借鉴

- 教育 AI 更适合做“陪练”和“教师助手”，不应替代教师判断。
- 对学生输出要避免直接给最终答案，优先引导思考。
- 需要记录错误案例和教师反馈，持续改进。

### 可落地为仓库示例

```text
examples/education-tutor-agent/
  socratic-prompt-template.md
  teacher-review-rubric.md
  student-safety-policy.md
  misconception-tags.json
```

## 案例 4：Harvey 的法律专业工作流

来源：OpenAI customer story, Harvey.

### 核心工作流

1. 法律任务分类：检索、摘要、文书草稿、条款比对、尽调。
2. 使用法律领域材料和客户授权数据增强专业性。
3. 输出法律分析草稿或检索结果。
4. 律师或法务人员审核、修改、确认。
5. 保留引用、来源和审计记录。

### 值得借鉴

- 专业行业更适合“expert-in-the-loop”，不是“AI replaces expert”。
- 模型定制需要与权限控制、客户保密、审计记录一起设计。
- 法律内容必须标为草稿或辅助分析。

### 可落地为仓库示例

```text
examples/legal-doc-review/
  clause-extraction-schema.json
  citation-policy.md
  attorney-review-checklist.md
```

## 案例 5：RAGFlow 的企业文档 RAG 工作流

来源：RAGFlow README 与官方文档。

### 核心工作流

1. 接入复杂文档：PDF、Word、表格、扫描件、图片等。
2. 使用文档解析和分块策略处理复杂版面。
3. 混合检索与重排。
4. 生成带引用的答案。
5. 通过引用快照和人工干预降低幻觉风险。

### 值得借鉴

- 企业 RAG 的关键常常不是 LLM，而是文档解析、分块、权限和引用。
- “可追溯引用”应作为企业知识问答的默认要求。
- 对复杂 PDF 和扫描件要把 OCR 置信度、人工抽检纳入流程。

### 可落地为仓库示例

```text
examples/ragflow-document-qa/
  docker-compose.override.example.yml
  sample-docs/
  chunking-policy.md
  citation-eval.md
```

## 案例 6：AutoGen Studio 的多智能体原型和调试

来源：AutoGen Studio paper, Microsoft AutoGen project.

### 核心工作流

1. 用可视化界面定义多个 agent。
2. 为每个 agent 配置模型、工具和系统提示。
3. 用 JSON 规格表示 workflow。
4. 运行、观察、调试多智能体交互。
5. 复用 agent 组件并进行评估。

### 值得借鉴

- 多智能体系统必须可观察、可调试、可复现。
- 原型阶段适合低代码/可视化工具，生产阶段要补权限、成本、日志和异常处理。
- 多智能体不是越多越好，应从单 agent 或简单 workflow 开始。

### 可落地为仓库示例

```text
examples/multi-agent-prototyping/
  autogen-spec.sample.json
  debug-log-template.md
  agent-role-card.md
```

## 案例 7：Minerva CQ 的客服坐席辅助 Agentic Workflow

来源：Redefining CX with Agentic AI: Minerva CQ Case Study, arXiv.

### 核心工作流

1. 实时语音转写。
2. 识别客户意图、情绪和实体。
3. 动态客户画像与上下文维护。
4. 触发模块化工作流。
5. 给坐席提供实时辅助、摘要和下一步建议。

### 值得借鉴

- Agentic workflow 不一定直接面对最终客户，也可以作为坐席 copilot。
- 实时系统需要关注延迟、准确性、坐席采纳率和误导风险。
- 语音客服场景尤其需要人工主体责任。

### 可落地为仓库示例

```text
examples/contact-center-copilot/
  realtime-transcript-schema.json
  intent-routing-rules.md
  agent-assist-ui-notes.md
  call-summary-template.md
```

## 推荐优先级

建议优先补充三个仓库示例：

1. `examples/ragflow-document-qa/`  
   最贴近企业知识库与 RAG 工作流，风险可控，读者容易复现。

2. `examples/customer-service-agent/`  
   业务价值明确，可演示意图识别、工具调用、转人工、评估闭环。

3. `examples/education-tutor-agent/`  
   适合展示“AI 辅助而非替代人”的设计，能体现安全边界。

## 不建议优先复刻的案例

- 高度金融化的投资建议 agent：合规成本高，容易误导。
- 法律意见书自动生成 agent：必须有专业审核，不适合做无边界 demo。
- 完全自主电脑操作 agent：权限、安全和不可控风险较高。
- 只展示炫技、没有评估指标的多智能体 demo。
