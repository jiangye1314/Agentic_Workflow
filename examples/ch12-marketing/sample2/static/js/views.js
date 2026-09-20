/**
 * 牧童商城 · 视图组件（17 个）
 * BI 大屏 / 实时监控 / 商品 / 分类 / 库存 / 订单 / 对账 / 售后 / 智能推荐(核心) / 画像 / 客服 / 活动 / 销售 / 漏斗 / AB / 定价 / 网关
 * 浅色主题 · 数据来自 Flask 后端（USE_MOCK=false）
 */

/* ═══ 状态徽章映射 ═══ */
const STATUS_MAP = {
  "已支付": "blue", "待支付": "orange", "已发货": "blue", "已完成": "green",
  "售后中": "orange", "已退款": "gray",
  "在售": "green", "已下架": "gray",
  "pending_review": "orange", "graded": "green", "confirmed": "green", "pending": "orange",
  "一致": "green", "长款": "red", "短款": "red", "金额不符": "red",
  "审核中": "orange", "退款中": "blue", "已驳回": "red",
  "进行中": "blue", "未开始": "gray", "已结束": "gray", "已生成": "green",
  "正常": "green", "异常": "red", "在线": "green"
};
const badgeCls = s => STATUS_MAP[s] || "gray";
/* 置信度徽章：≥0.8 绿 / ≥0.7 橙 / <0.7 红（分流阈值） */
const confCls = c => (c >= 0.8 ? "green" : c >= 0.7 ? "orange" : "red");

/* ═══ 1. 电商 BI 大屏 ═══ */
const DashboardView = {
  data() { return { stats: null, sales: null }; },
  async mounted() {
    const [a, b] = await Promise.all([API.get("/api/stats/overview"), API.get("/api/sales")]);
    this.stats = a;
    this.sales = b;
  },
  computed: {
    hours() { return ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]; },
    trendMax() { return this.sales ? Math.max(...this.sales.trend) : 1; },
    shareMax() { return this.sales ? Math.max(...this.sales.category_share.map(c => c.value)) : 1; }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">电商 BI 大屏</div>
      <div class="page-desc">运营驾驶舱：GMV、转化、客单价等北极星指标统一聚合 · 推荐闭环三层：确定性规则 + LLM 排序 + 人工审核（HITL）</div>
    </div>
    <div class="grid grid-4" v-if="stats">
      <div class="kpi"><div class="kpi-label">今日 GMV</div><div class="kpi-val">{{ (stats.gmv_today / 10000).toFixed(2) }} 万</div><div class="kpi-foot"><b class="up">↑ 12.4%</b> 较昨日</div></div>
      <div class="kpi"><div class="kpi-label">今日订单</div><div class="kpi-val">{{ stats.orders_today }}</div><div class="kpi-foot">单 · 已支付口径</div></div>
      <div class="kpi"><div class="kpi-label">转化率</div><div class="kpi-val">{{ stats.conv_rate }}%</div><div class="kpi-foot">下单 UV / 访问 UV</div></div>
      <div class="kpi"><div class="kpi-label">客单价</div><div class="kpi-val">{{ fmtMoney(stats.avg_order) }}</div><div class="kpi-foot">GMV / 订单数</div></div>
      <div class="kpi"><div class="kpi-label">今日 UV</div><div class="kpi-val">{{ stats.uv_today }}</div><div class="kpi-foot">去重访客</div></div>
      <div class="kpi"><div class="kpi-label">退款率</div><div class="kpi-val">{{ stats.refund_rate }}%</div><div class="kpi-foot">低于 3% 警戒线</div></div>
      <div class="kpi"><div class="kpi-label">推荐 CTR</div><div class="kpi-val">{{ stats.rec_ctr }}%</div><div class="kpi-foot">推荐位点击 / 曝光</div></div>
      <div class="kpi" style="cursor:pointer" @click="$emit('navigate','recommend')">
        <div class="kpi-label">待人工审核</div>
        <div class="kpi-val" style="color:var(--warn)">{{ stats.pending_review }}</div>
        <div class="kpi-foot">推荐置信度 &lt; 0.7</div>
      </div>
    </div>
    <div class="grid grid-2" style="margin-top:14px">
      <div class="card" v-if="sales">
        <div class="card-title">今日 GMV 趋势<span class="sub">按小时 · 万元</span></div>
        <div class="bar-chart">
          <div class="bar-col" v-for="(v, i) in sales.trend" :key="i">
            <div class="bar" :style="{ height: Math.max(3, Math.round(v / trendMax * 150)) + 'px' }" :title="hours[i] + ' · ' + v + ' 万'"></div>
            <div class="bar-label">{{ hours[i] }}</div>
          </div>
        </div>
      </div>
      <div class="card" v-if="sales">
        <div class="card-title">类目销售占比<span class="sub">今日 GMV 结构</span></div>
        <div class="hbar-row" v-for="c in sales.category_share" :key="c.name">
          <div class="hbar-name">{{ c.name }}</div>
          <div class="hbar-track"><div class="hbar-fill" :style="{ width: Math.round(c.value / shareMax * 100) + '%' }"></div></div>
          <div class="hbar-num">{{ c.value }}%</div>
        </div>
      </div>
    </div>
    <div class="grid grid-3" style="margin-top:14px" v-if="stats">
      <div class="card">
        <div class="card-title">推荐链路</div>
        <div class="detail-row"><span class="k">第 1 层</span><span class="v">规则召回：类目偏好 + 排除缺货</span><span class="badge green">确定性</span></div>
        <div class="detail-row"><span class="k">第 2 层</span><span class="v">LLM 排序 + 生成推荐理由</span><span class="badge blue">AI</span></div>
        <div class="detail-row"><span class="k">第 3 层</span><span class="v">置信度 &lt; 0.7 转人工审核</span><span class="badge orange">HITL</span></div>
        <div class="detail-row"><span class="k">AI 出口</span><span class="v">{{ stats.gateway }}</span></div>
      </div>
      <div class="card">
        <div class="card-title">核心业务规则</div>
        <ul class="rp-points">
          <li>推荐置信度只看 AI 排序层，规则层恒 1.0 不稀释</li>
          <li>库存 ≤ 预警线自动进库存预警列表</li>
          <li>定价底线：建议价 &lt; 成本 × 1.2 直接拒绝</li>
          <li>审核改判回流 few-shot 推荐库</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-title">快捷入口</div>
        <div class="btn primary" @click="$emit('navigate','recommend')">智能推荐</div>
        <div class="btn" style="margin-left:8px" @click="$emit('navigate','inventory')">库存预警</div>
        <div class="btn" style="margin-left:8px" @click="$emit('navigate','funnel')">转化漏斗</div>
      </div>
    </div>
  </div>`
};

/* ═══ 2. 实时销售监控 ═══ */
const RealtimeView = {
  data() { return { feed: [], auto: true, timer: null }; },
  async mounted() { await this.load(); },
  activated() {
    if (this.auto) this.startTimer();
  },
  deactivated() { this.stopTimer(); },
  methods: {
    async load() { this.feed = await API.get("/api/realtime"); },
    startTimer() {
      this.stopTimer();
      this.timer = setInterval(() => this.load(), 5000);
    },
    stopTimer() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
    toggleAuto() {
      this.auto = !this.auto;
      if (this.auto) this.startTimer(); else this.stopTimer();
    }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">实时销售监控</div>
      <div class="page-desc">订单流实时滚动 · 演示环境 5 秒轮询后端接口</div>
    </div>
    <div class="card">
      <div class="card-title">
        实时订单流
        <span class="spacer"></span>
        <span class="auth-switch"><input type="checkbox" :checked="auto" @change="toggleAuto"><span :class="{ok: auto}">自动刷新</span></span>
        <span class="btn sm" style="margin-left:10px" @click="load">刷新</span>
      </div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>时间</th><th>用户</th><th>商品</th><th>金额</th></tr>
        <tr v-for="(f, i) in feed" :key="i">
          <td class="mono">{{ f.ts }}</td>
          <td>{{ f.user }}</td>
          <td>{{ f.item }}</td>
          <td class="num">{{ fmtMoney(f.amount) }}</td>
        </tr>
      </table></div>
      <div class="hint" style="margin-top:10px">生产环境链路：订单系统 → 消息队列 → WebSocket 推送；告警规则：单品 5 分钟订单 &gt; 50 触发爆款提示、库存 &lt; 预警线自动进库存预警列表。</div>
    </div>
  </div>`
};

