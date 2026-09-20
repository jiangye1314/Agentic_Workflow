/**
 * 牧童中学智慧教学平台 · 视图组件（17 个）
 * 教学驾驶舱 / 班级 / 资源 / 学籍 / 作业布置 / AI 批改 / 人工复核 / 错题本 / 报告 / 学情 / 质检 / AI 助教 / 问答 / 纪要 / 教案×2 / 网关
 * 浅色主题 · 数据来自 Flask 后端（USE_MOCK=false）
 */

/* ═══ 状态徽章映射 ═══ */
const STATUS_MAP = {
  "进行中": "blue", "已截止": "gray", "graded": "green", "已批改": "green",
  "pending": "orange", "pending_review": "orange", "待复核": "orange", "submitted": "gray", "待批改": "gray",
  "confirmed": "green", "已确认": "green", "online": "green", "在线": "green",
  "通过": "green", "超标": "red", "up": "green", "down": "red", "flat": "gray",
  "上升": "green", "下降": "red", "持平": "gray"
};
const badgeCls = s => STATUS_MAP[s] || "gray";
const TREND_TXT = { up: "上升", down: "下降", flat: "持平" };

/* ═══ 1. 教学驾驶舱 ═══ */
const DashboardView = {
  data() { return { stats: null, loading: true }; },
  async mounted() {
    this.stats = await API.get("/api/stats/overview");
    this.loading = false;
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">教学驾驶舱</div>
      <div class="page-desc">全校作业批改关键指标总览 · 三层批改架构：确定性规则 + AI 评分 + 人工复核（HITL）</div>
    </div>
    <div class="grid grid-4" v-if="stats">
      <div class="kpi"><div class="kpi-label">班级数</div><div class="kpi-val">{{ stats.classes }}</div><div class="kpi-sub">个教学班</div></div>
      <div class="kpi"><div class="kpi-label">在读学生</div><div class="kpi-val">{{ stats.students }}</div><div class="kpi-sub">人</div></div>
      <div class="kpi"><div class="kpi-label">进行中作业</div><div class="kpi-val">{{ stats.assignments_active }}</div><div class="kpi-sub">份</div></div>
      <div class="kpi"><div class="kpi-label">今日提交</div><div class="kpi-val">{{ stats.submissions_today }}</div><div class="kpi-sub">份</div></div>
      <div class="kpi"><div class="kpi-label">已批改</div><div class="kpi-val">{{ stats.graded }}</div><div class="kpi-sub">份提交</div></div>
      <div class="kpi"><div class="kpi-label">待人工复核</div><div class="kpi-val" style="color:var(--warn)">{{ stats.pending_review }}</div><div class="kpi-sub">置信度 &lt; 0.7</div></div>
      <div class="kpi"><div class="kpi-label">全级平均分</div><div class="kpi-val">{{ stats.avg_score }}</div><div class="kpi-sub">分</div></div>
      <div class="kpi"><div class="kpi-label">AI 批改准确率</div><div class="kpi-val">{{ stats.ai_accuracy }}%</div><div class="kpi-sub">质检抽检口径</div></div>
    </div>
    <div class="grid grid-3" style="margin-top:14px" v-if="stats">
      <div class="card">
        <div class="card-title">批改链路</div>
        <div class="detail-row"><span>客观题</span><b>规则引擎</b><span class="badge green">确定性</span></div>
        <div class="detail-row"><span>主观题</span><b>LLM 按 rubric</b><span class="badge blue">AI</span></div>
        <div class="detail-row"><span>低置信度</span><b>人工复核队列</b><span class="badge orange">HITL</span></div>
        <div class="detail-row"><span>AI 出口</span><b>{{ stats.gateway }}</b></div>
      </div>
      <div class="card">
        <div class="card-title">核心业务规则</div>
        <ul class="rp-points">
          <li>置信度阈值 0.7，低于阈值自动转人工复核</li>
          <li>数学题答案分:步骤分 = 4:6</li>
          <li>质检抽检 10%，偏差 &gt; 5 分记为超标</li>
          <li>改判回流 few-shot 库，每桶 ≤ 20 条</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-title">快捷入口</div>
        <div class="btn primary" @click="$emit('navigate','assign')">布置作业</div>
        <div class="btn" style="margin-left:8px" @click="$emit('navigate','grading')">开始批改</div>
        <div class="btn" style="margin-left:8px" @click="$emit('navigate','review')">复核队列</div>
      </div>
    </div>
  </div>`
};

/* ═══ 2. 班级管理 ═══ */
const ClassesView = {
  data() { return { classes: [], students: [], openClass: null }; },
  async mounted() { this.classes = await API.get("/api/classes"); },
  methods: {
  async toggleStudents(c) {
    if (this.openClass === c.id) { this.openClass = null; return; }
    this.openClass = c.id;
    this.students = await API.get("/api/students?class_id=" + c.id);
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">班级管理</div>
      <div class="page-desc">班级为最小管理单元：作业、学生、学情均挂载在班级下</div>
    </div>
    <div class="card">
      <div class="card-title">全校班级（{{ classes.length }}）</div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>班级</th><th>年级</th><th>班主任</th><th>科目方向</th><th>人数</th><th>平均分</th><th></th></tr>
        <tr v-for="c in classes" :key="c.id">
          <td><b>{{ c.name }}</b></td>
          <td>{{ c.grade }}</td>
          <td>{{ c.teacher }}</td>
          <td><span class="tag">{{ c.subject }}</span></td>
          <td>{{ c.students }}</td>
          <td>{{ c.avg_score }}</td>
          <td><span class="btn sm" @click="toggleStudents(c)">{{ openClass===c.id ? '收起' : '学生' }}</span></td>
        </tr>
      </table></div>
      <template v-if="openClass">
        <div class="card-title" style="margin-top:14px">学生列表</div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>学号</th><th>姓名</th><th>弱势知识点</th><th>最近成绩</th><th>趋势</th></tr>
          <tr v-for="s in students" :key="s.id">
            <td>{{ s.id }}</td><td>{{ s.name }}</td>
            <td><span class="badge orange">{{ s.weak }}</span></td>
            <td>{{ s.recent }}</td>
            <td><span class="badge" :class="badgeCls(s.trend)">{{ TREND_TXT[s.trend] }}</span></td>
          </tr>
        </table></div>
      </template>
    </div>
  </div>`
};

/* ═══ 3. 课程资源库 ═══ */
const ResourcesView = {
  data() { return { resources: [], kw: "" }; },
  async mounted() { this.resources = await API.get("/api/resources"); },
  computed: {
    filtered() {
      const k = this.kw.trim();
      if (!k) return this.resources;
      return this.resources.filter(r => (r.name + r.subject + r.grade + (r.tags || []).join("")).includes(k));
    }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">课程资源库</div>
      <div class="page-desc">课件 / 音频 / 视频统一存放，按科目、年级、标签检索</div>
    </div>
    <div class="card">
      <div class="form-row">
        <div class="field">
          <input class="search-box" placeholder="搜索资源名称 / 科目 / 标签" v-model="kw">
        </div>
      </div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>资源</th><th>科目</th><th>年级</th><th>大小</th><th>上传人</th><th>下载</th><th>标签</th></tr>
        <tr v-for="r in filtered" :key="r.id">
          <td><b>{{ r.name }}</b><div class="hint">{{ r.uploaded_at }}</div></td>
          <td>{{ r.subject }}</td><td>{{ r.grade }}</td><td>{{ r.size }}</td>
          <td>{{ r.uploader }}</td><td>{{ r.downloads }}</td>
          <td><span class="tag" v-for="t in r.tags" :key="t">{{ t }}</span></td>
        </tr>
      </table></div>
    </div>
  </div>`
};

/* ═══ 4. 学生学籍档案 ═══ */
const ProfilesView = {
  data() { return { students: [] }; },
  async mounted() { this.students = await API.get("/api/students"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">学生学籍档案</div>
      <div class="page-desc">静态档案 + 动态学习画像（弱势知识点由批改引擎自动回写）</div>
    </div>
    <div class="grid grid-3">
      <div class="card" v-for="s in students" :key="s.id">
        <div class="card-title">{{ s.name }} <span class="tag">{{ s.class_name }}</span></div>
        <div class="detail-row"><span>学号</span><b>{{ s.id }}</b></div>
        <div class="detail-row"><span>弱势知识点</span><span class="badge orange">{{ s.weak }}</span></div>
        <div class="detail-row"><span>最近成绩</span><b>{{ s.recent }}</b></div>
        <div class="detail-row"><span>趋势</span><span class="badge" :class="badgeCls(s.trend)">{{ TREND_TXT[s.trend] }}</span></div>
      </div>
    </div>
  </div>`
};

/* ═══ 5. 作业布置 ═══ */
const AssignView = {
  data() {
    return {
      assignments: [],
      form: { title: "", subject: "数学", class_name: "初三(1)班", deadline: "2026-09-21 18:00" },
      questions: [],
      qdraft: { type: "choice", stem: "", answer: "", score: 5, rubric: "" },
      subjects: ["数学", "语文", "英语", "物理", "化学", "历史"],
      classOptions: ["初三(1)班", "初三(2)班", "初三(3)班", "初二(1)班", "初二(2)班"]
    };
  },
  async mounted() { this.assignments = await API.get("/api/assignments"); },
  methods: {
  addQuestion() {
    if (!this.qdraft.stem.trim() || !this.qdraft.answer.trim()) { toast("题目与答案不能为空", "err"); return; }
    this.questions.push({ qid: "q" + (this.questions.length + 1), ...this.qdraft });
    this.qdraft = { type: "choice", stem: "", answer: "", score: 5, rubric: "" };
    toast("题目已加入草稿");
  },
  async submit() {
    if (!this.form.title.trim()) { toast("请填写作业标题", "err"); return; }
    if (!this.questions.length) { toast("请至少添加一道题", "err"); return; }
    await API.post("/api/assignments", { ...this.form, questions: this.questions });
    toast("作业已发布", "ok");
    this.assignments = await API.get("/api/assignments");
    this.form.title = ""; this.questions = [];
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">作业布置</div>
      <div class="page-desc">录入题目 + 标准答案 + 评分标准：这是后续自动批改的基准（锚点）</div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">新作业</div>
        <div class="form-row">
          <div class="field"><label>作业标题</label><input v-model="form.title" placeholder="如：二次函数单元测验"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>科目</label>
            <select v-model="form.subject"><option v-for="s in subjects" :key="s">{{ s }}</option></select>
          </div>
          <div class="field"><label>班级</label>
            <select v-model="form.class_name"><option v-for="c in classOptions" :key="c">{{ c }}</option></select>
          </div>
        </div>
        <div class="form-row">
          <div class="field"><label>截止时间</label><input v-model="form.deadline"></div>
        </div>
        <div class="card-title" style="margin-top:10px">题目草稿（{{ questions.length }}）</div>
        <div class="form-row">
          <div class="field"><label>题型</label>
            <select v-model="qdraft.type">
              <option value="choice">选择题（规则引擎）</option>
              <option value="fill">填空题（规则引擎）</option>
              <option value="short">简答题（AI 批改）</option>
              <option value="math">解答题（AI 批改）</option>
              <option value="essay">作文/论述（AI 批改）</option>
            </select>
          </div>
          <div class="field"><label>分值</label><input type="number" v-model.number="qdraft.score" min="1" max="50"></div>
        </div>
        <div class="form-row"><div class="field"><label>题干</label><textarea rows="2" v-model="qdraft.stem" placeholder="题目内容"></textarea></div></div>
        <div class="form-row"><div class="field"><label>标准答案</label><textarea rows="2" v-model="qdraft.answer" placeholder="客观题填精确答案；主观题填参考答案"></textarea></div></div>
        <div class="form-row" v-if="qdraft.type!=='choice' && qdraft.type!=='fill'">
          <div class="field"><label>评分标准 rubric（分项得分点）</label><textarea rows="2" v-model="qdraft.rubric" placeholder="如：对称轴 4 分，顶点 6 分"></textarea></div>
        </div>
        <div><span class="btn" @click="addQuestion">+ 加入题目</span>
        <span class="btn primary" style="margin-left:8px" @click="submit">发布作业</span></div>
      </div>
      <div class="card">
        <div class="card-title">已布置作业</div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>标题</th><th>班级</th><th>截止</th><th>提交</th><th>状态</th></tr>
          <tr v-for="a in assignments" :key="a.id">
            <td><b>{{ a.title }}</b></td><td>{{ a.class_name }}</td>
            <td>{{ a.deadline }}</td><td>{{ a.submissions }}</td>
            <td><span class="badge" :class="badgeCls(a.status)">{{ a.status }}</span></td>
          </tr>
        </table></div>
      </div>
    </div>
  </div>`
};

/* ═══ 6. AI 智能批改（核心） ═══ */
const GradingView = {
  data() {
    return {
      assignments: [], submissions: [], selAsg: null,
      grading: false, result: null, selSub: null,
      ocrProviders: [], ocrProvider: "bailian", ocrImage: null,
      ocrImageName: "", ocrBusy: false, ocrResult: null
    };
  },
  async mounted() {
    this.loadOcrProviders();
    this.assignments = await API.get("/api/assignments");
    if (this.assignments.length) await this.pickAssignment(this.assignments[0]);
  },
  methods: {
  async loadOcrProviders() {
    this.ocrProviders = await API.get("/api/ocr/providers");
    const cur = this.ocrProviders.find(p => p.current);
    if (cur) this.ocrProvider = cur.id;
  },
  onOcrFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast("图片超过 4MB 上限", "err"); return; }
    const r = new FileReader();
    r.onload = () => {
      this.ocrImage = String(r.result).split(",")[1] || String(r.result);
      this.ocrImageName = f.name;
      this.ocrResult = null;
    };
    r.readAsDataURL(f);
  },
  async runOcr() {
    if (!this.ocrImage || this.ocrBusy) return;
    this.ocrBusy = true; this.ocrResult = null;
    try {
      this.ocrResult = await API.post("/api/ocr/recognize?provider=" + this.ocrProvider, { image: this.ocrImage });
    } catch (e) { toast("OCR 识别失败：" + e.message, "err"); }
    this.ocrBusy = false;
  },
  async pickAssignment(a) {
    this.selAsg = a;
    this.submissions = await API.get("/api/submissions");
    this.submissions = this.submissions.filter(s => s.assignment_id === a.id);
    this.result = null;
  },
  async grade(sub) {
    this.selSub = sub;
    this.grading = true; this.result = null;
    try {
      this.result = await API.post("/api/grade", { submission_id: sub.id });
    } catch (e) { toast("批改失败：" + e.message, "err"); }
    this.grading = false;
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">AI 智能批改</div>
      <div class="page-desc">三层批改：客观题规则引擎（确定性）→ 主观题 LLM 按 rubric → 置信度 &lt; 0.7 自动转人工复核</div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-title">作业图片 OCR 识别 <span class="hint">手写作业拍照 → 视觉模型识别为文本 → 作为学生答案参与批改</span></div>
      <div class="detail-row">
        <span>识别供应商</span>
        <select v-model="ocrProvider" style="width:220px">
          <option v-for="p in ocrProviders" :key="p.id" :value="p.id">{{ p.name }} · {{ p.model }}{{ p.ready ? '' : '（未配密钥）' }}</option>
        </select>
        <label class="btn sm" style="margin-left:8px;cursor:pointer">选择图片
          <input type="file" accept="image/*" style="display:none" @change="onOcrFile">
        </label>
        <span class="tag" v-if="ocrImageName">{{ ocrImageName }}</span>
        <span class="btn sm primary" style="margin-left:8px" @click="runOcr" :disabled="ocrBusy || !ocrImage">{{ ocrBusy ? '识别中…' : '开始识别' }}</span>
      </div>
      <div v-if="ocrResult">
        <div class="detail-row" style="margin-top:8px">
          <span>识别结果</span>
          <b>{{ ocrResult.provider_name }}</b>
          <span class="badge" :class="ocrResult.degraded ? 'orange' : 'green'">{{ ocrResult.degraded ? '降级' : '在线' }}</span>
          <span class="hint" v-if="ocrResult.reason" style="margin-left:6px">{{ ocrResult.reason }}</span>
        </div>
        <div class="hint" style="white-space:pre-wrap;margin-top:6px">{{ ocrResult.text }}</div>
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">选择作业</div>
        <div class="form-row"><div class="field">
          <select v-model="selAsg" @change="pickAssignment(selAsg)">
            <option v-for="a in assignments" :key="a.id" :value="a">{{ a.title }}（{{ a.class_name }}）</option>
          </select>
        </div></div>
        <div class="card-title" style="margin-top:8px">提交列表（{{ submissions.length }}）</div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>学生</th><th>提交时间</th><th>状态</th><th></th></tr>
          <tr v-for="s in submissions" :key="s.id">
            <td><b>{{ s.student }}</b></td><td>{{ s.submitted_at }}</td>
            <td><span class="badge" :class="badgeCls(s.status)">{{ s.status==='submitted' ? '待批改' : (s.status==='pending_review' ? '待复核' : '已批改') }}</span></td>
            <td><span class="btn sm primary" @click="grade(s)" :disabled="grading">{{ grading && selSub===s ? '批改中…' : '开始批改' }}</span></td>
          </tr>
        </table></div>
      </div>
      <div class="card" v-if="result">
        <div class="card-title">{{ result.assignment }} · {{ result.student }}
          <span class="badge" :class="badgeCls(result.status)">{{ result.status==='pending_review' ? '已转人工复核' : '批改完成' }}</span>
        </div>
        <div class="detail-row"><span>总分</span><b style="font-size:18px">{{ result.score }} / {{ result.max }}</b>
          <span class="badge" :class="result.confidence >= 0.7 ? 'green' : 'orange'">置信度 {{ result.confidence }}</span></div>
        <div v-if="result.status==='pending_review'" class="hint" style="color:var(--warn);margin-bottom:8px">
          本卷置信度低于阈值 0.7，成绩暂不发布，已进入人工复核队列。
        </div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>题号</th><th>批改方式</th><th>得分</th><th>置信度</th><th>批改依据</th></tr>
          <tr v-for="it in result.items" :key="it.qid">
            <td>{{ it.qid }}</td>
            <td><span class="badge" :class="it.grader==='rules' ? 'green' : 'blue'">{{ it.grader==='rules' ? '规则引擎' : 'AI · ' + (it.via||'LLM') }}</span></td>
            <td><b>{{ it.score }} / {{ it.max }}</b></td>
            <td><span class="badge" :class="it.confidence >= 0.7 ? 'green' : 'orange'">{{ it.confidence }}</span></td>
            <td class="hint">{{ it.reasoning }}</td>
          </tr>
        </table></div>
      </div>
      <div class="card" v-else>
        <div class="card-title">批改结果</div>
        <div class="empty">{{ grading ? '批改中…' : '在左侧选择一份提交，点击「开始批改」' }}</div>
      </div>
    </div>
  </div>`
};

/* ═══ 7. 人工复核队列（核心 HITL） ═══ */
const ReviewView = {
  data() { return { reviews: [], open: null, adjust: {} }; },
  async mounted() { this.reviews = await API.get("/api/reviews"); },
  methods: {
  openReview(rv) {
    this.open = rv.id;
    this.adjust = {};
    rv.items.forEach(it => { this.adjust[it.qid] = it.score; });
  },
  async confirm(rv) {
    await API.put("/api/reviews/" + rv.id, { adjustments: this.adjust, confirmed_by: "李敏" });
    toast("复核完成：成绩已发布，改判样本已回流 few-shot 库", "ok");
    this.reviews = await API.get("/api/reviews");
    this.open = null;
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">人工复核队列</div>
      <div class="page-desc">低置信度批改单（&lt; 0.7）在此等待教师确认或改判 · 改判结果回流 few-shot 库</div>
    </div>
    <div class="card">
      <div class="card-title">待复核（{{ reviews.filter(r=>r.status==='pending').length }}）</div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>学生</th><th>作业</th><th>AI 得分</th><th>置信度</th><th>低置信题</th><th>进入时间</th><th></th></tr>
        <tr v-for="rv in reviews" :key="rv.id">
          <td><b>{{ rv.student }}</b><div class="hint">{{ rv.class_name }}</div></td>
          <td>{{ rv.assignment }}</td>
          <td>{{ rv.ai_score }}</td>
          <td><span class="badge orange">{{ rv.confidence }}</span></td>
          <td><span class="tag" v-for="q in rv.low_items" :key="q">{{ q }}</span></td>
          <td class="hint">{{ rv.created_at }}</td>
          <td>
            <span v-if="rv.status==='pending'" class="btn sm primary" @click="openReview(rv)">复核</span>
            <span v-else class="badge green">已确认</span>
          </td>
        </tr>
      </table></div>
      <template v-if="open">
        <div class="card-title" style="margin-top:14px">逐题复核（可改分）</div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>题号</th><th>批改方式</th><th>AI 给分</th><th>AI 依据</th><th>改判分数</th></tr>
          <tr v-for="it in (reviews.find(r=>r.id===open)||{}).items" :key="it.qid">
            <td>{{ it.qid }}</td>
            <td><span class="badge" :class="it.grader==='rules' ? 'green' : 'blue'">{{ it.grader==='rules' ? '规则引擎' : 'AI' }}</span></td>
            <td>{{ it.score }} / {{ it.max }}</td>
            <td class="hint">{{ it.reasoning }}</td>
            <td><input type="number" v-model.number="adjust[it.qid]" :min="0" :max="it.max" style="width:70px"> / {{ it.max }}</td>
          </tr>
        </table></div>
        <div style="margin-top:10px">
          <span class="btn primary" @click="confirm(reviews.find(r=>r.id===open))">确认并发布成绩（改判回流 few-shot 库）</span>
        </div>
      </template>
    </div>
  </div>`
};

/* ═══ 8. 错题本 ═══ */
const MistakesView = {
  data() { return { mistakes: [] }; },
  async mounted() { this.mistakes = await API.get("/api/mistakes"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">错题本</div>
      <div class="page-desc">批改后自动沉淀：错误答案 → 正确答案 → 错因归因 → 错误次数</div>
    </div>
    <div class="card">
      <div class="table-wrap"><table class="tbl">
        <tr><th>学生</th><th>科目</th><th>知识点</th><th>来源</th><th>错误答案</th><th>正确答案</th><th>错因</th><th>次数</th></tr>
        <tr v-for="m in mistakes" :key="m.id">
          <td><b>{{ m.student }}</b><div class="hint">{{ m.class_name }}</div></td>
          <td>{{ m.subject }}</td>
          <td><span class="badge orange">{{ m.knowledge }}</span></td>
          <td class="hint">{{ m.source }}</td>
          <td style="color:var(--danger)">{{ m.wrong }}</td>
          <td style="color:var(--ok)">{{ m.right }}</td>
          <td class="hint">{{ m.reason }}</td>
          <td><span class="badge" :class="m.times>=3 ? 'red' : 'orange'">{{ m.times }} 次</span></td>
        </tr>
      </table></div>
    </div>
  </div>`
};

/* ═══ 9. 作业分析报告 ═══ */
const ReportView = {
  data() { return { assignments: [], selAsg: null }; },
  async mounted() {
    this.assignments = await API.get("/api/assignments");
    if (this.assignments.length) this.selAsg = this.assignments[0];
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">作业分析报告</div>
      <div class="page-desc">单次作业的班级报告：均分 / 逐题正确率 / 分数段分布</div>
    </div>
    <div class="card">
      <div class="form-row"><div class="field">
        <select v-model="selAsg">
          <option v-for="a in assignments" :key="a.id" :value="a">{{ a.title }}（{{ a.class_name }}）</option>
        </select>
      </div></div>
      <template v-if="selAsg">
        <div class="grid grid-3">
          <div class="report-card"><div class="report-head">班级均分</div><div class="rec-score">82.5</div><div class="report-meta">满分 {{ selAsg.questions.reduce((a,q)=>a+q.score,0) }} 分</div></div>
          <div class="report-card"><div class="report-head">提交率</div><div class="rec-score">{{ Math.round(selAsg.submissions/44*100) }}%</div><div class="report-meta">{{ selAsg.submissions }} / 44 人</div></div>
          <div class="report-card"><div class="report-head">教学预警题</div><div class="rec-score" style="color:var(--warn)">{{ selAsg.questions.length >= 2 ? 1 : 0 }}</div><div class="report-meta">正确率 &lt; 60% 的题目</div></div>
        </div>
        <div class="card-title" style="margin-top:12px">逐题正确率（演示数据）</div>
        <div v-for="(q,i) in selAsg.questions" :key="q.qid" class="hbar-row">
          <div class="hbar-name">{{ q.qid }} {{ q.stem.slice(0, 22) }}{{ q.stem.length>22?'…':'' }}</div>
          <div class="hbar-track"><div class="hbar-fill" :class="[88 - i*14 < 60 ? 'warn-fill' : '']" :style="{width:(88-i*14)+'%'}"></div></div>
          <div class="hbar-num">{{ 88-i*14 }}%</div>
        </div>
      </template>
    </div>
  </div>`
};

/* ═══ 10. 学情数据分析 ═══ */
const LearningView = {
  data() { return { data: null }; },
  async mounted() { this.data = await API.get("/api/learning"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">学情数据分析</div>
      <div class="page-desc">知识点掌握度 + 弱势学生名单（规则判定，AI 补充归因）</div>
    </div>
    <div class="grid grid-2" v-if="data">
      <div class="card">
        <div class="card-title">知识点掌握度</div>
        <div v-for="k in data.knowledge" :key="k.name" class="hbar-row">
          <div class="hbar-name">{{ k.name }}</div>
          <div class="hbar-track"><div class="hbar-fill" :class="k.mastery<65 ? 'warn-fill' : ''" :style="{width:k.mastery+'%'}"></div></div>
          <div class="hbar-num">{{ k.mastery }}%</div>
        </div>
        <div class="hint" style="margin-top:8px">掌握度 = 1 - 该知识点错题数 / 总题数 · 低于 65% 标橙</div>
      </div>
      <div class="card">
        <div class="card-title">需关注学生（规则判定）</div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>学生</th><th>班级</th><th>弱势知识点</th><th>最近成绩</th></tr>
          <tr v-for="s in data.weak_students" :key="s.name">
            <td><b>{{ s.name }}</b></td><td>{{ s.class_name }}</td>
            <td><span class="badge orange">{{ s.weak }}</span></td>
            <td style="color:var(--danger)">{{ s.score }}</td>
          </tr>
        </table></div>
        <div class="hint" style="margin-top:8px">规则：最近成绩 &lt; 70 且趋势为下降 → 进入名单，AI 生成归因建议</div>
      </div>
    </div>
  </div>`
};

/* ═══ 11. 批改质检中心 ═══ */
const QualityView = {
  data() { return { q: null }; },
  async mounted() { this.q = await API.get("/api/quality"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">批改质检中心</div>
      <div class="page-desc">对 AI 批改按比例抽检 · 双评偏差 &gt; 5 分记为超标 · 超标率 &gt; 5% 触发告警</div>
    </div>
    <div class="grid grid-4" v-if="q">
      <div class="kpi"><div class="kpi-label">累计抽检</div><div class="kpi-val">{{ q.total_checked }}</div><div class="kpi-sub">份</div></div>
      <div class="kpi"><div class="kpi-label">抽检比例</div><div class="kpi-val">{{ q.sample_rate*100 }}%</div><div class="kpi-sub">规则设定</div></div>
      <div class="kpi"><div class="kpi-label">偏差 &gt; 5 分</div><div class="kpi-val" style="color:var(--warn)">{{ q.deviation_over5 }}</div><div class="kpi-sub">超标样本</div></div>
      <div class="kpi"><div class="kpi-label">AI 准确率</div><div class="kpi-val">{{ q.accuracy }}%</div><div class="kpi-sub">抽检口径</div></div>
    </div>
    <div class="card" v-if="q">
      <div class="card-title">最近质检记录</div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>编号</th><th>作业</th><th>教师</th><th>抽检数</th><th>平均偏差(分)</th><th>结果</th><th>时间</th></tr>
        <tr v-for="r in q.recent" :key="r.id">
          <td>{{ r.id }}</td><td>{{ r.assignment }}</td><td>{{ r.teacher }}</td>
          <td>{{ r.checked }}</td><td>{{ r.deviation }}</td>
          <td><span class="badge" :class="badgeCls(r.result)">{{ r.result }}</span></td>
          <td class="hint">{{ r.ts }}</td>
        </tr>
      </table></div>
    </div>
  </div>`
};

/* ═══ 12. AI 助教 ═══ */
const AiChatView = {
  data() { return { msgs: [], input: "", presets: ["帮我出 3 道二次函数的课堂练习", "点评一份数学作业的共性错误", "写一段给家长的沟通话术：学生最近成绩下滑"], busy: false }; },
  methods: {
  async send() {
    const t = this.input.trim();
    if (!t || this.busy) return;
    this.msgs.push({ role: "user", text: t });
    this.input = "";
    this.busy = true;
    try {
      const r = await API.post("/api/gateway/chat", { question: t });
      this.msgs.push({ role: "ai", text: r.reply || "（无回复）", meta: r.mock ? "Mock 应答" : (r.model || "LLM") });
    } catch (e) {
      this.msgs.push({ role: "ai", text: "调用失败：" + e.message + "（检查 agent-gateway 10050 是否启动）", meta: "错误" });
    }
    this.busy = false;
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">AI 助教</div>
      <div class="page-desc">课堂提问 / 作业点评 / 家长沟通话术 · 经统一 agent-gateway 调用</div>
    </div>
    <div class="card">
      <div class="chat-list" style="min-height:300px">
        <div class="msg" :class="{user: m.role==='user'}" v-for="(m,i) in msgs" :key="i">
          <div class="msg-avatar">{{ m.role==='user' ? '师' : 'AI' }}</div>
          <div>
            <div class="msg-bubble">{{ m.text }}</div>
            <div class="msg-meta" v-if="m.meta">{{ m.meta }}</div>
          </div>
        </div>
        <div class="empty" v-if="!msgs.length">选择预设问题或输入你的需求</div>
      </div>
      <div class="preset-row">
        <span class="preset-chip" v-for="p in presets" :key="p" @click="input=p; send()">{{ p }}</span>
      </div>
      <div class="chat-input-bar">
        <textarea rows="2" v-model="input" placeholder="输入问题…" @keydown.enter.exact.prevent="send"></textarea>
        <span class="btn primary" @click="send" :disabled="busy">{{ busy ? '思考中…' : '发送' }}</span>
      </div>
    </div>
  </div>`
};

/* ═══ 13. 智能问答（RAG） ═══ */
const QaView = {
  data() { return { q: "", result: null, busy: false }; },
  methods: {
  async ask() {
    if (!this.q.trim() || this.busy) return;
    this.busy = true; this.result = null;
    try {
      const r = await API.post("/api/gateway/chat", { question: this.q, mode: "rag" });
      this.result = { answer: r.reply || "（无回复）", refs: r.refs || ["教材 §3.2", "课程资源库 · 二次函数复习课件"] };
    } catch (e) { toast("检索失败：" + e.message, "err"); }
    this.busy = false;
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">智能问答</div>
      <div class="page-desc">基于教学资料库的检索增强问答（RAG）：先检索、再回答、带出处</div>
    </div>
    <div class="card">
      <div class="form-row">
        <div class="field"><input v-model="q" placeholder="如：二次函数的顶点式是什么？" @keydown.enter="ask"></div>
        <span class="btn primary" @click="ask" :disabled="busy">{{ busy ? '检索中…' : '提问' }}</span>
      </div>
      <template v-if="result">
        <div class="card-title" style="margin-top:10px">回答</div>
        <div class="code-block">{{ result.answer }}</div>
        <div class="card-title" style="margin-top:10px">引用来源</div>
        <ul class="rp-points"><li v-for="r in result.refs" :key="r">{{ r }}</li></ul>
      </template>
    </div>
  </div>`
};

/* ═══ 14. 教研会议纪要 ═══ */
const MeetingView = {
  data() { return { meetings: [{ id: "MT001", name: "初三数学备课组第 3 次教研会", date: "2026-09-18", duration: "52 分钟", summary: "确定二次函数单元教学进度；讨论 AI 批改结果的使用边界；安排单元测验命题。", actions: [{ who: "李敏", what: "周五前完成单元测验命题" }, { who: "刘洋", what: "整理错题变式练习库" }] }], busy: false, uploaded: null }; },
  methods: {
  async upload() {
    this.busy = true;
    await new Promise(r => setTimeout(r, 800));
    this.uploaded = "2026-09-18 教研会录音.mp3（转写中…）";
    this.busy = false;
    toast("演示环境：录音转写经网关 /asr 接口，此处为占位流程", "ok");
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">教研会议纪要</div>
      <div class="page-desc">上传录音 → ASR 转写 → LLM 结构化纪要（议题 / 结论 / 行动项）</div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">上传录音</div>
        <div class="form-row">
          <div class="field"><input type="file" accept="audio/*"></div>
          <span class="btn primary" @click="upload" :disabled="busy">{{ busy ? '处理中…' : '开始转写' }}</span>
        </div>
        <div class="hint" v-if="uploaded">{{ uploaded }}</div>
        <div class="hint" style="margin-top:8px">音频 → agent-gateway /asr → 逐字稿 → LLM 摘要</div>
      </div>
      <div class="card" v-for="m in meetings" :key="m.id">
        <div class="card-title">{{ m.name }}</div>
        <div class="report-meta">{{ m.date }} · {{ m.duration }}</div>
        <div class="rp-sec-title" style="margin-top:8px">会议摘要</div>
        <div class="rp-text">{{ m.summary }}</div>
        <div class="rp-sec-title">行动项</div>
        <ul class="rp-points"><li v-for="a in m.actions" :key="a.what"><b>{{ a.who }}</b>：{{ a.what }}</li></ul>
      </div>
    </div>
  </div>`
};

/* ═══ 15/16. 教案生成（Python 编排 / LangGraph 图编排） ═══ */
const LessonGenBase = {
  data() { return { form: { subject: "数学", grade: "初三", topic: "二次函数的图像与性质", period: "1 课时" }, result: null, busy: false, mode: "python" }; },
  methods: {
  async generate() {
    if (!this.form.topic.trim()) { toast("请填写课题", "err"); return; }
    this.busy = true; this.result = null;
    try {
      const r = await API.post("/api/gateway/chat", { question: "教案生成：" + JSON.stringify(this.form), mode: this.mode });
      this.result = {
        text: r.reply || "（无回复）",
        pipeline: this.mode === "python"
          ? ["plan_agent 生成大纲", "section_agents 分节撰写", "exercise_agent 设计习题", "merge 汇总输出"]
          : ["StateGraph 定义节点", "plan → section* → exercise", "quality_check 质量校验", "不达标则回环重写"]
      };
    } catch (e) { toast("生成失败：" + e.message, "err"); }
    this.busy = false;
  },
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">教案生成（{{ mode==='python' ? 'Python 多智能体流水线' : 'LangGraph 图编排' }}）</div>
      <div class="page-desc">{{ mode==='python' ? 'Python 串行编排多个 LLM 调用，每步可独立重试' : '用状态图描述流程：节点即智能体，支持条件分支与循环' }}</div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">课题信息</div>
        <div class="form-row">
          <div class="field"><label>科目</label><input v-model="form.subject"></div>
          <div class="field"><label>年级</label><input v-model="form.grade"></div>
        </div>
        <div class="form-row"><div class="field"><label>课题</label><input v-model="form.topic"></div></div>
        <div class="form-row"><div class="field"><label>课时</label><input v-model="form.period"></div></div>
        <span class="btn primary" @click="generate" :disabled="busy">{{ busy ? '生成中…' : '生成教案' }}</span>
        <div class="card-title" style="margin-top:12px">编排流水线</div>
        <ul class="rp-points"><li v-for="p in (result ? result.pipeline : [])" :key="p">{{ p }}</li></ul>
        <div class="hint" v-if="!result">点击「生成教案」后展示流水线各步</div>
      </div>
      <div class="card">
        <div class="card-title">教案初稿</div>
        <div class="code-block" v-if="result">{{ result.text }}</div>
        <div class="empty" v-else>{{ busy ? '生成中…' : '等待生成' }}</div>
      </div>
    </div>
  </div>`
};
const LessonPyView = { ...LessonGenBase, data() { return { ...LessonGenBase.data(), mode: "python" }; } };
const LessonLgView = { ...LessonGenBase, data() { return { ...LessonGenBase.data(), mode: "langgraph" }; } };

/* ═══ 17. 网关管理 ═══ */
const GatewayView = {
  data() { return { gw: null, err: null }; },
  async mounted() {
    try { this.gw = await API.get("/api/gateway/info"); }
    catch (e) { this.err = e.message; }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">网关管理</div>
      <div class="page-desc">统一 AI 出口监控：路由表 / QPM / 延迟 · 网关离线时批改自动降级为规则引擎</div>
    </div>
    <div class="empty" v-if="err" style="padding:40px">网关不可达：{{ err }}（agent-gateway 127.0.0.1:10050 未启动，批改将降级为规则引擎模式）</div>
    <template v-else-if="gw">
      <div class="grid grid-4">
        <div class="kpi"><div class="kpi-label">状态</div><div class="kpi-val"><span class="badge green">在线</span></div><div class="kpi-sub">{{ gw.url }}</div></div>
        <div class="kpi"><div class="kpi-label">QPM 用量</div><div class="kpi-val">{{ gw.qpm.used }}</div><div class="kpi-sub">上限 {{ gw.qpm.limit }}</div></div>
        <div class="kpi"><div class="kpi-label">P95 延迟</div><div class="kpi-val">{{ gw.latency.p95 }}</div><div class="kpi-sub">ms</div></div>
        <div class="kpi"><div class="kpi-label">可用性</div><div class="kpi-val">{{ gw.uptime }}</div><div class="kpi-sub">近 30 天</div></div>
      </div>
      <div class="card">
        <div class="card-title">路由表</div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>路径</th><th>说明</th><th>健康</th></tr>
          <tr v-for="r in gw.routes" :key="r.path">
            <td class="code-block" style="display:inline-block;padding:2px 8px">{{ r.path }}</td>
            <td>{{ r.desc }}</td>
            <td><span class="badge" :class="r.ok ? 'green' : 'red'">{{ r.ok ? '正常' : '异常' }}</span></td>
          </tr>
        </table></div>
        <div class="hint" style="margin-top:8px">原则：本平台不新建 AI 通道，全部复用 agent-gateway</div>
      </div>
    </template>
  </div>`
};

/* ═══ 注册 + 挂载 ═══ */
app.config.globalProperties.badgeCls = badgeCls;
app.config.globalProperties.TREND_TXT = TREND_TXT;
app.component("dashboard-view", DashboardView);
app.component("classes-view", ClassesView);
app.component("resources-view", ResourcesView);
app.component("profiles-view", ProfilesView);
app.component("assign-view", AssignView);
app.component("grading-view", GradingView);
app.component("review-view", ReviewView);
app.component("mistakes-view", MistakesView);
app.component("report-view", ReportView);
app.component("learning-view", LearningView);
app.component("quality-view", QualityView);
app.component("ai-chat-view", AiChatView);
app.component("qa-view", QaView);
app.component("meeting-view", MeetingView);
app.component("lesson-py-view", LessonPyView);
app.component("lesson-lg-view", LessonLgView);
app.component("gateway-view", GatewayView);

app.mount("#app");
