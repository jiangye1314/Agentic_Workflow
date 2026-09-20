/**
 * 牧童商城 · 电商种子数据（Mock 模式 USE_MOCK=true 时使用）
 * 商品 / 分类 / 订单 / 用户画像 / 推荐审核队列 / 网关
 * 浅色主题 · 数据与后端 app.py 的 SEED 同构
 */

/* ═══ 分类 ═══ */
const MOCK_CATEGORIES = [
  { id: "CA01", name: "数码家电", products: 86, level: 1 },
  { id: "CA02", name: "服饰鞋包", products: 132, level: 1 },
  { id: "CA03", name: "美妆个护", products: 74, level: 1 },
  { id: "CA04", name: "食品生鲜", products: 58, level: 1 },
  { id: "CA05", name: "家居生活", products: 61, level: 1 }
];

/* ═══ 商品 ═══ */
const MOCK_PRODUCTS = [
  { id: "P001", name: "无线降噪耳机 Pro", category: "数码家电", price: 899, stock: 320, alert_line: 50, sales: 12480, rating: 4.8, status: "在售", tags: ["爆款", "数码"] },
  { id: "P002", name: "智能手环 6 代", category: "数码家电", price: 249, stock: 860, alert_line: 100, sales: 28500, rating: 4.6, status: "在售", tags: ["热卖"] },
  { id: "P003", name: "机械键盘 87 键", category: "数码家电", price: 399, stock: 210, alert_line: 60, sales: 8120, rating: 4.7, status: "在售", tags: ["客制化"] },
  { id: "P004", name: "便携榨汁杯", category: "家居生活", price: 129, stock: 45, alert_line: 80, sales: 16400, rating: 4.4, status: "在售", tags: ["低库存"] },
  { id: "P005", name: "家居香薰套装", category: "家居生活", price: 168, stock: 540, alert_line: 80, sales: 6320, rating: 4.5, status: "在售", tags: ["礼盒"] },
  { id: "P006", name: "轻羽绒连帽外套", category: "服饰鞋包", price: 459, stock: 380, alert_line: 60, sales: 9320, rating: 4.6, status: "在售", tags: ["秋冬"] },
  { id: "P007", name: "复古慢跑鞋", category: "服饰鞋包", price: 329, stock: 260, alert_line: 60, sales: 11750, rating: 4.5, status: "在售", tags: [] },
  { id: "P008", name: "氨基酸洗面奶", category: "美妆个护", price: 89, stock: 1500, alert_line: 200, sales: 35200, rating: 4.7, status: "在售", tags: ["复购"] },
  { id: "P009", name: "控油洗发水 500ml", category: "美妆个护", price: 79, stock: 96, alert_line: 100, sales: 21050, rating: 4.4, status: "在售", tags: ["低库存"] },
  { id: "P010", name: "精品挂耳咖啡礼盒", category: "食品生鲜", price: 118, stock: 430, alert_line: 60, sales: 4860, rating: 4.8, status: "在售", tags: ["礼盒"] },
  { id: "P011", name: "低糖燕麦片 1kg", category: "食品生鲜", price: 49, stock: 720, alert_line: 100, sales: 18200, rating: 4.5, status: "在售", tags: [] },
  { id: "P012", name: "智能投影仪 mini", category: "数码家电", price: 1599, stock: 8, alert_line: 30, sales: 3120, rating: 4.6, status: "在售", tags: ["低库存", "新品"] }
];

