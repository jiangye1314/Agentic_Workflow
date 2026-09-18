# FastGPT 实践模板与案例方向

参考项目：`labring/FastGPT`  
链接：https://github.com/labring/FastGPT

## 适合沉淀的案例

1. 团队知识库问答
2. 企业私有文档问答
3. 可视化工作流编排
4. 表单收集 + 文档生成
5. MCP / 外部工具接入型 Agent

## 推荐模板：企业私有文档问答

```yaml
name: fastgpt-private-doc-qa
platform: fastgpt
scenario: 企业私有知识库问答

data_sources:
  - markdown_docs
  - pdf_docs
  - faq_table

retrieval_policy:
  chunk_strategy: semantic
  top_k: 8
  rerank: true
  metadata_filters:
    - department
    - confidentiality_level

workflow:
  - receive_question
  - check_user_permission
  - retrieve_context
  - generate_answer_with_citations
  - confidence_check
  - return_or_escalate

guardrails:
  - 无引用不得编造
  - 无权限不得返回片段
  - 涉及制度例外必须转人工

metrics:
  - retrieval_recall
  - citation_accuracy
  - permission_leakage_rate
  - answer_factuality
```

## 推荐模板：表单到文档生成工作流

```yaml
name: fastgpt-form-to-doc
platform: fastgpt
scenario: 表单收集与文档生成

inputs:
  - form_payload
  - template_type
  - reviewer

workflow:
  - validate_form_fields
  - enrich_with_knowledge_base
  - generate_document_draft
  - format_output
  - reviewer_approval

outputs:
  - draft_markdown
  - missing_fields
  - review_status
```

## 落地建议

- FastGPT 适合做中文场景下的知识库问答和可视化流程示例。
- 企业案例要强调权限过滤，不能只靠提示词避免越权。
- 文档生成类案例要保存中间产物，便于审计和人工修改。

## 可放入仓库的目录建议

```text
examples/fastgpt-private-doc-qa/
  README.md
  dataset-policy.md
  workflow.example.yaml
  permission-model.md
  eval-set.sample.jsonl
```
