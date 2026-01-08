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


## Phase 41: Chat Scroll & Admin Enhancements

- [ ] Fix chat auto-scroll issue when messages are added
- [ ] Enhance admin user management with detailed user view (click to expand)
- [ ] Show user's generated images in admin panel
- [ ] Add user activity details (chat history, image generations, usage stats)


---

## Phase 18: Admin Dashboard Enhancements & Chat Auto-Scroll Fix

### Chat Auto-Scrolling Fix
- [x] Fix auto-scroll when new messages are added
- [x] Fix auto-scroll during AI response streaming
- [x] Add isGenerating to scroll dependency array

### Generated Images Database
- [x] Create generated_images table in schema
- [x] Add columns: userId, imageUrl, prompt, model, status, metadata
- [x] Add isEdit and originalImageUrl columns for edit tracking
- [x] Create db helper functions for CRUD operations
- [x] Push database schema changes

### Image Generation Tracking
- [x] Update image.generate mutation to save images to database
- [x] Update imageEdit.edit mutation to save edited images
- [x] Track failed generation attempts with status="failed"
- [x] Store generation metadata (duration, parameters)

### Admin Dashboard - Images Tab
- [x] Create new Images tab in admin dashboard
- [x] Display image grid with thumbnails
- [x] Show image stats (total, last 24h, last 7d, by model)
- [x] Add status filter (completed/failed)
- [x] Add image preview modal
- [x] Add delete image functionality
- [x] Show prompt, user, and timestamp on hover

### Admin Dashboard - Enhanced User Management
- [x] Add "View" button to see user details
- [x] Create user details dialog with activity info
- [x] Show user's generated images in dialog
- [x] Show user's recent activity in dialog
- [x] Add user details API endpoint

### Testing
- [x] Update test mocks for generated images functions
- [x] All 204 tests passing


---

## Phase 19: User Image Gallery

### Personal Gallery Page
- [x] Create user gallery page component
- [x] Add tRPC endpoint to fetch user's generated images
- [x] Display images in responsive grid layout
- [x] Add image preview modal on click
- [x] Show prompt, date, and model info
- [x] Add download button for images
- [x] Add delete functionality for own images
- [x] Add navigation link to gallery page
- [x] Update messaging: "Your images are stored securely and accessible from any device"


---

## Phase 20: Accessibility Optimization

### WAVE Report Fixes
- [x] Fix "No heading structure" alert on homepage
- [x] Add proper h1, h2, h3 heading hierarchy
- [x] Ensure all pages have proper heading structure
- [x] Add ARIA landmarks (role="banner", role="main", etc.)


---

## Bug Fixes (User Reported - Jan 3 2026)

- [x] Fix chat scroll not working - users cannot scroll up to see full response or message history


---

## Phase 21: Performance Optimization (Lighthouse Score 72 → 90+)

### Image Optimization
- [x] Convert chofesh-logo.png to WebP format
- [x] Resize logo to appropriate dimensions (48x48 instead of 512x512)
- [x] Created multiple sizes (48, 96, 192) for responsive use

### JavaScript Optimization
- [x] Code split heavy components (Chat, ImageGen, etc.) with React.lazy
- [x] Implemented Suspense with loading fallback
- [x] Only Home and Login pages eagerly loaded

### CSS/Font Optimization
- [x] Fonts bundled locally via @fontsource (no external requests)
- [x] Updated service worker cache to v2

### Render Blocking
- [x] Reduced logo image from 94KB to 1.4KB (48x48 WebP)
- [x] Lazy loading reduces initial bundle size significantly



---

## Future Features: Multi-Language Support (i18n)

- [ ] Add language selector dropdown in UI (header/settings)
- [ ] Implement i18n framework (react-i18next or similar)
- [ ] Translate UI to Spanish
- [ ] Translate UI to Hebrew
- [ ] Translate UI to French
- [ ] Translate UI to German
- [ ] Translate UI to Portuguese
- [ ] Auto-detect user's browser language preference
- [ ] Add "Chat in any language" messaging to homepage/marketing
- [ ] Translate landing page content for key markets


## Bug Fix: Image Generation Guidance in Chat

- [x] Add system prompt guidance to redirect users to Generate Images feature when they ask for images in chat


## Browser Language Detection (Auto-Respond in User Language)

- [ ] Detect browser language using navigator.language in React
- [ ] Pass detected language to chat.send tRPC endpoint
- [ ] Inject language preference into AI system prompt (e.g., "Respond in Hebrew")
- [ ] AI automatically responds in user's preferred language without UI translation


## Phase 25: New Features from Roadmap

### Image in Chat (Vision)
- [x] Add image upload button to chat input
- [x] Upload images to S3 storage
- [x] Pass image URL to LLM with vision capability
- [x] Display uploaded images in chat messages
- [x] Support multiple images per message

### Deep Research Mode
- [x] Add "Deep Research" toggle in chat settings
- [x] Implement multi-step search (search → analyze → follow-up)
- [x] Add inline citations with source URLs
- [x] Show research progress indicator (via loading state)
- [x] Generate research summary with sources

### Response Formatting Modes
- [x] Add format selector dropdown (Detailed/Concise/Bullet/Table)
- [x] Inject format instructions into system prompt
- [x] Add quick toggle buttons in chat header
- [ ] Persist format preference per conversation (future enhancement)


## Phase 26: Vision Badge on Homepage

