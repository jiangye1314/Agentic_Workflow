# 第 4 章 核心设计模式 · 导读 ★

> 设计模式是构建一切可靠智能系统的「语法」。本章导读提供模式速查表、选型决策树与最小代码示例。

## 本章要点

- 工作流与智能体的分界：**预定义路径**（workflow）与**动态决策路径**（agent）不是对立，而是光谱；优先用最简单的方案解决问题。
- 复杂系统由少量基础模式组合而成，掌握单个模式的适用场景比堆砌框架更重要。
- 每种模式都有代价：延迟、成本、可调试性。选型是权衡而非追新。

## 设计模式速查表

| 模式 | 核心思想 | 适用场景 | 代价 / 风险 | 最小示例 |
| --- | --- | --- | --- | --- |
| 链式（Prompt Chaining） | 任务拆成顺序步骤，步间可加校验 | 生成→检查→改写；多轮加工 | 延迟叠加 | [prompt_chaining.py](../../examples/design-patterns-mini/prompt_chaining.py) |
| 路由（Routing） | 先分类，再分发给专用处理分支 | 客服意图分流、难易分流 | 分类错误会传导 | [routing.py](../../examples/design-patterns-mini/routing.py) |
| 并行化（Parallelization） | 子任务同时执行后汇总（投票/合并） | 多角度评审、分片处理 | 成本 ×N | 见速查表下方练习 |
| 编排-工人（Orchestrator-Workers） | 中央 LLM 动态拆解并派发子任务 | 子任务无法预先枚举（如改多文件代码） | 调试难、成本不可预估 | — |
| 评估-优化（Evaluator-Optimizer） | 生成→评估→反馈→再生成循环 | 有明确评价标准的创作类任务 | 循环失控风险，需设上限 | [evaluator_optimizer.py](../../examples/design-patterns-mini/evaluator_optimizer.py) |
| 自主智能体（Autonomous Agent） | 工具 + 环境反馈的开放循环 | 开放式问题（研究、排查） | 成本/错误累积，需人工检查点 | — |

## 选型决策树

```text
任务能否拆成固定步骤？
├─ 能 → 步骤间需要中途校验吗？
│       ├─ 需要 → 链式
│       └─ 不需要 → 单次 LLM 调用（别过度设计）
└─ 不能 → 分支是预先可枚举的吗？
        ├─ 是 → 路由（分支并行→并行化）
        └─ 否 → 子任务由模型动态生成？
                ├─ 是 → 编排-工人
                └─ 需要开放探索 → 自主智能体（加人工检查点）
产出有明确质量标准且首轮不达标？ → 叠加评估-优化循环
```

## 书中配套伪代码

[examples/ch04-design-patterns/](../../examples/ch04-design-patterns/) 收录了本章全部配套伪代码：反思模式三形态、RAG 五种变体、任务分解（含递归）、多智能体团队三案例（内容创作/产品开发/旅行规划）。

## 动手练习

1. 跑通 [examples/design-patterns-mini/](../../examples/design-patterns-mini/) 的三个脚本，把模型换成你常用的国产模型（改 `OPENAI_BASE_URL` 即可）。
2. 用「并行化」思想改写 `evaluator_optimizer.py`：让 3 个不同视角的评审并行打分后取共识。
3. 用 [../../templates/workflow-spec.yaml](../../templates/workflow-spec.yaml) 描述你工作中的一个真实任务，标出每一步对应哪种模式。

## 延伸阅读

- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)（本章模式的主要来源之一）
- [../../docs/public-cases.md](../../docs/public-cases.md)：模式在工业界的落地形态
