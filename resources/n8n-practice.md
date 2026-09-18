# n8n 实践模板与案例方向

参考项目：`n8n-io/n8n`  
链接：https://github.com/n8n-io/n8n

## 适合沉淀的案例

1. Webhook 触发的内容摘要与通知
2. CRM / 表格 / 邮件同步
3. AI 自动分类与工单路由
4. RSS / Hacker News / GitHub Trending 信息流
5. 人审后发布的营销内容流水线

## 推荐模板：信息收集到摘要通知

```yaml
name: n8n-news-summary-flow
platform: n8n
scenario: 信息流抓取、筛选、摘要、通知

trigger:
  type: schedule
  cron: "0 9 * * *"

nodes:
  - fetch_sources
  - deduplicate_items
  - score_relevance
  - summarize_with_llm
  - human_review_optional
  - send_to_feishu_or_email

failure_policy:
  retry: 3
  on_failure: send_error_notification
  idempotency_key: source_url

metrics:
  - duplicate_rate
  - summary_acceptance_rate
  - notification_delivery_rate
  - manual_edit_rate
```

## 推荐模板：客服工单自动分流

```yaml
name: n8n-ticket-routing-flow
platform: n8n
scenario: 工单分类、优先级判断、分派

trigger:
  type: webhook
  source: customer_support_form

workflow:
  - normalize_payload
  - classify_intent_with_llm
  - detect_priority_and_risk
  - create_or_update_ticket
  - notify_owner
  - log_result

handoff_rules:
  - 高价值客户
  - 投诉升级
  - 退款/赔付请求
  - LLM 置信度低
```

## 落地建议

- n8n 很适合承接 Agent 的外围自动化：触发、路由、通知、写表、写 CRM。
- 涉及写操作时要设置幂等键，避免重复创建订单、工单或通知。
- AI 节点输出要加结构校验，不能直接把自由文本写入业务系统。

## 可放入仓库的目录建议

```text
examples/n8n-ai-summary-flow/
  README.md
  workflow.export.example.json
  env.example
  failure-policy.md
  eval-samples.jsonl
```