- [x] Add "Vision" feature badge to homepage features section
- [x] Add "Deep Research" feature badge to homepage features section

## Phase 27: Improve Voice Capture Speed

- [x] Implement continuous voice recognition mode
- [x] Real-time speech capture as user speaks
- [x] Auto-populate input field with transcribed text
- [x] Visual feedback during continuous listening (pulsing mic button, red border on input)

## Phase 28: Local Models (Ollama Integration)

- [x] Add Ollama settings section in Settings page
- [x] Allow users to configure local Ollama endpoint URL
- [x] Detect available local models from Ollama API
- [x] Add "Local" option to model selector in chat
- [x] Route chat requests to local Ollama when selected
- [x] Show connection status indicator for local models
- [x] Handle offline/unavailable Ollama gracefully

## Phase 29: Code Workspace (Monaco Editor)

- [x] Create /code route and CodeWorkspace page
- [x] Integrate Monaco editor for code editing
- [x] Add file tree sidebar with virtual file system
- [x] Implement AI code assistance (explain, refactor, generate)
- [x] Add syntax highlighting for multiple languages
- [x] Support creating, editing, deleting files
- [x] Add code execution preview (for HTML/JS)

### Phase 30: Workflows (Visual Builder)
- [x] Create /workflows route and Workflows page
- [x] Build visual node-based workflow editor
- [x] Implement workflow nodes: Input, AI, Condition, Output, Transform
- [x] Add drag-and-drop node placement
- [x] Connect nodes with visual edges
- [x] Save/load workflow definitions
- [x] Execute workflows with real AI calls

## Phase 31: Navigation & Homepage Updates

- [x] Add Code Workspace link to sidebar navigation
- [x] Add Workflows link to sidebar navigation  
- [x] Add Code Workspace feature badge to homepage
- [x] Add Workflows feature badge to homepage

## Phase 32: Homepage & UX Improvements

- [x] Fix header visibility in light mode (buttons hard to see against light background)
- [x] Add Local Models (Ollama) feature badge to homepage
- [x] Create onboarding tooltips for Code Workspace on first visit
- [x] Create onboarding tooltips for Workflows on first visit

## Phase 33: Header Fix & Sidebar Update

- [x] Remove grey shadow from header in light mode
- [x] Add Local Models (Ollama) link to chat sidebar

## Phase 34: Navigation Button Styling

- [x] Style nav buttons (Features, Pricing, Privacy Policy) to match Get Started button palette (using primary color)


## Phase 35: Code Review Bot (Full Implementation)

- [x] Create /code-review route and CodeReview page
- [x] Add code paste area with language detection
- [x] Implement security vulnerability scanning (SQL injection, XSS, etc.)
- [x] Add performance analysis suggestions
- [x] Implement severity ratings (Critical, Warning, Info)
- [x] Add style/convention checking
- [x] Generate actionable fix suggestions
- [x] Export review report

### Phase 36: Knowledge Base / RAG (Full Implementation)
- [x] Create /knowledge route and KnowledgeBase page
- [x] Add multi-document upload and organization
- [x] Implement vector embeddings for semantic search
- [x] Add document workspace with folders
- [x] Implement citation to specific pages/sections
- [x] Add semantic search across all documents
- [x] Create chat interface for knowledge base queries


## Phase 37: Ask Dia Links, GitHub Code Review, Vector Embeddings

### Ask Dia Links
- [x] Parse AI responses for key terms/concepts
- [x] Make terms clickable to trigger follow-up questions
- [x] Add visual styling for clickable terms (dotted underline + icon)
- [x] Handle click to auto-populate chat input

### GitHub Integration for Code Review
- [x] Add GitHub token-based authentication
- [x] Fetch repository file tree
- [x] Allow selecting files/folders for review
- [x] Multi-file analysis with cross-file context
- [x] Show results organized by file

### Vector Embeddings for Knowledge Base
- [x] Integrate OpenAI embeddings API (using Forge API)
- [x] Store embeddings in database with document chunks
- [x] Implement cosine similarity search
- [x] Replace text search with vector similarity
- [x] Show relevance scores based on actual similarity


## Phase 38: Homepage Feature Showcase Update

- [x] Review and reorganize feature cards for better visibility
- [x] Highlight newest features (Ask Dia Links, GitHub Code Review, Vector Search)
- [x] Improve feature card descriptions and badges
- [x] Ensure consistent layout and visual hierarchy


## Phase 39: Comprehensive Security & UX Audit

### Security & Vulnerability Audit
- [x] Research best security audit tools for web applications
- [x] Run npm audit for dependency vulnerabilities
- [x] Run static code analysis for security issues
- [x] Check for common web vulnerabilities (XSS, CSRF, SQL injection)
- [x] Audit authentication and authorization flows
- [x] Review API endpoint security
- [x] Check for sensitive data exposure

### UI/UX Audit
- [x] Run Lighthouse audit for performance and accessibility
- [x] Check WCAG accessibility compliance
- [x] Review mobile responsiveness
- [x] Analyze user flow and navigation
- [x] Check loading states and error handling

### Business & Marketing Analysis
- [x] Competitive positioning analysis
- [x] Value proposition clarity
- [x] Conversion funnel optimization
- [x] Trust signals and social proof
- [x] SEO and discoverability

### Report Delivery
- [x] Compile comprehensive expert report
- [x] Provide actionable recommendations


## Phase 40: Dependency Updates & Performance Optimizations

