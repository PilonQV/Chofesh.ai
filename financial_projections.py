#!/usr/bin/env python3
"""
Chofesh.ai 3-Year Financial Projections
Based on market research and industry benchmarks
"""

import json

# ============================================
# ASSUMPTIONS
# ============================================

# Market Data (from research)
CHATBOT_MARKET_2024 = 7.76e9  # $7.76B
CHATBOT_MARKET_2027 = 15.5e9  # Projected at 23.3% CAGR
MARKET_CAGR = 0.233  # 23.3% annual growth

# Competitor Benchmarks
CHATGPT_USERS_2025 = 800e6  # 800M users
CHATGPT_PAID_SUBSCRIBERS = 20e6  # 20M paid
CHATGPT_CONVERSION_RATE = 0.025  # 2.5%

# SaaS Benchmarks
AVG_FREEMIUM_CONVERSION = 0.035  # 3.5% (target for niche)
AVG_CAC_SAAS = 500  # $500 (organic/content focus)
AVG_CHURN_MONTHLY = 0.05  # 5% monthly churn
TARGET_LTV_CAC_RATIO = 3.0

# Chofesh.ai Pricing Tiers
PRICING = {
    "free": 0,
    "starter": 9.99,  # $9.99/month
    "pro": 19.99,  # $19.99/month
    "enterprise": 49.99  # $49.99/month
}

# User Distribution (of paid users)
PAID_DISTRIBUTION = {
    "starter": 0.50,  # 50% of paid users
    "pro": 0.40,  # 40% of paid users
    "enterprise": 0.10  # 10% of paid users
}

# Cost Structure
GROSS_MARGIN_BYOK = 0.95  # 95% margin when users bring own keys
GROSS_MARGIN_MANAGED = 0.60  # 60% margin with managed API
BYOK_PERCENTAGE = 0.30  # 30% of users use BYOK
BLENDED_GROSS_MARGIN = GROSS_MARGIN_BYOK * BYOK_PERCENTAGE + GROSS_MARGIN_MANAGED * (1 - BYOK_PERCENTAGE)

# Growth Assumptions
YEAR1_MONTHLY_GROWTH = 0.20  # 20% month-over-month in Y1
YEAR2_MONTHLY_GROWTH = 0.12  # 12% MoM in Y2
YEAR3_MONTHLY_GROWTH = 0.08  # 8% MoM in Y3

# Starting point
INITIAL_FREE_USERS = 500  # Launch month
INITIAL_PAID_USERS = 10

# ============================================
# PROJECTIONS
# ============================================

def calculate_arpu():
    """Calculate Average Revenue Per User (paid)"""
    arpu = sum(PRICING[tier] * pct for tier, pct in PAID_DISTRIBUTION.items())
    return arpu

def calculate_ltv(arpu, churn_rate):
    """Calculate Customer Lifetime Value"""
    monthly_churn = churn_rate
    avg_lifetime_months = 1 / monthly_churn
    ltv = arpu * avg_lifetime_months
    return ltv

def project_users(months, initial_free, initial_paid, growth_rates):
    """Project user growth over time"""
    projections = []
    free_users = initial_free
    paid_users = initial_paid
    
    for month in range(1, months + 1):
        # Determine growth rate based on year
        if month <= 12:
            growth = growth_rates[0]
        elif month <= 24:
            growth = growth_rates[1]
        else:
            growth = growth_rates[2]
        
        # Grow free users
        free_users = free_users * (1 + growth)
        
        # Convert some free to paid
        new_paid = free_users * AVG_FREEMIUM_CONVERSION / 12  # Monthly conversion
        
        # Account for churn
        churned = paid_users * AVG_CHURN_MONTHLY
        paid_users = paid_users + new_paid - churned
        
        projections.append({
            "month": month,
            "free_users": int(free_users),
            "paid_users": int(max(paid_users, 0)),
            "total_users": int(free_users + max(paid_users, 0))
        })
    
    return projections

