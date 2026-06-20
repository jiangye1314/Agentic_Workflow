# RPA 实践模板与案例方向

参考项目：`robocorp/rpaframework`  
链接：https://github.com/robocorp/rpaframework

## 适合沉淀的案例

1. 浏览器自动填报
2. 发票 / 订单 / 报表下载与归档
3. Excel / CSV 清洗与系统录入
4. 邮件附件处理与业务系统提交
5. LLM + RPA 的后台运营助手

## 推荐模板：表格到系统录入机器人

```yaml
name: rpa-spreadsheet-to-system
platform: rpa
scenario: 表格数据校验并录入后台系统

inputs:
  - spreadsheet_file
  - target_system_url
  - user_credential_reference

workflow:
  - load_spreadsheet
  - validate_required_fields
  - login_target_system
  - enter_records_one_by_one
  - capture_result_screenshot
  - export_success_and_failure_report

controls:
  idempotency:
    key: record_id
  human_confirm_before_submit: true
  max_records_per_run: 100
  rollback_plan: manual_review

metrics:
  - success_rate
  - failed_record_count
  - average_processing_time
  - manual_intervention_count
```

## 推荐模板：LLM + RPA 文档处理

```yaml
name: llm-rpa-document-processing
platform: rpa
scenario: 邮件附件、票据、订单文档处理

workflow:
  - download_attachments
  - extract_text_or_table
  - classify_document_type
  - validate_fields
  - submit_to_business_system
  - notify_reviewer

human_review:
  required_when:
    - field_confidence_low
    - amount_exceeds_threshold
    - document_type_unknown
    - duplicate_detected
```

## 落地建议

- RPA 适合自动化“稳定但重复”的界面流程，不适合无人监管地执行高风险决策。
- 所有写入型机器人都应有截图、日志、失败清单和重跑机制。
- LLM 只负责理解、分类、草拟；最终提交动作应有明确规则或人工确认。

## 可放入仓库的目录建议

```text
examples/rpa-spreadsheet-automation/
  README.md
  robot-flow.yaml
  sample-input.csv
  runbook.md
  exception-report-template.md
```
