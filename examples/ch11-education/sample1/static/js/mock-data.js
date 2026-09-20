/**
 * 牧童中学智慧教学平台 · 演示数据（Mock）
 * 与后端 app.py 的 data/ 目录同一套结构
 * 全部为虚构数据，仅用于演示
 */

/* ═══ 班级 ═══ */
const MOCK_CLASSES = [
  { id: "C001", name: "初三(1)班", grade: "初三", teacher: "李敏", subject: "数学", students: 42, avg_score: 81.4, tags: ["理科重点", "数学"] },
  { id: "C002", name: "初三(2)班", grade: "初三", teacher: "王芳", subject: "语文", students: 40, avg_score: 78.9, tags: ["文科", "语文"] },
  { id: "C003", name: "初三(3)班", grade: "初三", teacher: "陈刚", subject: "英语", students: 41, avg_score: 76.2, tags: ["英语"] },
  { id: "C004", name: "初二(1)班", grade: "初二", teacher: "刘洋", subject: "数学", students: 44, avg_score: 79.8, tags: ["数学"] },
  { id: "C005", name: "初二(2)班", grade: "初二", teacher: "周婷", subject: "物理", students: 43, avg_score: 74.5, tags: ["物理"] }
];

/* ═══ 学生（节选，每班 3 人） ═══ */
const MOCK_STUDENTS = [
  { id: "ST001", name: "张一凡", class_id: "C001", class_name: "初三(1)班", weak: "二次函数图像", recent: 58, trend: "down" },
  { id: "ST002", name: "李思琪", class_id: "C001", class_name: "初三(1)班", weak: "几何证明", recent: 72, trend: "up" },
  { id: "ST003", name: "王浩然", class_id: "C001", class_name: "初三(1)班", weak: "应用题建模", recent: 85, trend: "up" },
  { id: "ST004", name: "刘雨桐", class_id: "C002", class_name: "初三(2)班", weak: "英语时态", recent: 63, trend: "flat" },
  { id: "ST005", name: "陈子墨", class_id: "C002", class_name: "初三(2)班", weak: "文言实词", recent: 69, trend: "up" },
  { id: "ST006", name: "赵子轩", class_id: "C003", class_name: "初三(3)班", weak: "文言实词", recent: 61, trend: "down" },
  { id: "ST007", name: "孙雨欣", class_id: "C003", class_name: "初三(3)班", weak: "听力理解", recent: 77, trend: "up" },
  { id: "ST008", name: "周天佑", class_id: "C004", class_name: "初二(1)班", weak: "因式分解", recent: 55, trend: "down" },
  { id: "ST009", name: "吴晨曦", class_id: "C005", class_name: "初二(2)班", weak: "电路分析", recent: 66, trend: "flat" }
];

