# 飞书多维表格实践模板与案例方向

参考项目：

- Lark / Feishu OpenAPI Python SDK: https://github.com/larksuite/oapi-sdk-python
- Lark / Feishu OpenAPI Node SDK: https://github.com/larksuite/oapi-sdk-nodejs

## 适合沉淀的案例

1. 销售线索池与自动分派
2. 项目任务看板与逾期提醒
3. 内容选题库与发布排期
4. 用户反馈收集与 AI 分类
5. 运营数据表 + 周报生成

## 推荐模板：销售线索池工作流

```yaml
name: feishu-bitable-lead-pipeline
platform: feishu-bitable
scenario: 销售线索采集、评分、分派、跟进

tables:
  leads:
    fields:
      - lead_id
      - company
      - contact
      - source
      - score
      - owner
      - status
      - next_action
      - last_updated_at

workflow:
  - receive_new_lead
  - normalize_fields
  - score_lead_with_rules_or_llm
  - assign_owner
  - write_to_bitable
  - notify_owner
  - weekly_pipeline_summary

controls:
  pii_redaction: true
  owner_permission_check: true
  duplicate_detection_key: company + contact

metrics:
  - duplicate_rate
  - assignment_latency
  - follow_up_completion_rate
  - conversion_rate
```

## 推荐模板：内容选题库 + AI 周报

```yaml
name: feishu-content-calendar-ai-report
platform: feishu-bitable
scenario: 内容选题、状态流转、周报总结

tables:
  topics:
    fields:
      - topic
      - source_url
      - owner
      - status
      - publish_date
      - notes

workflow:
  - collect_topics
  - classify_topic
  - update_status
  - generate_weekly_summary
  - send_to_group

human_review:
  required_when:
    - summary_contains_unverified_claim
    - content_status_is_publish_ready
```

## 落地建议

- 多维表格适合作为轻量级状态库，不要把它当成完整权限系统。
- 写入记录前要做重复检测，尤其是线索、任务、内容选题。
- AI 生成周报时要保留来源记录和更新时间，避免把过期状态写成事实。

## 可放入仓库的目录建议

```text
examples/feishu-bitable-lead-pipeline/
  README.md
  table-schema.example.yaml
  workflow.example.yaml
  permission-notes.md
  weekly-report-template.md
```