### Dependency Updates
- [x] Update esbuild to 0.25.12
- [x] Update vite to 7.3.0
- [x] Update streamdown to 1.6.10
- [x] Update vitest to 4.0.16
- [x] Update tailwindcss/vite to 4.1.18
- [x] Run pnpm audit - reduced from 8 to 3 vulnerabilities (remaining are in drizzle-kit transitive deps)

### Performance Optimizations
- [x] Implement React.lazy for route-based code splitting (22 pages lazy loaded)
- [x] Add Suspense boundaries with loading fallbacks (PageLoader component)
- [x] Configure Vite build with manual chunks (react-vendor, ui-vendor)
- [x] Enable esbuild minification with es2020 target
- [x] Verify production build succeeds (34.5s build time)


## Phase 41: Quick Win Features (Manus API Integration)

### YouTube Video Summarizer
- [ ] Create YouTube transcript fetcher using Data API
- [ ] Add summarization endpoint using LLM
- [ ] Integrate into chat with URL detection
- [ ] Show video thumbnail and metadata

### Smart Conversation Search
- [ ] Generate embeddings for conversation messages
- [ ] Store embeddings in database
- [ ] Add semantic search endpoint
- [ ] Create search UI in chat sidebar

### Location-Aware Chat
- [ ] Integrate Google Maps API for place search
- [ ] Detect location queries in chat
- [ ] Return formatted place results with maps
- [ ] Add "near me" functionality with geolocation

### Chat-Integrated Image Generation
- [ ] Add image generation command in chat (/image)
- [ ] Detect image generation intent
- [ ] Display generated images inline in chat
- [ ] Allow image variations and edits


## Phase 42: GitHub OAuth Integration

### Backend Implementation
- [x] Create GitHub OAuth helper (server/_core/githubOAuth.ts)
- [x] Add github_connections table to database schema
- [x] Add OAuth callback endpoint
- [x] Store encrypted GitHub access tokens
- [x] Add token encryption/decryption with AES-256-CBC

### Frontend Integration
- [x] Add "Connect GitHub" button to Code Review page
- [x] Handle OAuth callback redirect
- [x] Show connected GitHub account status
- [x] Allow disconnecting GitHub account
- [x] Use OAuth token instead of PAT for repo access
- [x] Fallback to PAT if OAuth not configured

### Testing
- [x] Add 13 unit tests for GitHub OAuth (encryption, config, router)


## Phase 43: Mobile UI Optimization

### Mobile Layout Improvements
- [x] Reduce vertical spacing between sections on mobile (py-12 vs py-20)
- [x] Make feature cards more compact on small screens (2-column grid, smaller padding)
- [x] Reduce padding in hero section for mobile (pt-24 pb-12)
- [x] Optimize privacy card size on mobile (aspect-auto, smaller padding)
- [x] Reduce gap between pricing section and features (gap-3 on mobile)
- [x] Make content visible without excessive scrolling (2-column pricing grid)


## Phase 44: Navigation Button Visibility Fix

### Light Mode Contrast Issues
- [x] Fix Chat, Images, Admin button visibility in light mode (added text-foreground class)
- [x] Fix theme toggle button visibility in light mode (added text-foreground class)
- [x] Ensure proper contrast ratio for accessibility (using semantic foreground color)


## Phase 45: Feature Implementation (5 Categories)

### Category 1: Smart Tools
- [x] YouTube Summarizer - Paste URL, get AI summary with timestamps
- [x] PDF Chat Enhancement - Already have document chat with vector search
- [x] URL Scraper - Extract and analyze webpage content
- [x] Calculator/Math Solver - Step-by-step math with LaTeX
- [x] Unit Converter - Currency, measurements, timezones

### Category 2: Productivity Features
- [x] Conversation Templates - Already have 25+ templates in modelRouter.ts
- [x] Quick Actions Menu - Tools page with tabbed interface
- [ ] Export Options - Download chat as PDF/Markdown/Word (future)
- [ ] Scheduled Messages - Set reminders, daily summaries (future)
- [ ] Conversation Folders - Organize chats by project/topic (future)

### Category 3: AI Enhancements
- [x] Response Comparison - Already have multi-model support in chat
- [x] Fact-Check Mode - Added fact-check template
- [x] Tone Adjuster - Added tone-adjuster template
- [x] Translation Mode - Added translate template
- [x] Summarize Thread - Added summarize-thread template
- [x] Expand Text - Added expand-text template
- [x] Simplify Text - Added simplify template

### Category 4: Developer Tools
- [x] Regex Tester - Build and test regex patterns
- [x] JSON/YAML Formatter - Pretty print and validate JSON
- [x] API Tester - Send HTTP requests, analyze responses
- [x] Diff Viewer - Compare two code snippets
- [ ] SQL Playground - Write and explain SQL queries (future)

### Category 5: New Personas
- [x] Code Reviewer persona (already existed)
- [x] Documentation Writer persona (added)
- [x] DevOps Engineer persona (already existed)
- [x] Database Expert persona (added)
- [x] API Designer persona (added)

### Future Features (Backlog)
- [ ] App Builder Mode - Full sandbox with live preview and deployment


## Phase 46: Homepage Update & Conversation Folders

