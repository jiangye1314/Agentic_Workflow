# 牧童中学智慧教学平台（书稿配套资料 Sample 1）

教育场景智慧教学演示系统，覆盖"AI 批改 → 人工复核 → 学情回流"完整闭环：

- **AI 作业批改（核心）**：三层批改架构——客观题走确定性规则引擎（100% 可复现），主观题走 LLM 按 rubric 评分（经 agent-gateway 统一出口），置信度 < 0.7 自动转入人工复核队列
- **作业图片 OCR**：三供应商可切换——百炼 qwen-vl / 扣子 Coze / Dify（未配密钥自动降级为演示文本，批改流程不中断）
- **人工复核队列（HITL）**：教师改判回流 few-shot 库，越批越准
- 另有教学驾驶舱、班级管理、课程资源、错题本、学情分析、批改质检、AI 助教等模块

## 目录结构

```
sample1/
├── app.py                 # Flask 后端（单文件，含登录认证与页面静态服务）
├── PRD.md                 # 产品需求文档
├── SPEC.md                # 技术规格（架构 / 接口 / 数据模型 / 批改流程）
├── requirements.txt       # Python 依赖
├── .env.example           # 配置模板（复制为 .env 后填入密钥）
├── .gitignore             # 打包/提交时忽略的文件
├── data/db.json           # 本地演示数据（登录后初始化，不入库）
└── static/
    ├── login.html         # 登录页（系统入口）
    ├── index.html         # 教学平台主页（Vue 3 本地化，无外部依赖）
    ├── css/style.css      # 全站样式（浅色主题）
    ├── js/                # app.js 框架 + views.js 各页面 + mock-data.js 演示数据
    └── vendor/            # Vue 3 生产构建本地文件
```

## 快速开始

```bash
cd sample1
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # 按需填入密钥；不填则走降级/mock 兜底
export $(cat .env | xargs)  # 加载环境变量
python app.py
```

浏览器打开：<http://localhost:1002>

- 打开后先进入登录页，演示账号 `admin` / `teacher`，密码均为 `123456`
- 未登录访问主页会跳回登录页

## 功能与端点

| 功能 | 端点 |
|---|---|
| 登录 / 退出 / 登录状态 | `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me` |
| 教学驾驶舱 | `GET /api/stats/overview` |
| 班级 / 学生 / 课程资源 | `GET /api/classes` / `GET /api/students` / `GET /api/resources` |
| 作业布置 / 列表 | `POST /api/assignments` / `GET /api/assignments` |
| 作业提交 | `GET /api/submissions` / `POST /api/submissions` |
| AI 批改（三层架构） | `POST /api/grade` |
| 人工复核队列 | `GET /api/reviews` / `PUT /api/reviews/<rid>` |
| 错题本 / 学情分析 | `GET /api/mistakes` / `GET /api/learning` |
| 批改质检 | `GET /api/quality` |
| OCR 供应商列表 / 图片识别 | `GET /api/ocr/providers` / `POST /api/ocr/recognize` |
| Agent 网关状态 / 对话 | `GET /api/gateway/info` / `POST /api/gateway/chat` |

## 页面结构与演示路径（书稿演示要点）

演示路径示例：登录 → 教学驾驶舱 → 「AI 作业批改」上传作业（规则引擎评客观题 + LLM 评主观题）→ 低置信度批改进入「人工复核队列」→ 教师改判 → 「错题本 / 学情分析」查看回流效果 → 「AI 助教」对话。批改页内可直接上传作业图片走 OCR 识别（供应商下拉可切换，未配密钥显示"降级"徽章）。

详细业务规则见 `PRD.md`，技术实现见 `SPEC.md`。