/* ═══ 作业（含题目与标准答案） ═══ */
const MOCK_ASSIGNMENTS = [
  {
    id: "A001", title: "二次函数单元测验", subject: "数学", class_name: "初三(1)班",
    deadline: "2026-09-20 18:00", status: "进行中", submissions: 38,
    questions: [
      { qid: "q1", type: "choice", stem: "函数 y=(x-1)²+2 的顶点坐标是（　）", score: 5, answer: "B", options: ["A. (1, -2)", "B. (1, 2)", "C. (-1, 2)", "D. (-1, -2)"] },
      { qid: "q2", type: "choice", stem: "二次函数 y=x²-4x+3 与 x 轴交点个数是（　）", score: 5, answer: "C", options: ["A. 0 个", "B. 1 个", "C. 2 个", "D. 3 个"] },
      { qid: "q3", type: "fill", stem: "一元二次方程 x²-5x+6=0 的两个根分别是 __ 和 __", score: 5, answer: "2,3" },
      { qid: "q4", type: "math", stem: "已知二次函数 y=x²-6x+8，求对称轴与顶点坐标（写出解题步骤）", score: 10, answer: "对称轴 x=3，顶点 (3,-1)", rubric: "对称轴公式 4 分，顶点计算 6 分，步骤完整" },
      { qid: "q5", type: "short", stem: "简述判别式 Δ=b²-4ac 的几何意义", score: 5, answer: "判别式大于 0 时抛物线与 x 轴有两个交点，等于 0 时相切（一个交点），小于 0 时无交点", rubric: "三种情况各 1.5 分，语言准确 0.5 分" }
    ]
  },
  {
    id: "A002", title: "文言文阅读《岳阳楼记》", subject: "语文", class_name: "初三(2)班",
    deadline: "2026-09-20 18:00", status: "进行中", submissions: 35,
    questions: [
      { qid: "q1", type: "fill", stem: "「先天下之忧而忧，__」补全名句", score: 4, answer: "后天下之乐而乐" },
      { qid: "q2", type: "short", stem: "解释加点词「属予作文以记之」中「属」的意思", score: 4, answer: "通「嘱」，嘱托", rubric: "通假字 2 分，释义 2 分" },
      { qid: "q3", type: "essay", stem: "结合文章内容，分析作者「不以物喜，不以己悲」的胸襟（不少于 100 字）", score: 12, answer: "", rubric: "内容理解 4 分、情感分析 4 分、语言表达 4 分" }
    ]
  },
  {
    id: "A003", title: "英语时态专项练习", subject: "英语", class_name: "初三(3)班",
    deadline: "2026-09-19 20:00", status: "已截止", submissions: 40,
    questions: [
      { qid: "q1", type: "choice", stem: "She ___ to school every day.", score: 5, answer: "A", options: ["A. walks", "B. walked", "C. is walking", "D. has walked"] },
      { qid: "q2", type: "fill", stem: "I ___ (see) him yesterday.", score: 5, answer: "saw" },
      { qid: "q3", type: "choice", stem: "They ___ the Great Wall twice so far.", score: 5, answer: "D", options: ["A. visit", "B. visited", "C. are visiting", "D. have visited"] }
    ]
  }
];

/* ═══ 学生提交（含答案） ═══ */
const MOCK_SUBMISSIONS = [
  {
    id: "S001", assignment_id: "A001", student: "张一凡", class_name: "初三(1)班",
    submitted_at: "2026-09-19 17:32", status: "submitted",
    answers: [
      { qid: "q1", answer: "B" },
      { qid: "q2", answer: "B" },
      { qid: "q3", answer: "2和3" },
      { qid: "q4", answer: "配方得 y=(x-3)²-1，所以对称轴是 x=3，顶点是 (3,-1)" },
      { qid: "q5", answer: "判别式反映方程根的情况" }
    ]
  },
  {
    id: "S002", assignment_id: "A001", student: "李思琪", class_name: "初三(1)班",
    submitted_at: "2026-09-19 17:10", status: "submitted",
    answers: [
      { qid: "q1", answer: "B" },
      { qid: "q2", answer: "C" },
      { qid: "q3", answer: "2,3" },
      { qid: "q4", answer: "对称轴 x=3，顶点坐标 (3,-1)。配方：y=x²-6x+8=(x-3)²-1" },
      { qid: "q5", answer: "Δ>0 时与 x 轴有两个交点，Δ=0 时有一个交点（相切），Δ<0 时没有交点，反映抛物线与 x 轴的交点个数" }
    ]
  },
  {
    id: "S003", assignment_id: "A002", student: "刘雨桐", class_name: "初三(2)班",
    submitted_at: "2026-09-19 16:48", status: "submitted",
    answers: [
      { qid: "q1", answer: "后天下之乐而乐" },
      { qid: "q2", answer: "嘱咐" },
      { qid: "q3", answer: "范仲淹面对贬谪不怨天尤人，而是心系天下百姓。他在文中写道先天下之忧而忧，后天下之乐而乐，把个人得失放在国家之后，表现了以天下为己任的博大胸襟。" }
    ]
  },
  {
    id: "S004", assignment_id: "A003", student: "赵子轩", class_name: "初三(3)班",
    submitted_at: "2026-09-19 15:20", status: "submitted",
    answers: [
      { qid: "q1", answer: "A" },
      { qid: "q2", answer: "see" },
      { qid: "q3", answer: "D" }
    ]
  }
];