### Homepage Updates
- [x] Scan for duplicate feature cards (found Knowledge Base/Document Chat overlap, Code Review duplicate)
- [x] Consolidate overlapping features into single cards
- [x] Add Smart Tools feature card (YouTube, URL, Calculator, Converter)
- [x] Add Developer Tools feature card (Regex, JSON, API, Diff)
- [x] Add Conversation Folders feature card
- [x] Add GitHub OAuth feature card
- [x] Add New AI Personas feature card
- [x] Update feature descriptions for clarity

### Conversation Folders
- [x] Add folders table to database schema (conversation_folders, conversation_folder_mappings)
- [x] Create folder CRUD operations in db.ts (10 functions)
- [x] Add folder router endpoints (9 endpoints)
- [x] Create FolderSidebar component with drag-and-drop
- [x] Add 15 unit tests for folders functionality


## Phase 47: Navigation & Comparison Table Fixes

### Navigation Button Visibility
- [x] Fix Chat, Images, Admin button visibility in light mode (text-primary font-semibold)
- [x] Fix theme toggle button visibility in light mode (text-primary)
- [x] Ensure proper contrast in both themes

### Comparison Table Update
- [x] Add Smart Tools to comparison table
- [x] Add Developer Tools to comparison table
- [x] Add Conversation Folders to comparison table
- [x] Add GitHub OAuth to comparison table
- [x] Add Vector Search (Document chat with vector search)
- [x] Add Multiple AI models row
- [x] Add 25+ AI personas row
- [x] Update feature descriptions for accuracy (13 rows total)


## Phase 48: Admin Audit Logging System

### Database Schema
- [x] Create api_call_logs table (19 columns: user_id, prompt, response, model, tokens, etc.)
- [x] Create image_access_logs table (9 columns: user_id, image_url, action, prompt, etc.)
- [x] Create audit_settings table for retention configuration
- [x] Database migration applied successfully

### API Call Logging
- [x] Add logging middleware for LLM API calls (auditLogApiCall helper)
- [x] Store prompts and responses in plain text (readable)
- [x] Include user context (email, name, IP, user agent)
- [x] Track model used, tokens, duration
- [x] Integrated into main chat.send procedureteri### Image Access Logging
- [x] Log image generation events (generate action)
- [x] Log image edit events (generate action with edit context)
- [x] Include prompt used for generation
- [ ] Log image view/download events (future - requires frontend integration)### Admin UI
- [ ] Create audit logs page in Admin panel
- [ ] Add user search/filter functionality
- [ ] Display API calls with full prompt/response
- [ ] Show image access history
- [ ] Add export functionality

### Retention Policy
- [ ] Add configurable retention period (default 30 days)
- [ ] Implement auto-cleanup job
- [ ] Add manual purge option for admins


---

## Phase 41: Admin Audit Logging System

### Database Schema
- [x] Create api_call_logs table (userId, timestamp, model, prompt, response, tokens, duration)
- [x] Create image_access_logs table (userId, timestamp, imageUrl, prompt, actionType)
- [x] Create audit_settings table for retention configuration
- [x] Add indexes for efficient querying by userId and timestamp

### Backend Implementation
- [x] Create logApiCall function for chat API logging
- [x] Create logImageAccess function for image generation logging
- [x] Create getApiCallLogs with filtering (userId, actionType, date range)
- [x] Create getImageAccessLogs with filtering
- [x] Create getApiCallStats for dashboard metrics
- [x] Create cleanup functions for old logs based on retention policy
- [x] Add audit middleware to chat.send endpoint
- [x] Add audit middleware to image.generate endpoint

### Admin UI
- [x] Create AdminAuditLogs page at /admin/audit-logs
- [x] Add API Calls tab with full prompt/response display
- [x] Add Image Access tab with thumbnail previews
- [x] Add Settings tab for retention policy configuration
- [x] Add filtering by user ID and action type
- [x] Add pagination for large log sets
- [x] Add log detail modal for full content view
- [x] Add link to Audit Logs in Admin Dashboard header

### Router Endpoints
- [x] adminAudit.getApiCallLogs - query logs with filters
- [x] adminAudit.getApiCallLogsByUser - get logs for specific user
- [x] adminAudit.getApiCallStats - get statistics
- [x] adminAudit.getImageAccessLogs - query image logs
- [x] adminAudit.getRetentionDays - get retention setting
- [x] adminAudit.setRetentionDays - update retention setting
- [x] adminAudit.cleanupOldLogs - manual cleanup mutation
- [x] adminAudit.deleteUserLogs - delete all logs for a user

### Tests
- [x] Unit tests for database functions (13 tests)
- [x] Update existing test mocks for new audit functions
- [x] All 318 tests passing



---

## Phase 42: Honest Marketing Copy Review

### Analysis
- [ ] Review current technical stack and API limitations
- [ ] Identify what content restrictions actually exist from upstream APIs
- [ ] Document what we CAN honestly claim vs what's misleading

### Copy Updates
- [ ] Update "Uncensored Chat" feature card to be realistic
- [ ] Update hero section messaging if needed
- [ ] Update comparison table claims
- [ ] Review all "no restrictions" / "uncensored" language
- [ ] Ensure all marketing aligns with actual user experience



---

## Phase 43: Venice Uncensored Integration with Auto-Fallback

### Model Integration
- [x] Add Venice Uncensored model to TEXT_MODELS list
- [x] Add OpenRouter helper for Venice Uncensored calls
- [x] Configure model as "Uncensored" tier option

### Auto-Fallback System
- [x] Create refusal detection patterns (common refusal phrases)
- [x] Implement auto-retry logic when model refuses
- [x] Add fallback to Venice Uncensored on refusal