/* ═══ 订单 ═══ */
const MOCK_ORDERS = [
  { id: "O240918001", user: "林晓", amount: 899, status: "已支付", items: 1, created_at: "2026-09-20 07:30" },
  { id: "O240918002", user: "陈雨", amount: 129, status: "已支付", items: 2, created_at: "2026-09-20 07:29" },
  { id: "O240918003", user: "赵轩", amount: 249, status: "待支付", items: 1, created_at: "2026-09-20 07:28" },
  { id: "O240918004", user: "王涵", amount: 399, status: "已发货", items: 1, created_at: "2026-09-20 07:12" },
  { id: "O240918005", user: "孙悦", amount: 168, status: "售后中", items: 1, created_at: "2026-09-20 06:55" },
  { id: "O240918006", user: "周宁", amount: 459, status: "已完成", items: 1, created_at: "2026-09-19 22:40" },
  { id: "O240918007", user: "吴桐", amount: 89, status: "已完成", items: 3, created_at: "2026-09-19 21:15" },
  { id: "O240918008", user: "郑凯", amount: 118, status: "已退款", items: 1, created_at: "2026-09-19 20:02" }
];

/* ═══ 用户画像 ═══ */
const MOCK_PORTRAITS = [
  { id: "U001", name: "林晓", age: 28, city: "杭州", tags: ["数码", "音频"], price_band: "300-1500", recent_view: "无线降噪耳机 Pro", order_cnt: 23, prefer: ["数码家电"] },
  { id: "U002", name: "陈雨", age: 35, city: "上海", tags: ["家居", "品质"], price_band: "100-500", recent_view: "家居香薰套装", order_cnt: 41, prefer: ["家居生活", "美妆个护"] },
  { id: "U003", name: "赵轩", age: 24, city: "深圳", tags: ["运动", "性价比"], price_band: "100-400", recent_view: "智能手环 6 代", order_cnt: 9, prefer: ["数码家电"] },
  { id: "U004", name: "王涵", age: 31, city: "北京", tags: ["办公", "键鼠"], price_band: "200-800", recent_view: "机械键盘 87 键", order_cnt: 17, prefer: ["数码家电"] }
];

/* ═══ 推荐审核队列（低置信度推荐进人工审核，初始为空） ═══ */
const MOCK_REC_REVIEWS = [];

/* ═══ 支付对账（渠道流水 vs 内部订单，演示差异） ═══ */
const MOCK_PAYMENTS = [
  { id: "REC001", channel_no: "WX20260920073012", amount: 899, inner_order: "O240918001", status: "一致", note: "" },
  { id: "REC002", channel_no: "WX20260920072955", amount: 129, inner_order: "O240918002", status: "一致", note: "" },
  { id: "REC003", channel_no: "ALI20260920071503", amount: 249, inner_order: "—", status: "长款", note: "渠道有、内部无（疑似支付回调延迟）" },
  { id: "REC004", channel_no: "WX20260920065841", amount: 399, inner_order: "O240918004", status: "一致", note: "" },
  { id: "REC005", channel_no: "ALI20260920064020", amount: 168, inner_order: "—", status: "金额不符", note: "渠道 168 / 内部 128（优惠券未同步）" }
];

/* ═══ 售后工单 ═══ */
const MOCK_AFTERSALES = [
  { id: "AS001", order_id: "O240918005", user: "孙悦", product: "家居香薰套装", type: "退货退款", reason: "礼盒外包装破损", status: "审核中", created_at: "2026-09-20 07:05" },
  { id: "AS002", order_id: "O240918008", user: "郑凯", product: "精品挂耳咖啡礼盒", type: "仅退款", reason: "临期商品", status: "退款中", created_at: "2026-09-19 20:30" },
  { id: "AS003", order_id: "O240917112", user: "何静", product: "复古慢跑鞋", type: "换货", reason: "尺码偏小", status: "已完成", created_at: "2026-09-18 15:22" },
  { id: "AS004", order_id: "O240917089", user: "罗浩", product: "智能手环 6 代", type: "退货退款", reason: "功能与描述不符", status: "已驳回", created_at: "2026-09-18 11:47" }
];