/* ═══ 人工复核队列（初始 2 条） ═══ */
const MOCK_REVIEWS = [
  {
    id: "RV001", submission_id: "S003", assignment_id: "A002",
    student: "刘雨桐", class_name: "初三(2)班", assignment: "文言文阅读《岳阳楼记》",
    ai_score: 14, confidence: 0.62, low_items: ["q3"],
    items: [
      { qid: "q1", grader: "rules", score: 4, max: 4, correct: true, confidence: 1.0, reasoning: "名句默写，与标准答案一致" },
      { qid: "q2", grader: "rules", score: 2, max: 4, correct: false, confidence: 1.0, reasoning: "答「嘱咐」未指出通假字，得释义分 2/4" },
      { qid: "q3", grader: "ai", score: 8, max: 12, correct: null, confidence: 0.62, reasoning: "内容理解 3 分（未结合具体语句），情感分析 3 分，语言表达 2 分", via: "qwen-max", model: "qwen-max" }
    ],
    status: "pending", created_at: "2026-09-19 16:50"
  },
  {
    id: "RV002", submission_id: "S001", assignment_id: "A001",
    student: "张一凡", class_name: "初三(1)班", assignment: "二次函数单元测验",
    ai_score: 17, confidence: 0.58, low_items: ["q4", "q5"],
    items: [
      { qid: "q1", grader: "rules", score: 5, max: 5, correct: true, confidence: 1.0, reasoning: "选择题，答案 B 与标准一致" },
      { qid: "q2", grader: "rules", score: 0, max: 5, correct: false, confidence: 1.0, reasoning: "标准答案 C，学生选 B" },
      { qid: "q3", grader: "rules", score: 5, max: 5, correct: true, confidence: 1.0, reasoning: "答案 2,3，与标准一致（容错 2和3）" },
      { qid: "q4", grader: "ai", score: 6, max: 10, correct: null, confidence: 0.55, reasoning: "对称轴与顶点正确但未展示配方过程，步骤分不足", via: "qwen-max", model: "qwen-max" },
      { qid: "q5", grader: "ai", score: 1, max: 5, correct: null, confidence: 0.61, reasoning: "仅答「反映根的情况」过于笼统，未说明三种情形", via: "qwen-max", model: "qwen-max" }
    ],
    status: "pending", created_at: "2026-09-19 17:35"
  }
];

/* ═══ 错题本 ═══ */
const MOCK_MISTAKES = [
  { id: "M001", student: "张一凡", class_name: "初三(1)班", subject: "数学", knowledge: "二次函数图像", source: "二次函数单元测验 q2", wrong: "B. 1 个", right: "C. 2 个", reason: "判别式 Δ=4>0 应为两个交点", times: 2, added_at: "2026-09-19" },
  { id: "M002", student: "刘雨桐", class_name: "初三(2)班", subject: "语文", knowledge: "文言实词", source: "文言文阅读《岳阳楼记》 q2", wrong: "嘱咐", right: "通「嘱」，嘱托", reason: "未答出通假字", times: 1, added_at: "2026-09-19" },
  { id: "M003", student: "赵子轩", class_name: "初三(3)班", subject: "英语", knowledge: "一般过去时", source: "英语时态专项 q2", wrong: "see", right: "saw", reason: "yesterday 提示过去时，动词未变形", times: 3, added_at: "2026-09-19" },
  { id: "M004", student: "周天佑", class_name: "初二(1)班", subject: "数学", knowledge: "因式分解", source: "因式分解练习 q3", wrong: "x(x-2)=0 未解完", right: "x=0 或 x=2", reason: "未写出根", times: 1, added_at: "2026-09-18" }
];

/* ═══ 课程资源 ═══ */
const MOCK_RESOURCES = [
  { id: "R001", name: "二次函数复习课件.pptx", subject: "数学", grade: "初三", size: "4.2 MB", uploader: "李敏", uploaded_at: "2026-09-10", downloads: 86, tags: ["课件", "复习"] },
  { id: "R002", name: "《岳阳楼记》朗读音频.mp3", subject: "语文", grade: "初三", size: "8.6 MB", uploader: "王芳", uploaded_at: "2026-09-08", downloads: 54, tags: ["音频"] },
  { id: "R003", name: "英语时态思维导图.pdf", subject: "英语", grade: "初三", size: "1.1 MB", uploader: "陈刚", uploaded_at: "2026-09-05", downloads: 132, tags: ["导图", "语法"] },
  { id: "R004", name: "电路分析实验视频.mp4", subject: "物理", grade: "初二", size: "156 MB", uploader: "周婷", uploaded_at: "2026-09-03", downloads: 41, tags: ["实验", "视频"] }
];

