# Chofesh.ai - Private AI Platform 🤖

> **Open Source AI Platform** with multi-provider support, intelligent routing, cost optimization, and enterprise-grade features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.0-339933.svg)](https://nodejs.org/)

---

## 🌟 Features

### 🎯 Core Capabilities
- **Multi-Provider AI** - Groq, Cerebras, Kimi, OpenRouter, Gemini, Cloudflare Workers AI
- **Intelligent Routing** - Automatic model selection based on query complexity
- **Cost Optimization** - 95% free API usage, <5% paid for complex queries
- **ReAct Agent** - Autonomous multi-step reasoning with tool access
- **Master Command** - Natural language UI modifications
- **Vision Support** - Image understanding and analysis
- **Voice I/O** - Speech-to-text and text-to-speech
- **Deep Research** - Multi-source information synthesis
- **Memory System** - Context-aware conversations

### 💎 Enterprise Features
- **Authentication** - Email/password + Google OAuth
- **Database** - PostgreSQL with Drizzle ORM
- **Rate Limiting** - API cost control ($5/day default)
- **Usage Monitoring** - Real-time API cost tracking
- **Stripe Integration** - Payment processing
- **Webhook System** - Event-driven automation
- **Scheduled Tasks** - Cron-based job scheduling
- **Admin Dashboard** - Usage analytics and management

### 🎨 Modern UI
- **Glassmorphism Design** - Animated backgrounds and smooth transitions
- **Markdown Rendering** - Tables, code blocks, syntax highlighting
- **Responsive Layout** - Mobile-first design
- **Dark Mode** - Eye-friendly interface
- **Chat History** - Persistent conversations with search

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 22+ (with pnpm)
- **PostgreSQL** 14+
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/serever-coder357/Chofesh.ai.git
cd Chofesh.ai

# Install dependencies
pnpm install

# Set up environment variables
# See env-example-template.txt for complete list
# Minimum required:
# - DATABASE_URL
# - JWT_SECRET
# - At least one AI provider API key (GROQ_API_KEY recommended)

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the app running.

---

## 📋 Environment Setup

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/chofesh

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_characters_long

# At least one AI provider (Groq recommended for free tier)
GROQ_API_KEY=your_groq_api_key_here
```

### Optional Variables

See [.env.example](./.env.example) for complete list of supported environment variables.

**Free AI Providers:**
- [Groq](https://console.groq.com/) - Fast inference (recommended)
- [Cerebras](https://cloud.cerebras.ai/) - Ultra-fast inference
- [Google AI](https://ai.google.dev/) - Gemini models

**Paid AI Providers:**
- [Kimi](https://platform.moonshot.cn/) - Advanced reasoning
- [OpenRouter](https://openrouter.ai/) - Multi-model access
- [Cloudflare Workers AI](https://dash.cloudflare.com/) - Edge inference

---

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + tRPC
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** OAuth 2.0 (Google) + Email/Password (bcrypt)
- **Payment:** Stripe
- **Deployment:** Render.com / Vercel / Self-hosted

### Project Structure

```
chofesh.ai/
├── client/               # Frontend React app
│   ├── src/
│   │   ├── pages/        # Page components (Chat, Home, etc.)
│   │   ├── components/   # Reusable UI components
│   │   ├── styles/       # CSS and design system
│   │   └── lib/          # tRPC client and utilities
├── server/               # Backend Express + tRPC
│   ├── _core/            # Core business logic
│   │   ├── aiProviders.ts      # AI provider integrations
│   │   ├── reactAgent.ts       # ReAct autonomous agent
│   │   ├── kimiOrchestrator.ts # Kimi routing logic
│   │   ├── masterCommand.ts    # UI modification system
│   │   └── complexityScoring.ts # Query routing
│   ├── routers.ts        # tRPC API routes
│   ├── db.ts             # Database client and schema
│   └── auth.ts           # Authentication logic
├── drizzle/              # Database migrations
└── package.json          # Dependencies and scripts
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server (port 3000)
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm db:push      # Push schema changes to database
pnpm db:studio    # Open Drizzle Studio (database GUI)

# Testing
pnpm test         # Run all tests
pnpm test:watch   # Run tests in watch mode

# Code Quality
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler
```

---

## 🤖 AI Provider Configuration

### Cost-Optimized Routing

Chofesh.ai automatically routes queries to minimize costs:

1. **Simple queries** (95%) → Free APIs (Groq, Cerebras, Gemini)
2. **Complex queries** (<5%) → Paid APIs (Kimi, OpenRouter)

### Complexity Scoring

Queries are scored 0-100 based on:
- Word count
- Technical terms
- Multi-step reasoning indicators
- Tool requirements

**Threshold:** Score >80 uses paid APIs, <=80 uses free APIs.

### Manual Override

Users can manually select models or use "Verify with Kimi" button for double-checking.

---

## 🔐 Security

### Best Practices Implemented

- ✅ **No hardcoded secrets** - All sensitive data in environment variables
- ✅ **bcrypt password hashing** - Secure password storage
- ✅ **JWT authentication** - Stateless session management
- ✅ **Rate limiting** - API cost control and DDoS protection
- ✅ **Input validation** - SQL injection and XSS prevention
- ✅ **CORS configuration** - Cross-origin request control
- ✅ **Webhook signatures** - Stripe event verification
- ✅ **Dependency scanning** - Automated vulnerability detection (Dependabot)

### Reporting Vulnerabilities

Please report security vulnerabilities by opening a GitHub issue with the "security" label.

---

## 🚢 Deployment

### Render.com (Recommended)

1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

**Build Command:** `pnpm install && pnpm build`  
**Start Command:** `NODE_OPTIONS='--max-old-space-size=3584' node dist/index.js`

### Self-Hosted

```bash
# Build
pnpm build

# Start with PM2
pm2 start dist/index.js --name chofesh-ai

# Or with systemd
sudo systemctl enable chofesh-ai
sudo systemctl start chofesh-ai
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) - Fast AI inference
- [Cerebras](https://cerebras.ai/) - Ultra-fast AI inference
- [Moonshot AI](https://moonshot.cn/) - Kimi models
- [OpenRouter](https://openrouter.ai/) - Multi-model access
- [React](https://reactjs.org/) - UI framework
- [tRPC](https://trpc.io/) - Type-safe APIs
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/serever-coder357/Chofesh.ai/issues)
- **Discussions:** [GitHub Discussions](https://github.com/serever-coder357/Chofesh.ai/discussions)

---

<div align="center">

**Made with ❤️ by the open source community**

[GitHub](https://github.com/serever-coder357/Chofesh.ai)

</div>
