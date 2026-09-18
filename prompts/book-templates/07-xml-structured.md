# XML 结构化提示词

> 整理自本书第 7 章（约 p227–229）。用 `<instruction>` / `<input>` / `<example>` / `<output>` 标签组织提示词，
> 让模型清晰区分「指令、输入、示例、输出」四个区域。

## 示例一：旅行规划生成器

```xml
<instruction>
1. 首先收集以下变量信息：
- {{travel_destination}}：旅行目的地（城市/国家/景点名称）
- {{travel_dates}}：旅行日期范围（格式：YYYY-MM-DD 至 YYYY-MM-DD）
- {{travel_budget}}：旅行预算（货币单位+金额）
- {{travel_interests}}：旅行兴趣点（如美食/历史/自然等，多个用逗号分隔）
- {{travel_group_size}}：旅行人数
- {{special_requirements}}：特殊需求（如无障碍设施/饮食限制等）
2. 根据这些信息生成包含以下内容的旅行计划：
- 每日行程安排（时间、地点、活动）
- 推荐住宿选项（符合预算）
- 餐饮建议（符合兴趣和需求）
- 交通建议（当地交通工具）
- 预算分配建议
- 实用小贴士（当地习俗/天气等）
3. 输出要求：
- 使用清晰的项目符号格式
- 不要包含任何XML标签
- 语言与用户输入保持一致
- 对特殊需求要特别关注
<example>
输入：
- {{travel_destination}}：巴黎
- {{travel_dates}}：2023-07-15 至 2023-07-20
- {{travel_budget}}：5000 欧元
- {{travel_interests}}：艺术, 美食, 历史
- {{travel_group_size}}：2
- {{special_requirements}}：无
输出：
巴黎5日艺术美食之旅（2023年7月15日至2023年7月20日）
• 第一天：
  - 上午：卢浮宫参观（建议提前网上订票）
  - 午餐：Le Fumoir 餐厅（经典法餐）
  - 下午：杜乐丽花园漫步
  - 晚餐：Les Papilles 小酒馆
...
住宿推荐：Hôtel du Petit Moulin（玛黑区精品酒店，约150欧/晚）
...
</example>
</instruction>
<input>
目的地：{{travel_destination}}
日期：{{travel_dates}}
预算：{{travel_budget}}
兴趣：{{travel_interests}}
人数：{{travel_group_size}}
特殊需求：{{special_requirements}}
</input>
<output>
```

## 示例二：中文文本优化器

```xml
<instruction>
1. 仔细阅读并理解 '{{input_text}}' 的核心主旨。
2. 在保持原文核心意思不变的前提下，进行以下优化：
   - 修正语法错误和标点误用。
   - 优化句子结构，提升流畅度。
   - 使用更规范的中文表达。
   - 替换不恰当的词汇。
3. 确保改进后的文本自然流畅，符合中文表达习惯。
4. 输出时，仅输出改进后的文本，不包含任何XML标签。
</instruction>
<input>
{{input_text}}
</input>
<example>
[在此放入一个"原文 → 优化后"的示例]
</example>
<output>
{{improved_text}}
</output>
```

## 使用提示

- XML 标签边界清晰，适合长提示词与多区域场景；模型对标签的遵循度普遍较好。
- `<example>` 内提供完整的输入→输出对，效果通常优于纯文字描述要求。
