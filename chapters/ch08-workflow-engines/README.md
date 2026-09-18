# 第 8 章 工作流编排引擎 · 导读

> 节点式编排工具如何赋能复杂任务自动化。

## 本章要点

- 编排引擎是智能体工作流的「骨架」：把 LLM 节点、工具节点、逻辑节点、人工节点连成可执行的图。
- **节点式设计**的价值：可视化、可复用、可观测；代价是表达能力上限低于代码，复杂逻辑需要「代码节点」逃逸舱。
- 选型关注：触发器丰富度、节点生态、自部署能力、与 LLM 平台的边界（编排引擎擅长连接系统，Agent 平台擅长智能决策——二者常组合使用）。

## 代表性工具速查

| 工具 | 定位 | 特点 | 实践文档 |
| --- | --- | --- | --- |
| n8n | 开源自动化编排 | 节点生态丰富、可自部署、AI 节点成熟 | [../../resources/n8n-practice.md](../../resources/n8n-practice.md) |
| Dify / FastGPT 画布 | LLM 应用编排 | 模型与知识库原生集成 | 见 [../ch07-agent-platforms/](../ch07-agent-platforms/) |
| RPA 工具 | 界面级自动化 | 操作无 API 的老系统 | [../../resources/rpa-practice.md](../../resources/rpa-practice.md) |
| ComfyUI | 视觉生成编排 | 图像/视频生成管线节点化 | [../../resources/comfyui-practice.md](../../resources/comfyui-practice.md) |

## 书中配套素材

[examples/ch08-n8n/](../../examples/ch08-n8n/)：n8n 本地 Docker 部署命令（对应 8.3.1 节）。

## 动手练习

1. 在 n8n 中用 5 个以内节点实现「表单提交 → LLM 总结 → 通知到 IM」，体验触发器与错误处理配置。
2. 思考边界：同一任务分别在 n8n 与 Dify 中实现，什么逻辑放哪边更自然？

## 延伸阅读

- [../../resources/github-practice-index.md](../../resources/github-practice-index.md)：各编排工具的开源项目索引。
