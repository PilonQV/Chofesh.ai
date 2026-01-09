# EternalAI API Pricing Analysis

## Overview
- **Website:** https://eternalai.org
- **Focus:** Uncensored Image & Video Editing API
- **Tagline:** "Build anything uncensored"

## API Pricing (Standard)
| Type | Cost |
|------|------|
| Uncensored Image | $0.019 / image |
| Uncensored Video | $0.099 / video |

## Tiers

### Free Tier
- 3 images per day
- No credit card required
- Good for testing

### Standard (Pay as you go)
- $0.019 per image
- $0.099 per video
- No subscription required

### Custom (Enterprise)
- Dedicated GPU clusters
- Dedicated AI engineers
- Unlimited throughput
- Fast processing
- Volume discounts

## Key Features
- 50+ visual effects
- Full creative freedom (uncensored)
- Privacy (fully encrypted)
- Simple REST API
- Supports Shell, JavaScript, Python, Go

## API Endpoint
```
POST https://open.eternalai.org/generate
Headers:
  - x-api-key: <ETERNAL_API_KEY>
  - Content-Type: application/json

Body:
{
  "images": ["https://example.com/image.jpg"],
  "effect_id": "1"
}
```

## Comparison to Our Venice API
| Feature | EternalAI | Venice (Current) |
|---------|-----------|------------------|
| Image Cost | $0.019 | $0.01 |
| Video | $0.099 | Not available |
| Uncensored | Yes | Yes (Lustify) |
| Effects | 50+ visual effects | Text-to-image only |

## Verdict
EternalAI is more expensive per image ($0.019 vs $0.01) but offers:
- Video generation
- Visual effects/transformations
- Image-to-image editing

Could be useful for adding video generation or visual effects features.
