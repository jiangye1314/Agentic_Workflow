# 设计模式最小示例（对应第 4 章）

3 个单文件脚本，演示智能体工作流最常用的三种设计模式。刻意保持简单：无框架、无向量库，便于看清模式本身。

| 脚本 | 模式 | 演示内容 |
| --- | --- | --- |
| `prompt_chaining.py` | 链式 | 作文批改：打分 → 校验 → 润色评语 |
| `routing.py` | 路由 | 客服消息：意图分类 → 分发到专用处理分支 |
| `evaluator_optimizer.py` | 评估-优化 | 文案生成：生成 → 按量规评估 → 带反馈改写，直到达标或超限 |

## 环境准备

```bash
pip install openai

export OPENAI_API_KEY="你的密钥"
# 使用 OpenAI 兼容接口（如国产模型网关）时：
export OPENAI_BASE_URL="https://你的网关地址/v1"   # 可选
export MODEL="gpt-4o-mini"                          # 可选，默认 gpt-4o-mini
```

## 运行

```bash
python3 prompt_chaining.py
python3 routing.py
python3 evaluator_optimizer.py
```

## 学习建议

1. 先运行看输出，再读代码——每个脚本都不足 80 行。
2. 试着修改：把评估标准换成你的业务量规；给路由脚本增加一个新意图分支。
3. 思考工程化缺口：真实系统还需日志、重试、成本统计与人工复核——见第 6 章导读（../../chapters/ch06-agent-engineering/）。
