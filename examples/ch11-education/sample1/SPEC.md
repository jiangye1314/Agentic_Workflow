# 技术 Spec — 牧童中学智慧教学平台

> 配套 [PRD.md](PRD.md)。实现路径复用 5006（fund-marketing-platform-v2）已验证的架构模式：Vue3 单文件前端 + Flask 后端 + agent-gateway（127.0.0.1:10050）统一 AI 出口。

---

## 1. 架构设计

### 1.1 总体架构

```
┌─────────────── 浏览器 ───────────────┐
│ index.html + app.js + views.js      │
│ Vue3 单文件，17 视图 + 右侧背后逻辑面板 │
└──────────────┬──────────────────────┘
               │ REST /api/*
┌──────────────▼──────────────────────┐
│ Flask（app.py，单文件，1002 端口）     │
│ ├ 认证：session 登录（教师/学生/管理员） │
│ ├ 业务：作业/提交/批改/复核/错题/学情   │
│ ├ 确定性：规则引擎（客观题）、sympy 校验 │
│ └ 存储：SQLite（起步），预留 MySQL     │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
 agent-gateway         静态资源（pages/）
 127.0.0.1:10050        login.html 等
 LLM 路由/审计          无需重启即可改
```

### 1.2 模块划分

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| 前端入口 | frontend/index.html | Vue3 挂载点，CDN 引入 vue |
| 前端逻辑 | frontend/js/app.js | API 层（USE_MOCK 开关）、菜单、视图路由、toast |
| 前端视图 | frontend/js/views.js | 17 个视图组件 + 右侧"背后逻辑"文案 |
| 前端数据 | frontend/js/mock-data.js | 演示数据（无后端时使用） |
| 后端 | app.py | 路由 + session 认证 + 业务逻辑 + SQLite |
| 批改引擎 | grading/ 包 | 规则引擎、LLM 批改、sympy 校验、置信度分层 |
| 网关客户端 | grading/gateway.py | 调 agent-gateway 的薄封装（超时/重试/降级） |

### 1.3 批改引擎内部结构（核心）

```
grading/
├── __init__.py
├── objective.py    # 客观题：答案比对（选择/判断/填空）
├── subjective.py   # 主观题：rubric 化 prompt → LLM → {score, confidence, reasoning}
├── math_check.py   # 数学：sympy 最终答案校验 + 步骤分上限控制
├── essay.py        # 作文：四维评分（立意/结构/语言/卷面）+ 范文对照
├── confidence.py   # 置信度：LLM 自评 + 规则修正（答案与 rubric 匹配度）
├── fewshot.py      # 改判回流库：按题型分桶，每桶 ≤ 20 条，FIFO
└── gateway.py      # agent-gateway 客户端：30s 超时、2 次重试、mock 兜底
```

**关键原则**：客观题与数学最终答案走确定性通道，LLM 只做"规则覆盖不到"的评判（主观题表述、解题步骤逻辑、作文质量）。

---

## 2. 接口定义

统一前缀 `/api`，均需登录（session cookie）。返回结构：`{"ok": true, "data": ...}` 或 `{"ok": false, "error": "..."}`。

### 2.1 作业与批改

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/assignments | 创建作业（班级、截止时间、题目列表） |
| GET | /api/assignments?class_id= | 作业列表 |
| POST | /api/submissions | 学生提交（作业 ID、题目作答数组） |
| POST | /api/grade | 对一份提交发起批改（客观题即时，主观题异步） |
| GET | /api/grades/{submission_id} | 批改结果（含逐题明细） |
| GET | /api/review-queue | 低置信度复核队列（按教师/班级过滤） |
| PUT | /api/grades/{grade_id}/override | 人工改判（新分数 + 理由 → 回流 few-shot 库） |
| POST | /api/grades/{grade_id}/appeal | 学生申诉 |

**POST /api/grade 请求示例**

```json
{
  "submission_id": "S0012",
  "mode": "auto"
}
```

**GET /api/grades/{id} 响应示例**

```json
{
  "ok": true,
  "data": {
    "submission_id": "S0012",
    "status": "pending_review",
    "total_score": 78,
    "items": [
      {
        "question_id": "Q101",
        "type": "subjective",
        "grader": "ai",
        "score": 6,
        "max_score": 10,
        "confidence": 0.62,
        "reasoning": "步骤 2 化简正确，但未考虑定义域，扣 2 分；最终答案正确。",
        "via": "llm",
        "model": "default"
      }
    ]
  }
}
```

### 2.2 数据与质检

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/stats/overview | 驾驶舱 KPI |
| GET | /api/stats/learning | 学情（学生/班级/年级三级） |
| GET | /api/kb/mistakes?student_id= | 错题本（按知识点聚合） |
| POST | /api/kb/variants | 基于知识点生成变式练习 |
| GET | /api/quality/audits | 质检抽检列表 |
| GET | /api/quality/deviation | AI-人工偏差统计 |

### 2.3 错误码

| 码 | 含义 |
| --- | --- |
| 400 | 参数错误（缺 rubric 等） |
| 401 | 未登录 / 会话过期 |
| 403 | 无权限（越权访问他班数据） |
| 404 | 资源不存在 |
| 409 | 状态冲突（已批改作业重复提交等） |
| 503 | agent-gateway 不可用，任务已入待处理队列 |

