# Venice API Image Generation Pricing

Source: https://docs.venice.ai/overview/pricing#image-models

## Image Models - Priced per generation

| Model | Model ID | Price per Image |
|-------|----------|-----------------|
| GPT Image 1.5 | gpt-image-1-5 | $0.23 |
| Nano Banana Pro | nano-banana-pro | $0.18 |
| Flux 2 Max | flux-2-max | $0.09 |
| SeedreamV4.5 | seedream-v4 | $0.05 |
| Flux 2 Pro | flux-2-pro | $0.04 |
| Venice SD35 | venice-sd35 | $0.01 |
| HiDream | hidream | $0.01 |
| Lustify SDXL | lustify-sdxl | $0.01 |
| Lustify v7 | lustify-v7 | $0.01 |
| Qwen Image | qwen-image | $0.01 |
| Anime (WAI) | wai-illustrious | $0.01 |
| Z-Image Turbo | z-image-turbo | $0.01 |

## Editing (Inpainting)
- Qwen-Image: $0.04 per edit

## Our Cost Analysis

Using **HiDream** model (currently used in agent mode):
- Cost per image: **$0.01**
- 4 images = **$0.04** our cost

### Credit Pricing Options

**Option A: 4 credits for 1 image**
- User pays: 4 credits = $0.04 (at $0.01/credit)
- Our cost: $0.01
- Margin: $0.03 (75%)

**Option B: 10 credits for 4 images**
- User pays: 10 credits = $0.10 (at $0.01/credit)
- Our cost: $0.04 (4 x $0.01)
- Margin: $0.06 (60%)

**Recommendation:**
- Default: 1 image for 3 credits ($0.03 user / $0.01 cost = 67% margin)
- Batch: 4 images for 10 credits ($0.10 user / $0.04 cost = 60% margin)
