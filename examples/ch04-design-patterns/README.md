# 第 4 章配套伪代码：核心设计模式

> 整理自《智能体工作流设计：方法与实践》第 4 章的配套伪代码（约 p66–92）。
> 这些是**教学用伪代码**：`model.generate()`、`agent.execute()` 等调用为抽象接口，
> 用于展示模式结构，不可直接运行。可运行版本见 [../design-patterns-mini/](../design-patterns-mini/)。

## 文件索引

| 文件 | 对应模式 | 书中位置 |
| --- | --- | --- |
| [reflection.py](reflection.py) | 反思模式：单次反思 / 迭代反思 / 多智能体反思 | 约 p66–68 |
| [rag_variants.py](rag_variants.py) | RAG 五种变体：基础 / 向量 / 混合 / 多步 / 迭代 | 约 p74–76 |
| [task_decomposition.py](task_decomposition.py) | 任务分解：线性分解 + 递归分解 | 约 p80–82 |
| [multi_agent_teams.py](multi_agent_teams.py) | 多智能体团队：共享工作空间 + 3 个团队案例 | 约 p87–92 |

## 学习路径建议

1. 先读 [../../chapters/ch04-design-patterns/](../../chapters/ch04-design-patterns/) 的模式速查表，建立全局认识。
2. 按上表顺序读伪代码，注意每个模式的「退出条件」与「兜底逻辑」。
3. 用 [../design-patterns-mini/](../design-patterns-mini/) 的真实可运行版本对照，体会「伪代码 → 工程实现」之间还差什么（日志、重试、成本、评估）。
