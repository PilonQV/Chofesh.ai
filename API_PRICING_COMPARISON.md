# API Pricing Comparison: Grok vs Perplexity (January 2026)

## Summary

| Feature | **Grok (xAI)** | **Perplexity** |
|---------|----------------|----------------|
| **Best Value Model** | Grok 4.1 Fast | Sonar |
| **Input Cost** | $0.20/1M tokens | $1.00/1M tokens |
| **Output Cost** | $0.50/1M tokens | $1.00/1M tokens |
| **Free Tier** | Promotional credits (varies) | $5/month API credits with Pro |
| **Web Search** | Built-in ($5/1K calls) | Built-in (included in request fee) |
| **Knowledge Cutoff** | Aug 2025 + real-time search | Real-time (always current) |

---

## Grok API Pricing (xAI)

### Token Pricing (per 1M tokens)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| **Grok 4.1 Fast** | $0.20 | $0.50 | Best value, 64 intelligence score |
| Grok 4.1 Fast (Reasoning) | $0.20 | $0.50 | Same price, better reasoning |
| Grok 4 | $3.00 | $15.00 | Frontier model, 65 intelligence |
| Grok 3 | $3.00 | $15.00 | Older model |
| Grok 3 Mini | $0.30 | $0.50 | Good value, 57 intelligence |

### Tools Pricing
- Web Search: $5 per 1,000 calls
- X (Twitter) Search: $5 per 1,000 calls
- Code Execution: $5 per 1,000 calls

### Monthly Cost Estimates
- Light use: $5-30/month
- Medium use: $30-150/month
- Heavy use: $150-800/month

### Pros
- ✅ Very cheap ($0.20/1M input tokens)
- ✅ Aug 2025 training cutoff (most recent)
- ✅ Built-in web & X search
- ✅ 2M token context window
- ✅ OpenAI-compatible API

### Cons
- ❌ Web search costs extra ($5/1K calls)
- ❌ No guaranteed free tier

---

## Perplexity API Pricing

### Token Pricing (per 1M tokens)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| **Sonar** | $1.00 | $1.00 | Quick facts, simple Q&A |
| Sonar Pro | $3.00 | $15.00 | Complex queries, research |
| Sonar Reasoning | $1.00 | $5.00 | Logic, math problems |
| Sonar Reasoning Pro | $2.00 | $8.00 | Complex problem-solving |
| Sonar Deep Research | $2.00 | $8.00 | Academic research, reports |

### Request Pricing (per 1K requests)
- Search API: $5.00 (raw search results only)
- Sonar models: Additional request fee based on search context size

### Pros
- ✅ Always real-time (no knowledge cutoff)
- ✅ Search built into every response
- ✅ $5/month API credits with Pro subscription
- ✅ Specialized for search-grounded answers

### Cons
- ❌ More expensive per token ($1 vs $0.20)
- ❌ Request fees add up
- ❌ Requires Pro subscription for API credits

---

## Cost Comparison Example

**Scenario:** 100 queries/day, 500 input + 500 output tokens each

### Grok 4.1 Fast
- Input: 100 × 500 × 30 = 1.5M tokens/month × $0.20 = **$0.30**
- Output: 100 × 500 × 30 = 1.5M tokens/month × $0.50 = **$0.75**
- Web Search: 100 × 30 = 3,000 calls × $0.005 = **$15.00**
- **Total: ~$16/month**

### Perplexity Sonar
- Input: 1.5M tokens × $1.00 = **$1.50**
- Output: 1.5M tokens × $1.00 = **$1.50**
- Request fees: ~$0.005 × 3,000 = **$15.00**
- **Total: ~$18/month**

---

## Recommendation

| Use Case | Recommended |
|----------|-------------|
| **Budget-conscious + recent data** | Grok 4.1 Fast |
| **Always real-time search** | Perplexity Sonar |
| **Complex reasoning** | Grok 4.1 Fast (Reasoning) |
| **Deep research reports** | Perplexity Sonar Deep Research |

**For Chofesh.ai:** Grok 4.1 Fast offers the best value with Aug 2025 training data and built-in web search. Perplexity is better if you need guaranteed real-time information in every response.