---

## 3. 数据模型（SQLite 起步）

### 3.1 表结构

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,          -- 学号/工号
  name TEXT, role TEXT,         -- teacher / student / admin / researcher
  class_id TEXT, password_hash TEXT
);

CREATE TABLE classes (
  id TEXT PRIMARY KEY, name TEXT, grade TEXT, subject TEXT
);

CREATE TABLE assignments (
  id TEXT PRIMARY KEY, class_id TEXT, teacher_id TEXT,
  title TEXT, subject TEXT, due_at TEXT, status TEXT,  -- draft/published/closed
  questions TEXT               -- JSON：[{id,type,stem,answer,rubric,max_score,kp_id}]
);

CREATE TABLE submissions (
  id TEXT PRIMARY KEY, assignment_id TEXT, student_id TEXT,
  answers TEXT,                -- JSON：{question_id: answer}
  submitted_at TEXT
);

CREATE TABLE grades (
  id TEXT PRIMARY KEY, submission_id TEXT, question_id TEXT,
  score REAL, max_score REAL, confidence REAL,
  grader TEXT,                 -- ai / human
  reasoning TEXT, status TEXT, -- auto / pending_review / confirmed / appealed
  history TEXT,                -- JSON：改判历史
  model TEXT, created_at TEXT
);

CREATE TABLE knowledge_points (
  id TEXT PRIMARY KEY, name TEXT, subject TEXT, parent_id TEXT
);

CREATE TABLE fewshot_examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qtype TEXT, student_answer TEXT, ai_score REAL,
  human_score REAL, reason TEXT, created_at TEXT
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT, action TEXT, target TEXT, ts TEXT
);
```

### 3.2 批改状态机

```
submitted ──自动批改──▶ pending_review (confidence<0.7)
     │                      │ 教师改判/确认
     └──(confidence≥0.7)──▶ confirmed ◀───────────┘
                              │ 学生申诉
                              ▼
                           appealed ──教师处理──▶ confirmed（分数更新，留痕）
```

---

## 4. 关键流程与时序

### 4.1 主观题 AI 批改（含置信度分流）

```
教师发布作业（含 rubric）
   → 学生提交
   → POST /api/grade
   → objective.py 处理客观题（即时）
   → subjective.py：组装 prompt（题干 + rubric + 学生答案 + fewshot 示例）
   → gateway.py → agent-gateway → LLM 返回 {score, point_feedback, self_confidence}
   → confidence.py 计算置信度
        ≥ 0.7 → status=confirmed，待发布
        < 0.7 → status=pending_review，入人工复核队列
   → 教师复核：确认 / 改判（PUT override）
   → 改判 → fewshot.py 写入示例库（同题型分桶，FIFO）
   → 发布 → 错题按 kp_id 归入错题本 → 学情画像刷新
```

### 4.2 数学题双通道批改

```
学生答案 ─┬─ 最终答案 → sympy 符号比对（确定性，答案分 40%）
          └─ 解题步骤 → LLM 按步骤 rubric 评判（步骤分 60%，答案错时上限 40% 总分）
```

### 4.3 网关降级路径

```
POST /api/grade
 → gateway.py 调 agent-gateway
     ├ 成功（<30s）→ 正常流程
     ├ 超时/5xx → 重试（共 2 次）
     └ 仍失败 → 任务入 pending 队列（status=pending_review，原因标注 gateway_down）
               → 前端提示"AI 批改暂不可用"
               → USE_MOCK=true 时返回标注"演示数据"的 mock 批改
```

---

## 5. 异常与降级

| 场景 | 处理 |
| --- | --- |
| LLM 返回格式非法（缺 score/confidence） | 解析失败视为置信度 0，强制转人工复核，不落库错误数据 |
| 单份作业批改部分失败 | 逐题独立落库，成功的题正常显示，失败的题标记待重批 |
| rubric 缺失 | 拒绝发起 AI 批改（R-02），前端禁用批改按钮并提示补 rubric |
| 学生重复提交 | 409，提示教师；教师可开放重交窗口 |
| 网关长时间不可用 | 批改任务保留在待处理队列，网关恢复后手动/定时重放 |
| 数据误改 | 批改记录不可物理删除（R-09），仅可标注"作废"并留审计日志 |

---

## 6. 实施路线

| 阶段 | 内容 | 验收对应 |
| --- | --- | --- |
| S1 骨架 | Vue3 单文件前端（17 菜单 + 背后逻辑面板）+ Flask + session 登录 + SQLite | AC-10 |
| S2 客观题闭环 | 作业布置 → 提交 → 规则引擎批改 → 报告 | AC-01 |
| S3 主观题批改 | rubric 化 LLM 批改 + 置信度分流 + 人工复核队列 + 改判回流 | AC-02/03/04 |
| S4 数学/作文 | sympy 校验 + 四维作文评分 | AC-05 |
| S5 错题与学情 | 错题本 + 变式练习 + 学情分析 + 质检中心 | AC-06/07/09 |
| S6 降级加固 | 网关超时重试 + mock 兜底 + 审计日志 | AC-08 |
