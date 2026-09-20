/**
 * 牧童中学智慧教学平台 · 右侧「背后逻辑」面板文案
 * 随菜单切换：每个视图一段可读的技术实现说明
 */
const INSIGHTS = {
  dashboard: {
    name: "教学驾驶舱",
    intro: "总览页面聚合全校作业批改的关键指标。数据来自后端聚合接口，每 30 秒自动刷新。",
    sections: [
      { tag: "确定性", tagCls: "green", title: "指标口径", body: "所有数值来自后端 SQL/JSON 聚合，前端不计算业务指标，避免口径漂移。", points: ["批改量 = 状态为已批改/待复核的提交数", "待复核 = 置信度低于阈值（0.7）的批改单"] },
      { tag: "架构", tagCls: "blue", title: "三层批改架构", body: "本平台的核心设计：确定性规则处理客观题，AI 处理主观题，人工复核兜底低置信度。", points: ["客观题：规则引擎直接比对，100% 可复现", "主观题：LLM 按 rubric 评分，附置信度", "置信度 < 0.7：自动进入人工复核队列（HITL）"] }
    ]
  },
  classes: {
    name: "班级管理",
    intro: "班级为最小管理单元，作业、学生、学情均挂载在班级下。",
    sections: [
      { tag: "数据", tagCls: "blue", title: "实体关系", body: "class → students → submissions → grades 四层归属，删除班级需先确认无未归档作业。", points: ["班级属性：年级/班主任/科目/人数", "均分由已批改提交实时计算"] }
    ]
  },
  resources: {
    name: "课程资源库",
    intro: "课件、音频、视频等教学素材的统一存放与检索。",
    sections: [
      { tag: "存储", tagCls: "blue", title: "文件管理", body: "演示版用 uploads/ 目录存文件，元数据（大小/上传人/下载量）存 JSON 数据文件。", points: ["支持 pptx/pdf/mp3/mp4 等常见格式", "按科目、年级、标签三维检索"] }
    ]
  },
  profiles: {
    name: "学生学籍档案",
    intro: "学生的静态档案与动态学习画像（弱势知识点、近期趋势）合并在同一视图。",
    sections: [
      { tag: "画像", tagCls: "green", title: "档案构成", body: "静态部分来自学籍录入，动态部分由批改引擎自动回写：每次批改后更新知识点掌握度。", points: ["弱势知识点：按错题知识点频次聚合", "趋势：最近 3 次测验成绩斜率"] }
    ]
  },
  assign: {
    name: "作业布置",
    intro: "教师创建作业：录入题目、标准答案与评分标准（rubric），这是后续自动批改的基准。",
    sections: [
      { tag: "关键", tagCls: "red", title: "标准答案是批改的锚", body: "客观题（选择/填空）需要精确答案，主观题需要可操作的评分标准——rubric 越细，AI 批改越稳定。", points: ["客观题：答案 + 分值", "主观题：参考答案 + 分项得分点"] },
      { tag: "规则", tagCls: "blue", title: "题型决定批改路由", body: "布置作业时题型即确定批改路径：choice/fill 走规则引擎，short/math/essay 走 AI 批改。", code: "choice|fill  → 规则引擎（确定性）\nshort|math|essay → LLM 按 rubric 评分\n任何题型置信度 < 0.7 → 人工复核" }
    ]
  },
  grading: {
    name: "AI 智能批改",
    intro: "核心模块。一次批改请求经过三层处理：客观题规则引擎、主观题 LLM 评分、置信度分流。",
    sections: [
      { tag: "确定性", tagCls: "green", title: "第 1 层：规则引擎（客观题）", body: "选择/填空题与标准答案逐题比对，含常见容错（全半角、空格、和/与分隔）。规则比对 100% 可复现，置信度恒为 1.0。", code: "norm(s) = s 去空格/去「和与及」/转小写\ncorrect = norm(学生答案) == norm(标准答案)" },
      { tag: "AI", tagCls: "blue", title: "第 2 层：LLM 按 rubric 评分（主观题）", body: "主观题把题目、评分标准、学生答案打包成 prompt 交给 LLM，要求输出 JSON：得分 + 分项 + 置信度。", code: "POST /v1/chat/completions\n{\n  \"messages\": [{\n    \"role\": \"system\",\n    \"content\": \"你是数学阅卷教师。\n     按评分标准给分，输出 JSON：\n     {score, items, confidence}\"\n  }, { role: \"user\", content: 题目+rubric+答案 }]\n}" },
      { tag: "HITL", tagCls: "orange", title: "第 3 层：置信度分流", body: "整卷置信度 = AI 主观题置信度均值（客观题规则引擎 100% 确定，不参与）。低于阈值 0.7 的批改单不直接发布成绩，自动进入人工复核队列。", points: ["阈值 0.7 可在配置中调整（0.5~0.9）", "数学题答案分:步骤分 = 4:6，答案错时步骤分上限 40%"] }
    ]
  },
  review: {
    name: "人工复核队列",
    intro: "Human-in-the-Loop：低置信度批改单排队等待教师确认或改判。改判结果回流为 few-shot 样本，让 AI 下次更准。",
    sections: [
      { tag: "HITL", tagCls: "orange", title: "入队条件", body: "置信度 < 0.7 的批改单自动入队，按提交时间排队。教师可整卷确认或逐题改判。", points: ["队列只进低置信度单，避免教师重复劳动", "复核后成绩才对学生可见"] },
      { tag: "回流", tagCls: "green", title: "改判 → few-shot 库", body: "教师改判的题目存入 few-shot 库（按知识点分桶，每桶 ≤ 20 条，FIFO 淘汰）。同知识点再批改时，把库中样本附到 prompt 里。", code: "fewshot_bucket[知识点].append({\n  q, rubric, stu_ans, ai_score, teacher_score\n})\n// 每桶上限 20 条，超出淘汰最旧" }
    ]
  },
  mistakes: {
    name: "错题本",
    intro: "批改后的错题自动沉淀：错误答案、正确答案、错因归因、错误次数。",
    sections: [
      { tag: "自动化", tagCls: "green", title: "自动归集", body: "规则引擎比对失败即生成错题记录；主观题由 LLM 输出错因标签。同一知识点重复错误，次数累加。", points: ["错因归因覆盖率目标 100%", "错题可一键生成同类变式练习（AI 能力）"] }
    ]
  },
  report: {
    name: "作业分析报告",
    intro: "单次作业的班级整体报告：均分、得分率分布、逐题正确率。",
    sections: [
      { tag: "数据", tagCls: "blue", title: "报告生成", body: "由批改结果聚合生成，包含逐题得分率（定位教学薄弱点）与分数段分布（识别临界生）。", points: ["逐题正确率低于 60% 自动标注为「教学预警」"] }
    ]
  },
  learning: {
    name: "学情数据分析",
    intro: "跨作业的知识点掌握度与学生趋势分析，用于识别需要关注的学生。",
    sections: [
      { tag: "AI 归因", tagCls: "blue", title: "归因逻辑", body: "掌握度按知识点聚合错题率计算；「下降」趋势由最近 3 次成绩斜率判定；弱势学生名单由后端规则生成，AI 补充归因说明。", code: "mastery(知识点) = 1 - 错题数/总题数\nslope < -3 且 recent < 70 → 关注名单\nLLM 生成每个学生的归因一句话" }
    ]
  },
  quality: {
    name: "批改质检中心",
    intro: "对 AI 批改结果按比例抽检，控制 AI 与教师打分的偏差在阈值内。",
    sections: [
      { tag: "硬校验", tagCls: "red", title: "质检规则（确定性）", body: "抽检比例 10%，双评偏差（AI 分 vs 教师分）超过 5 分的样本记为超标，超标率 > 5% 触发模型调参或阈值上调。", code: "抽检率 = 10%（可配置）\n|AI分 - 教师分| ≤ 5 → 通过\n超标率 > 5% → 触发告警" }
    ]
  },
  ai: {
    name: "AI 助教",
    intro: "面向教师的通用助手：课堂提问设计、作业点评、家长沟通话术等，经统一网关调用 LLM。",
    sections: [
      { tag: "AI", tagCls: "blue", title: "调用链路", body: "前端 → Flask /api/gateway/chat → agent-gateway（127.0.0.1:10050）→ 模型。所有 AI 能力共用同一条出口，便于统一限流、审计与模型切换。", code: "浏览器 → Flask 后端 → agent-gateway → LLM\n             （同一 AI 出口，不改动网关）" }
    ]
  },
  qa: {
    name: "智能问答",
    intro: "基于教学资料库的检索增强问答（RAG）：先检索再回答，减少模型幻觉。",
    sections: [
      { tag: "RAG", tagCls: "blue", title: "检索增强流程", body: "问题 → 向量化 → 在课程资源/教材库检索 top-k 片段 → 拼入 prompt → LLM 生成带出处的答案。", code: "embed(query) → top-k 片段\nanswer = LLM(问题 + 片段)\n返回：答案 + 引用来源" }
    ]
  },
  meeting: {
    name: "教研会议纪要",
    intro: "上传会议录音，自动转写并生成结构化纪要：议题、结论、行动项、责任人。",
    sections: [
      { tag: "ASR", tagCls: "blue", title: "语音转写链路", body: "音频 → 网关 /asr 接口（ASR 模型）→ 全文转写 → LLM 摘要为结构化纪要。", code: "audio.mp3 → /asr → 逐字稿\n逐字稿 → LLM → {议题, 结论, 行动项[]}" }
    ]
  },
  lessonpy: {
    name: "教案生成（Python）",
    intro: "输入课题与课时，生成含教学目标、重难点、教学过程的教案初稿。",
    sections: [
      { tag: "实现", tagCls: "blue", title: "多智能体流水线（Python 编排）", body: "用 Python 串起多个 LLM 调用：大纲生成 → 分节撰写 → 习题设计 → 汇总，每步可独立重试。", code: "plan_agent → section_agents → exercise_agent\n            → merge" }
    ]
  },
  lessonlg: {
    name: "教案生成（LangGraph）",
    intro: "同一教案场景的 LangGraph 实现：用图编排多智能体，节点失败可局部重试。",
    sections: [
      { tag: "实现", tagCls: "blue", title: "图编排（LangGraph）", body: "与 Python 版对比：LangGraph 用状态图描述流程，节点即智能体，支持条件分支与循环。", code: "graph: plan → section* → exercise\n            → quality_check → (loop)" }
    ]
  },
  gateway: {
    name: "网关管理",
    intro: "统一 AI 出口的监控面板：路由表、QPM 用量、延迟与可用性。",
    sections: [
      { tag: "复用", tagCls: "green", title: "不改动原则", body: "本平台不新建 AI 通道，全部复用已有 agent-gateway（127.0.0.1:10050）。网关未启动时，批改自动降级为规则引擎。", code: "gateway 在线 → 客观题+主观题全流程\ngateway 离线 → 仅规则引擎批改\n            主观题标记「待 AI 补批」" }
    ]
  }
};