### User Experience
- [x] Show friendly message when switching models ("I found a different approach to help you with that.")
- [x] Indicate when response came from uncensored model (usedFallback flag in response)
- [x] Keep branding clean (no vendor disclosure)

### Testing
- [x] Test refusal detection accuracy
- [x] Test auto-fallback flow
- [x] Verify Venice Uncensored API calls work


---

## Phase 44: Marketing Copy Update & Edge Case Testing

### Marketing Copy
- [x] Add "(within legal parameters)" disclaimer to uncensored claims
- [x] Update hero section copy to be accurate about capabilities
- [x] Ensure legal compliance messaging is clear

### Edge Case Testing
- [x] Test text chat fallback with commonly blocked prompts
- [x] Verify Venice Uncensored responds appropriately (API key validated, model responds)
- [x] Document test results (see uncensored-ai-research.md)

### Image Generation Research
- [x] Research uncensored image generation APIs
- [x] Evaluate cost and feasibility (Venice.ai requires $18/month Pro, no free option found)
- [x] Document findings for potential future integration (see uncensored-ai-research.md)



---

## Phase 45: Fix Venice Uncensored Fallback Detection

- [x] Add "I cannot fulfill this request" to refusal patterns
- [x] Add "prohibit the creation" to refusal patterns
- [x] Add "strict safety guidelines" to refusal patterns
- [x] Add additional NSFW-specific refusal patterns (sexually explicit, adult content, etc.)
- [x] Test fallback triggers correctly on NSFW refusals (330 tests passing)


---

## Phase 46: Fix Venice Uncensored Auto-Fallback Logic

- [x] Debug why auto-retry isn't triggering after refusal detection
- [x] Fix the fallback logic in chat.send procedure (patterns were correct, needed server restart)
- [x] Test fallback works end-to-end (NSFW content successfully generated via Venice Uncensored)


---

## Phase 47: Age Verification Gate for Uncensored Features

### Age Verification Modal
- [x] Create AgeVerificationModal component with 18+ confirmation
- [x] Add clear terms and legal disclaimer
- [x] Link to terms of service explaining content nature

### Visible Uncensored Button
- [x] Add prominent "Uncensored" quick button in chat UI (not in dropdown)
- [x] Style button distinctively (rose/pink color with Shield icon)
- [x] Button triggers age verification if not yet confirmed

### Consent Storage
- [x] Store age confirmation in user's database record (for logged-in users)
- [x] Store in localStorage for anonymous users
- [x] Check consent before allowing uncensored features

### Integration
- [x] Gate Uncensored Assistant persona behind age verification
- [x] Gate Venice Uncensored model selection behind age verification
- [x] Show appropriate messaging when age not verified


---

## Phase 48: Chat UI Fixes

### Sidebar Collapse
- [x] Add toggle button to collapse/expand left sidebar
- [x] Remember collapse state in localStorage
- [x] Show icons only when collapsed with tooltips

### Uncensored Button Visibility
- [x] Move Uncensored button to be always visible (not just new chat)
- [x] Added to Quick Feature Toggles area next to Deep Research
- [x] Show current mode indicator (18+ vs Uncensored)

### Venice Fallback for Grok
- [x] Add Grok-specific refusal patterns to detection
- [x] Test with "adhere to guidelines that prioritize" pattern
- [x] Ensure auto-retry triggers for all model refusals


---

## Phase 49: Critical Bug Fixes

### Venice Uncensored Button Flow
- [x] Show 18+ button first, after age verification show Uncensored button
- [x] When Uncensored is ON, directly use venice-uncensored model
- [x] Backend already handles venice-uncensored model correctly

### Sidebar Width Fix
- [x] Reduced sidebar width from w-72 to w-64
- [x] Collapse toggle already working
- [x] Conversation titles more visible now


---

## Phase 50: Puter.js Free AI Integration

### Frontend Setup
- [ ] Add Puter.js script to index.html
- [ ] Create TypeScript types for Puter API

### Model Integration
- [ ] Add Puter models to modelRouter (GPT-5.2, GPT-4o, o1, o3, etc.)
- [ ] Create Puter chat handler in frontend
- [ ] Support streaming responses from Puter

### Image Generation
- [ ] Add Puter image models (GPT Image, DALL-E 3)
- [ ] Integrate with existing image generation UI

### Testing
- [ ] Test Puter chat models
- [ ] Test Puter image generation
- [ ] Verify streaming works correctly


---

## Phase 50: Puter.js Free AI Integration

### Frontend Setup
- [x] Add Puter.js script to index.html
- [x] Create TypeScript types for Puter API
- [x] Update CSP to allow Puter.js

### Text Models
- [x] Add Puter models to AVAILABLE_MODELS (GPT-5 Nano, GPT-5, GPT-4o, o1, o3)
- [x] Handle Puter models in Chat.tsx (client-side processing)
- [x] Display Puter model responses correctly

### Image Models
- [x] Add Puter image models (DALL-E 2, DALL-E 3, GPT Image)
- [x] Handle Puter image generation in ImageGen.tsx
- [x] Display Puter-generated images correctly

### Testing
- [x] TypeScript compilation passes
- [x] All 343 tests passing
- [x] Ready for live testing


---

## Phase 51: Fix Uncensored Mode Routing