/* ═══ 3. 商品管理 ═══ */
const ProductsView = {
  data() { return { products: [], kw: "", cat: "全部" }; },
  async mounted() { this.products = await API.get("/api/products"); },
  computed: {
    cats() {
      const set = new Set(this.products.map(p => p.category));
      return ["全部", ...set];
    },
    filtered() {
      return this.products.filter(p =>
        (this.cat === "全部" || p.category === this.cat) &&
        (!this.kw || p.name.includes(this.kw) || p.id.includes(this.kw))
      );
    }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">商品管理</div>
      <div class="page-desc">商品是推荐与交易的基础数据 · 类目与标签决定规则召回范围</div>
    </div>
    <div class="card">
      <div class="card-title">
        <div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input v-model="kw" placeholder="搜索商品名 / 编号"></div>
        <select v-model="cat" style="width:150px;margin-left:10px" class="field">
          <option v-for="c in cats" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="sub" style="margin-left:10px">共 {{ filtered.length }} 件</span>
      </div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>编号</th><th>商品</th><th>类目</th><th>价格</th><th>库存</th><th>预警线</th><th>销量</th><th>评分</th><th>状态</th><th>标签</th></tr>
        <tr v-for="p in filtered" :key="p.id">
          <td class="mono">{{ p.id }}</td>
          <td><b>{{ p.name }}</b></td>
          <td>{{ p.category }}</td>
          <td class="num">{{ fmtMoney(p.price) }}</td>
          <td class="num" :style="p.stock <= p.alert_line ? 'color:var(--warn);font-weight:600' : ''">{{ p.stock }}</td>
          <td class="num">{{ p.alert_line }}</td>
          <td class="num">{{ p.sales }}</td>
          <td class="num">{{ p.rating }}</td>
          <td><span class="badge" :class="badgeCls(p.status)">{{ p.status }}</span></td>
          <td><span class="tag-list"><span class="tag" v-for="t in p.tags" :key="t">{{ t }}</span></span></td>
        </tr>
      </table></div>
    </div>
  </div>`
};

/* ═══ 4. 分类管理 ═══ */
const CategoriesView = {
  data() { return { categories: [] }; },
  async mounted() { this.categories = await API.get("/api/categories"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">分类管理</div>
      <div class="page-desc">类目是推荐召回的硬约束：用户偏好类目直接决定召回池</div>
    </div>
    <div class="prod-grid">
      <div class="prod-card" v-for="c in categories" :key="c.id">
        <div class="prod-top">
          <span class="prod-type">{{ c.id }}</span>
          <span class="prod-cat">L{{ c.level }} 类目</span>
        </div>
        <div class="prod-name">{{ c.name }}</div>
        <div class="prod-meta"><span>在售商品 <b>{{ c.products }}</b> 件</span></div>
        <div class="prod-foot">
          <span class="tag-list"><span class="tag">规则召回候选池</span></span>
        </div>
      </div>
    </div>
    <div class="hint" style="margin-top:14px">类目归属错误 → 推荐不相关；类目过粗 → 召回噪声大。生产环境使用三级类目树（一级行业 / 二级品类 / 三级属性）。</div>
  </div>`
};

/* ═══ 5. 库存预警 ═══ */
const InventoryView = {
  data() { return { items: [] }; },
  async mounted() { this.items = await API.get("/api/inventory"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">库存预警</div>
      <div class="page-desc">当前库存 ≤ 预警线自动进入列表 · 缺货商品被推荐引擎自动排除</div>
    </div>
    <div class="card">
      <div class="card-title">预警商品（{{ items.length }}）</div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>编号</th><th>商品</th><th>当前库存</th><th>预警线</th><th>缺口率</th><th>状态</th><th></th></tr>
        <tr v-for="p in items" :key="p.id">
          <td class="mono">{{ p.id }}</td>
          <td><b>{{ p.name }}</b></td>
          <td class="num" style="color:var(--danger);font-weight:600">{{ p.stock }}</td>
          <td class="num">{{ p.alert_line }}</td>
          <td class="num">{{ Math.round((p.alert_line - p.stock) / p.alert_line * 100) }}%</td>
          <td><span class="badge orange">{{ p.stock === 0 ? '缺货' : '低库存' }}</span></td>
          <td><span class="btn sm" @click="$emit('navigate','products')">去补货</span></td>
        </tr>
      </table></div>
      <div class="hint" style="margin-top:10px">与推荐联动：stock = 0 的商品不进入召回；低库存商品在排序中降权，避免「推荐了买不到」的体验损伤。</div>
    </div>
  </div>`
};

/* ═══ 6. 订单管理 ═══ */
const OrdersView = {
  data() { return { orders: [], tab: "全部" }; },
  async mounted() { this.orders = await API.get("/api/orders"); },
  computed: {
    tabs() { return ["全部", "待支付", "已支付", "已发货", "已完成", "售后中", "已退款"]; },
    filtered() { return this.tab === "全部" ? this.orders : this.orders.filter(o => o.status === this.tab); }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">订单管理</div>
      <div class="page-desc">订单全生命周期：待支付 → 已支付 → 已发货 → 已完成（含售后分支）</div>
    </div>
    <div class="tabs">
      <div class="tab" v-for="t in tabs" :key="t" :class="{active: tab===t}" @click="tab=t">{{ t }}</div>
    </div>
    <div class="card">
      <div class="table-wrap"><table class="tbl">
        <tr><th>订单号</th><th>用户</th><th>金额</th><th>件数</th><th>下单时间</th><th>状态</th></tr>
        <tr v-for="o in filtered" :key="o.id">
          <td class="mono">{{ o.id }}</td>
          <td>{{ o.user }}</td>
          <td class="num">{{ fmtMoney(o.amount) }}</td>
          <td class="num">{{ o.items }}</td>
          <td class="mono">{{ o.created_at }}</td>
          <td><span class="badge" :class="badgeCls(o.status)">{{ o.status }}</span></td>
        </tr>
      </table></div>
    </div>
  </div>`
};

/* ═══ 7. 支付对账 ═══ */
const PaymentView = {
  data() { return { rows: [] }; },
  async mounted() { this.rows = await API.get("/api/payment"); },
  computed: {
    diffCount() { return this.rows.filter(r => r.status !== "一致").length; }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">支付对账</div>
      <div class="page-desc">渠道账单与内部订单流水逐笔比对 · 资金类功能确定性规则实现</div>
    </div>
    <div class="grid grid-3" v-if="rows.length">
      <div class="kpi"><div class="kpi-label">今日流水</div><div class="kpi-val">{{ rows.length }}</div><div class="kpi-foot">笔</div></div>
      <div class="kpi"><div class="kpi-label">一致</div><div class="kpi-val">{{ rows.length - diffCount }}</div><div class="kpi-foot">笔</div></div>
      <div class="kpi"><div class="kpi-label">差异</div><div class="kpi-val" style="color:var(--danger)">{{ diffCount }}</div><div class="kpi-foot">需人工处理</div></div>
    </div>
    <div class="card">
      <div class="card-title">对账明细</div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>流水号</th><th>渠道金额</th><th>内部订单</th><th>状态</th><th>备注</th></tr>
        <tr v-for="r in rows" :key="r.id">
          <td class="mono">{{ r.channel_no }}</td>
          <td class="num">{{ fmtMoney(r.amount) }}</td>
          <td class="mono">{{ r.inner_order }}</td>
          <td><span class="badge" :class="badgeCls(r.status)">{{ r.status }}</span></td>
          <td style="color:var(--muted)">{{ r.note || '—' }}</td>
        </tr>
      </table></div>
      <div class="hint" style="margin-top:10px">差异类型：长款 = 渠道有 / 内部无；短款 = 内部有 / 渠道无；金额不符 = 双有但金额不一致。AI 只做差异归因建议，退款与调整必须人工确认。</div>
    </div>
  </div>`
};

/* ═══ 8. 售后工单 ═══ */
const AftersaleView = {
  data() { return { list: [] }; },
  async mounted() { this.list = await API.get("/api/aftersale"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">售后工单</div>
      <div class="page-desc">退款退货工单处理 · 售后数据是商品质量负反馈信号</div>
    </div>
    <div class="card">
      <div class="table-wrap"><table class="tbl">
        <tr><th>工单号</th><th>关联订单</th><th>用户</th><th>商品</th><th>类型</th><th>原因</th><th>状态</th><th>申请时间</th></tr>
        <tr v-for="a in list" :key="a.id">
          <td class="mono">{{ a.id }}</td>
          <td class="mono">{{ a.order_id }}</td>
          <td>{{ a.user }}</td>
          <td>{{ a.product }}</td>
          <td><span class="tag">{{ a.type }}</span></td>
          <td style="color:var(--muted)">{{ a.reason }}</td>
          <td><span class="badge" :class="badgeCls(a.status)">{{ a.status }}</span></td>
          <td class="mono">{{ a.created_at }}</td>
        </tr>
      </table></div>
      <div class="hint" style="margin-top:10px">售后反哺推荐：退货率 &gt; 10% 的商品在推荐排序中降权；质量类售后词频用于品类问题预警。</div>
    </div>
  </div>`
};

/* ═══ 9. 智能推荐（核心：三层闭环 + 人工审核 HITL） ═══ */
const RecommendView = {
  data() {
    return {
      portraits: [], products: [], selUser: "U001",
      result: null, generating: false,
      reviews: [], editingId: null
    };
  },
  async mounted() {
    this.portraits = await API.get("/api/portrait");
    this.products = await API.get("/api/products");
    await this.loadReviews();
  },
  computed: {
    curUser() { return this.portraits.find(p => p.id === this.selUser) || null; }
  },
  methods: {
    async loadReviews() { this.reviews = await API.get("/api/recommend/reviews"); },
    async generate() {
      this.generating = true;
      this.result = null;
      try {
        this.result = await API.post("/api/recommend", { user_id: this.selUser });
        if (this.result.status === "pending_review") {
          toast("整单置信度 " + this.result.confidence + " < 0.7，已转入人工审核队列", "err");
        } else {
          toast("推荐已生成，置信度 " + this.result.confidence + "，直接上线推荐位", "ok");
        }
      } catch (e) {
        toast("生成失败：" + e.message, "err");
      }
      this.generating = false;
      await this.loadReviews();
    },
    startEdit(r) { this.editingId = this.editingId === r.id ? null : r.id; },
    replaceItem(rv, idx) {
      const it = rv.items[idx];
      const p = this.products.find(x => x.id === it.product_id);
      if (p) {
        it.name = p.name;
        it.price = p.price;
        toast("已替换为 " + p.name + "，将回流 few-shot 推荐库", "ok");
      }
    },
    async confirmReview(rv) {
      try {
        await API.put("/api/recommend/reviews/" + rv.id, {
          adjustments: rv.items.map(i => ({ product_id: i.product_id, name: i.name, reason: i.reason })),
          confirmed_by: "运营"
        });
        toast("已确认：改判回流 few-shot 推荐库", "ok");
        this.editingId = null;
      } catch (e) {
        toast("确认失败：" + e.message, "err");
      }
      await this.loadReviews();
    }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">智能推荐</div>
      <div class="page-desc">一次推荐请求三层流转：规则召回（确定性）→ LLM 排序 + 推荐理由（AI）→ 置信度分流（HITL）</div>
    </div>

    <div class="card">
      <div class="card-title">发起推荐</div>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div class="field" style="margin-bottom:0">
          <label>选择用户</label>
          <select v-model="selUser" style="width:240px">
            <option v-for="p in portraits" :key="p.id" :value="p.id">{{ p.name }}（{{ p.id }} · {{ p.city }}）</option>
          </select>
        </div>
        <div v-if="curUser" style="font-size:12px;color:var(--muted);padding-bottom:8px">
          偏好类目：<b style="color:var(--text)">{{ curUser.prefer.join("、") }}</b> · 价格带 {{ curUser.price_band }} · 标签 {{ curUser.tags.join("、") }}
        </div>
        <span class="spacer" style="flex:1"></span>
        <button class="btn primary" :disabled="generating" @click="generate">
          <span v-if="generating" class="spin"></span>{{ generating ? '生成中…' : '生成推荐' }}
        </button>
      </div>

      <template v-if="result">
        <div class="card-title" style="margin-top:18px">第 1 层 · 规则召回<span class="badge green">确定性 · 置信度 {{ result.rules_conf }}</span></div>
        <div class="tag-list">
          <span class="tag" v-for="r in result.recalled" :key="r.product_id">{{ r.name }}</span>
          <span v-if="!result.recalled.length" class="tag">无召回（偏好类目无在售商品）</span>
        </div>

        <div class="card-title" style="margin-top:18px">第 2 层 · LLM 排序 + 推荐理由<span class="badge blue">AI</span></div>
        <div class="rec-list">
          <div class="rec-item" v-for="(it, i) in result.items" :key="it.product_id">
            <div class="rec-rank" :class="{first: i===0}">{{ i + 1 }}</div>
            <div class="rec-body">
              <div class="rec-name">{{ it.name }} <span style="font-weight:400;color:var(--muted)">· {{ fmtMoney(it.price) }}</span></div>
              <div class="rec-reason">{{ it.reason }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div class="rec-score">评分 {{ it.score }}</div>
              <span class="badge" :class="confCls(it.confidence)">置信度 {{ it.confidence }}</span>
            </div>
          </div>
        </div>

        <div class="card-title" style="margin-top:18px">第 3 层 · 置信度分流<span class="badge orange">HITL</span></div>
        <div class="hint" :style="result.status==='graded' ? 'border-color:var(--ok);background:var(--ok-weak);color:var(--ok)' : 'border-color:var(--warn);background:var(--warn-weak);color:var(--warn)'">
          <template v-if="result.status === 'graded'">
            整单置信度 {{ result.confidence }} ≥ 0.7 → 直接进入线上推荐位
          </template>
          <template v-else>
            整单置信度 {{ result.confidence }} &lt; 0.7 → 不进入线上推荐位，已转入下方人工审核队列
          </template>
        </div>
      </template>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">
        人工审核队列<span class="badge orange">HITL</span>
        <span class="sub">低置信度推荐 · 人工确认后回流 few-shot 推荐库</span>
        <span class="spacer"></span>
        <span class="btn sm" @click="loadReviews">刷新</span>
      </div>
      <div class="empty" v-if="!reviews.length">队列为空 · 在「发起推荐」中多次生成，约一半概率刷出低置信度样本</div>
      <div v-else>
        <div class="card" v-for="rv in reviews" :key="rv.id" style="margin-bottom:12px;background:#fffdfb">
          <div class="card-title" style="margin-bottom:8px">
            {{ rv.user_name }}（{{ rv.user_id }}）
            <span class="badge" :class="badgeCls(rv.status)">{{ rv.status === 'confirmed' ? '已确认' : '待审核' }}</span>
            <span class="sub">整单置信度 {{ rv.confidence }} · {{ rv.created_at }}</span>
            <span class="spacer"></span>
            <span class="btn sm" v-if="editingId !== rv.id" @click="startEdit(rv)">审核</span>
            <span class="btn sm" v-else @click="startEdit(rv)">收起</span>
          </div>
          <div class="rec-item" v-for="(it, i) in rv.items" :key="i" style="border:none;padding:6px 0">
            <div class="rec-rank" :class="{first: i===0}" style="width:22px;height:22px;font-size:11px">{{ i + 1 }}</div>
            <div class="rec-body">
              <div class="rec-name">{{ it.name }} <span style="font-weight:400;color:var(--muted)">· {{ fmtMoney(it.price) }}</span></div>
              <div class="rec-reason" v-if="editingId !== rv.id">{{ it.reason }}</div>
              <textarea v-else v-model="it.reason" style="width:100%;min-height:44px;margin-top:4px;font-size:12px"></textarea>
            </div>
            <div style="flex-shrink:0;display:flex;flex-direction:column;gap:4px;align-items:flex-end">
              <span class="badge" :class="confCls(it.confidence)">{{ it.confidence }}</span>
              <select v-if="editingId === rv.id" :value="it.product_id" @change="it.product_id = $event.target.value; replaceItem(rv, i)" style="font-size:11px;padding:2px 4px;width:130px">
                <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
          </div>
          <div v-if="editingId === rv.id" style="text-align:right;margin-top:6px">
            <span class="btn primary sm" @click="confirmReview(rv)">确认并回流 few-shot 库</span>
          </div>
          <div v-if="rv.status === 'confirmed'" class="hint" style="margin-top:6px">已确认 · 改判样本已回流 few-shot 推荐库，后续同类请求将参考该样例</div>
        </div>
      </div>
    </div>
  </div>`
};

/* ═══ 10. 用户画像 ═══ */
const PortraitView = {
  data() { return { portraits: [] }; },
  async mounted() { this.portraits = await API.get("/api/portrait"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">用户画像</div>
      <div class="page-desc">画像驱动推荐：偏好类目、价格带、兴趣标签是召回与排序的输入</div>
    </div>
    <div class="prod-grid">
      <div class="prod-card" v-for="p in portraits" :key="p.id">
        <div class="prod-top">
          <span class="prod-type">{{ p.id }}</span>
          <span class="prod-cat">{{ p.city }}</span>
        </div>
        <div class="prod-name">{{ p.name }} <span style="font-weight:400;font-size:12px;color:var(--muted)">{{ p.age }} 岁</span></div>
        <div class="prod-meta"><span>累计下单 <b>{{ p.order_cnt }}</b> 单</span><span>最近浏览 <b>{{ p.recent_view }}</b></span></div>
        <div class="prod-meta"><span>价格带 <b>{{ p.price_band }}</b></span></div>
        <div class="prod-foot">
          <span class="tag-list">
            <span class="tag" v-for="c in p.prefer" :key="c">偏好·{{ c }}</span>
            <span class="tag" v-for="t in p.tags" :key="t">{{ t }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="hint" style="margin-top:14px">画像由确定性规则生成：偏好类目 = 下单类目 TopN，价格带 = 下单金额 P25~P75。AI 只做「浏览多但不下单」等行为的解释性归因，不直接改画像。</div>
  </div>`
};

/* ═══ 11. 智能客服 ═══ */
const ServiceView = {
  data() {
    return {
      msgs: [{ role: "ai", text: "你好，我是牧童商城智能客服。商品咨询、售后政策、活动规则都可以问我。涉及价格承诺与退款金额的问题会转人工。", ts: "" }],
      input: "", sending: false
    };
  },
  methods: {
    async send(text) {
      const t = (text || this.input).trim();
      if (!t || this.sending) return;
      this.msgs.push({ role: "user", text: t, ts: nowStr() });
      this.input = "";
      this.sending = true;
      try {
        const r = await API.post("/api/gateway/chat", { messages: [{ role: "user", content: t }] });
        this.msgs.push({ role: "ai", text: r.reply || "（无应答）", ts: nowStr() });
      } catch (e) {
        this.msgs.push({ role: "ai", text: "网关不可达，已降级为人工转接提示：请稍后重试或联系在线客服。", ts: nowStr() });
      }
      this.sending = false;
    }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">智能客服</div>
      <div class="page-desc">售前咨询与售后引导 · 经统一 agent-gateway 调用 LLM，知识库约束回答范围</div>
    </div>
    <div class="card">
      <div class="chat-panel">
        <div class="chat-list">
          <div class="msg" :class="m.role === 'user' ? 'user' : 'ai'" v-for="(m, i) in msgs" :key="i">
            <div class="msg-avatar">{{ m.role === 'user' ? '运营' : 'MT' }}</div>
            <div>
              <div class="msg-bubble">{{ m.text }}</div>
              <div class="msg-meta" v-if="m.ts">{{ m.ts }} · via agent-gateway</div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 0">
          <span class="preset-chip" @click="send('退货政策是什么？')">退货政策</span>
          <span class="preset-chip" @click="send('发货时效多久？')">发货时效</span>
          <span class="preset-chip" @click="send('新人优惠券怎么领？')">新人优惠券</span>
        </div>
        <div class="chat-input-bar">
          <textarea v-model="input" @keydown.enter.exact.prevent="send()" placeholder="输入问题，Enter 发送"></textarea>
          <button class="btn primary" :disabled="sending" @click="send()">发送</button>
        </div>
      </div>
    </div>
  </div>`
};

/* ═══ 12. 营销活动 ═══ */
const CampaignView = {
  data() { return { campaigns: [] }; },
  async mounted() { this.campaigns = await API.get("/api/campaign"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">营销活动</div>
      <div class="page-desc">活动是交易杠杆：满减、秒杀、新人券 · 活动数据同步进推荐排序特征</div>
    </div>
    <div class="prod-grid">
      <div class="prod-card" v-for="c in campaigns" :key="c.id">
        <div class="prod-top">
          <span class="prod-type">{{ c.type }}</span>
          <span class="prod-cat">{{ c.id }}</span>
        </div>
        <div class="prod-name">{{ c.name }}</div>
        <div class="prod-meta"><span>规则 <b>{{ c.rule }}</b></span></div>
        <div class="prod-meta"><span>范围 <b>{{ c.scope }}</b></span></div>
        <div class="prod-meta"><span>{{ c.start }} ~ {{ c.end }}</span></div>
        <div class="prod-foot">
          <span class="spacer"></span>
          <span class="badge" :class="badgeCls(c.status)">{{ c.status }}</span>
        </div>
      </div>
    </div>
    <div class="hint" style="margin-top:14px">与推荐联动：参加活动的商品在推荐位打「活动」角标；秒杀商品排序加权，活动结束后角标及时下线。</div>
  </div>`
};

/* ═══ 13. 销售分析 ═══ */
const SalesView = {
  data() { return { sales: null, note: "" }; },
  async mounted() { this.sales = await API.get("/api/sales"); },
  computed: {
    hours() { return ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]; },
    trendMax() { return this.sales ? Math.max(...this.sales.trend) : 1; },
    shareMax() { return this.sales ? Math.max(...this.sales.category_share.map(c => c.value)) : 1; }
  },
  methods: {
    genNote() {
      if (!this.sales) return;
      const t = this.sales.trend;
      const peak = t.indexOf(Math.max(...t));
      const top = [...this.sales.category_share].sort((a, b) => b.value - a.value)[0];
      this.note = "今日 GMV 高峰出现在 " + this.hours[peak] + "（" + t[peak] + " 万），全天呈上行趋势。类目结构上 " +
        top.name + " 占比 " + top.value + "% 居首，为大盘主要贡献类目；建议围绕头部类目加大活动与推荐位资源投放。" +
        "（示例解读 · 生产环境由 LLM 结合活动日历生成归因）";
    }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">销售分析</div>
      <div class="page-desc">趋势 + 类目占比：看大盘、找结构变化，为选品与备货提供依据</div>
    </div>
    <div class="grid grid-2" v-if="sales">
      <div class="card">
        <div class="card-title">今日 GMV 趋势<span class="sub">按小时 · 万元</span></div>
        <div class="bar-chart">
          <div class="bar-col" v-for="(v, i) in sales.trend" :key="i">
            <div class="bar" :style="{ height: Math.max(3, Math.round(v / trendMax * 150)) + 'px' }"></div>
            <div class="bar-label">{{ hours[i] }}</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">类目销售占比<span class="sub">今日 GMV 结构</span></div>
        <div class="hbar-row" v-for="c in sales.category_share" :key="c.name">
          <div class="hbar-name">{{ c.name }}</div>
          <div class="hbar-track"><div class="hbar-fill" :style="{ width: Math.round(c.value / shareMax * 100) + '%' }"></div></div>
          <div class="hbar-num">{{ c.value }}%</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="card-title">AI 解读<span class="sub">数据曲线 → 自然语言归因</span><span class="spacer"></span><span class="btn sm" @click="genNote">生成解读</span></div>
      <div class="hint" v-if="note" style="border-color:var(--brand-border)">{{ note }}</div>
      <div class="empty" v-else>点击「生成解读」生成示例解读文本</div>
    </div>
  </div>`
};

/* ═══ 14. 转化漏斗 ═══ */
const FunnelView = {
  data() { return { funnel: null }; },
  async mounted() { this.funnel = await API.get("/api/funnel"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">转化漏斗</div>
      <div class="page-desc">曝光 → 点击 → 加购 → 下单 → 支付 · 每层流失点就是优化点</div>
    </div>
    <div class="card" v-if="funnel">
      <div class="card-title">今日转化漏斗</div>
      <div v-for="(s, i) in funnel.stages" :key="s.name" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;font-size:12.5px">
          <div class="hbar-name">{{ s.name }}</div>
          <div class="hbar-track" style="height:26px;border-radius:6px">
            <div class="hbar-fill" :style="{ width: Math.max(2, Math.round(s.rate / funnel.stages[0].rate * 100)) + '%', height: '100%' }"></div>
          </div>
          <div class="hbar-num" style="width:auto">{{ s.value.toLocaleString() }} <span style="color:var(--muted)">({{ s.rate }}%)</span></div>
        </div>
        <div v-if="i < funnel.stages.length - 1" style="font-size:11px;color:var(--muted);margin:2px 0 0 160px">
          流失 {{ ((funnel.stages[i].value - funnel.stages[i+1].value) / funnel.stages[i].value * 100).toFixed(1) }}%
        </div>
      </div>
      <div class="hint" style="margin-top:8px">点击率低查推荐位与首屏；加购低查详情页与价格；支付低查支付链路与库存。流失归因建议由 LLM 生成，策略调整先走 A/B 实验验证。</div>
    </div>
  </div>`
};

/* ═══ 15. A/B 实验 ═══ */
const AbtestView = {
  data() { return { experiments: [] }; },
  async mounted() {
    const r = await API.get("/api/abtest");
    this.experiments = r.experiments || [];
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">A/B 实验</div>
      <div class="page-desc">策略变更先实验后全量 · 置信度 0.95 为决策门槛，统计显著不等于业务正确</div>
    </div>
    <div class="grid grid-3">
      <div class="card" v-for="e in experiments" :key="e.id">
        <div class="card-title">{{ e.name }}<span class="spacer"></span><span class="badge" :class="badgeCls(e.status)">{{ e.status }}</span></div>
        <table class="tbl" style="font-size:12.5px">
          <tr><th>分组</th><th>CTR</th><th>CVR</th></tr>
          <tr><td>{{ e.a.name }}</td><td class="num">{{ e.a.ctr }}%</td><td class="num">{{ e.a.cvr }}%</td></tr>
          <tr><td>{{ e.b.name }}</td><td class="num">{{ e.b.ctr }}%</td><td class="num">{{ e.b.cvr }}%</td></tr>
        </table>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12.5px">
          <span>置信度 <b class="num">{{ e.confidence }}</b></span>
          <span class="spacer" style="flex:1"></span>
          <span v-if="e.confidence >= 0.95 && e.winner" class="badge green">胜出：{{ e.winner }} · 可决策</span>
          <span v-else-if="e.confidence >= 0.95 && !e.winner" class="badge gray">无显著差异</span>
          <span v-else class="badge orange">继续实验</span>
        </div>
        <div class="hint" style="margin-top:10px">实验期 ≥ 7 天含周末；警惕新样式新奇效应；是否全量由运营结合收入影响人工拍板（HITL）。</div>
      </div>
    </div>
  </div>`
};

/* ═══ 16. 定价助手 ═══ */
const PricingView = {
  data() {
    return {
      products: [], pricings: [],
      productId: "", cost: "", generating: false,
      lastResult: null
    };
  },
  async mounted() {
    this.products = await API.get("/api/products");
    this.pricings = await API.get("/api/pricing");
  },
  methods: {
    async generate() {
      if (!this.productId || !this.cost) { toast("请选择商品并填写成本价", "err"); return; }
      this.generating = true;
      this.lastResult = null;
      try {
        this.lastResult = await API.post("/api/pricing", { product_id: this.productId, cost: Number(this.cost) });
        if (this.lastResult.rejected) {
          toast("低于毛利底线（成本 × 1.2），已拒绝", "err");
        } else {
          toast("建议价区间已生成", "ok");
          this.pricings = await API.get("/api/pricing");
        }
      } catch (e) {
        toast("生成失败：" + e.message, "err");
      }
      this.generating = false;
    }
  },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">定价助手</div>
      <div class="page-desc">成本、竞品价、销量弹性共同输入 · 毛利底线是确定性硬约束，之上由 LLM 给出建议区间</div>
    </div>
    <div class="card">
      <div class="card-title">生成定价建议</div>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div class="field" style="margin-bottom:0">
          <label>商品</label>
          <select v-model="productId" style="width:260px">
            <option value="" disabled>选择商品</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}（现价 {{ p.price }}）</option>
          </select>
        </div>
        <div class="field" style="margin-bottom:0">
          <label>成本价（元）</label>
          <input v-model="cost" type="number" min="0" placeholder="如 980" style="width:140px">
        </div>
        <button class="btn primary" :disabled="generating" @click="generate">
          <span v-if="generating" class="spin"></span>{{ generating ? '生成中…' : '生成建议' }}
        </button>
      </div>
      <div v-if="lastResult" :class="lastResult.rejected ? 'hint' : 'hint'" :style="lastResult.rejected ? 'margin-top:14px;border-color:var(--danger);background:var(--danger-weak);color:var(--danger)' : 'margin-top:14px;border-color:var(--ok);background:var(--ok-weak)'">
        <template v-if="lastResult.rejected">
          已拒绝：毛利底线 = 成本 × 1.2 = {{ fmtMoney(lastResult.floor) }}，高于现价 —— {{ lastResult.reason }}
        </template>
        <template v-else>
          建议价区间 {{ fmtMoney(lastResult.suggest_min) }} ~ {{ fmtMoney(lastResult.suggest_max) }} · 起步毛利 {{ lastResult.margin }} · 已入记录（生产环境由 LLM 综合竞品价与销量弹性生成，引用竞品价可追溯，调价执行仍需人工确认）
        </template>
      </div>
    </div>
    <div class="card">
      <div class="card-title">定价记录</div>
      <div class="table-wrap"><table class="tbl">
        <tr><th>编号</th><th>商品</th><th>成本</th><th>建议区间</th><th>起步毛利</th><th>状态</th><th>时间</th></tr>
        <tr v-for="r in pricings" :key="r.id">
          <td class="mono">{{ r.id }}</td>
          <td>{{ r.product_name }}</td>
          <td class="num">{{ fmtMoney(r.cost) }}</td>
          <td class="num">{{ fmtMoney(r.suggest_min) }} ~ {{ fmtMoney(r.suggest_max) }}</td>
          <td class="num">{{ r.margin }}</td>
          <td><span class="badge" :class="badgeCls(r.status)">{{ r.status }}</span></td>
          <td class="mono">{{ r.created_at }}</td>
        </tr>
      </table></div>
    </div>
  </div>`
};

/* ═══ 17. AI 网关 ═══ */
const GatewayView = {
  data() { return { gw: null }; },
  async mounted() { this.gw = await API.get("/api/gateway/info"); },
  template: `
  <div>
    <div class="page-head">
      <div class="page-title">AI 网关</div>
      <div class="page-desc">统一 AI 出口：所有 LLM 调用（推荐理由 / 客服 / 定价）都经 agent-gateway 路由 · 网关离线自动降级</div>
    </div>
    <template v-if="gw">
      <div class="grid grid-4">
        <div class="kpi"><div class="kpi-label">状态</div><div class="kpi-val"><span class="badge green">在线</span></div><div class="kpi-foot">{{ gw.url }}</div></div>
        <div class="kpi"><div class="kpi-label">模型</div><div class="kpi-val" style="font-size:18px">{{ gw.model }}</div><div class="kpi-foot">默认路由模型</div></div>
        <div class="kpi"><div class="kpi-label">QPM 用量</div><div class="kpi-val">{{ gw.qpm.used }}</div><div class="kpi-foot">上限 {{ gw.qpm.limit }}</div></div>
        <div class="kpi"><div class="kpi-label">P95 延迟</div><div class="kpi-val">{{ gw.latency.p95 }}</div><div class="kpi-foot">ms · P50 {{ gw.latency.p50 }} · 可用性 {{ gw.uptime }}</div></div>
      </div>
      <div class="card">
        <div class="card-title">路由表</div>
        <div class="table-wrap"><table class="tbl">
          <tr><th>路径</th><th>说明</th><th>健康</th></tr>
          <tr v-for="r in gw.routes" :key="r.path">
            <td><span class="code-block" style="display:inline-block;padding:2px 8px">{{ r.path }}</span></td>
            <td>{{ r.desc }}</td>
            <td><span class="badge" :class="r.ok ? 'green' : 'red'">{{ r.ok ? '正常' : '异常' }}</span></td>
          </tr>
        </table></div>
        <div class="hint" style="margin-top:8px">离线降级：网关不可达时推荐不中断——LLM 排序降级为启发式打分（确定性伪 AI），推荐理由用模板话术；降级结果置信度偏低，更易进入人工审核；网关恢复后自动切回 LLM。</div>
      </div>
    </template>
  </div>`
};

/* ═══ 注册 + 挂载 ═══ */
app.config.globalProperties.badgeCls = badgeCls;
app.config.globalProperties.confCls = confCls;
app.config.globalProperties.fmtMoney = fmtMoney;
app.config.globalProperties.fmtWan = fmtWan;

app.component("dashboard-view", DashboardView);
app.component("realtime-view", RealtimeView);
app.component("products-view", ProductsView);
app.component("categories-view", CategoriesView);
app.component("inventory-view", InventoryView);
app.component("orders-view", OrdersView);
app.component("payment-view", PaymentView);
app.component("aftersale-view", AftersaleView);
app.component("recommend-view", RecommendView);
app.component("portrait-view", PortraitView);
app.component("service-view", ServiceView);
app.component("campaign-view", CampaignView);
app.component("sales-view", SalesView);
app.component("funnel-view", FunnelView);
app.component("abtest-view", AbtestView);
app.component("pricing-view", PricingView);
app.component("gateway-view", GatewayView);

app.mount("#app");