/* ═══ 网关信息 ═══ */
const MOCK_GATEWAY = {
  name: "agent-gateway",
  url: "http://127.0.0.1:10050",
  status: "online",
  version: "1.3.0",
  models: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen3-omni"],
  routes: [
    { path: "/v1/chat/completions", desc: "通用对话（OpenAI 兼容）", ok: true },
    { path: "/v1/embeddings", desc: "文本向量化（RAG 检索）", ok: true },
    { path: "/asr", desc: "语音转写（会议纪要）", ok: true },
    { path: "/health", desc: "健康检查", ok: true }
  ],
  qpm: { used: 128, limit: 600 },
  latency: { p50: 420, p95: 980 },
  uptime: "99.96%"
};

/* ═══ Mock 批改函数（与后端 app.py 的规则引擎同一套逻辑） ═══ */
window.mockGrade = (body, gid) => {
  const sub = MOCK_SUBMISSIONS.find(s => s.id === gid) || body.submission;
  const asg = MOCK_ASSIGNMENTS.find(a => a.id === sub.assignment_id);
  if (!asg) return { id: "G-" + gid, status: "graded", score: 0, items: [], confidence: 1.0 };

  const items = [];
  const aiConfs = [];
  let total = 0;

  asg.questions.forEach(q => {
    const ans = (sub.answers || []).find(a => a.qid === q.qid);
    const stuAns = ans ? String(ans.answer).trim() : "";
    const std = String(q.answer).trim();

    if (q.type === "choice" || q.type === "fill") {
      // ── 确定性规则引擎：客观题直接比对（含常见容错） ──
      const norm = s => s.replace(/\s+/g, "").replace(/[和与及]/g, ",").toLowerCase();
      const ok = norm(stuAns) === norm(std);
      const conf = 1.0;
      total += ok ? q.score : 0;
      items.push({
        qid: q.qid, grader: "rules", score: ok ? q.score : 0, max: q.score,
        correct: ok, confidence: conf,
        reasoning: ok ? "与标准答案一致" : "标准答案「" + std + "」，学生答案「" + stuAns + "」"
      });
    } else {
      // ── 主观题：AI 批改（mock 用确定性启发式模拟 LLM 判断） ──
      let ratio;
      if (q.type === "short") {
        ratio = stuAns.length >= 10 ? 0.8 : (stuAns.length >= 4 ? 0.6 : 0.2);
      } else if (q.type === "math") {
        const hasKey = std.split("，")[0].replace(/\s+/g, "");
        ratio = stuAns.includes("3") && stuAns.length > 15 ? 0.85 : 0.6;
      } else {
        ratio = stuAns.length >= 60 ? 0.7 : 0.4;
      }
      const conf = 0.5 + Math.random() * 0.4;
      const score = Math.round(q.score * ratio);
      aiConfs.push(conf);
      total += score;
      items.push({
        qid: q.qid, grader: "ai", score, max: q.score, correct: null,
        confidence: Number(conf.toFixed(2)),
        reasoning: "按评分标准给分：内容 " + Math.round(q.score * ratio * 0.5) + " 分、表达 " + (score - Math.round(q.score * ratio * 0.5)) + " 分（mock 启发式）",
        via: "qwen-max", model: "qwen-max"
      });
    }
  });

  // 置信度只看 AI 主观题：客观题规则引擎 100% 确定，不参与稀释
  const avgConf = aiConfs.length ? Number((aiConfs.reduce((a, b) => a + b, 0) / aiConfs.length).toFixed(2)) : 1.0;
  const status = avgConf < 0.7 ? "pending_review" : "graded";
  const lowItems = items.filter(i => i.confidence < 0.7).map(i => i.qid);
  const student = sub.student || "未知";
  return {
    id: "G-" + gid,
    submission_id: gid,
    student, class_name: sub.class_name,
    assignment: asg.title,
    score: total, max: items.reduce((a, i) => a + i.max, 0),
    confidence: avgConf, status,
    low_items: lowItems, items,
    created_at: new Date().toISOString().slice(0, 16).replace("T", " ")
  };
};
