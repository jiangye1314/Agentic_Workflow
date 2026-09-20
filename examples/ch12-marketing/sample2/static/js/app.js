/**
 * 牧童商城 · 电商智慧运营平台 · Vue3 前端入口
 * 顶部 Header + 左侧控制台菜单 + 内容区 + 右侧"背后逻辑"面板
 * 浅色主题（Light Theme）· 电商风格（橙 #e05c1a）
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
  let products = JSON.parse(JSON.stringify(MOCK_PRODUCTS || []));
  let categories = JSON.parse(JSON.stringify(MOCK_CATEGORIES || []));
  let orders = JSON.parse(JSON.stringify(MOCK_ORDERS || []));
  let recReviews = JSON.parse(JSON.stringify(MOCK_REC_REVIEWS || []));
  let portraits = JSON.parse(JSON.stringify(MOCK_PORTRAITS || []));
  let payments = JSON.parse(JSON.stringify(MOCK_PAYMENTS || []));
  let aftersales = JSON.parse(JSON.stringify(MOCK_AFTERSALES || []));
  let campaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS || []));
  let pricings = JSON.parse(JSON.stringify(MOCK_PRICINGS || []));

  const delay = (data, ms = 120) => new Promise(res => setTimeout(() => res(data), ms));
  const clone = o => JSON.parse(JSON.stringify(o));

  const overview = () => {
    const pending = recReviews.filter(r => r.status === "pending_review").length;
    return {
      mall: "牧童商城",
      gmv_today: 4862300,
      orders_today: 3821,
      conv_rate: 3.42,
      avg_order: 1272.5,
      uv_today: 111725,
      refund_rate: 1.8,
      products_on_sale: products.filter(p => p.status === "在售").length,
      rec_ctr: 12.6,
      pending_review: pending,
      gateway: "agent-gateway · 127.0.0.1:10050"
    };
  };

  return {
    get(url) {
      if (url === "/api/stats/overview") return delay(overview());
      if (url === "/api/products") return delay(clone(products));
      if (url === "/api/categories") return delay(clone(categories));
      if (url === "/api/inventory") return delay(clone(products.filter(p => p.stock <= p.alert_line)));
      if (url === "/api/orders") return delay(clone(orders));
      if (url === "/api/payment") return delay(clone(payments));
      if (url === "/api/aftersale") return delay(clone(aftersales));
      if (url === "/api/campaign") return delay(clone(campaigns));
      if (url === "/api/pricing") return delay(clone(pricings));
      if (url === "/api/realtime") {
        return delay([
          { ts: "07:30:12", user: "林*", item: "无线降噪耳机 Pro", amount: 899 },
          { ts: "07:29:55", user: "陈*", item: "便携榨汁杯", amount: 129 },
          { ts: "07:29:31", user: "赵*", item: "智能手环 6 代", amount: 249 },
          { ts: "07:28:47", user: "王*", item: "机械键盘 87 键", amount: 399 },
          { ts: "07:28:02", user: "孙*", item: "家居香薰套装", amount: 168 }
        ]);
      }
      if (url === "/api/recommend/reviews") return delay(clone(recReviews));
      if (url.startsWith("/api/portrait")) return delay(clone(portraits));
      if (url === "/api/funnel") {
        return delay({
          stages: [
            { name: "曝光", value: 486200, rate: 100 },
            { name: "点击", value: 61261, rate: 12.6 },
            { name: "加购", value: 18378, rate: 3.78 },
            { name: "下单", value: 11090, rate: 2.28 },
            { name: "支付", value: 9354, rate: 1.92 }
          ]
        });
      }
      if (url === "/api/abtest") {
        return delay({
          experiments: [
            { id: "AB-01", name: "首页推荐位样式 A/B", status: "进行中", a: { name: "A 双列瀑布流", ctr: 11.2, cvr: 2.1 }, b: { name: "B 单列大图", ctr: 14.8, cvr: 2.9 }, winner: "B", confidence: 0.96 },
            { id: "AB-02", name: "加购按钮文案", status: "进行中", a: { name: "A 加入购物车", ctr: 9.4, cvr: 2.2 }, b: { name: "B 立即购买", ctr: 9.1, cvr: 2.4 }, winner: null, confidence: 0.71 },
            { id: "AB-03", name: "新人优惠券面额", status: "已结束", a: { name: "A 满 199-20", ctr: 10.1, cvr: 1.8 }, b: { name: "B 无门槛 15 元", ctr: 12.9, cvr: 2.6 }, winner: "B", confidence: 0.99 }
          ]
        });
      }
      if (url === "/api/sales") {
        return delay({
          trend: [312, 356, 341, 402, 438, 417, 486, 523, 498, 562, 601, 634],
          category_share: [
            { name: "数码家电", value: 34.2 },
            { name: "服饰鞋包", value: 26.8 },
            { name: "美妆个护", value: 15.4 },
            { name: "食品生鲜", value: 12.1 },
            { name: "家居生活", value: 11.5 }
          ]
        });
      }
      if (url === "/api/gateway/info") return delay(clone(MOCK_GATEWAY));
      return delay({ error: "mock 未实现: " + url }, 0);
    },
    post(url, body) {
      if (url === "/api/recommend") {
        const result = window.mockRecommend ? window.mockRecommend(body || {}) : { status: "pending_review", confidence: 0.5 };
        if (result.status === "pending_review") recReviews.unshift(result);
        return delay(result, 600);
      }
      if (url === "/api/gateway/chat") return delay({ mock: true, reply: "当前为 Mock 模式应答；USE_MOCK=false 后经 agent-gateway（127.0.0.1:10050）路由到真实 LLM。" }, 500);
      if (url === "/api/pricing") {
        // 定价：成本 * 1.2 是毛利底线（确定性规则），建议价区间为演示伪 AI 输出
        const b = body || {};
        const cost = Number(b.cost) || 0;
        if (!cost || !b.product_id) return delay({ error: "缺少商品或成本" }, 0);
        const p = products.find(x => x.id === b.product_id);
        if (!p) return delay({ error: "商品不存在" }, 0);
        const floor = cost * 1.2;
        if (floor > p.price) return delay({ rejected: true, floor: Math.round(floor), reason: "成本价 1.2 倍（毛利底线）高于现价，拒绝生成建议" }, 400);
        const rec = {
          id: "PR-" + Date.now(),
          product_id: p.id, product_name: p.name, cost,
          suggest_min: Math.round(cost * 1.35), suggest_max: Math.round(cost * 1.55),
          margin: ((cost * 1.35 - cost) / (cost * 1.35) * 100).toFixed(1) + "%",
          status: "已生成", created_at: nowStr()
        };
        pricings.unshift(rec);
        return delay(rec, 800);
      }
      return delay({ error: "mock 未实现: " + url }, 0);
    },
    put(url, body) {
      const m = url.match(/^\/api\/recommend\/reviews\/(\w+)$/);
      if (m) {
        const rv = recReviews.find(r => r.id === m[1]);
        if (rv) { rv.status = "confirmed"; rv.adjust = body.adjustments; rv.confirmed_by = body.confirmed_by || "运营"; }
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
        <div class="brand-badge">MT</div>
        <div>
          <div class="header-title">牧童商城 · 电商智慧运营平台</div>
          <div class="header-sub">电商 BI 大屏 · 商品运营 · 智能推荐 · 订单交易 · 用户画像 · 统一 AI Gateway</div>
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
          <div class="menu-group">数据大屏</div>
          <div class="menu-item" :class="{active: view==='dashboard'}" @click="go('dashboard')">
            <span v-html="Icons.overview"></span>电商 BI 大屏<span class="tag">核心</span>
          </div>
          <div class="menu-item" :class="{active: view==='realtime'}" @click="go('realtime')">
            <span v-html="Icons.wave"></span>实时销售监控
          </div>
          <div class="menu-group">商品管理</div>
          <div class="menu-item" :class="{active: view==='products'}" @click="go('products')">
            <span v-html="Icons.list"></span>商品管理
          </div>
          <div class="menu-item" :class="{active: view==='categories'}" @click="go('categories')">
            <span v-html="Icons.building"></span>分类管理
          </div>
          <div class="menu-item" :class="{active: view==='inventory'}" @click="go('inventory')">
            <span v-html="Icons.spectrum"></span>库存预警
          </div>
          <div class="menu-group">交易管理</div>
          <div class="menu-item" :class="{active: view==='orders'}" @click="go('orders')">
            <span v-html="Icons.plan"></span>订单管理
          </div>
          <div class="menu-item" :class="{active: view==='payment'}" @click="go('payment')">
            <span v-html="Icons.check"></span>支付对账
          </div>
          <div class="menu-item" :class="{active: view==='aftersale'}" @click="go('aftersale')">
            <span v-html="Icons.shield"></span>售后工单
          </div>
          <div class="menu-group">智能营销</div>
          <div class="menu-item" :class="{active: view==='recommend'}" @click="go('recommend')">
            <span v-html="Icons.sat"></span>智能推荐<span class="tag">AI</span>
          </div>
          <div class="menu-item" :class="{active: view==='portrait'}" @click="go('portrait')">
            <span v-html="Icons.user"></span>用户画像
          </div>
          <div class="menu-item" :class="{active: view==='service'}" @click="go('service')">
            <span v-html="Icons.chat"></span>智能客服
          </div>
          <div class="menu-item" :class="{active: view==='campaign'}" @click="go('campaign')">
            <span v-html="Icons.calendar"></span>营销活动
          </div>
          <div class="menu-group">数据与 AI</div>
          <div class="menu-item" :class="{active: view==='sales'}" @click="go('sales')">
            <span v-html="Icons.chart"></span>销售分析
          </div>
          <div class="menu-item" :class="{active: view==='funnel'}" @click="go('funnel')">
            <span v-html="Icons.spectrum"></span>转化漏斗
          </div>
          <div class="menu-item" :class="{active: view==='abtest'}" @click="go('abtest')">
            <span v-html="Icons.edit"></span>A/B 实验<span class="tag">HITL</span>
          </div>
          <div class="menu-item" :class="{active: view==='pricing'}" @click="go('pricing')">
            <span v-html="Icons.wrench"></span>定价助手
          </div>
          <div class="menu-item" :class="{active: view==='gateway'}" @click="go('gateway')">
            <span v-html="Icons.gateway"></span>AI 网关
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
        realtime: "realtime-view",
        products: "products-view",
        categories: "categories-view",
        inventory: "inventory-view",
        orders: "orders-view",
        payment: "payment-view",
        aftersale: "aftersale-view",
        recommend: "recommend-view",
        portrait: "portrait-view",
        service: "service-view",
        campaign: "campaign-view",
        sales: "sales-view",
        funnel: "funnel-view",
        abtest: "abtest-view",
        pricing: "pricing-view",
        gateway: "gateway-view"
      };
      return map[view.value] || "dashboard-view";
    });
    const insights = Vue.computed(() => INSIGHTS[view.value] || INSIGHTS.dashboard);

    // ── 右侧侧边栏：折叠 + 拖拽调宽（localStorage 持久化）──
    const rpCollapsed = Vue.ref(false);
    const rpWidth = Vue.ref(parseInt(localStorage.getItem("mall-rp-width") || "304", 10) || 304);
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
        localStorage.setItem("mall-rp-width", String(rpWidth.value));
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    }

    return { view, clock, go, currentView, insights, Icons, toastBus, USE_MOCK,
             rpCollapsed, rpWidth, startResize };
  }
};

const app = Vue.createApp(AppRoot);
