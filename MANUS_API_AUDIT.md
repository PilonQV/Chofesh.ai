# Manus Built-in API Audit Report for Chofesh.ai

**Date:** January 1, 2026  
**Author:** Manus AI  
**Project:** Chofesh.ai (formerly LibreAI)

---

## Executive Summary

This report provides a comprehensive audit of the Manus platform's built-in APIs and their current utilization within the Chofesh.ai project. The analysis identifies which APIs are actively used, which remain untapped, and recommends feature enhancements that could leverage these capabilities to improve the platform's value proposition.

Chofesh.ai currently utilizes **3 of 7** available Manus built-in APIs. The unused APIs present significant opportunities for feature expansion, particularly in areas such as voice transcription, external data integration, owner notifications, and mapping services.

---

## Current API Utilization Status

| API Module | Status | Description | Current Usage |
|------------|--------|-------------|---------------|
| **LLM (invokeLLM)** | ✅ Active | Chat completions with multi-modal support | Primary chat functionality |
| **Image Generation (generateImage)** | ✅ Active | FLUX model image generation | Image creation feature |
| **Groq Integration** | ✅ Active | Free Llama/Mixtral models | Free tier routing |
| **Voice Transcription (transcribeAudio)** | ❌ Unused | Whisper-based speech-to-text | Not implemented |
| **Data API (callDataApi)** | ❌ Unused | External data sources (YouTube, etc.) | Not implemented |
| **Owner Notifications (notifyOwner)** | ❌ Unused | Push notifications to project owner | Not implemented |
| **Google Maps (makeRequest)** | ❌ Unused | Full Google Maps API access | Not implemented |

---

## Detailed API Analysis

### 1. LLM API (Currently Active)

The `invokeLLM` helper provides access to the Manus Forge API for chat completions. Chofesh.ai makes extensive use of this API for its core chat functionality.

**Current Implementation:**
- Multi-model chat with smart routing
- Support for system prompts, temperature, and top-p parameters
- Structured JSON responses via `response_format`
- Vision support for image analysis (available but not fully utilized)

**Capabilities Not Yet Leveraged:**
- **File Content Analysis:** The LLM API supports `file_url` content type for PDFs, audio, and video files. This could enable:
  - PDF document chat (currently only TXT/MD supported)
  - Audio file summarization
  - Video content analysis

**Recommendation:** Extend the document chat feature to support PDF files using the `file_url` content type with `mime_type: "application/pdf"`.

---

### 2. Image Generation API (Currently Active)

The `generateImage` helper uses the FLUX model for high-quality image generation. Chofesh.ai implements this with advanced controls.

**Current Implementation:**
- Text-to-image generation
- Negative prompts
- Aspect ratio selection
- Seed control for reproducibility
- CFG scale adjustment

**Capabilities Not Yet Leveraged:**
- **Image Editing:** The API supports `originalImages` parameter for image-to-image editing. This could enable:
  - Inpainting (edit parts of an image)
  - Style transfer
  - Image enhancement

**Recommendation:** Add an "Edit Image" feature allowing users to upload an existing image and modify it with text prompts.

---

### 3. Voice Transcription API (Not Implemented)

The `transcribeAudio` helper provides Whisper-based speech-to-text transcription. This API is fully configured but not utilized.

**Available Features:**
- Supports webm, mp3, wav, ogg, m4a formats
- 16MB file size limit
- Language detection and specification
- Timestamped segments with metadata
- Custom prompts for context

**Potential Use Cases:**
1. **Voice Message Transcription:** Allow users to record voice messages that are transcribed and sent as text to the AI
2. **Audio File Analysis:** Upload audio files (podcasts, meetings) for transcription and AI analysis
3. **Accessibility:** Improve accessibility for users who prefer voice input

**Implementation Effort:** Medium - requires frontend audio recording UI and backend tRPC procedure

**Recommendation:** Implement server-side voice transcription to complement the existing Web Speech API (browser-based) voice input. This would provide:
- Better accuracy than browser-based speech recognition
- Support for audio file uploads
- Offline transcription of recorded content

---

### 4. Data API (Not Implemented)

The `callDataApi` helper provides access to Manus API Hub for external data sources. This is a powerful but underutilized capability.

**Available Data Sources (Examples):**
- YouTube search and video data
- News aggregation
- Financial data
- Weather information
- And more via the Manus API Hub

**Potential Use Cases:**
1. **Web Search Enhancement:** Integrate real-time web search results into AI responses (currently the "Web Search" toggle is a placeholder)
2. **YouTube Integration:** Search and analyze YouTube content
3. **News Feed:** Provide current news context for AI conversations
4. **Research Assistant:** Pull data from multiple sources for comprehensive research

**Implementation Effort:** Low to Medium - API is ready to use, just needs frontend integration

**Recommendation:** Implement the "Web Search" feature properly using the Data API to fetch real-time information. This would significantly enhance the AI's ability to provide current, factual responses.

---

### 5. Owner Notifications API (Not Implemented)

