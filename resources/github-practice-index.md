# GitHub 公开实践项目索引

同步日期：2026-06-20

本索引面向 Agentic Workflow 仓库后续扩展，用来快速定位公开项目、可复用模板和适合沉淀的案例。这里不复制第三方代码，只记录项目用途、适配场景和参考链接。

## 平台与项目

| 方向 | 推荐公开项目 / 资料 | 适合沉淀的案例 |
| --- | --- | --- |
| Dify | `langgenius/dify` | 企业知识库问答、客服助手、内容生成工作流、工具调用 Agent |
| FastGPT | `labring/FastGPT` | 知识库问答、工作流编排、企业私有数据问答、团队知识助手 |
| n8n | `n8n-io/n8n` | 跨系统自动化、Webhook 触发、AI 摘要、CRM/表格同步 |
| RPA | `robocorp/rpaframework` | 浏览器/桌面自动化、表格处理、发票/订单流程、后台运营机器人 |
| 飞书多维表格 | `larksuite/oapi-sdk-*` | 多维表格 CRUD、销售线索池、项目看板、内容选题库 |
| ComfyUI | `comfyanonymous/ComfyUI`、`Comfy-Org/ComfyUI_examples` | 文生图、图生图、产品图批量生成、品牌视觉素材流水线 |
| 扣子 / Coze | `coze-dev/coze-studio`、`coze-dev/coze-js` | Bot、插件、知识库、工作流、渠道发布 |

## 参考链接

- Dify: https://github.com/langgenius/dify
- FastGPT: https://github.com/labring/FastGPT
- n8n: https://github.com/n8n-io/n8n
- Robocorp RPA Framework: https://github.com/robocorp/rpaframework
- Lark / Feishu OpenAPI Python SDK: https://github.com/larksuite/oapi-sdk-python
- Lark / Feishu OpenAPI Node SDK: https://github.com/larksuite/oapi-sdk-nodejs
- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- ComfyUI Examples: https://github.com/Comfy-Org/ComfyUI_examples
- Coze Studio: https://github.com/coze-dev/coze-studio
- Coze JS SDK: https://github.com/coze-dev/coze-js

## 案例筛选标准

优先收录满足以下条件的案例：

1. 有公开仓库、官方文档或论文支撑。
2. 能抽象出输入、处理步骤、输出、评估指标和人工复核点。
3. 能迁移到不同平台，而不是只绑定单一厂商 UI。
4. 不依赖真实密钥、隐私数据或不可公开的业务数据。
5. 能体现 Agentic Workflow 的关键要素：状态、工具、权限、评估、人工兜底。

## 不建议直接收录

- 只有宣传截图、没有可复现路径的项目。
- 未声明许可证且包含大量代码复制的仓库。
- 要求上传真实用户数据、密钥或内部系统访问权限的示例。
- 没有人工复核机制的金融、医疗、法律、教育未成年人场景。
