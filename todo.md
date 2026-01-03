# Chofesh.ai Project TODO

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


---

## Phase 6: Production Readiness

### Groq API Integration
- [x] Request Groq API key from user
- [x] Add Groq API key to environment secrets
- [x] Test Groq models (Llama 3.1, Mixtral) work correctly
- [x] Verify free tier routing to Groq models

### Cookie Consent Banner (EU Compliance)
- [x] Create CookieConsent component
- [x] Store consent preference in localStorage
- [x] Show banner on first visit
- [x] Allow users to change preferences
- [x] Add cookie policy link


---

## Phase 7: Brand Identity

### Logo Design
- [x] Design unique Chofesh.ai logo concept
- [x] Generate logo variations
- [x] Integrate logo into platform header
- [x] Update favicon


---

## Phase 8: Manus API Expansion

### PDF Document Chat
- [x] Update document upload to accept PDF files
- [x] Use LLM API file_url for PDF analysis
- [x] Update Documents page UI for PDF support

### Real Web Search
- [x] Implement Data API integration for web search
- [x] Replace placeholder Web Search toggle with real functionality
- [x] Display search results in chat context

### Server-side Voice Transcription
- [x] Create voice transcription tRPC procedure
- [x] Add audio file upload endpoint
- [x] Integrate Whisper API for transcription

### Owner Notifications
- [x] Add notification on new user registration
- [x] Add notification on usage milestones
- [x] Add notification on critical errors

### Image Editing
- [x] Add image editing UI with edit mode
- [x] Implement edit prompt interface
- [x] Use originalImages parameter for image-to-image


---

## Bug Fixes (User Reported)

