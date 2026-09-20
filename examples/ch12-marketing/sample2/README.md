# 牧童商城 · 电商智慧运营平台（书稿配套资料 Sample 2）

电商场景智慧运营演示系统，"AI 建议 + 确定性底线"双保险设计：

- **智能推荐（核心）**：LLM 生成推荐理由与人群标签，置信度 < 0.7 转人工审核队列，审核通过才生效
- **智能定价**：确定性底线先行——建议价低于成本 × 1.2 直接拒绝，不交给 AI；通过后由 LLM 给出定价策略说明
- **经营驾驶舱 + 实时大屏**：KPI、销售趋势、库存风险、支付与售后数据
- 另有商品管理、订单、库存、营销活动、用户画像、转化漏斗、AB 测试、销量预测、智能客服等模块
- 所有 AI 调用经 agent-gateway 统一出口，未启动时自动走离线启发式降级，页面演示不中断

## 目录结构

```
sample2/
├── app.py                 # Flask 后端（单文件，含登录认证与页面静态服务）
├── requirements.txt       # Python 依赖
├── .env.example           # 配置模板（复制为 .env 后填入密钥）
├── .gitignore             # 打包/提交时忽略的文件
├── data/db.json           # 本地演示数据（登录后初始化，不入库）
├── screenshot-dashboard.png  # 经营驾驶舱演示截图（不入库，仅本地演示用）
└── static/
    ├── login.html         # 登录页（系统入口）
    ├── index.html         # 运营平台主页（Vue 3 本地化，无外部依赖）
    ├── css/style.css      # 全站样式（浅色主题）
    ├── js/                # app.js 框架 + views.js 各页面 + mock-data.js 演示数据
    └── vendor/            # Vue 3 生产构建本地文件
```

## 快速开始

```bash
cd sample2
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # 按需填入密钥；不填则走降级/mock 兜底
export $(cat .env | xargs)  # 加载环境变量
python app.py
```

浏览器打开：<http://localhost:1003>

- 打开后先进入登录页，演示账号 `admin` / `operator`，密码均为 `123456`
- 未登录访问主页会跳回登录页

## 功能与端点

| 功能 | 端点 |
|---|---|
| 登录 / 退出 / 登录状态 | `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me` |
| 经营驾驶舱 | `GET /api/stats/overview` |
| 商品 / 类目 / 库存 / 订单 | `GET /api/products` / `GET /api/categories` / `GET /api/inventory` / `GET /api/orders` |
| 实时大屏 | `GET /api/realtime` |
| 支付 / 售后 / 营销活动 | `GET /api/payment` / `GET /api/aftersale` / `GET /api/campaign` |
| 智能推荐 / 人工审核 | `POST /api/recommend` / `GET /api/recommend/reviews` / `PUT /api/recommend/reviews/<rid>` |
| 用户画像 / 转化漏斗 / AB 测试 | `GET /api/portrait` / `GET /api/funnel` / `GET /api/abtest` |
| 销量预测 | `GET /api/sales` |
| 智能定价（成本底线校验） | `GET /api/pricing` / `POST /api/pricing` |
| Agent 网关状态 / 对话 | `GET /api/gateway/info` / `POST /api/gateway/chat` |

## 页面结构与演示路径（书稿演示要点）

演示路径示例：登录 → 经营驾驶舱 → 「智能推荐」输入商品 → LLM 生成推荐（低置信度自动转「人工审核」）→ 审核通过后推荐生效 → 「智能定价」输入低于成本底线的价格被确定性规则直接拒绝 → 「实时大屏」查看销售实时数据 → 「智能客服」对话。
