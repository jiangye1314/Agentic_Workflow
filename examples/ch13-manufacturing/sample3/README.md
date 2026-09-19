# 牧童 · 智能制造 + 物料看板（书稿配套资料 Sample 3）

二轮电动车智能制造演示系统，两个页面：
- **制造控制台**（`console.html`，登录后首页）：车间全景驾驶舱，含完整导航列表
- **物料看板**（`index.html`）：物料风险看板——**公式算数字，Agent 写人话**。确定性公式层负责库存与耗尽时间计算，Agent 层负责风险分析与人话建议，HITL 工作流负责人工审批闭环

## 目录结构

```
sample3/
├── app.py                 # Flask 后端（单文件，含登录认证与页面静态服务）
├── requirements.txt       # Python 依赖
├── .env.example           # 配置模板（复制为 .env 后填入密钥）
├── .gitignore             # 打包/提交时忽略的文件
└── static/
    ├── login.html         # 登录页（系统入口）
    ├── console.html       # 制造控制台（登录后首页，车间全景 + 导航列表）
    └── index.html         # 物料看板（HTML/CSS/JS 单文件，无外部依赖）
```

## 快速开始

```bash
cd sample3
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # 按需填入密钥；不填则走 mock 兜底
python app.py
```

浏览器打开：<http://localhost:1001>（Swagger 文档在 `/apidocs`）

- 打开后先进入登录页，演示账号 `admin` / `123456`（可在 `.env` 中修改）
- 登录后进入制造控制台；未登录直接访问 `/pages/` 下页面会跳回登录页

## 功能与端点

| 功能 | 端点 |
|---|---|
| 登录 / 退出 / 登录状态 | `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me` |
| 物料风险分析（百炼） | `POST /api/agent/analyze` |
| 物料风险分析（牧童 Agent，流式） | `POST /api/agent/mutong/analyze` |
| 物料风险分析（DeepSeek） | `POST /api/agent/deepseek/analyze` / `.../sync` |
| 消息推送（飞书） | `POST /api/feishu/send` |
| 健康检查 | `GET /api/health` / `GET /api/health/agents` |
| HITL 人工审批 | `POST /api/hitl/start` / `pending` / `approve` / `reject` / `status` / `history` |

## 页面结构与联动（书稿演示要点）

两个页面通过导航互相串联，共用同一套登录会话：

1. **制造控制台**（`console.html`，登录后首页）：
   - 左侧完整导航列表（4 组 12 项：生产监控 / Agent 中心 / 分析与优化 / 系统），其中「物料监控」为真实入口
   - 顶部 KPI 六卡 + 四产线车间全景图（SVG 工位状态、传送带动画、AGV 调度、Agent 标注）
   - 右侧 BI 面板：设备状态、各线产量、OEE 周趋势、实时告警、Agent 处置记录
2. **物料看板**（`index.html`）：工厂导航树 + KPI + 物料表格 + 详情面板（AI 分析 / 快捷操作 / 分析历史），菜单栏「主页」返回控制台
3. **联动路径**：登录 → 控制台首页 → 点「物料监控」（侧边栏或顶部导航）→ 物料看板 → 选中告警物料 → Agent 分析 → HITL 审批 → 菜单「主页」返回控制台

演示路径示例：登录 → 控制台首页 → 顶部「物料监控」→ 点击「锂电池包」告警行 → 详情面板自动展开 Agent 分析 → 快捷操作发起 HITL → 审批面板投票 → 「主页」返回控制台。

## 可打包资料清单

书稿配套提交时，以下文件可直接打包（密钥文件不包含在内）：

| 文件 | 用途 |
|---|---|
| `app.py` | 后端完整实现（含登录认证），读者可直接运行 |
| `static/login.html` | 登录页（系统入口） |
| `static/console.html` | 制造控制台（登录后首页，完整导航列表 + 车间全景） |
| `static/index.html` | 物料看板页面，与后端配套 |
| `requirements.txt` | 依赖清单 |
| `.env.example` | 配置模板（已脱敏，无真实密钥） |
| `.gitignore` | 版本管理忽略规则 |
| `README.md` | 本说明 |

## 脱敏说明

- 企业名称已全部替换为虚构名称（如物料供应商、Agent 品牌均不与任何真实厂商对应）；
  仅保留「牧童电动车」这一虚构品牌。
- 不包含任何真实 API 密钥、内网地址或账号信息。
- 文中「百炼 / DeepSeek / 飞书」为公开的通用大模型与办公工具名，作为
  集成示例保留；如需进一步中性化可在 `.env.example` 与页面文案中替换。
