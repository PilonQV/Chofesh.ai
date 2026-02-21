# Chofesh AI Gateway

> **Open Source Multi-Provider AI Infrastructure** - Self-hosted AI gateway with intelligent routing, cost controls, and privacy-first design.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933.svg)](https://nodejs.org/)

---

## Architecture

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + tRPC
- **Database:** PostgreSQL + Redis (caching)
- **AI Layer:** Abstracted provider client with retry logic

---

## Features

- **Intelligent Routing:** Auto-failover between OpenAI, Anthropic, Google, Groq, Cerebras, OpenRouter
- **Cost Controls:** Rate limiting, usage quotas, spend tracking per team
- **Privacy First:** Self-hostable. Your data never hits our servers (there are no "our" servers)
- **Document Processing:** RAG pipeline with vector storage
- **Enterprise Auth:** SSO-ready with organization management

### Multi-Model Chat
Unified interface for GPT-4, Claude, Gemini, Llama, Mixtral and 20+ more models.

### Document Ingestion
PDF, DOCX, TXT processing with semantic search.

### Team Management
Workspaces, role-based access, usage analytics.

### Voice Interface
Speech-to-text and text-to-speech pipeline.

### API Access
RESTful API for external integrations.

### Cost Optimization
Smart model selection based on query complexity.

---

## Quick Start (Docker)

```bash
git clone https://github.com/PilonQV/Chofesh.ai.git
cd Chofesh.ai

# Copy and edit your config
cp .env.example .env
# Add your AI provider API keys to .env

docker-compose up -d
# App runs at http://localhost:3000
```

## Quick Start (Development)

### Prerequisites
- **Node.js** 22+ (with pnpm)
- **PostgreSQL** 14+
- **Redis** (optional, for caching)

### Installation

```bash
# Clone the repository
git clone https://github.com/PilonQV/Chofesh.ai.git
cd Chofesh.ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the app running.

---

## Environment Setup

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chofesh

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# At least one AI provider API key
GROQ_API_KEY=gsk_...        # Recommended for free tier
OPENAI_API_KEY=sk-...       # OpenAI GPT models
ANTHROPIC_API_KEY=sk-ant-... # Claude models
GOOGLE_API_KEY=...          # Gemini models
```

See [.env.example](./.env.example) for complete configuration options.

---

## AI Providers

### Free Tier
- [Groq](https://console.groq.com/) - Fast inference (recommended)
- [Cerebras](https://cloud.cerebras.ai/) - Ultra-fast inference
- [Google AI](https://ai.google.dev/) - Gemini models
- [Cloudflare Workers AI](https://dash.cloudflare.com/) - Edge inference

### Paid Tier
- [OpenAI](https://platform.openai.com/) - GPT-4, GPT-4o
- [Anthropic](https://console.anthropic.com/) - Claude models
- [OpenRouter](https://openrouter.ai/) - Multi-model access
- [Kimi/Moonshot](https://platform.moonshot.cn/) - Long context

---

## Production Readiness

This has handled real traffic. Known limitations:
- Mobile app needs work (Capacitor implementation is basic)
- React Native migration planned
- Needs better test coverage (contributions welcome!)

---

## Roadmap

- [ ] Native mobile apps (React Native)
- [ ] Local model support (Ollama integration)
- [ ] MCP (Model Context Protocol) compatibility
- [ ] Better test suite
- [ ] Kubernetes helm charts

---

## Contributing

We need help with:
- Frontend performance (React optimization)
- Mobile development (React Native)
- Documentation (deployment guides)
- Testing (E2E coverage)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Security

See [SECURITY.md](./SECURITY.md) for our security policy and vulnerability reporting guidelines.

### Best Practices Implemented

- All sensitive data in environment variables
- bcrypt password hashing
- JWT authentication
- Rate limiting and DDoS protection
- Input validation (SQL injection and XSS prevention)
- CORS configuration
- Webhook signature verification

---

## License

MIT - Use it, fork it, build your own product on it. Just don't pretend you built it from scratch.

See [LICENSE](./LICENSE) for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/PilonQV/Chofesh.ai/issues)
- **Discussions:** [GitHub Discussions](https://github.com/PilonQV/Chofesh.ai/discussions)

---

<div align="center">

**Built with frustration about vendor lock-in and hope for open AI infrastructure.**

Production-tested AI gateway. Original author stepping back. Seeking core maintainers.

</div>