- [x] Fix model selection to always use venice-uncensored when isUncensoredMode is ON
- [x] Ensure Venice Uncensored is used regardless of routingMode setting
- [x] Test NSFW prompts work correctly with Uncensored mode enabled (343 tests passing)

---

## Phase 52: Venice API Uncensored Images Integration

### Research & Planning
- [ ] Research NSFW pricing strategies from competitors (Venice, CivitAI, NovelAI, etc.)
- [ ] Design NSFW pricing model for Chofesh.ai

### Venice API Integration
- [ ] Create Venice image API helper (server/_core/veniceImage.ts)
- [ ] Add Lustify SDXL and Lustify v7 models for NSFW
- [ ] Add Venice SD35 model for uncensored content
- [ ] Implement image generation via Venice API

### NSFW Subscription Tier
- [ ] Add NSFW add-on product to Stripe
- [ ] Create nsfw_subscription field in users table
- [ ] Add NSFW subscription checkout flow
- [ ] Handle NSFW subscription webhooks

### UI Implementation
- [ ] Add NSFW toggle in image generation page (after age verification)
- [ ] Show NSFW model options when toggle is ON
- [ ] Add usage tracking for NSFW images
- [ ] Display NSFW subscription status in settings

### Testing & Deployment
- [ ] Test full NSFW image flow
- [ ] Save checkpoint

---

## Phase 53: Comprehensive Platform Audit & NSFW Integration

### UX/UI Audit
- [ ] Audit Home page design and user flow
- [ ] Audit Chat page UX (sidebar, input, messages)
- [ ] Audit Image Generation page UX
- [ ] Audit Settings page organization
- [ ] Audit Admin dashboard UX
- [ ] Audit mobile responsiveness across all pages
- [ ] Identify outdated UI patterns
- [ ] Document all UX issues found

### Functionality Audit
- [ ] Test all chat features (models, personas, memory, thinking mode)
- [ ] Test all image generation features
- [ ] Test authentication flows (Google, email/password)
- [ ] Test subscription/payment flows
- [ ] Test admin features
- [ ] Test voice input/output
- [ ] Test web search integration
- [ ] Test document chat/RAG
- [ ] Document all broken/missing features

### Venice NSFW Integration
- [ ] Create Venice image API helper
- [ ] Add Lustify SDXL/v7 models
- [ ] Implement NSFW image generation endpoint

### NSFW Subscription ($7.99 add-on)
- [ ] Create Stripe product for NSFW add-on
- [ ] Add nsfw_subscription fields to database
- [ ] Implement subscription checkout flow
- [ ] Handle webhook events

### NSFW UI Flow
- [ ] Add NSFW toggle in image generation (after age verification)
- [ ] Show NSFW model options when enabled
- [ ] Track NSFW image usage
- [ ] Display subscription status

### UI/UX Redesign
- [ ] Implement identified UX improvements
- [ ] Update outdated UI components
- [ ] Improve mobile experience
- [ ] Add missing micro-interactions

### Testing & Deployment
- [ ] Run all unit tests
- [ ] Manual testing of all flows
- [ ] Save checkpoint


---

## Phase 42: Venice NSFW Image Integration & UX Audit

### Venice API Integration
- [x] Create Venice image generation helper (server/_core/veniceImage.ts)
- [x] Add Venice API key to environment configuration
- [x] Implement NSFW model detection (Lustify SDXL, Lustify v7)
- [x] Add Venice image generation tests (15 tests passing)

### NSFW Subscription System
- [x] Add NSFW subscription fields to users table
- [x] Create NSFW subscription helper functions in db.ts
- [x] Add NSFW router endpoints (getStatus, verifyAge, createCheckout, cancelSubscription, generate, getModels)
- [x] Implement $7.99/month NSFW add-on pricing
- [x] Add 18 NSFW subscription tests

### Age Verification Flow
- [x] Add age verification status to user profile
- [x] Create age verification modal in Settings page
- [x] Gate NSFW content behind age verification

### Image Generation NSFW UI
- [x] Add 18+ toggle button to ImageGen page header
- [x] Add NSFW unlock modal with status indicators
- [x] Show Venice models when NSFW mode enabled
- [x] Update handleGenerate to support Venice/NSFW generation
- [x] Display NSFW usage counter

### Settings Page NSFW Section
- [x] Add NsfwSubscriptionSection component
- [x] Show age verification status
- [x] Show NSFW subscription status and usage
- [x] Add subscribe/cancel buttons

### UX/UI Improvements
- [x] Cookie banner redesign (compact corner position, less intrusive)
- [x] Feature card hover animations (micro-interactions)
- [x] Route alias /images → /image (fix navigation mismatch)
- [x] Chat message actions (copy button, regenerate button on hover)
- [x] Admin link already role-gated in navigation



---

## Phase 43: Outstanding Audit Fixes

### Chat Input Area Improvements
- [x] Add character count display
- [x] Expand textarea on focus (min-h grows to 80px)
- [x] Better visual feedback (multiline support with Shift+Enter)

### Empty State for New Users
- [x] Welcome message when no conversations ("Welcome to Chofesh AI")
- [x] Quick start suggestions (4 clickable examples)

### Mobile Sidebar UX
- [x] Swipe gestures for sidebar open/close (useSwipe hook)
- [x] Better touch targets (edge swipe detection)

### Image Gallery Optimization
- [x] Lazy loading for images (loading="lazy" + decoding="async")
- [x] Fade-in animation on load

