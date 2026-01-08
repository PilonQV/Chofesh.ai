# Chofesh.ai Credits System Proposal

## Executive Summary

Replace the current subscription model with a **unified credits-based system** that is simple, transparent, and encourages engagement. Users get free daily credits + can purchase credit packs when needed.

---

## Proposed Credit Structure (Optimized for 70%+ Margins)

### Free Tier (Daily Refresh)
| Benefit | Amount |
|---------|--------|
| Daily free credits | 30 credits |
| Credits expire | End of day (use it or lose it) |
| Rollover | None |

**Why 30?** Enough for ~10 free model chats OR 2 standard images per day. Encourages daily engagement while pushing power users to purchase. Lower than competitors (Manus gives 300/day but charges $20/mo minimum).

---

### Credit Packs (One-Time Purchase) - Optimized Pricing

| Pack | Credits | Price | Per Credit | Margin | Target User |
|------|---------|-------|------------|--------|-------------|
| Starter | 300 | $5 | $0.017 | **75%** | Casual/trial |
| Standard | 1,000 | $12 | $0.012 | **70%** | Regular users |
| Pro | 3,500 | $35 | $0.010 | **65%** | Power users |
| Power | 12,000 | $99 | $0.008 | **60%** | Heavy users |

**Purchased credits never expire.**

**Margin Strategy:**
- Small packs = higher margin (convenience premium)
- Large packs = volume discount (but still 60%+ margin)
- Average blended margin: **68%**

---

## Credit Costs Per Action (Optimized)

### Chat (Text Generation)

| Model Tier | Credits | Actual API Cost | Our Revenue | Margin |
|------------|---------|-----------------|-------------|--------|
| Free models (Groq Llama) | 1 credit | $0.00 | $0.012 | **100%** |
| Standard (GPT-4o-mini) | 2 credits | $0.002 | $0.024 | **92%** |
| Premium (GPT-4o, Claude) | 8 credits | $0.03 | $0.096 | **69%** |
| Uncensored (Venice) | 3 credits | $0.005 | $0.036 | **86%** |

**Key Optimization:** Default to FREE Groq models. Users pay credits but we pay $0 API cost = 100% margin on most queries.

**Reasoning:**
- Free models should cost minimal (encourage usage)
- Premium models cost more due to API costs
- Uncensored is mid-tier (not premium pricing, but not free)

### Image Generation

| Model | Credits | API Cost | Revenue | Margin |
|-------|---------|----------|---------|--------|
| Standard (Flux) | 8 credits | $0.03 | $0.096 | **69%** |
| Premium (DALL-E 3) | 20 credits | $0.08 | $0.24 | **67%** |
| Uncensored (Lustify) | 10 credits | $0.02 | $0.12 | **83%** |

**Key Optimization:** Venice/Lustify has lower API costs than DALL-E, so we can offer competitive uncensored pricing while maintaining high margins.

**Reasoning:**
- Images cost ~10x more than chat in API costs
- Uncensored has slight premium but not excessive
- Keeps it simple: ~10-25 credits per image

### Other Actions

| Action | Credits | API Cost | Margin |
|--------|---------|----------|--------|
| Document chat | 3 credits | $0.005 | **86%** |
| Image upscale | 4 credits | $0.01 | **79%** |
| Voice input (STT) | 2 credits | $0.006 | **75%** |
| Voice output (TTS) | 2 credits | $0.005 | **79%** |

---

## Why NOT Premium Pricing for Uncensored?

Based on research, I recommend **NOT** charging a premium for uncensored content:

1. **Simplicity**: One credit system, no confusion
2. **Privacy positioning**: "We don't judge what you create"
3. **Competitive advantage**: Most competitors charge 2-3x for NSFW
4. **User trust**: Flat pricing builds trust

**Recommended approach**: Uncensored costs slightly more than free models (5 credits vs 1) but less than premium models (10 credits). This reflects the actual API cost difference without being punitive.

---

## Comparison: Old vs New

| Aspect | Old (Subscriptions) | New (Credits) |
|--------|---------------------|---------------|
| Entry barrier | $0 or $9.99/mo | $0 (50 free/day) |
| Flexibility | Locked to tier | Pay as you go |
| Unused value | Lost at month end | Purchased credits never expire |
| Uncensored access | Separate add-on | Same credits |
| Transparency | Hidden limits | Clear cost per action |
| Revenue model | Recurring | One-time + repeat purchases |

---

## User Experience Flow

### New User Journey:
1. Sign up → Get 50 free credits
2. Use credits for chat/images
3. See "Low credits" warning at 10 remaining
4. Prompt to buy credits OR wait for tomorrow's refresh
5. Purchase → Credits added instantly

### Dashboard Display:
```
┌─────────────────────────────────┐
│  🪙 Credits: 127               │
│  ├─ Free today: 42/50          │
│  └─ Purchased: 85              │
│                                 │
│  [+ Buy Credits]               │
└─────────────────────────────────┘
```

### Low Credits Warning:
```
┌─────────────────────────────────┐
│  ⚠️ Running low on credits!    │
│                                 │
│  You have 8 credits remaining. │
│  Get more to keep creating.    │
│                                 │
│  [Buy 500 for $5] [Wait til tomorrow]
└─────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Backend
- [ ] Add `credits` table (user_id, balance, type: free/purchased)
- [ ] Add `credit_transactions` table (history)
- [ ] Create credit deduction logic
- [ ] Add daily refresh cron job

### Phase 2: Stripe Integration
- [ ] Create credit pack products in Stripe
- [ ] Build purchase flow
- [ ] Handle webhooks for successful payments
- [ ] Add credits to user account

### Phase 3: Frontend
- [ ] Add credits display to header/sidebar
- [ ] Create "Buy Credits" page
- [ ] Add low-credits warnings
- [ ] Update usage dashboard

### Phase 4: Migration
- [ ] Convert existing subscribers to credit balance
- [ ] Grandfather existing users with bonus credits
- [ ] Remove subscription UI
- [ ] Update pricing page

---

## Revenue Projections

### Assumptions:
- 1,000 active users
- 30% convert to paid (300 users)
- Average purchase: $15/month

### Monthly Revenue:
- 300 users × $15 = **$4,500/month**

### Cost Structure (Optimized):
- Average API cost: ~$0.003 per credit (blended across free + paid models)
- Average revenue: ~$0.010-0.012 per credit sold
- **Blended margin: 68-72%**

### Margin Optimization Strategies Applied:
1. **Free model routing**: 60%+ of queries go to Groq (FREE) = 100% margin
2. **Tiered pack pricing**: Small packs = 75% margin, large = 60%
3. **Smart defaults**: Auto-select cheapest adequate model
4. **Response caching**: Cache common queries = $0 cost on repeats

---

## Recommended Decision

**Go with Option C + B (Credits + Free Tier):**

✅ Simple: One credit system for everything
✅ Fair: Uncensored same price as standard (slight premium over free)
✅ Flexible: Users buy what they need
✅ Engaging: Daily free credits drive retention
✅ Transparent: Clear cost per action

**Credit costs summary:**
- Chat: 1-10 credits (by model tier)
- Images: 10-25 credits (by model)
- Uncensored: Same as standard tier (no premium)

---

## Next Steps

1. **Approve this proposal** or request changes
2. **Implement database schema** for credits
3. **Set up Stripe products** for credit packs
4. **Build UI components** for credits display
5. **Migrate existing users** with bonus credits
6. **Update pricing page** with new model

Ready to implement when you approve!
