"""销售数据聚合处理 · 第 13 章配套代码。

整理自本书第 13 章（约 p372–373），已修复排版误差。
输入：飞书多维表格导出的 CSV（sales_export.csv）。
输出：按月聚合的销售指标与环比增长率（processed_sales.csv）。

运行：pip install pandas && python3 sales_analysis.py
（需先准备 sales_export.csv，字段含 year/month/amount/order_count/customer_count）
"""

import pandas as pd

# 读取飞书多维表格导出的 CSV 数据
sales_data = pd.read_csv("sales_export.csv")

# 处理缺失值
sales_data["amount"] = sales_data["amount"].fillna(0)

# 数据聚合计算：按月汇总销售额、订单数、客户数
monthly_sales = (
    sales_data.groupby(["year", "month"])
    .agg(
        {
            "amount": "sum",
            "order_count": "sum",
            "customer_count": "nunique",
        }
    )
    .reset_index()
)

# 计算环比增长率
monthly_sales["amount_mom"] = monthly_sales["amount"].pct_change()

# 导出处理后的数据
monthly_sales.to_csv("processed_sales.csv", index=False)
print(monthly_sales)
