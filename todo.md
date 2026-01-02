# LibreAI Project TODO

## Core Infrastructure
- [x] Database schema (users, audit_logs tables)
- [x] Audit logging system with IP, timestamps, content hashes
- [x] Backend tRPC API endpoints

## Authentication & User Management
- [x] User authentication with Manus OAuth
- [x] Role-based access control (admin/user)
- [x] User profile management

## AI Chat Interface
- [x] Chat UI with message input and display
- [x] Multiple AI model selection dropdown
- [x] Streaming response support
- [x] Local encrypted conversation storage
- [x] Conversation history management

## AI Image Generation
- [x] Image generation UI with prompt input
- [x] Generated image display and gallery
- [x] Image download functionality

## Admin Dashboard
- [x] Admin-only route protection
- [x] Audit logs viewer with filtering
- [x] User activity monitoring
- [x] User management interface

## UI/UX Design
- [x] Elegant dark theme design
- [x] Responsive layout (desktop/mobile)
- [x] Navigation structure
- [x] Loading states and animations
- [x] Error handling UI

## Security & Privacy
- [x] Client-side encryption for conversations
- [x] Content hashing for audit logs
- [x] Secure API endpoints

---

## Phase 2 Enhancements

### Messaging & Copy Rewrite
- [x] Remove scary compliance warnings from all UI
- [x] Rewrite chat page copy to be empowering
- [x] Rewrite image generation page copy
- [x] Update landing page hero messaging
- [x] Create positive privacy framing throughout

### Legal & Trust Pages
- [x] Create Privacy Policy page
- [x] Create Terms of Service page
- [x] Link pages in footer navigation

### Landing Page Redesign
- [x] New hero section with better positioning
- [x] Highlight "Your AI, Your Rules" messaging
- [x] Add feature comparison section
- [x] Improve CTA buttons and conversion flow

### BYOK (Bring Your Own Key)
- [x] Database schema for user API keys (encrypted)
- [x] Settings page for API key management
- [x] Support OpenAI API keys
- [x] Support Anthropic API keys
- [x] Support Google API keys
- [x] API key validation on save
- [x] Key hint display (last 4 chars)
- [x] Toggle keys active/inactive

### Usage Tracking Dashboard
- [x] Database schema for usage tracking
- [x] Track tokens per request
- [x] Track image generations
- [x] User-facing usage dashboard
- [x] Cost estimation display
- [x] Usage history by type
- [x] Daily activity chart

### Document Chat (RAG)
- [x] File upload UI (TXT, MD files)
- [x] Document processing and text extraction
- [x] Text chunking for RAG
- [x] Document management interface
- [x] Chat with documents UI
- [x] Context-aware responses

## Testing
- [x] Unit tests for auth endpoints
- [x] Unit tests for BYOK endpoints
- [x] Unit tests for usage tracking
- [x] Unit tests for document endpoints
- [x] Unit tests for admin endpoints


---

## Phase 3: Smart Routing & Free Tier

### Smart Model Router
- [x] Query complexity analyzer (simple/medium/complex)
- [x] Auto-route simple queries to cheap models (GPT-4o-mini)
- [x] Auto-route complex queries to better models (GPT-4o)
- [x] Cost estimation before sending
- [x] User can override auto-selection

### Free Tier with Groq
- [x] Integrate Groq API for free Llama 3.1 access
- [x] Add Llama 3.1 8B (fast, free) option
- [x] Add Llama 3.1 70B (powerful, free) option
- [x] Add Mixtral 8x7B option
- [x] Fallback to platform models if Groq unavailable

### Tiered Model Selection UI
- [x] "Auto" mode - smart routing (default for paid)
- [x] "Free" mode - Groq models only (zero cost)
- [x] "Manual" mode - user picks specific model
- [x] Model tier badges (Free/Standard/Premium)
- [x] Real-time cost indicator per message

### Response Caching
- [x] Hash-based cache for identical prompts
- [x] Cache TTL configuration
- [x] Cache hit indicator in UI
- [x] User can clear their cache

### Prompt Templates Library
- [x] Pre-built templates for common tasks
- [x] Categories: Writing, Coding, Analysis, Creative
- [x] One-click template insertion
- [ ] User can save custom templates (future enhancement)


---
## Phase 4: Venice.ai Feature Parity

### Chat Enhancements
- [x] System Prompt field (custom AI instructions)
- [x] Temperature slider (creativity control)
- [x] Top P slider (response diversity)
- [x] Web Search toggle (real-time info)

### Image Generation Enhancements
- [x] Negative prompt field
- [x] Aspect ratio selector (1:1, 16:9, 9:16, 4:3, 3:4)
- [x] Seed input for reproducibility
- [x] Steps/Quality slider
- [x] CFG Scale/Adherence slider

### Voice Features
- [x] Voice input using Web Speech API
- [x] Voice output using Speech Synthesis API

### AI Characters/Personas
- [x] Characters database table
- [x] Create custom AI persona
- [x] Auto-generate character option
- [x] Rich backstory editor
- [x] Duplicate and evolve characters
- [x] Use character in chat

### Secure Sharing
- [x] Generate encrypted share links
- [x] View shared conversations
- [x] Share link expiration options

### Additional Models
- [ ] DeepSeek R1 integration (reasoning) - future
- [x] More Groq models (Mixtral, Llama)


---

## Phase 5: Rebranding to Chofesh.ai

- [x] Update site title and logo text
- [x] Update landing page branding
- [x] Update navigation references
- [x] Update Privacy Policy references
- [x] Update Terms of Service references
- [x] Update all UI copy mentioning LibreAI
- [x] Update package.json name
