# Luma AI API Pricing Analysis

## Overview
- **Website:** https://lumalabs.ai
- **Products:** Ray (Video), Photon (Image)
- **Focus:** High-quality video and image generation

## Video Generation (Ray Models)

### API Costs by Model
| Model | Cost per Million Pixels |
|-------|------------------------|
| Ray 1.6 | $0.0032 |
| Ray 2 | $0.0064 |
| Ray Flash 2 | $0.0022 |

### Approximate Video Costs (16:9, no audio)
| Resolution | Duration | Ray 2 | Ray Flash 2 |
|------------|----------|-------|-------------|
| 540p | 5 sec | $0.40 | $0.14 |
| 540p | 9 sec | $0.72 | $0.25 |
| 720p | 5 sec | $0.71 | **$0.24** |
| 720p | 9 sec | $1.27 | $0.44 |
| 1080p | 5 sec | $0.86 | $0.39 |
| 1080p | 9 sec | $1.54 | $0.71 |
| 4K | 5 sec | $0.96 | $0.49 |
| 4K | 9 sec | $1.72 | $0.89 |

### Additional Features
| Feature | Cost |
|---------|------|
| Upscale 540p→720p | $0.06/sec |
| Upscale 540p→1080p | $0.09/sec |
| Upscale 540p→4K | $0.11/sec |
| Add Audio | $0.02/sec |

## Image Generation (Photon Models)

| Model | Cost per Million Pixels | 1080p Image Cost |
|-------|------------------------|------------------|
| Photon | $0.0073 | ¢1.51 (~$0.015) |
| Photon Flash | $0.0019 | ¢0.39 (~$0.004) |

## Key Features
- Text to Video
- Image to Video
- Keyframe control (start/end images)
- Video extend
- Seamless loops
- Camera control
- Variable aspect ratios
- Character reference (consistent faces)
- Visual/style reference

## Comparison Summary

### Video Generation Costs
| Provider | 5-sec 720p Video | Notes |
|----------|------------------|-------|
| Luma Ray Flash 2 | $0.24 | Best value |
| Luma Ray 2 | $0.71 | Higher quality |
| EternalAI | $0.099 | Uncensored focus |

### Image Generation Costs
| Provider | Per Image | Notes |
|----------|-----------|-------|
| Venice (HiDream) | $0.01 | Uncensored available |
| Luma Photon Flash | $0.004 | Cheapest |
| Luma Photon | $0.015 | Higher quality |
| EternalAI | $0.019 | Uncensored focus |

## Recommendation for Chofesh.ai

**For Video Generation:**
- Luma Ray Flash 2 at $0.24/video (5 sec, 720p) is competitive
- Could charge users 25-30 credits ($0.25-0.30) for 60%+ margin
- EternalAI at $0.099/video is cheaper but less features

**For Images:**
- Keep Venice at $0.01/image (good balance of cost and uncensored support)
- Luma Photon Flash at $0.004 could be alternative for SFW content

**Playbox Technology:**
- Based on research, Playbox.vip likely uses custom fine-tuned models
- They focus on "templates" - pre-trained motion patterns users can apply
- Their tech is proprietary, not available via API
