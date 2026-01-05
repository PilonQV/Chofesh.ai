# Manus API Analysis & Implementable Features for Chofesh.ai

**Date:** January 5, 2026

---

## Executive Summary

After reviewing the Manus platform APIs available to Chofesh.ai, I've identified 12 built-in services that can be leveraged for new features. The platform provides a comprehensive suite of AI, data, and infrastructure APIs through the Forge API system.

---

## Available Manus APIs

### 1. LLM / Chat Completions API
**File:** `server/_core/llm.ts`

| Capability | Details |
|------------|---------|
| Model | Gemini 2.5 Flash (default) |
| Features | Multi-modal (text, images, files, audio, video) |
| Tools | Function calling with tool_choice |
| Structured Output | JSON schema response format |
| Max Tokens | 32,768 |

**Current Usage:** Chat, code review, knowledge base queries

**New Feature Ideas:**
- **Document Summarization** - Auto-summarize uploaded PDFs/documents
- **Multi-modal Chat** - Allow image/audio inputs in conversations
- **AI Writing Assistant** - Grammar, style, and tone suggestions

---

### 2. Vector Embeddings API
**File:** `server/_core/embeddings.ts`

| Capability | Details |
|------------|---------|
| Model | text-embedding-3-small |
| Batch Support | Yes |
| Similarity | Cosine similarity helper included |

**Current Usage:** Knowledge base semantic search

**New Feature Ideas:**
- **Smart Conversation Search** - Search past conversations by meaning
- **Similar Document Finder** - "Find documents like this one"
- **Automatic Tagging** - AI-generated tags based on content similarity

---

### 3. Image Generation API
**File:** `server/_core/imageGeneration.ts`

| Capability | Details |
|------------|---------|
| Generation | Text-to-image |
| Editing | Image-to-image with prompts |
| Storage | Auto-saves to S3 |

**Current Usage:** Image generation page

**New Feature Ideas:**
- **Chat-Integrated Image Gen** - Generate images directly in chat
- **Image Variations** - Create variations of uploaded images
- **Style Transfer** - Apply artistic styles to photos

---

### 4. Voice Transcription API (Whisper)
**File:** `server/_core/voiceTranscription.ts`

| Capability | Details |
|------------|---------|
| Model | Whisper-1 |
| Formats | webm, mp3, wav, ogg, m4a |
| Max Size | 16MB |
| Output | Text + timestamps + language detection |

**Current Usage:** Voice input in chat

**New Feature Ideas:**
- **Meeting Transcription** - Upload meeting recordings for full transcription
- **Voice Notes** - Save and organize voice memos with searchable text
- **Podcast Summarizer** - Transcribe and summarize podcast episodes

---

### 5. Google Maps API (Full Suite)
**File:** `server/_core/map.ts`

| Endpoint | Capability |
|----------|------------|
| Geocoding | Address ↔ coordinates |
| Directions | Navigation routes |
| Distance Matrix | Multi-point distances |
| Places Search | Find businesses/POIs |
| Place Details | Reviews, hours, contact |
| Elevation | Altitude data |
| Time Zone | Timezone info |
| Roads | Snap to roads, speed limits |
| Autocomplete | Real-time suggestions |
| Static Maps | Generate map images |

**Current Usage:** Not yet implemented

**New Feature Ideas:**
- **Location-Aware AI** - "Find restaurants near me" in chat
- **Trip Planner** - AI-powered travel itinerary builder
- **Local Business Finder** - Search and compare local services
- **Route Optimizer** - Multi-stop route planning

---

### 6. Data API (External Data Sources)
**File:** `server/_core/dataApi.ts`

| Capability | Details |
|------------|---------|
| Format | Generic API caller |
| Example | YouTube search API |
| Auth | Bearer token via Forge |

**Current Usage:** Web search

**New Feature Ideas:**
- **YouTube Integration** - Search and summarize YouTube videos
- **News Aggregator** - Pull news from multiple sources
- **Stock Data** - Real-time financial information
- **Weather API** - Location-based weather in chat

---

### 7. DuckDuckGo Instant Answer API
**File:** `server/_core/duckduckgo.ts`

| Capability | Details |
|------------|---------|
| Features | Instant answers, definitions, summaries |
| Related Topics | Up to 3 related results |
| No API Key | Free, no authentication needed |

**Current Usage:** Web search fallback