- [x] Fix logo inconsistency - sparkle icon still showing on some pages
- [x] Fix chat API error - "Failed to generate response" (missing crypto import)
- [x] Fix 404 page for "How It Works" link (changed to #features anchor)
- [x] Fix privacy page scroll position - opens at bottom instead of top
- [x] Rename all "Libre" references to "Chofesh" throughout codebase
- [x] Replace all Sparkles icons with Chofesh logo image


## Bug Fixes (User Reported - Round 2)

- [x] Fix tier selection buttons (Free/Standard/Premium) not clickable in chat
- [x] Replace loading spinner with animated Chofesh bird logo when AI is thinking


## Phase 9: Theme Toggle Feature

- [x] Add dark/light theme toggle button in navigation
- [x] Persist theme preference in localStorage
- [x] Add theme toggle in Settings page


## Bug Fixes (User Reported - Jan 1 2026 - Part 3)

- [ ] Fix tier selection buttons (Free/Standard/Premium) - still not clickable
- [ ] Investigate outdated data issue - AI returning June 2024 data instead of current

- [x] Integrate DuckDuckGo Instant Answers API for web search (free, no API key)


---

## Phase 10: Monetization & Subscription System

### Stripe Integration
- [x] Add Stripe feature to project
- [x] Configure subscription products (Free, Starter $5, Pro $15, Unlimited $30)
- [x] Create checkout flow for upgrades
- [x] Handle webhook events for subscription changes

### Usage Tracking & Slowdown
- [x] Add daily_queries column to users table
- [x] Track query count per user per day
- [x] Implement slowdown after limit (1 query/min)
- [ ] Show upgrade prompt when slowed down
- [ ] Reset daily counts at midnight

### Grok API Integration
- [x] Add Grok API configuration
- [x] Create Grok model router
- [x] Add Grok as model option in chat

### Subscription Management UI
- [x] Create subscription page showing current plan
- [x] Add upgrade/downgrade buttons
- [x] Show usage statistics (queries used/remaining)
- [ ] Display billing history (future enhancement)


---

## Phase 11: DeepSeek R1 & Smart Router Enhancement

### DeepSeek R1 Free Integration
- [x] Add OpenRouter API helper for DeepSeek R1 Free
- [x] Add DeepSeek R1 to available models list
- [x] Configure as free reasoning model option

### Enhanced Smart Router
- [x] Detect complex reasoning queries (math, code, logic)
- [x] Route simple queries → Groq Llama (FREE)
- [x] Route medium queries → Grok 3 Fast (cheap, most up-to-date)
- [x] Route complex reasoning → DeepSeek R1 (FREE via OpenRouter)
- [x] Show user which model was selected and why

---

## Phase 12: Competitive Pricing Research & Implementation

### Pricing Research
- [x] Research Venice.ai pricing tiers
- [x] Research ChatGPT Plus/Pro pricing
- [x] Research Claude Pro pricing
- [x] Research Perplexity Pro pricing
- [x] Research other AI chat platforms pricing
- [x] Compile pricing comparison table

### Pricing Implementation
- [x] Design 8% more affordable pricing tiers
- [x] Update pricing constants in codebase
- [x] Update Stripe products with new prices
- [x] Update pricing display on frontend
- [x] Test subscription flow (UI verified)


---

## Phase 13: Realistic Marketing Positioning

### Marketing Copy Updates
- [x] Update Home page hero and messaging to "private and unrestricted"
- [x] Update feature descriptions to be more accurate
- [x] Remove "uncensored" claims, replace with "creative freedom"
- [x] Update comparison table to reflect realistic capabilities
- [x] Update image generation page copy

### Image Generation Clarity
- [x] Clarify what FLUX can and cannot generate (in feature description)
- [x] Update image generation UI messaging
- [ ] Add helpful prompting tips (future enhancement)


---

## Phase 14: xAI/Grok Integration

- [x] Add xAI API key to project secrets (X_ai_key)
- [x] Verify Grok 3 Fast integration works (8 tests passing)
- [x] Test Smart Router with Grok model


---

## Phase 15: Add BYOK Option Back

- [x] Add BYOK pricing card to Home page pricing section


---

## Phase 16: Vercel Deployment with Custom Domain

- [ ] Install and configure Vercel CLI
- [ ] Authenticate with Vercel
- [ ] Configure project for Vercel deployment
- [ ] Deploy to Vercel
- [ ] Add custom domain chofesh.ai
- [ ] Update Cloudflare DNS records
- [ ] Verify deployment is live

---

## Phase 17: User Experience Improvements

- [x] Add user dropdown menu in header with Dashboard, Settings, Usage, Logout
- [x] Run full website audit (performance, SEO, accessibility)
- [x] Add PWA manifest for app install option
- [x] Add service worker for offline support
- [x] Add "Install App" button/prompt
- [x] Compress logo images (6.6MB → 95KB)
- [x] Add canonical URL
- [x] Add structured data (JSON-LD)
- [x] Create robots.txt
- [x] Create sitemap.xml
- [x] Add Content Security Policy
- [x] Protect admin pages with role-based access control (already implemented)
- [x] Performance: Convert logo to WebP 48x48, enable sourcemaps
- [x] Accessibility: Fix viewport, add main landmark, fix headings
- [x] Security: Add HSTS, COOP, X-Frame-Options headers, strengthen CSP
- [x] SEO: Update privacy link text
- [x] Install Geist fonts locally (remove CDN)
- [x] Add Permissions-Policy: unload=() header
## Phase 18: AI Personas & System Prompts

- [x] Clone and analyze system-prompts repository
- [x] Select best prompts for Chofesh.ai
- [x] Implement AI personas feature (20 curated personas in 7 categories)
- [x] Add persona selector to chat interface
- [x] Add persona library page with search and filtering
- [x] Add 23 unit tests for personas feature


## Phase 19: Advanced Task Templates from Prompts Repository

- [x] Add specialized task templates (Code Review, Writing Assistant, Research, etc.)
- [x] Created FUTURE_ROADMAP.md with comprehensive implementation suggestions
- [ ] Add memory/context management features inspired by Windsurf (see FUTURE_ROADMAP.md)
- [ ] Add structured output templates (tables, lists, documents) (see FUTURE_ROADMAP.md)

## Future Implementation Reference

See `FUTURE_ROADMAP.md` for detailed implementation suggestions including:
- Memory System (Windsurf-inspired)
- Thinking Mode / Chain of Thought (Claude/Devin-inspired)
- Artifacts / Document Mode (Claude/Notion-inspired)
- Code Workspace (Cursor/Windsurf/Replit-inspired)
- Deep Research Mode (Perplexity-inspired)
- Voice Conversations
- Workflows & Automation
- And 15+ more features with implementation details


## Phase 20: Advanced Features Implementation

### Memory System
- [x] Add memories table to database schema
- [x] Create memory CRUD operations in db.ts
- [x] Add memory router endpoints
- [x] Build memory management UI (/memory page)
- [ ] Auto-extract memories from conversations (future)

### Thinking Mode
- [x] Add thinking mode toggle to chat settings
- [x] Update chat backend to support thinking blocks (<think>...</think>)
- [x] Render thinking blocks in chat UI with collapsible sections
- [x] Add visual styling for thinking vs response

### Artifacts Panel
- [x] Create artifact types and schema (document, code, table, diagram, markdown)
- [x] Add artifact router endpoints (CRUD + versioning)
- [x] Build split-view interface (/artifacts page)
- [x] Implement artifact versioning with history
- [x] Add export options (copy, download)

### Tests
- [x] 156 unit tests passing


## Phase 21: Lighthouse Score Improvements

### Heading Hierarchy (Accessibility)
- [x] Add proper h1 tag: "AI Without Limits" (already present)
- [x] Ensure h2 follows h1 (verified)
- [x] Fix heading progression - changed h4 to h3 in footer, h4 to p in ComparisonRow

### Link Text (Accessibility)
- [x] Update privacy link text to be descriptive: "Privacy Policy" (already descriptive)
- [x] All links have meaningful text (verified)

### Image Alt Text (Accessibility)
- [x] Add alt="Chofesh Logo" to logo images
- [x] Add descriptive alt text to all images (AIChatBox, Chat, Documents)

### CSP Headers (Security)
- [x] Add Content-Security-Policy header with comprehensive directives
- [x] Configure script-src, style-src, font-src, img-src, connect-src
- [x] Add frame-ancestors, base-uri, form-action restrictions


## Phase 22: Update Home Page with New Features

- [x] Add Memory System feature card
- [x] Add Thinking Mode feature card
- [x] Add Artifacts Panel feature card
- [x] Add AI Personas Library feature card
- [x] Add Smart Routing feature card
- [x] Update grid layout to 4 columns on XL screens
- [x] Update feature descriptions to highlight new capabilities


## Phase 23: Subscription Management Page
- [x] Create dedicated /subscription page with all plan tiers
- [x] Show current plan highlighted with upgrade/downgrade options
- [x] Implement upgrade/downgrade flow via Stripe checkout
- [x] Add cancel subscription with confirmation dialog

## Phase 24-28: Security & Email Features
- [x] Enhanced Admin Dashboard with MRR, ARR, user growth stats
- [x] Dashboard auto-refresh (15s, 30s, 60s intervals)
- [x] OAuth security logging (login/logout events)
- [x] Email/password authentication
- [x] Email verification with Resend
- [x] Rate limiting (5 attempts/IP, 10 attempts/email)
- [x] Password reset flow

## Phase 29: Email Enhancements
- [x] Remove Manus OAuth option from login page (Google only now)
- [x] Add email unsubscribe link helper
- [x] Add login notification emails (sent on each email login)
- [x] Add subscription confirmation emails (new, upgrade, downgrade, cancel)
- [x] 204 tests passings
- [x] Show current plan highlighted with upgrade/downgrade options
- [x] Add plan comparison showing features per tier
- [x] Implement upgrade flow (change to higher tier via Stripe checkout)
- [x] Implement downgrade flow (change to lower tier via Stripe checkout)
- [x] Add "Cancel Subscription" with confirmation dialog and feature loss warning
- [x] Update Settings page to link to new subscription page
- [x] Remove Venice.ai comparison text from pricing section


## Phase 24: Enhanced Admin Dashboard

- [x] Add revenue metrics (MRR, ARR, conversion rate)
- [x] Add user growth stats (new users today, this week, active users)
- [x] Add usage statistics (queries today, total events)
- [x] Add subscription tier distribution with visual breakdown
- [x] Add top users by usage leaderboard
- [x] Add subscription status column to users table
- [x] Improved stats cards with subtitles and trends


## Phase 25: Dashboard Auto-Refresh & OAuth Security

- [x] Add auto-refresh to dashboard (default 30 seconds)
- [x] Add refresh interval toggle (Off, 15s, 30s, 60s) with countdown timer
- [x] Add login audit logging to Manus OAuth callback
- [x] Add login audit logging to Google OAuth callback
- [x] Verify logout logging (already implemented)
- [x] All auth events captured with IP, user agent, and metadata


## Phase 26: Email/Password Authentication

- [x] Add password hash fields to users table (passwordHash, emailVerified, resetToken, resetTokenExpiry)
- [x] Create password hashing utilities (bcrypt)
- [x] Add registration endpoint with email validation
- [x] Add login endpoint with session creation
- [x] Create Login page with email/password form + OAuth options
- [x] Create Registration page with password strength indicator
- [x] Add "Forgot Password" and "Reset Password" pages
- [x] Update Home page to link to /login instead of OAuth directly
- [x] Add 23 unit tests for email auth (179 total tests passing)

- [x] Create dedicated /subscription page with all plan tiers
- [x] Show current plan highlighted with upgrade/downgrade options
- [x] Add plan comparison showing features per tier
- [x] Implement upgrade flow (change to higher tier via Stripe checkout)
- [x] Implement downgrade flow (change to lower tier via Stripe checkout)
- [x] Add "Cancel Subscription" with confirmation dialog and feature loss warning
- [x] Update Settings page to link to new subscription page
- [x] Remove Venice.ai comparison text from pricing section


## Phase 24: Enhanced Admin Dashboard

- [x] Add revenue metrics (MRR, ARR, conversion rate)
- [x] Add user growth stats (new users today, this week, active users)
- [x] Add usage statistics (queries today, total events)
- [x] Add subscription tier distribution with visual breakdown
- [x] Add top users by usage leaderboard
- [x] Add subscription status column to users table
- [x] Improved stats cards with subtitles and trends


## Phase 25: Dashboard Auto-Refresh & OAuth Security

- [x] Add auto-refresh to dashboard (default 30 seconds)
- [x] Add refresh interval toggle (Off, 15s, 30s, 60s) with countdown timer
- [x] Add login audit logging to Manus OAuth callback
- [x] Add login audit logging to Google OAuth callback
- [x] Verify logout logging (already implemented)
- [x] All auth events captured with IP, user agent, and metadata


## Phase 26: Email/Password Authentication

- [ ] Add passwordHash field to users table
- [ ] Add emailVerified and verificationToken fields
- [ ] Create password hashing utilities (bcrypt)
- [ ] Add register endpoint with email/password
- [ ] Add login endpoint with email/password
- [ ] Create registration page UI
- [ ] Create login page UI with email/password option
- [ ] Add password reset request endpoint
- [ ] Add password reset confirmation endpoint
- [ ] Create forgot password UI
- [ ] Add email verification flow


## Phase 27: Email Verification & Rate Limiting

### Email Verification
- [ ] Add email verification token field to users table
- [ ] Create email sending utility using notification API
- [ ] Send verification email on registration
- [ ] Create email verification endpoint
- [ ] Create email verification page
- [ ] Require verification before full access

### Rate Limiting
- [ ] Create rate limiting table for tracking attempts
- [ ] Add rate limit check on login endpoint
- [ ] Block IP after 5 failed attempts (15 min cooldown)
- [ ] Block email after 10 failed attempts (30 min cooldown)
- [ ] Show remaining attempts to user
- [ ] Add rate limit bypass for verified users (optional)

- [x] Show current plan highlighted with upgrade/downgrade options
- [x] Add plan comparison showing features per tier
- [x] Implement upgrade flow (change to higher tier via Stripe checkout)
- [x] Implement downgrade flow (change to lower tier via Stripe checkout)
- [x] Add "Cancel Subscription" with confirmation dialog and feature loss warning
- [x] Update Settings page to link to new subscription page
- [x] Remove Venice.ai comparison text from pricing section


## Phase 24: Enhanced Admin Dashboard

- [x] Add revenue metrics (MRR, ARR, conversion rate)
- [x] Add user growth stats (new users today, this week, active users)
- [x] Add usage statistics (queries today, total events)
- [x] Add subscription tier distribution with visual breakdown
- [x] Add top users by usage leaderboard
- [x] Add subscription status column to users table
- [x] Improved stats cards with subtitles and trends


## Phase 25: Dashboard Auto-Refresh & OAuth Security

- [x] Add auto-refresh to dashboard (default 30 seconds)
- [x] Add refresh interval toggle (Off, 15s, 30s, 60s) with countdown timer
- [x] Add login audit logging to Manus OAuth callback
- [x] Add login audit logging to Google OAuth callback
- [x] Verify logout logging (already implemented)
- [x] All auth events captured with IP, user agent, and metadata


## Phase 26: Email/Password Authentication

- [x] Add password hash fields to users table (passwordHash, emailVerified, resetToken, resetTokenExpiry)
- [x] Create password hashing utilities (bcrypt)
- [x] Add registration endpoint with email validation
- [x] Add login endpoint with session creation
- [x] Create Login page with email/password form + OAuth options
- [x] Create Registration page with password strength indicator
- [x] Add "Forgot Password" and "Reset Password" pages
- [x] Update Home page to link to /login instead of OAuth directly
- [x] Add 23 unit tests for email auth


## Phase 27: Email Verification & Rate Limiting

- [x] Add verification token fields to users table (verificationToken, verificationTokenExpiry)
- [x] Create email verification utilities (generateVerificationToken, isVerificationTokenExpired)
- [x] Add rate_limits table for tracking login attempts
- [x] Implement rate limiting (5 attempts per IP/15min, 10 attempts per email/30min)
- [x] Create email verification page (/verify-email)
- [x] Add verification check to login flow (blocks unverified users)
- [x] Show rate limit warnings in login UI (remaining attempts, blocked message)
- [x] Add 24 unit tests for security features (203 total tests passing)


## Phase 28: Resend Email Integration

- [x] Add Resend API key to project secrets
- [x] Create Resend email service utility (verification, password reset, welcome emails)
- [x] Update registration to send real verification emails via Resend
- [x] Update password reset to send real emails via Resend
- [x] Add resend verification email endpoint
- [x] Add "Resend Verification Email" button on login page
- [x] Send welcome email after verification
- [x] 204 tests passing


## Phase 29: Email Enhancements & Login Cleanup

- [ ] Remove "Continue with Manus" OAuth option from login page
- [ ] Add email unsubscribe link to marketing emails
- [ ] Add login notification emails (new device/location alerts)
- [ ] Add subscription confirmation emails (upgrade/downgrade receipts)


## Phase 30: Deployment Bug Fix

- [ ] Fix Resend API key initialization error on Render deployment
- [ ] Make Resend initialization graceful when API key is missing


## Phase 30: Deployment Bug Fix

- [x] Fix Resend API key initialization error on Render deployment
- [x] Make Resend initialization graceful when API key is missing


## Phase 31: Admin Page Bug Fix

- [x] Fix /admin route not loading admin dashboard in production
- [x] Verify admin role check is working correctly
- [x] Add proper "Access Denied" message for unauthenticated users instead of blank page


## Phase 32: Database Foreign Key Fix

- [x] Add CASCADE delete to audit_logs foreign key
- [x] Add CASCADE delete to all user-related tables
- [x] Push schema changes to database


## Phase 33: Email Verification Bug

- [x] Investigate why email verification is not being sent
- [x] Check Resend API key configuration
- [x] Test email sending functionality
- [x] Add RESEND_API_KEY to Render production environment
- [x] Trigger deployment to apply changes


## Phase 34: Mobile Responsive Fix

- [x] Fix chat page header getting cut off on mobile
- [x] Ensure proper spacing and layout on small screens
- [x] Add safe area insets for iOS devices
- [x] Make header controls responsive (icon-only on mobile)


## Phase 35: Login Notification Improvement

- [x] Only send login notification email for new/different devices
- [x] Track device fingerprint (user agent hash) for each user
- [x] Compare current login device with known devices
- [x] Register new devices and update last used timestamp for known devices


## Phase 36: Bug Fixes

- [x] Fix scroll not working on homepage (caused by overflow:hidden CSS)
- [x] Fix logout not working (was using manual cookie clear instead of useAuth logout)


## Phase 37: Light Mode Header Contrast

- [x] Fix header navigation links visibility in light mode (changed from text-muted-foreground to text-foreground/70 with font-medium)


## Phase 38: Stripe Live Migration

- [ ] Get current test products from Stripe
- [ ] Create products and prices in live mode
- [ ] Update environment variables with live keys


## Phase 39: Remove Login Notification Emails

- [x] Disable login notification emails completely (removed from email auth login flow)


## Phase 40: Mobile Chat Layout Fix

- [x] Fix bottom content cut off on mobile (Premium tier, input box)
- [x] Fix header getting hidden after scroll on mobile
- [x] Ensure proper scroll behavior on mobile chat page
- [x] Add safe area insets for iOS devices
