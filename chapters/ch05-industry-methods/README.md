# 第 5 章 工业界构建方法 · 导读

> 对标 Anthropic 与 Google 的 Agent 构建方法论，获得工程落地的「脚手架」。

## 本章要点

- **Anthropic 的核心主张**：从最简单的方案开始——单 LLM 调用 → 工作流（预定义路径）→ 智能体（动态路径），只有在收益大于复杂度代价时才升级；重视工具设计（ACI，Agent-Computer Interface）与透明可调试。
- **Google 的核心主张**：以 Agent 架构三要素（模型、工具、编排层）组织系统，强调评估驱动与生产化治理。
- 两家共识：**评估先行、护栏内置、人机协同**，与第 6 章的工程实践互为表里。

## 方法对照速查

| 主题 | 共同建议 | 仓库落地资源 |
| --- | --- | --- |
| 复杂度控制 | 能简单勿复杂，按需升级架构 | [../ch04-design-patterns/](../ch04-design-patterns/) 决策树 |
| 工具设计 | 工具描述面向模型撰写，职责单一、格式一致 | [../../prompts/04-tool-calling.md](../../prompts/04-tool-calling.md) |
| 评估 | 上线前建评估集，运行期持续回归 | [../../templates/eval-dataset-template.jsonl](../../templates/eval-dataset-template.jsonl) |
| 人机协同 | 高风险动作人工确认 | [../../templates/human-review-checklist.md](../../templates/human-review-checklist.md) |
| 多智能体 | 仅在单 Agent 明显不足时采用 | [../../templates/multi-agent-team.yaml](../../templates/multi-agent-team.yaml) |

## 书中配套伪代码

[examples/ch05-agent-evolution/](../../examples/ch05-agent-evolution/)：Agent 能力四级演进（单轮问答 → 工具增强 → ReAct 循环 → 多智能体系统），是本章「按需升级架构」主张的代码化表达。

## 动手练习

1. 选一个你正在做的 Agent，写下「当前架构层级（单调用/工作流/智能体）+ 为什么」，检验是否存在过度设计。
2. 阅读 [../../docs/public-cases.md](../../docs/public-cases.md) 中 Morgan Stanley 案例，对照本章方法列出它做对的 3 件事。

## 延伸阅读

- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- Google 白皮书 *Agents*（Kaggle / Google Cloud 发布）
