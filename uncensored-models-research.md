# Uncensored AI Models Research

## Key Finding: Venice Uncensored via OpenRouter

**Model:** `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`

**Details:**
- Based on Mistral-Small-24B-Instruct-2501
- Developed by dphn.ai in collaboration with Venice.ai
- **FREE** - $0/M input tokens, $0/M output tokens
- 32,768 context window
- Available via OpenRouter API (which we already use!)

**What makes it "uncensored":**
- Removes default safety and alignment layers
- Preserves user control over alignment, system prompts, and behavior
- Designed for "advanced and unrestricted use cases"
- Emphasizes steerability and transparent behavior

## Implementation Strategy

Since we already use OpenRouter for DeepSeek R1, we can easily add Venice Uncensored:

1. Add Venice Uncensored to our model list
2. Create detection logic for "restricted content" requests
3. Auto-route such requests to Venice Uncensored
4. Keep other models for general queries (better quality for normal tasks)

## Model ID for OpenRouter
```
cognitivecomputations/dolphin-mistral-24b-venice-edition:free
```

## Pricing Comparison
| Model | Input | Output |
|-------|-------|--------|
| Venice Uncensored | FREE | FREE |
| DeepSeek R1 | FREE | FREE |
| Groq Llama | FREE | FREE |
| Grok 3 Fast | $0.0002/1K | $0.0002/1K |

## Caveats
- Even Venice has some guardrails for truly illegal content (CSAM, etc.)
- Quality may be lower than GPT-4 or Claude for complex reasoning
- Best used as a fallback when other models refuse

## Recommended Approach
1. Try user's preferred model first
2. If model refuses (detects refusal patterns in response)
3. Automatically retry with Venice Uncensored
4. Inform user that response came from "unrestricted model"