### Global Keyboard Shortcuts
- [x] Cmd/Ctrl+K for search/command palette
- [x] Cmd/Ctrl+N for new chat
- [x] Cmd/Ctrl+/ for go to chat
- [x] Cmd/Ctrl+I for go to images
- [x] Cmd/Ctrl+, for settings
- [x] Escape to close modals (Radix UI built-in)


## Phase 44: Remove Keyboard Shortcuts

- [x] Remove useKeyboardShortcuts hook from App.tsx
- [x] Delete useKeyboardShortcuts.ts file


## Phase 45: Remove Shortcut Hints from Chat

- [x] Remove "(Shift+Enter for new line)" from placeholder
- [x] Remove shortcut hint from footer text


## Phase 46: UI Cleanup Research & Redesign

- [ ] Research top 5 uncensored AI platforms UI patterns
- [ ] Analyze sidebar/collapsible patterns
- [ ] Analyze response format controls placement
- [ ] Analyze NSFW/uncensored feature placement
- [ ] Compare pricing flow integration
- [ ] Present 2 design options to user


## Phase 47: Venice-Style UI Redesign

### Chat Input Area
- [x] Remove response format dropdown from input area
- [x] Remove Deep Research button from input area
- [x] Remove 18+ button from input area
- [x] Add settings gear icon to input area
- [x] Create chat settings popover/modal

### Sidebar
- [x] Make sidebar collapsible (already implemented)
- [x] Add toggle button to collapse/expand (already implemented)
- [x] Persist sidebar state (already implemented)

### Settings Page Updates
- [x] Response format now in chat settings popover (not needed in Settings page)
- [x] Uncensored mode now in chat settings popover with age verification
- [x] Deep Research toggle now in chat settings popover
- [x] Age verification integrated into chat settings popover


## Phase 48: Remove Venice Branding (Business Protection)

- [x] Remove Venice references from ImageGen.tsx
- [x] Remove Venice model names from UI dropdowns (now "Uncensored Models" and "Premium Models")
- [x] Rename "venice-uncensored" to "uncensored" in Chat.tsx
- [x] Remove Venice from error messages, toasts, and Settings.tsx
- [x] Backend still uses Venice API but frontend shows generic Chofesh branding


## Phase 49: ToS Update & Collapsible Sidebar Navigation

### Terms of Service
- [x] Add third-party AI providers clause (without naming Venice)

### Sidebar Navigation
- [x] Make navigation menu (AI Characters, Generate Images, etc.) collapsible
- [x] Add expand/collapse toggle for navigation section ("Tools & Features" header)
- [x] Give more room for chat history when nav is collapsed
- [x] Persist nav menu state to localStorage


## Phase 50: Chat Organization & NSFW Billing

### Stripe NSFW Billing
- [x] Fix subscription page error (TypeError: Failed to fetch dynamically imported module) - was stale cache issue
- [x] Create NSFW add-on product in Stripe ($7.99/month) - using price_data inline
- [x] Wire up "Subscribe Now" button to Stripe checkout - already implemented
- [x] Handle webhook for NSFW subscription activation - added handleNsfwSubscriptionActivation

### Unified Age Verification
- [x] One age verification unlocks both NSFW chat AND images (already implemented - uses ageVerified from DB)
- [x] Store verification status in user account (not just localStorage) - stored in users.ageVerified
- [ ] Check verification status before allowing uncensored mode in chat or images

### Chat Folders
- [ ] Add folders table to database schema
- [ ] Create folder CRUD operations
- [ ] Add folder selector in sidebar
- [ ] Allow moving chats between folders
- [ ] Default folders: All Chats, Uncategorized

### Chat Pinning
- [ ] Add isPinned field to conversations
- [ ] Add pin/unpin button to chat items
- [ ] Show pinned chats at top of list
- [ ] Visual indicator for pinned chats


### Chat Folders (Completed)
- [x] Add folderId field to Conversation interface
- [x] Create ChatFolder interface in encryption.ts
- [x] Add folder CRUD functions to useConversations hook (createFolder, deleteFolder, renameFolder)
- [x] Add "New Folder" button in sidebar with dialog
- [x] Allow moving chats to folders via dropdown menu

### Chat Pinning (Completed)
- [x] Add pinned field to Conversation interface
- [x] Add togglePin function to useConversations hook
- [x] Show pinned chats at top of sidebar with "Pinned" section header
- [x] Add pin/unpin option in chat dropdown menu
- [x] Visual indicator (Pin icon) for pinned chats


## Phase 51: Create NSFW Add-on Product in Stripe

- [x] Create "NSFW Add-on" product in Stripe ($7.99/month)
- [x] Get the price ID from Stripe (price_1SmdXZGcthikBvdKJOEh6ymu)
- [x] Update routers.ts to use the actual price ID instead of price_data
- [ ] Test NSFW subscription checkout flow


## Phase 52: Seamless Uncensored Experience

### System Prompt Education
- [ ] Update system prompt to mention uncensored features are available
- [ ] When user asks about explicit content, guide them to age verification
- [ ] Explain Chofesh's privacy-first uncensored capabilities

### Automatic Model Switching
- [ ] If user is age verified, automatically use uncensored model for chat
- [ ] No manual toggle needed - system detects and switches seamlessly
- [ ] User doesn't notice the switch - just works

### Venice Chat Integration
- [ ] Create Venice chat API integration for uncensored conversations
- [ ] Route age-verified users to Venice automatically
- [ ] Maintain conversation context across model switches

