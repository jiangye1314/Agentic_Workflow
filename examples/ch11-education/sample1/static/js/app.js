/**
 * 牧童中学智慧教学平台 · Vue3 前端入口
 * 顶部 Header + 左侧控制台菜单 + 内容区 + 右侧"背后逻辑"面板
 * 浅色主题（Light Theme）· 学校风格（深蓝 #1a4b8c）
 */

/* ═══ 模式开关：true=mock 内存后端，false=真实 Flask 后端 ═══ */
const USE_MOCK = false;

/* ═══ API 层：mock 与真实后端同一套方法签名 ═══ */
const API = {
  async _fetch(method, url, body, isForm) {
    const opt = { method, headers: {} };
    if (body && !isForm) {
      opt.headers["Content-Type"] = "application/json";
      opt.body = JSON.stringify(body);
    }
    if (body && isForm) opt.body = body;
    const r = await fetch(url, opt);
    const ct = r.headers.get("content-type") || "";
    const data = ct.includes("json") ? await r.json() : await r.text();
    if (!r.ok) throw new Error((data && data.error) || "HTTP " + r.status);
    return data;
  },
  get(url) {
    if (!USE_MOCK) return API._fetch("GET", url);
    return MockBackend.get(url);
  },
  post(url, body) {
    if (!USE_MOCK) return API._fetch("POST", url, body);
    return MockBackend.post(url, body);
  },
  put(url, body) {
    if (!USE_MOCK) return API._fetch("PUT", url, body);
    return MockBackend.put(url, body);
  },
  del(url) {
    if (!USE_MOCK) return API._fetch("DELETE", url);
    return MockBackend.del(url);
  },
  upload(url, fd) {
    if (!USE_MOCK) return API._fetch("POST", url, fd, true);
    return MockBackend.upload(url, fd);
  }
};