def calculate_financials(user_projections, arpu):
    """Calculate revenue and costs"""
    financials = []
    
    for proj in user_projections:
        month = proj["month"]
        paid_users = proj["paid_users"]
        
        # Revenue
        mrr = paid_users * arpu
        
        # Costs (simplified)
        cogs = mrr * (1 - BLENDED_GROSS_MARGIN)
        gross_profit = mrr - cogs
        
        # Operating expenses (as % of revenue, scaling down over time)
        if month <= 12:
            opex_ratio = 1.5  # 150% of revenue (investment phase)
        elif month <= 24:
            opex_ratio = 0.9  # 90% of revenue (growth phase)
        else:
            opex_ratio = 0.6  # 60% of revenue (scaling phase)
        
        opex = mrr * opex_ratio if mrr > 0 else 5000  # Minimum $5k/month
        
        # Net income
        net_income = gross_profit - opex
        
        financials.append({
            "month": month,
            "year": (month - 1) // 12 + 1,
            "mrr": round(mrr, 2),
            "arr": round(mrr * 12, 2),
            "cogs": round(cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "gross_margin": round(BLENDED_GROSS_MARGIN * 100, 1),
            "opex": round(opex, 2),
            "net_income": round(net_income, 2),
            "paid_users": paid_users,
            "free_users": proj["free_users"]
        })
    
    return financials

def summarize_by_year(financials):
    """Summarize financials by year"""
    yearly = {}
    for f in financials:
        year = f["year"]
        if year not in yearly:
            yearly[year] = {
                "revenue": 0,
                "cogs": 0,
                "gross_profit": 0,
                "opex": 0,
                "net_income": 0,
                "end_paid_users": 0,
                "end_free_users": 0,
                "end_mrr": 0
            }
        yearly[year]["revenue"] += f["mrr"]
        yearly[year]["cogs"] += f["cogs"]
        yearly[year]["gross_profit"] += f["gross_profit"]
        yearly[year]["opex"] += f["opex"]
        yearly[year]["net_income"] += f["net_income"]
        yearly[year]["end_paid_users"] = f["paid_users"]
        yearly[year]["end_free_users"] = f["free_users"]
        yearly[year]["end_mrr"] = f["mrr"]
    
    return yearly

def main():
    # Calculate key metrics
    arpu = calculate_arpu()
    ltv = calculate_ltv(arpu, AVG_CHURN_MONTHLY)
    
    print("=" * 60)
    print("CHOFESH.AI 3-YEAR FINANCIAL PROJECTIONS")
    print("=" * 60)
    print()
    
    print("KEY METRICS:")
    print(f"  ARPU (Monthly): ${arpu:.2f}")
    print(f"  Customer LTV: ${ltv:.2f}")
    print(f"  Target CAC: ${AVG_CAC_SAAS}")
    print(f"  LTV:CAC Ratio: {ltv/AVG_CAC_SAAS:.1f}x")
    print(f"  Blended Gross Margin: {BLENDED_GROSS_MARGIN*100:.1f}%")
    print()
    
    # Project users
    growth_rates = [YEAR1_MONTHLY_GROWTH, YEAR2_MONTHLY_GROWTH, YEAR3_MONTHLY_GROWTH]
    user_projections = project_users(36, INITIAL_FREE_USERS, INITIAL_PAID_USERS, growth_rates)
    
    # Calculate financials
    financials = calculate_financials(user_projections, arpu)
    
    # Summarize by year
    yearly = summarize_by_year(financials)
    
    print("YEARLY SUMMARY:")
    print("-" * 60)
    for year, data in yearly.items():
        print(f"\nYEAR {year}:")
        print(f"  Total Revenue: ${data['revenue']:,.0f}")
        print(f"  Gross Profit: ${data['gross_profit']:,.0f}")
        print(f"  Operating Expenses: ${data['opex']:,.0f}")
        print(f"  Net Income: ${data['net_income']:,.0f}")
        print(f"  End of Year MRR: ${data['end_mrr']:,.0f}")
        print(f"  End of Year ARR: ${data['end_mrr']*12:,.0f}")
        print(f"  Paid Users: {data['end_paid_users']:,}")
        print(f"  Free Users: {data['end_free_users']:,}")
    
    print()
    print("=" * 60)
    print("GROWTH MILESTONES:")
    print("-" * 60)
    
    # Key milestones
    milestones = [
        ("Month 6", financials[5]),
        ("Month 12 (Year 1)", financials[11]),
        ("Month 18", financials[17]),
        ("Month 24 (Year 2)", financials[23]),
        ("Month 30", financials[29]),
        ("Month 36 (Year 3)", financials[35])
    ]
    
    for name, data in milestones:
        print(f"\n{name}:")
        print(f"  MRR: ${data['mrr']:,.0f}")
        print(f"  ARR: ${data['arr']:,.0f}")
        print(f"  Paid Users: {data['paid_users']:,}")
        print(f"  Free Users: {data['free_users']:,}")
    
    # Save detailed projections to JSON
    output = {
        "key_metrics": {
            "arpu_monthly": arpu,
            "ltv": ltv,
            "cac": AVG_CAC_SAAS,
            "ltv_cac_ratio": ltv / AVG_CAC_SAAS,
            "gross_margin": BLENDED_GROSS_MARGIN
        },
        "yearly_summary": yearly,
        "monthly_projections": financials
    }
    
    with open("/home/ubuntu/libre-ai/financial_projections.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print()
    print("Detailed projections saved to financial_projections.json")

if __name__ == "__main__":
    main()