### Smooth Upgrade Flow
- [ ] For uncensored images, check subscription status
- [ ] If not subscribed, show upgrade prompt inline
- [ ] After upgrade, feature works immediately without page reload



## Phase 52: Seamless Uncensored Experience

### System Prompt Education
- [x] Update system prompt to mention uncensored features are available
- [x] When user asks about explicit content, guide them to age verification
- [x] Explain Chofesh's privacy-first uncensored capabilities

### Automatic Model Switching
- [x] If user is age verified, automatically use uncensored model for chat
- [x] No manual toggle needed - system detects NSFW content and switches seamlessly
- [x] User doesn't notice the switch - just works

### Venice Chat Integration
- [x] Venice chat API integration for uncensored conversations (via OpenRouter)
- [x] Route age-verified users to Venice automatically when NSFW content detected
- [x] Maintain conversation context across model switches

### Smooth Upgrade Flow
- [x] For uncensored images, check subscription status
- [x] If not subscribed, show inline upgrade button in modal
- [x] Direct checkout flow without leaving page



## Phase 53: Uncensored UX Improvements

### 1. Uncensored Mode Banner
- [x] Show subtle dismissible banner when auto-switching to uncensored mode
- [x] Message: "Using enhanced model for unrestricted response"
- [x] Allow user to dismiss and remember preference (localStorage)

### 2. Subscription Success Redirect
- [x] After Stripe checkout completes, redirect to image generation page
- [x] Auto-enable NSFW mode on redirect
- [x] Show success toast message

### 3. Uncensored Chat History Indicator
- [x] Mark conversations that used uncensored mode with badge/icon
- [x] Show pink shield indicator in sidebar chat list
- [x] Tooltip explains "Contains uncensored content"



## CRITICAL BUG FIX: Chat History Leaking Between Accounts

### Issue
- [x] Chat history stored in localStorage persists across different user accounts
- [x] New users see previous account's conversations after login
- [x] Privacy/security violation - users can see other users' chats on shared devices

### Fix
- [x] Scope localStorage keys by user ID (e.g., `chofesh-conversations-{userId}`)
- [x] Conversations, folders, and encryption keys are now user-scoped
- [x] Data automatically reloads when user changes



## Phase 54: NSFW → Uncensored Rename & Bug Fixes

### Issues Reported
- [ ] 404 error on NSFW checkout redirect (wrong domain used)
- [ ] "NSFW" terminology should be "Uncensored" throughout app
- [ ] Image generation fails even with active subscription
- [ ] Error messages not helpful - should explain what's needed

### Fixes
- [ ] Fix checkout redirect URL to use correct app domain (not OAuth portal)
- [ ] Rename all "NSFW" labels to "Uncensored" in UI
- [ ] Add specific error messages for uncensored features
- [ ] Debug Venice API image generation



## Phase 54: NSFW → Uncensored Rename & Bug Fixes

### Issues Found
- [x] 404 on NSFW checkout redirect (redirecting to wrong domain)
- [x] "NSFW" label should be "Uncensored" throughout the app
- [x] Image generation failing even with active subscription - Venice API verified working
- [x] Error messages not helpful when uncensored features aren't active

### Fixes
- [x] Fix checkout redirect URL to use correct app domain (uses req.headers.origin)
- [x] Rename all "NSFW" labels to "Uncensored" in UI (ImageGen, Settings)
- [x] Add better error messages for uncensored image generation
- [x] Venice API integration verified working ($8.08 balance)
- [x] User checolin357@msn.com has active subscription and age verified


## CRITICAL: Gallery Privacy Bug

- [ ] Gallery shows ALL users' images instead of only current user's images
- [ ] Failed image attempts visible to everyone (privacy violation)
- [ ] Need to filter gallery by userId in the query


## Phase 55: Admin Audit Content Viewer & Venice Debug

- [ ] Add detailed API call logs with actual content for admin review
- [ ] Create admin UI to view actual prompts and responses (not just hashes)
- [ ] Debug Venice API production issue - still failing after adding key to Render


## Phase 55: Admin Audit Content Viewing & Production Debugging

- [x] Add "View Full Content Logs" button to admin dashboard
- [x] Link from hashed audit logs to detailed API call logs page
- [x] Debug Venice API production issue - identified missing OPENROUTER_API_KEY
- [x] Add better error logging to veniceImage.ts
- [x] Improve chat error handling to show actual error messages


## Phase 56: Chat UX & Admin Dashboard Improvements

### Chat Interface
- [x] Fix manual model selection - show model dropdown when Manual mode selected (verified working)
- [x] Move image upload button inside chatbox input area
- [x] Move voice input button inside chatbox input area

### Admin Dashboard
- [x] Add search/filter by user ID in audit logs
- [x] Highlight uncensored/NSFW content rows in red
- [x] Add user email search functionality
- [x] Add uncensored content filter dropdown

## Phase 57: Fix Premium Uncensored Image Models

### Bug Report
- [x] Venice SD35, HiDream, Z-Image Turbo produce blurry/censored results (CONFIRMED: Not NSFW-capable)
- [x] Only Lustify SDXL and Lustify v7 work correctly for NSFW content (CONFIRMED by Venice docs)
- [x] Remove non-NSFW models from 18+ mode dropdown
- [x] Fix image download functionality not working (added server-side proxy)
