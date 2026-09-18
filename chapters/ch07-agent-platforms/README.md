# 第 7 章 企业级智能体平台 · 导读 ★

> Dify、扣子（Coze）、FastGPT 三大平台深度剖析 + 六大提示词框架 + 选型指南。

## 本章要点

- 三个平台都能完成「模型接入 + 插件 + 知识库 + 工作流编排」，差异在**开放程度、生态位与私有化能力**。
- 选型先看约束（私有化？团队技术力？生态绑定？），再看功能差异。
- 提示词工程是跨平台通用的底层能力：六大框架模板见 [../../prompts/](../../prompts/)。

## 三平台速查对比

| 维度 | Dify | 扣子（Coze） | FastGPT |
| --- | --- | --- | --- |
| 定位 | 开源 LLM 应用开发平台 | 字节系一站式 Bot/Agent 平台 | 知识库问答见长的开源平台 |
| 模型接入 | 开放模型市场，国内外数十家 | 字节系为主 + 多引擎适配 | 精选模型 + 深度集成优化 |
| 插件体系 | 开发者驱动，可自制插件 | 模块化插件市场，生态丰富 | 内聚式功能节点，轻量高效 |
| 知识库 | 灵活开放的知识管理中心 | RAG 增强 + 内置数据库（持久化记忆） | 一体化高精度问答引擎 |
| 工作流 | 通用画布，自由度最高 | 复杂任务编排引擎 + 触发器 | 为问答应用而生，上手快 |
| 私有化部署 | ✅ 成熟（Docker / K8s） | 开源版 Coze Studio 可私有化 | ✅ 开源可私有化 |
| 上手门槛 | 中 | 低（C 端友好） | 低-中 |
| 更适合 | 需要开放性与私有化的技术团队 | 快速上线、生态插件、对话机器人 | 以知识库问答为核心的场景 |

> 功能细节随版本迭代较快，以各平台官方文档为准；深入的逐平台实践见 [../../resources/](../../resources/) 下的 [dify](../../resources/dify-practice.md)、[coze](../../resources/coze-practice.md)、[fastgpt](../../resources/fastgpt-practice.md) 实践文档。

## 选型决策

```text
需要完全私有化 + 深度二次开发？ → Dify（通用）或 FastGPT（知识库为主）
需要最快上线一个对外 Bot + 丰富插件生态？ → 扣子
核心场景是企业知识库高精度问答？ → FastGPT
要自建插件市场 / 多团队共用平台？ → Dify
不确定？ → 用 [platform-template-matrix.md](../../resources/platform-template-matrix.md) 把你的场景映射到模板
```

## 部署与成本效益要点（对应 7.6.3）

- **隐性成本清单**：模型 API 费用（大头）、向量库/存储、平台运维人力、插件付费、评估与复核人力。
- **估算方法**：先算单任务 token 消耗 × 日调用量，再乘以 1.5 的余量系数；私有化另算 GPU/向量库。
- **起步建议**：云端 SaaS 验证场景价值 → 用量稳定后再评估私有化（第 13 章有私有化平台完整方案）。

## 书中配套素材

- [prompts/book-templates/](../../prompts/book-templates/)：第 7.5 节六大框架对应的填空式提示词模板（通用角色、人物扮演、专家工作流、搜索大师、知识库问答、生图设计师、XML 结构化）。
- [examples/ch07-platform-configs/](../../examples/ch07-platform-configs/)：MCP 服务接入配置示例。

## 动手练习

1. 在任一平台按 [../../prompts/05-knowledge-rag.md](../../prompts/05-knowledge-rag.md) 模板搭建一个知识库问答应用，验证「引用 + 拒答」是否生效。
2. 用同一个需求（如客服 FAQ + 转人工）在两个平台各搭一遍，记录搭建时长与卡点，形成你自己的选型结论。
3. 按 [../../templates/workflow-spec.yaml](../../templates/workflow-spec.yaml) 把搭好的应用反向描述成规格，检查平台能力缺口。

## 延伸阅读

- [../../resources/platform-template-matrix.md](../../resources/platform-template-matrix.md)：场景 → 平台 → 模板映射
- [../../resources/github-practice-index.md](../../resources/github-practice-index.md)：公开项目索引