**New Feature Ideas:**
- **Quick Facts Widget** - Instant answers in sidebar
- **Definition Lookup** - Hover-to-define technical terms
- **Research Assistant** - Auto-fetch background info on topics

---

### 8. OpenRouter API (DeepSeek R1 Free)
**File:** `server/_core/openrouter.ts`

| Capability | Details |
|------------|---------|
| Model | DeepSeek R1 (reasoning model) |
| Cost | Free tier |
| Best For | Math, code, complex reasoning |

**Current Usage:** Smart router for complex queries

**New Feature Ideas:**
- **Math Solver** - Step-by-step math problem solving
- **Code Debugger** - Advanced debugging with reasoning
- **Logic Puzzles** - Solve complex logical problems

---

### 9. Grok API (xAI)
**File:** `server/_core/grok.ts`

| Capability | Details |
|------------|---------|
| Model | Grok-3-fast |
| Provider | xAI |
| Format | OpenAI-compatible |

**Current Usage:** Alternative AI model option

**New Feature Ideas:**
- **Real-time Information** - Grok's access to X/Twitter data
- **Humor Mode** - Grok's unique personality for casual chat
- **Current Events** - Up-to-date news and trends

---

### 10. Email Service (Resend)
**File:** `server/_core/resend.ts`

| Capability | Details |
|------------|---------|
| Provider | Resend |
| Features | Transactional emails |

**Current Usage:** Email verification, password reset

**New Feature Ideas:**
- **Chat Export via Email** - Send conversation summaries
- **Daily Digest** - Email summary of AI interactions
- **Scheduled Reports** - Automated usage reports

---

### 11. Notification Service
**File:** `server/_core/notification.ts`

| Capability | Details |
|------------|---------|
| Target | Project owner |
| Max Title | 1,200 chars |
| Max Content | 20,000 chars |

**Current Usage:** System notifications

**New Feature Ideas:**
- **Alert System** - Notify on important events
- **Usage Alerts** - Warn when approaching limits
- **Security Notifications** - Login alerts, suspicious activity

---

### 12. S3 Storage
**File:** `server/storage.ts`

| Capability | Details |
|------------|---------|
| Operations | Put, Get (presigned URLs) |
| Public | Yes (direct URLs) |

**Current Usage:** Image storage, document uploads

**New Feature Ideas:**
- **File Manager** - Full file management interface
- **Media Gallery** - Organized media library
- **Backup/Export** - Export all user data

---

## Top 10 Recommended Features to Implement

Based on the available APIs and current platform capabilities, here are the highest-impact features:

| Priority | Feature | APIs Used | Effort | Impact |
|----------|---------|-----------|--------|--------|
| 1 | **Location-Aware Chat** | Maps, LLM | Medium | High |
| 2 | **Meeting Transcription** | Whisper, LLM, S3 | Medium | High |
| 3 | **YouTube Video Summarizer** | Data API, LLM | Low | High |
| 4 | **Smart Conversation Search** | Embeddings | Low | Medium |
| 5 | **Trip Planner** | Maps, LLM | High | High |
| 6 | **Document Summarization** | LLM | Low | Medium |
| 7 | **Chat Image Generation** | Image Gen, LLM | Low | Medium |
| 8 | **Daily Digest Emails** | Resend, LLM | Medium | Medium |
| 9 | **Real-time News in Chat** | Data API, LLM | Medium | Medium |
| 10 | **Voice Notes with Search** | Whisper, Embeddings, S3 | High | High |

---

## GitHub API Status

**Note:** The Manus platform does not include a built-in GitHub API integration. The current GitHub code review feature uses direct GitHub REST API calls with user-provided personal access tokens.

**Options for GitHub Enhancement:**
1. Continue using user-provided PATs (current approach)
2. Implement GitHub OAuth for seamless authentication
3. Use GitHub App installation for organization-level access

---

## Conclusion

Chofesh.ai has access to a powerful suite of Manus APIs that are underutilized. The Google Maps API in particular offers significant potential for location-aware AI features. The combination of LLM + Embeddings + Voice Transcription enables sophisticated voice-first experiences.

**Quick Wins (Low Effort, High Impact):**
1. YouTube Video Summarizer
2. Smart Conversation Search
3. Document Summarization
4. Chat-integrated Image Generation

**Strategic Features (Higher Effort, Transformative):**
1. Location-Aware AI Assistant
2. Full Meeting Transcription Suite
3. AI Trip Planner
4. Voice Notes with Semantic Search
