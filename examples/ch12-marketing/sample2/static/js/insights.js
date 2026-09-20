/**
 * 牧童商城 · "背后逻辑"面板文案（随菜单切换）
 * 17 个视图：大屏 / 实时 / 商品 / 分类 / 库存 / 订单 / 支付 / 售后 / 推荐 / 画像 / 客服 / 活动 / 销售 / 漏斗 / AB / 定价 / 网关
 */

const INSIGHTS = {
  dashboard: {
    name: "电商 BI 大屏",
    intro: "运营驾驶舱：GMV、转化、客单价等北极星指标统一聚合，配套推荐链路与规则说明。数据来自后端聚合接口。",
    sections: [
      { tag: "口径", tagCls: "green", title: "指标口径", body: "所有数值由后端聚合，前端不计算业务指标，避免口径漂移。", points: ["GMV = 已支付订单金额合计（不含退款）", "转化率 = 下单 UV / 访问 UV", "推荐 CTR = 推荐位点击 / 曝光"] },
      { tag: "架构", tagCls: "blue", title: "推荐闭环三层", body: "本平台核心设计：确定性规则召回，AI 排序 + 推荐理由，低置信度人工审核兜底。", points: ["第 1 层：规则召回（类目偏好/价格带），100% 可复现", "第 2 层：LLM 排序 + 生成推荐理由，附置信度", "第 3 层：置信度 < 0.7 转人工审核（HITL）"] }
    ]
  },
  realtime: {
    name: "实时销售监控",
    intro: "订单流实时滚动，运营可即时发现爆款与异常（如某商品短时激增）。",
    sections: [
      { tag: "流式", tagCls: "blue", title: "实时链路", body: "订单系统 → 消息队列 → 前端轮询/推送。演示环境为 5 秒轮询后端接口。", code: "orders -> MQ -> /api/realtime\n前端 5s 轮询刷新" },
      { tag: "告警", tagCls: "orange", title: "异常识别规则", points: ["单品 5 分钟订单 > 50 触发爆款提示", "支付失败率 > 3% 触发通道告警", "库存 < 预警线自动进库存预警列表"] }
    ]
  },
  products: {
    name: "商品管理",
    intro: "商品是推荐与交易的基础数据。上架质量直接影响召回效果。",
    sections: [
      { tag: "基础", tagCls: "green", title: "商品字段", body: "标题、类目、价格、库存、标签是推荐引擎的输入。标签越准确，规则召回越准。", points: ["类目决定规则召回的范围", "标签用于兴趣匹配打分", "评分/销量是排序的弱信号"] },
      { tag: "规范", tagCls: "blue", title: "上架规范", body: "演示版按「低库存/爆款/新品」标签管理；生产环境需接入类目树与 SPU/SKU 体系。", code: "商品 -> 类目 -> 标签 -> 推荐引擎\n标题规范：品牌 + 品类 + 核心卖点" }
    ]
  },
  categories: {
    name: "分类管理",
    intro: "类目是推荐召回的硬约束：用户偏好类目直接决定召回池。",
    sections: [
      { tag: "规则", tagCls: "green", title: "类目即召回边界", body: "第 1 层规则召回只在该用户偏好类目内选品，类目体系错了召回就错。", points: ["类目归属错误 → 推荐不相关", "类目过粗 → 召回噪声大", "类目过细 → 召回不足"] },
      { tag: "体系", tagCls: "blue", title: "类目树设计", body: "演示版单层 5 类；生产环境用三级类目树（一级行业、二级品类、三级商品属性）。", code: "数码家电（1 级）\n  -> 音频设备（2 级）\n    -> 降噪耳机（3 级）" }
    ]
  },
  inventory: {
    name: "库存预警",
    intro: "库存低于预警线自动进入列表。缺货商品会被推荐引擎自动排除。",
    sections: [
      { tag: "规则", tagCls: "green", title: "预警规则", body: "每件商品设置 alert_line（安全库存）。当前库存 ≤ 预警线即进入预警列表。", code: "if stock <= alert_line:\n    push 库存预警列表" },
      { tag: "联动", tagCls: "blue", title: "与推荐联动", body: "推荐召回层排除缺货/下架商品——避免「推荐了买不到」的体验损伤。", points: ["stock = 0 的商品不进入召回", "低库存商品排序降权（可选策略）", "大促前对爆款提前备货"] }
    ]
  },
  orders: {
    name: "订单管理",
    intro: "订单全生命周期：待支付 → 已支付 → 已发货 → 已完成，含售后分支。",
    sections: [
      { tag: "状态机", tagCls: "blue", title: "订单状态流转", body: "演示版简化为 6 态；生产环境有更细的拆分（部分发货、部分退款等）。", code: "待支付 -> 已支付 -> 已发货 -> 已完成\n        \\-> 售后中 -> 已退款" },
      { tag: "规则", tagCls: "green", title: "超时规则", body: "待支付订单 30 分钟未付自动关闭（演示版未实现自动关闭，仅展示状态）。", points: ["关闭后释放库存", "重复支付需幂等保护", "退款走售后工单"] }
    ]
  },
  payment: {
    name: "支付对账",
    intro: "渠道账单与内部订单流水对账，找出单边账（渠道有、内部无）。",
    sections: [
      { tag: "对账", tagCls: "green", title: "对账规则", body: "以渠道流水为基准逐笔比对内部订单：金额 + 订单号双匹配。", code: "渠道流水 LEFT JOIN 内部订单\n差异类型：\n  长款 = 渠道有 / 内部无\n  短款 = 内部有 / 渠道无\n  金额不符 = 双有但金额不一致" },
      { tag: "安全", tagCls: "orange", title: "资金安全底线", body: "对账是资金类功能，确定性规则实现，不用 AI 判断资金差异。", points: ["AI 只做差异归因建议", "退款/调整必须人工确认"] }
    ]
  },
  aftersale: {
    name: "售后工单",
    intro: "退款退货工单处理。售后数据是商品质量的负反馈信号。",
    sections: [
      { tag: "流程", tagCls: "blue", title: "工单流转", body: "用户申请 → 客服审核 → 退款/退货。演示版按状态展示工单列表。", code: "申请中 -> 审核中 -> 退款中 -> 已完成\n                   \\-> 已驳回" },
      { tag: "联动", tagCls: "green", title: "售后反哺推荐", body: "高退货率商品在推荐排序中降权；售后原因文本可用于 LLM 归因分析。", points: ["退货率 > 10% 的商品降权", "质量类售后词频 → 品类问题预警"] }
    ]
  },
  recommend: {
    name: "智能推荐",
    intro: "核心模块。一次推荐请求经过三层：规则召回、LLM 排序 + 推荐理由、置信度分流。",
    sections: [
      { tag: "确定性", tagCls: "green", title: "第 1 层：规则召回", body: "按用户画像的偏好类目、价格带过滤商品池，排除缺货/下架。100% 可复现，置信度恒为 1.0。", code: "recalled = products.filter(\n  category in user.prefer\n  and price in user.price_band\n  and stock > 0)" },
      { tag: "AI", tagCls: "blue", title: "第 2 层：LLM 排序 + 推荐理由", body: "把召回的商品与用户画像打包成 prompt，要求 LLM 输出 JSON：排序 + 每件商品的推荐理由 + 置信度。", code: "POST /v1/chat/completions\n{\n  system: \"你是电商推荐运营专家。\n  输出 JSON：\n  {items:[{id, reason, confidence}]}\"\n  user: 用户画像 + 候选商品\n}" },
      { tag: "HITL", tagCls: "orange", title: "第 3 层：置信度分流", body: "整单置信度 = AI 排序层置信度均值（规则召回恒 1.0 不参与稀释）。低于阈值 0.7 不进线上推荐位，自动进人工审核队列。", points: ["阈值 0.7 可配置（0.5~0.9）", "人工审核可换商品、改理由", "改判回流 few-shot 推荐库"] }
    ]
  },
  portrait: {
    name: "用户画像",
    intro: "画像驱动推荐：偏好类目、价格带、兴趣标签是召回与排序的输入。",
    sections: [
      { tag: "规则", tagCls: "green", title: "画像字段", body: "演示版画像由确定性规则生成：浏览/下单行为聚合出偏好类目与价格带。", code: "prefer = topN(下单类目, 2)\nprice_band = 下单金额 P25~P75\ntags = 点击商品标签频次 top3" },
      { tag: "AI", tagCls: "blue", title: "AI 补充归因", body: "规则生成画像骨架，LLM 对「浏览多但不下单」等行为做解释性归因。", points: ["规则画像：稳定可审计", "AI 归因：解释行为，不直接改画像", "画像更新：T+1 离线批量"] }
    ]
  },
  service: {
    name: "智能客服",
    intro: "售前咨询与售后引导，经统一 agent-gateway 调用 LLM，知识库约束回答范围。",
    sections: [
      { tag: "架构", tagCls: "blue", title: "客服 = LLM + 知识库", body: "商品 FAQ、售后政策进入知识库，LLM 先检索再回答，带出处。", code: "用户提问 -> 知识库检索(RAG)\n  -> LLM 组织回答\n  -> 无法回答时转人工" },
      { tag: "边界", tagCls: "orange", title: "兜底规则", points: ["涉及价格承诺/退款金额的对话必须转人工", "LLM 不直接操作订单系统", "每次回答记录质检样本"] }
    ]
  },
  campaign: {
    name: "营销活动",
    intro: "活动是交易杠杆：满减、秒杀、新人券。活动数据同步进推荐排序特征。",
    sections: [
      { tag: "规则", tagCls: "green", title: "活动配置", body: "活动 = 类型 + 门槛 + 商品范围 + 时间窗。演示版为列表展示。", code: "满减：满 199 减 20（全场）\n秒杀：P004 129 -> 99（限量 500）\n新人券：无门槛 15 元" },
      { tag: "联动", tagCls: "blue", title: "与推荐联动", body: "参加活动的商品在推荐位打「活动」角标；秒杀商品排序加权。", points: ["活动价与推荐排序分协同", "活动结束后角标及时下线"] }
    ]
  },
  sales: {
    name: "销售分析",
    intro: "趋势 + 类目占比。看大盘、找结构变化，为选品与备货提供依据。",
    sections: [
      { tag: "口径", tagCls: "green", title: "分析口径", body: "演示版按小时 GMV 趋势与类目销售额占比；生产环境可下钻到单品与地区。", points: ["趋势：识别大促脉冲与下滑拐点", "占比：类目结构变化 → 调整运营重心"] },
      { tag: "AI", tagCls: "blue", title: "AI 解读", body: "数据曲线交给 LLM 生成自然语言解读：增长归因、异常解释。", code: "input: 趋势数组 + 活动日历\noutput: \"10:00 起 GMV 环比 +23%，\n主因数码专场开售…\"" }
    ]
  },
  funnel: {
    name: "转化漏斗",
    intro: "曝光 → 点击 → 加购 → 下单 → 支付。每层流失点就是优化点。",
    sections: [
      { tag: "规则", tagCls: "green", title: "漏斗口径", body: "各层 UV 去重统计。转化率 = 本层 / 上一层。", code: "曝光 486200 (100%)\n点击  61261 (12.6%)   <- 点击率低查推荐\n加购  18378 (3.78%)   <- 加购低查详情页\n下单  11090 (2.28%)\n支付   9354 (1.92%)   <- 支付低查支付链路" },
      { tag: "AI", tagCls: "blue", title: "流失归因", body: "每层流失的明细用户与商品交给 LLM 归因：价格因素、缺货、页面体验。", points: ["只给归因建议，不动策略", "策略调整走 A/B 实验验证"] }
    ]
  },
  abtest: {
    name: "A/B 实验",
    intro: "策略变更先实验后全量：分流、指标、显著性判断缺一不可。",
    sections: [
      { tag: "规则", tagCls: "green", title: "实验设计", body: "随机分流 50/50，观察 CTR/CVR 指标，置信度 > 0.95 才可下结论。", code: "H0: 两组无差异\np 值 < 0.05 -> 拒绝 H0\nwinner 以置信度 0.95 为门槛" },
      { tag: "HITL", tagCls: "orange", title: "决策在人工", body: "统计显著不等于业务正确：是否全量由运营结合收入影响与风险人工拍板。", points: ["实验期至少 7 天含周末", "新奇效应：新样式短期虚高", "结论落文档，可回溯"] }
    ]
  },
  pricing: {
    name: "定价助手",
    intro: "给商品定价建议：成本、竞品价、历史销量共同输入，LLM 输出建议价与理由。",
    sections: [
      { tag: "确定性", tagCls: "green", title: "定价底线（规则）", body: "毛利底线是硬约束：建议价低于成本价 1.2 倍直接拒绝，不交给 AI。", code: "if 建议价 < 成本 * 1.2:\n    reject(\"低于毛利底线\")" },
      { tag: "AI", tagCls: "blue", title: "LLM 定价建议", body: "规则底线之上，LLM 综合竞品价、销量弹性、活动档期给出建议价区间与理由。", points: ["输出区间而非单一价格", "引用竞品价需可追溯", "调价执行仍需人工确认"] }
    ]
  },
  gateway: {
    name: "AI 网关",
    intro: "统一 AI 出口：所有 LLM 调用（推荐理由/客服/定价）都经 agent-gateway 路由，网关离线自动降级。",
    sections: [
      { tag: "架构", tagCls: "blue", title: "统一出口", body: "本平台不新建 AI 通道，全部复用 agent-gateway。QPM、延迟、可用性集中监控。", code: "推荐理由/客服/定价/归因\n   -> agent-gateway (127.0.0.1:10050)\n      -> /v1/chat/completions -> LLM" },
      { tag: "降级", tagCls: "orange", title: "离线降级", body: "网关不可达时推荐不中断：LLM 排序降级为启发式打分（确定性伪 AI），推荐理由用模板话术。", points: ["降级结果置信度偏低，更易进人工审核", "网关恢复后自动切回 LLM", "降级时段在日志可查"] }
    ]
  }
};
