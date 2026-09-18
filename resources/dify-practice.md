# Dify 实践模板与案例方向

参考项目：`langgenius/dify`  
链接：https://github.com/langgenius/dify

## 适合沉淀的案例

1. 企业知识库问答助手
2. 客服 FAQ + 工单转人工
3. 内容生成与审核工作流
4. 表单收集 + 总结 + 通知
5. 带工具调用的业务查询 Agent

## 推荐模板：企业知识库问答助手

```yaml
name: dify-knowledge-base-assistant
platform: dify
scenario: 企业知识库问答

inputs:
  - user_question
  - user_role
  - department

knowledge:
  sources:
    - product_docs
    - internal_faq
    - policy_docs
  retrieval:
    top_k: 6
    rerank: true
    require_citation: true

workflow:
  - classify_question
  - retrieve_authorized_docs
  - generate_grounded_answer
  - validate_citations
  - route_to_human_if_needed

human_review:
  required_when:
    - no_citation
    - low_confidence
    - legal_or_financial_question
    - user_requests_internal_policy_exception

metrics:
  - citation_coverage
  - answer_acceptance_rate
  - fallback_rate
  - human_review_pass_rate
```

## 推荐模板：客服 FAQ + 工单转人工

```yaml
name: dify-customer-service-flow
platform: dify
scenario: 客服 FAQ 与售后咨询

workflow:
  - intent_classification
  - faq_retrieval
  - order_or_ticket_tool_call
  - response_generation
  - escalation_check

escalation_rules:
  - 用户明确要求人工
  - 退款、赔付、投诉升级
  - 工具返回异常或订单不匹配
  - 模型置信度低

output:
  answer: string
  ticket_needed: boolean
  escalation_reason: string
```

## 落地建议

- Dify 适合用来展示从 Prompt App 到 Workflow / Agent 的演进。
- 所有知识库问答案例都应强制保留引用来源。
- 对外客服类应用要单独维护转人工规则和质检数据集。
- 如果接入业务系统，工具权限应尽量只读，写操作必须二次确认。

## 可放入仓库的目录建议

```text
examples/dify-knowledge-assistant/
  README.md
  app-config.example.yaml
  retrieval-policy.md
  human-review-checklist.md
  eval-set.sample.jsonl
```
