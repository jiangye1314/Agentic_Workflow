# 扣子 / Coze 实践模板与案例方向

参考项目：

- Coze Studio: https://github.com/coze-dev/coze-studio
- Coze JS SDK: https://github.com/coze-dev/coze-js

## 适合沉淀的案例

1. 知识库问答 Bot
2. 插件工具调用 Bot
3. 多步骤工作流 Bot
4. 企业内部助手
5. 渠道发布与会话管理

## 推荐模板：知识库 + 工具调用 Bot

```yaml
name: coze-knowledge-tool-bot
platform: coze
scenario: 知识库问答与业务工具调用

bot:
  persona: 专业、克制、基于来源回答
  channels:
    - web
    - internal_chat

knowledge:
  require_citation: true
  fallback_when_no_context: true

tools:
  - name: search_knowledge
    permission: read_only
  - name: query_business_status
    permission: read_only
  - name: create_ticket
    permission: write_with_confirmation

workflow:
  - classify_intent
  - retrieve_knowledge
  - decide_tool_call
  - generate_answer
  - run_safety_check
  - answer_or_handoff

human_review:
  required_when:
    - write_action_requested
    - user_disputes_answer
    - no_citation_available
    - sensitive_personal_data
```

## 推荐模板：运营助手 Bot

```yaml
name: coze-ops-assistant
platform: coze
scenario: 企业内部运营助手

capabilities:
  - faq_answering
  - task_creation
  - weekly_summary
  - data_lookup

workflow:
  - understand_request
  - check_permission
  - call_tool_or_retrieve
  - draft_response
  - confirm_high_impact_action

metrics:
  - task_success_rate
  - tool_call_success_rate
  - handoff_rate
  - user_satisfaction
```

## 落地建议

- 扣子/Coze 适合快速搭建 Bot、插件和工作流，再把成熟流程沉淀为模板。
- 对外发布 Bot 前要单独做安全词、拒答、转人工和日志策略。
- 插件工具调用要按最小权限设计，写操作必须确认。

## 可放入仓库的目录建议

```text
examples/coze-knowledge-tool-bot/
  README.md
  bot-card.md
  workflow.example.yaml
  plugin-permission-policy.md
  eval-set.sample.jsonl
```