The `notifyOwner` helper sends push notifications to the project owner through the Manus platform.

**Available Features:**
- Title (up to 1,200 characters)
- Content (up to 20,000 characters)
- Returns success/failure status

**Potential Use Cases:**
1. **New User Alerts:** Notify when new users sign up
2. **Usage Milestones:** Alert when usage thresholds are reached
3. **Error Monitoring:** Notify of critical errors or API failures
4. **Subscription Events:** Alert when users upgrade/downgrade (future Stripe integration)
5. **Content Moderation:** Flag potentially problematic content for review

**Implementation Effort:** Low - API is ready to use

**Recommendation:** Implement owner notifications for:
- New user registrations
- Daily usage summaries
- Error alerts
- Subscription changes (when Stripe is added)

---

### 6. Google Maps API (Not Implemented)

The `makeRequest` helper provides full access to Google Maps APIs through the Manus proxy. All authentication is handled automatically.

**Available Services:**
- Geocoding (address ↔ coordinates)
- Directions and routing
- Distance matrix calculations
- Place search and details
- Elevation data
- Time zone information
- Static map images

**Relevance to Chofesh.ai:** Limited direct relevance for an AI chat platform. However, potential use cases include:
- Location-based AI personas (characters with geographic context)
- Travel planning assistant feature
- Local business search integration

**Recommendation:** Low priority for Chofesh.ai unless expanding into location-based features.

---

## Feature Recommendations Summary

Based on the API audit, here are the recommended feature additions prioritized by impact and effort:

| Priority | Feature | API Used | Effort | Impact |
|----------|---------|----------|--------|--------|
| **High** | Real Web Search | Data API | Medium | High - Enables current information access |
| **High** | PDF Document Chat | LLM API (file_url) | Low | High - Expands RAG capabilities |
| **Medium** | Server-side Voice Transcription | Voice Transcription API | Medium | Medium - Better accuracy than browser |
| **Medium** | Owner Notifications | Notification API | Low | Medium - Operational awareness |
| **Medium** | Image Editing | Image Generation API | Medium | Medium - Expands creative tools |
| **Low** | Audio File Analysis | Voice + LLM APIs | Medium | Low - Niche use case |
| **Low** | Maps Integration | Maps API | High | Low - Not core to platform |

---

## Implementation Roadmap

### Phase 8: API Expansion (Recommended Next Steps)

1. **PDF Document Chat** (1-2 hours)
   - Update document upload to accept PDF files
   - Use LLM API with `file_url` content type
   - No new API integration needed, just configuration change

2. **Real Web Search Integration** (2-3 hours)
   - Implement Data API call for web search
   - Integrate results into chat context
   - Replace placeholder "Web Search" toggle with real functionality

3. **Owner Notifications** (1 hour)
   - Add notification triggers for key events
   - New user registration alerts
   - Daily usage summary

4. **Server-side Voice Transcription** (2-3 hours)
   - Add audio upload endpoint
   - Implement transcription tRPC procedure
   - Add UI for audio file upload

5. **Image Editing** (2-3 hours)
   - Add image upload for editing
   - Implement edit prompt interface
   - Use `originalImages` parameter

---

## Technical Notes

### Environment Variables Available

The following Manus-provided environment variables are configured:

```
BUILT_IN_FORGE_API_URL    - Base URL for all Manus APIs
BUILT_IN_FORGE_API_KEY    - Server-side authentication token
VITE_FRONTEND_FORGE_API_KEY - Frontend authentication token
VITE_FRONTEND_FORGE_API_URL - Frontend API URL
```

### API Endpoint Patterns

All Manus APIs follow a consistent pattern:

```typescript
// LLM API
POST ${FORGE_API_URL}/v1/chat/completions

// Image Generation
POST ${FORGE_API_URL}/images.v1.ImageService/GenerateImage

// Voice Transcription
POST ${FORGE_API_URL}/v1/audio/transcriptions

// Data API
POST ${FORGE_API_URL}/webdevtoken.v1.WebDevService/CallApi

// Notifications
POST ${FORGE_API_URL}/webdevtoken.v1.WebDevService/SendNotification

// Maps Proxy
GET ${FORGE_API_URL}/v1/maps/proxy/{endpoint}
```

---

## Conclusion

Chofesh.ai has a solid foundation utilizing the core Manus APIs for LLM chat and image generation. However, significant opportunities exist to enhance the platform by leveraging the unused APIs, particularly:

1. **Data API** for real web search functionality
2. **Voice Transcription** for improved voice input accuracy
3. **Owner Notifications** for operational awareness
4. **LLM file_url support** for PDF document chat

Implementing these features would bring Chofesh.ai closer to feature parity with competitors like Venice.ai while maintaining its privacy-focused differentiator.

---

## References

- Manus WebDev Template Documentation (internal)
- Chofesh.ai Project Files (`/home/ubuntu/libre-ai/server/_core/`)
- OpenAI Whisper API Documentation
- Google Maps Platform Documentation

