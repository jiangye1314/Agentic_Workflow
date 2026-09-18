# 框架六：动态生成提示词

> 结构：**变量槽位 → 组装规则 → 降级策略**。提示词由程序按上下文拼装，适合千人千面的场景。

## 模板 1：槽位拼装

```text
# 系统提示词骨架（由程序填充槽位）
你是 {{brand_name}} 的客服助手。
当前用户：{{user_tier}} 会员，最近购买：{{recent_orders_summary}}。
当前活动：{{active_campaigns}}。
用户情绪：{{sentiment_label}}（由前置分类节点写入）。

{{if sentiment_label == "angry"}}
优先安抚情绪，不要推销任何商品，必要时直接转人工。
{{endif}}
```

## 模板 2：组装规则（伪代码）

```python
prompt = base_template
    .fill(brand_name=tenant.config.brand)
    .fill(user_tier=crm.get_tier(user.id))
    .fill(recent_orders_summary=crm.recent_orders(user.id, limit=3))
    .fill(active_campaigns=marketing.active_campaigns())

# 降级策略：任一槽位数据获取失败时的默认值
# recent_orders_summary -> "暂无记录"（不阻断主流程）
# active_campaigns      -> 移除该段落（避免误导）
```

## 注意事项

- 每个槽位都要有**默认值/降级策略**：上游数据缺失时提示词仍然成立。
- 动态部分（用户画像、情绪标签）应由前置节点写入，而不是让主 Agent 临时去查。
- 记录最终拼装的完整提示词到日志，便于回溯与评估（衔接第 6 章状态追踪）。
- 槽位过多（>10）说明职责不清，考虑拆分为多节点工作流。