/* ═══ 营销活动 ═══ */
const MOCK_CAMPAIGNS = [
  { id: "CP001", name: "数码家电超级品牌日", type: "满减", rule: "满 999 减 150", scope: "数码家电类目", start: "2026-09-20", end: "2026-09-22", status: "进行中" },
  { id: "CP002", name: "便携榨汁杯秒杀", type: "秒杀", rule: "129 → 99（限量 500 件）", scope: "P004 单品", start: "2026-09-20 10:00", end: "2026-09-20 12:00", status: "未开始" },
  { id: "CP003", name: "新人有礼", type: "优惠券", rule: "无门槛 15 元券", scope: "全场", start: "2026-09-01", end: "2026-09-30", status: "进行中" },
  { id: "CP004", name: "秋冬换新季", type: "满减", rule: "满 300 减 40", scope: "服饰鞋包类目", start: "2026-09-15", end: "2026-09-30", status: "进行中" }
];

/* ═══ 定价记录（定价助手） ═══ */
const MOCK_PRICINGS = [
  { id: "PR001", product_id: "P012", product_name: "智能投影仪 mini", cost: 980, suggest_min: 1499, suggest_max: 1699, margin: "42.3%", status: "已生成", created_at: "2026-09-19 18:40" },
  { id: "PR002", product_id: "P001", product_name: "无线降噪耳机 Pro", cost: 520, suggest_min: 849, suggest_max: 949, margin: "39.0%", status: "已生成", created_at: "2026-09-19 10:12" }
];

/* ═══ 网关信息 ═══ */
const MOCK_GATEWAY = {
  url: "http://127.0.0.1:10050",
  model: "qwen-max",
  qpm: { used: 312, limit: 1000 },
  latency: { p50: 186, p95: 486 },
  uptime: "99.96%",
  routes: [
    { path: "/v1/chat/completions", desc: "LLM 对话补全（推荐理由 / 客服 / 定价）", ok: true },
    { path: "/v1/embeddings", desc: "向量化（商品标题 / 用户兴趣）", ok: true },
    { path: "/asr", desc: "语音转写（客服质检）", ok: true }
  ]
};

/* ═══ Mock 推荐引擎（与后端 app.py 三层同一套逻辑） ═══ */
window.mockRecommend = (body) => {
  const user = MOCK_PORTRAITS.find(p => p.id === (body.user_id || "U001")) || MOCK_PORTRAITS[0];

  // ── 第 1 层：确定性规则召回（类目偏好 + 价格带 + 排除缺货） ──
  const recalled = MOCK_PRODUCTS.filter(p =>
    user.prefer.includes(p.category) && p.status === "在售" && p.stock > 0
  );
  const rulesConf = 1.0;

  // ── 第 2 层：启发式排序（模拟 LLM 个性化评分）+ 推荐理由 ──
  const items = recalled.slice(0, 4).map(p => {
    const tagHit = p.tags.some(t => user.tags.includes(t));
    const score = Math.round(p.price * 0.6) + (tagHit ? 10 : 0) + p.rating * 5;
    const conf = 0.5 + Math.random() * 0.4;
    return {
      product_id: p.id, name: p.name, price: p.price,
      reason: tagHit
        ? "与你偏好的「" + user.tags.join("、") + "」高度匹配，同类用户复购率高"
        : "同价位段好评 " + p.rating + "，与你的浏览记录相关",
      confidence: Number(conf.toFixed(2)),
      score
    };
  });

  // ── 第 3 层：置信度分流（只看 AI 排序层，规则召回恒 1.0 不稀释） ──
  const aiConfs = items.map(i => i.confidence);
  const avgConf = aiConfs.length
    ? Number((aiConfs.reduce((a, b) => a + b, 0) / aiConfs.length).toFixed(2))
    : 1.0;
  const status = avgConf < 0.7 ? "pending_review" : "graded";
  const result = {
    id: "R-" + Date.now(),
    user_id: user.id, user_name: user.name,
    recalled: recalled.map(p => ({ product_id: p.id, name: p.name, category: p.category })),
    items, rules_conf: rulesConf,
    confidence: avgConf, status,
    low_items: items.filter(i => i.confidence < 0.7).map(i => i.product_id),
    created_at: new Date().toISOString().slice(0, 16).replace("T", " ")
  };
  return result;
};