/* ═══ Mock 后端：模拟 Flask 接口（与 app.py 同一套端点） ═══ */
const MockBackend = (() => {
  let classes = JSON.parse(JSON.stringify(MOCK_CLASSES || []));
  let students = JSON.parse(JSON.stringify(MOCK_STUDENTS || []));
  let assignments = JSON.parse(JSON.stringify(MOCK_ASSIGNMENTS || []));
  let submissions = JSON.parse(JSON.stringify(MOCK_SUBMISSIONS || []));
  let reviews = JSON.parse(JSON.stringify(MOCK_REVIEWS || []));
  let mistakes = JSON.parse(JSON.stringify(MOCK_MISTAKES || []));
  let resources = JSON.parse(JSON.stringify(MOCK_RESOURCES || []));

  const delay = (data, ms = 120) => new Promise(res => setTimeout(() => res(data), ms));
  const clone = o => JSON.parse(JSON.stringify(o));
  const nextId = (list, prefix) => {
    let max = 0;
    list.forEach(it => {
      const tail = it.id.slice(prefix.length);
      if (it.id.startsWith(prefix) && /^\d+$/.test(tail)) max = Math.max(max, +tail);
    });
    return prefix + String(max + 1).padStart(3, "0");
  };

  const overview = () => {
    const pending = reviews.filter(r => r.status === "pending").length;
    const graded = submissions.filter(s => s.status !== "submitted").length;
    return {
      school: "牧童中学",
      classes: classes.length,
      students: students.length,
      assignments_active: assignments.filter(a => a.status === "进行中").length,
      submissions_today: 46,
      graded: graded,
      pending_review: pending,
      avg_score: 82.5,
      ai_accuracy: 94.2,
      gateway: "agent-gateway · 127.0.0.1:10050"
    };
  };

  return {
    get(url) {
      if (url === "/api/stats/overview") return delay(overview());
      if (url === "/api/classes") return delay(clone(classes));
      if (url.startsWith("/api/students")) return delay(clone(students));
      if (url === "/api/resources") return delay(clone(resources));
      if (url === "/api/assignments") return delay(clone(assignments));
      if (url === "/api/submissions") return delay(clone(submissions));
      if (url === "/api/reviews") return delay(clone(reviews));
      if (url === "/api/mistakes") return delay(clone(mistakes));
      if (url === "/api/quality") {
        return delay({
          total_checked: 128,
          deviation_over5: 3,
          sample_rate: 0.10,
          accuracy: 97.7,
          recent: [
            { id: "QC-001", assignment: "二次函数单元测", teacher: "李敏", checked: 20, deviation: 1.2, result: "通过", ts: "09-19 16:30" },
            { id: "QC-002", assignment: "文言文阅读练习", teacher: "王芳", checked: 16, deviation: 6.8, result: "超标", ts: "09-19 15:10" },
            { id: "QC-003", assignment: "英语完形填空", teacher: "陈刚", checked: 12, deviation: 0.9, result: "通过", ts: "09-18 17:45" }
          ]
        });
      }
      if (url === "/api/learning") {
        return delay({
          knowledge: [
            { name: "一元二次方程", mastery: 78, trend: "up" },
            { name: "二次函数图像", mastery: 62, trend: "down" },
            { name: "韦达定理", mastery: 71, trend: "up" },
            { name: "圆的方程", mastery: 85, trend: "flat" },
            { name: "三角函数", mastery: 66, trend: "up" }
          ],
          weak_students: [
            { name: "张一凡", class_name: "初三(1)班", weak: "二次函数图像", score: 58 },
            { name: "刘雨桐", class_name: "初三(2)班", weak: "英语时态", score: 63 },
            { name: "赵子轩", class_name: "初三(3)班", weak: "文言实词", score: 61 }
          ],
          trend: [72, 74, 73, 76, 78, 80]
        });
      }
      if (url === "/api/gateway/info") return delay(clone(MOCK_GATEWAY));
      return delay({ error: "mock 未实现: " + url }, 0);
    },
    post(url, body) {
      if (url === "/api/assignments") {
        const item = { ...body, id: nextId(assignments, "A"), created_at: new Date().toISOString().slice(0, 10), status: "进行中", submissions: 0 };
        assignments.unshift(item);
        return delay({ ok: true, item });
      }
      if (url === "/api/submissions") {
        const item = { ...body, id: nextId(submissions, "S"), submitted_at: new Date().toISOString().slice(0, 16).replace("T", " "), status: "submitted" };
        submissions.unshift(item);
        return delay({ ok: true, item });
      }
      if (url.startsWith("/api/grade")) {
        const gid = body.submission_id || "S001";
        const result = window.mockGrade ? window.mockGrade(body, gid) : { id: "G-" + gid, status: "pending_review", confidence: 0.5 };
        const sub = submissions.find(s => s.id === gid);
        if (sub) { sub.status = result.status; sub.grade = result; }
        if (result.status === "pending_review") reviews.unshift(result);
        return delay(result, 600);
      }
      if (url === "/api/gateway/chat") return delay({ mock: true, reply: "当前为 Mock 模式应答；USE_MOCK=false 后经 agent-gateway（127.0.0.1:10050）路由到真实 LLM。" }, 500);
      return delay({ error: "mock 未实现: " + url }, 0);
    },
    put(url, body) {
      const m = url.match(/^\/api\/reviews\/(\w+)$/);
      if (m) {
        const rv = reviews.find(r => r.id === m[1]);
        if (rv) { rv.status = "confirmed"; rv.confirmed_at = new Date().toISOString().slice(0, 16).replace("T", " "); rv.teacher_adjust = body; }
        return delay({ ok: true });
      }
      return delay({ error: "mock 未实现: " + url }, 0);
    },
    del(url) {
      return delay({ error: "mock 未实现: " + url }, 0);
    },
    upload(url, fd) {
      return delay({ ok: true, file: "(mock 本地预览)" }, 200);
    }
  };
})();


/* ═══ 工具函数 ═══ */
const fmtMoney = n => "¥" + Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2 });
const fmtWan = n => {
  const v = Number(n) / 10000;
  return v >= 100 ? (v / 10000).toFixed(2) + " 亿" : v.toFixed(2) + " 万";
};
const nowStr = () => {
  const d = new Date();
  const p = x => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/* ═══ 图标库（线性 SVG，单色）════ */
const Icons = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/></svg>',
  tower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M8.5 6h7M9.5 6v3M14.5 6v3M10.5 9h3M12 9v8M8 21h8M8 21v-2M16 21v-2M10 17h4"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.4L3 17.4V21h3.6l5.7-5.7a4.5 4.5 0 0 0 5.4-6l-3 3-2.4-.6-.6-2.4 3-3z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg>',
  gateway: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M6.5 6.5l3 3M17.5 6.5l-3 3M6.5 17.5l3-3M17.5 17.5l-3-3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 5-7"/></svg>',
  wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l4.5-4.5"/><path d="M16 12a4 4 0 1 1-4-4"/><circle cx="12" cy="12" r="1.5"/></svg>',
  sat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="9" width="8" height="8" rx="1.5"/><path d="M8 12H4M16 12h4M12 9V5"/><path d="M3 5l2 2M21 5l-2 2"/></svg>',
  spectrum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20v-8M9 20V6M14 20v-11M19 20V9"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V5l5-2v18M10 21V7l4-1v15M14 21V9l5-1v13"/></svg>',
  consult: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="8" ry="4.5"/><path d="M6 16.5v3M12 16.5v3M18 16.5v3"/><circle cx="12" cy="7.5" r="1.4"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/></svg>'
};

/* ═══ Toast ═══ */
const toastBus = Vue.reactive({ list: [] });
let toastSeq = 0;
function toast(msg, type) {
  const id = ++toastSeq;
  toastBus.list.push({ id, msg, type: type || "info" });
  setTimeout(() => {
    const idx = toastBus.list.findIndex(t => t.id === id);
    if (idx >= 0) toastBus.list.splice(idx, 1);
  }, 3200);
}

/* ═══ 跨视图共享状态（如从套餐数据跳转订购并预选产品）════ */
const AppStore = Vue.reactive({ pendingProductId: "" });

/* ═══ 根组件 ═══ */
const AppRoot = {
  template: `
    <div class="layout-root">
      <div class="header">
        <div class="brand-badge">QH</div>
        <div>
          <div class="header-title">牧童中学智慧教学平台</div>
          <div class="header-sub">作业布置 · AI 批改 · 人工复核 · 错题归因 · 学情分析 · 统一 AI Gateway</div>
        </div>
        <div class="header-spacer"></div>
        <div class="header-right">
          <span class="chip"><span class="dot"></span>Gateway: agent-gateway · 10050</span>
          <span class="chip" v-if="USE_MOCK"><span class="dot warn"></span>原型模式 · Mock 数据</span>
          <span class="header-clock">{{ clock }}</span>
        </div>
      </div>
      <div class="layout">
        <div class="sidebar">
          <div class="menu-group">教学总览</div>
          <div class="menu-item" :class="{active: view==='dashboard'}" @click="go('dashboard')">
            <span v-html="Icons.overview"></span>教学驾驶舱
          </div>
          <div class="menu-group">教务管理</div>
          <div class="menu-item" :class="{active: view==='classes'}" @click="go('classes')">
            <span v-html="Icons.users"></span>班级管理<span class="tag">核心</span>
          </div>
          <div class="menu-item" :class="{active: view==='resources'}" @click="go('resources')">
            <span v-html="Icons.file"></span>课程资源库
          </div>
          <div class="menu-item" :class="{active: view==='profiles'}" @click="go('profiles')">
            <span v-html="Icons.user"></span>学生学籍档案
          </div>
          <div class="menu-group">作业与批改</div>
          <div class="menu-item" :class="{active: view==='assign'}" @click="go('assign')">
            <span v-html="Icons.plan"></span>作业布置
          </div>
          <div class="menu-item" :class="{active: view==='grading'}" @click="go('grading')">
            <span v-html="Icons.check"></span>AI 智能批改<span class="tag">AI</span>
          </div>
          <div class="menu-item" :class="{active: view==='review'}" @click="go('review')">
            <span v-html="Icons.shield"></span>人工复核队列<span class="tag">HITL</span>
          </div>
          <div class="menu-item" :class="{active: view==='mistakes'}" @click="go('mistakes')">
            <span v-html="Icons.edit"></span>错题本
          </div>
          <div class="menu-item" :class="{active: view==='report'}" @click="go('report')">
            <span v-html="Icons.chart"></span>作业分析报告
          </div>
          <div class="menu-group">数据与质量</div>
          <div class="menu-item" :class="{active: view==='learning'}" @click="go('learning')">
            <span v-html="Icons.chart"></span>学情数据分析<span class="tag">AI 归因</span>
          </div>
          <div class="menu-item" :class="{active: view==='quality'}" @click="go('quality')">
            <span v-html="Icons.shield"></span>批改质检中心<span class="tag">硬校验</span>
          </div>
          <div class="menu-group">AI 能力</div>
          <div class="menu-item" :class="{active: view==='ai'}" @click="go('ai')">
            <span v-html="Icons.chat"></span>AI 助教
          </div>
          <div class="menu-item" :class="{active: view==='qa'}" @click="go('qa')">
            <span v-html="Icons.search"></span>智能问答<span class="tag">RAG</span>
          </div>
          <div class="menu-item" :class="{active: view==='meeting'}" @click="go('meeting')">
            <span v-html="Icons.wave"></span>教研会议纪要<span class="tag">ASR</span>
          </div>
          <div class="menu-item" :class="{active: view==='lessonpy'}" @click="go('lessonpy')">
            <span v-html="Icons.consult"></span>教案生成<span class="tag">Python</span>
          </div>
          <div class="menu-item" :class="{active: view==='lessonlg'}" @click="go('lessonlg')">
            <span v-html="Icons.consult"></span>教案生成<span class="tag">LangGraph</span>
          </div>
          <div class="menu-item" :class="{active: view==='gateway'}" @click="go('gateway')">
            <span v-html="Icons.gateway"></span>网关管理
          </div>
          <div class="sidebar-foot">
            前端 Vue3（本地化）· 后端 Flask + JSON<br>
            AI Gateway 复用 agent-gateway<br>
            <span style="font-family:var(--mono)">127.0.0.1:10050（不改动）</span>
          </div>
        </div>
        <div class="main">
          <keep-alive>
            <component :is="currentView" @navigate="go"></component>
          </keep-alive>
        </div>
        <div class="right-panel" :class="{ collapsed: rpCollapsed }"
             :style="{ width: (rpCollapsed ? 36 : rpWidth) + 'px' }">
          <div class="rp-resizer" @mousedown.prevent="startResize" title="拖拽调整宽度"></div>
          <div class="rp-collapsed-bar" @click="rpCollapsed = false" title="展开侧边栏">
            <div class="rp-badge">&gt;_</div>
            <div class="rp-v-title">背后逻辑</div>
            <div class="rp-v-open">‹</div>
          </div>
          <div class="rp-head">
            <div class="rp-badge">&gt;_</div>
            <div>
              <div class="rp-title">背后逻辑</div>
              <div class="rp-sub">{{ insights.name }}</div>
            </div>
            <button class="rp-collapse-btn" @click="rpCollapsed = true" title="折叠侧边栏">›</button>
          </div>
          <div class="rp-intro">{{ insights.intro }}</div>
          <div class="rp-body">
            <div class="rp-section" v-for="(s, i) in insights.sections" :key="i">
              <div class="rp-tag" :class="s.tagCls">{{ s.tag }}</div>
              <div class="rp-sec-title">{{ s.title }}</div>
              <div class="rp-text" v-if="s.body">{{ s.body }}</div>
              <ul class="rp-points" v-if="s.points">
                <li v-for="(p, j) in s.points" :key="j">{{ p }}</li>
              </ul>
              <pre class="rp-code" v-if="s.code">{{ s.code }}</pre>
            </div>
            <div class="rp-foot">内容随菜单切换 · 模块持续细化</div>
          </div>
        </div>
      </div>
      <div class="toast-wrap">
        <div v-for="t in toastBus.list" :key="t.id" class="toast" :class="{ok: t.type==='ok', err: t.type==='err'}">{{ t.msg }}</div>
      </div>
    </div>`,
  setup() {
    const view = Vue.ref("dashboard");
    const clock = Vue.ref(nowStr());
    const timer = setInterval(() => { clock.value = nowStr(); }, 1000);
    Vue.onUnmounted(() => clearInterval(timer));
    const go = v => { view.value = v; };
    const currentView = Vue.computed(() => {
      const map = {
        dashboard: "dashboard-view",
        classes: "classes-view",
        resources: "resources-view",
        profiles: "profiles-view",
        assign: "assign-view",
        grading: "grading-view",
        review: "review-view",
        mistakes: "mistakes-view",
        report: "report-view",
        learning: "learning-view",
        quality: "quality-view",
        lessonpy: "lesson-py-view",
        lessonlg: "lesson-lg-view",
        ai: "ai-chat-view",
        qa: "qa-view",
        meeting: "meeting-view",
        gateway: "gateway-view"
      };
      return map[view.value] || "dashboard-view";
    });
    const insights = Vue.computed(() => INSIGHTS[view.value] || INSIGHTS.dashboard);

    // ── 右侧侧边栏：折叠 + 拖拽调宽（localStorage 持久化）──
    const rpCollapsed = Vue.ref(false);
    const rpWidth = Vue.ref(parseInt(localStorage.getItem("edu-rp-width") || "304", 10) || 304);
    function startResize(e) {
      if (rpCollapsed.value) return;
      const startX = e.clientX;
      const startW = rpWidth.value;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const move = ev => {
        rpWidth.value = Math.min(640, Math.max(220, startW + (startX - ev.clientX)));
      };
      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("fund-rp-width", String(rpWidth.value));
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    }

    return { view, clock, go, currentView, insights, Icons, toastBus, USE_MOCK,
             rpCollapsed, rpWidth, startResize };
  }
};

const app = Vue.createApp(AppRoot);
