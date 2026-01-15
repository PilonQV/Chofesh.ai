# Chofesh.ai Development Roadmap

**Last Updated:** January 14, 2026  
**Vision:** Transform Chofesh.ai from a privacy-first AI chat into a comprehensive AI coding platform with developer SDK and autonomous agent capabilities.

---

## Overview

This roadmap outlines the integration of OpenHANDS-inspired features into Chofesh.ai, prioritized by impact and feasibility. Enterprise features are scheduled for later phases to focus on building a strong developer foundation first.

---

## Roadmap Phases

### ✅ Phase 0: Foundation (COMPLETED)
**Timeline:** Q4 2025 - Q1 2026  
**Status:** ✅ Complete

**Achievements:**
- ✅ Privacy-first architecture with local storage
- ✅ 25+ AI models (GPT-OSS, Llama, DeepSeek, etc.)
- ✅ Research Mode with web search and code execution (Judge0)
- ✅ Image generation with multiple models
- ✅ Document analysis (RAG)
- ✅ BYOK support
- ✅ Prompt Guard 2 security
- ✅ Whisper V3 Turbo audio transcription

---

### ✅ Phase 1: Developer Foundation (COMPLETED)
**Timeline:** Q1 2026  
**Status:** ✅ Complete

**Achievements:**
- ✅ **Agent SDK**: Core Python SDK for building autonomous agents programmatically.
- ✅ **Extensible Tool System**: Modular architecture for custom tool registration.
- ✅ **GitHub Integration**: Full API support for autonomous repository operations.
- ✅ **98% Test Coverage**: World-class reliability with 167+ automated tests.
- ✅ **Documentation & Examples**: Comprehensive guides for rapid developer onboarding.

---

### 🚀 Phase 2: Distribution & Scale
**Timeline:** Q1 2026 (Current)  
**Goal:** Make Chofesh accessible to the global developer community.
**Status:** 🔄 In Progress

#### 2.1 PyPI Release
**Priority:** 🔴 Critical  
**Status:** 🔄 Pending Final Approval

**Description:**
Publish the `chofesh-sdk` to the Python Package Index (PyPI) for global distribution.

**Deliverables:**
- [ ] Verified PyPI account and namespace
- [ ] Automated CI/CD pipeline for package publishing
- [ ] Version 0.1.0 public release
- [ ] `pip install chofesh-sdk` availability

---

### ✅ Phase 3: Advanced Capabilities (COMPLETED)
**Timeline:** Q1 2026  
**Goal:** Add advanced agent capabilities and workspace management  
**Status:** ✅ Complete

#### 3.1 Workspace Abstraction ✅
**Priority:** 🟡 High  
**Status:** ✅ Implemented

**Description:** Flexible workspace system supporting local, Docker, and remote execution environments.

**Implementation Details:**
- ✅ **BaseWorkspace**: Abstract base class for all workspace types
- ✅ **WorkspaceManager**: Centralized workspace lifecycle management
- ✅ **LocalWorkspaceProvider**: Direct execution on server (development)
- ✅ **DockerWorkspaceProvider**: Isolated container execution
- ✅ **PistonWorkspaceProvider**: Self-hosted Piston engine (60+ languages)
- ✅ **Factory Pattern**: Automatic provider selection with fallback

**Files:**
- `server/_core/workspace/types.ts` - Core type definitions
- `server/_core/workspace/BaseWorkspace.ts` - Abstract base class
- `server/_core/workspace/WorkspaceManager.ts` - Lifecycle management
- `server/_core/workspace/providers/` - Provider implementations
- `server/_core/workspace/factory.ts` - Provider factory

#### 3.2 GitLab Integration
**Priority:** 🟡 High  
**Status:** 📋 Planned (Skipped for now)

**Description:** Extend version control integration to GitLab.

**Note:** GitLab integration is planned but not yet implemented. Focus was on 3.1 and 3.3.

#### 3.3 Advanced Code Execution ✅
**Priority:** 🟡 High  
**Status:** ✅ Implemented

**Description:** Enhanced code execution beyond Judge0 with more languages and package management.

**Implementation Details:**
- ✅ **60+ Programming Languages** via Piston API
- ✅ **Package Management**: pip, npm, yarn, pnpm, cargo, go, gem, composer
- ✅ **Smart Fallback**: Piston → Local execution chain
- ✅ **Language Support**: Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, Ruby, PHP, Kotlin, Swift, Scala, Haskell, Lua, Perl, R, Julia, Elixir, Erlang, Clojure, Dart, Bash, PowerShell, SQL, C#, F#
- ✅ **Unified Interface**: `CodeExecutionService` for all providers
- ✅ **Agent Integration**: `executeCode` tool in AgentTools

**Files:**
- `server/_core/codeExecution.ts` - Unified execution service
- `server/_core/workspace/provider.ts` - Language definitions
- `server/_core/agentTools.ts` - Agent tool integration

---

### 🌟 Phase 4: Community & Ecosystem
**Timeline:** Q3 2026 (8 weeks)  
**Goal:** Build community ecosystem and reusable components  
**Status:** 📋 Planned

#### 4.1 Skills Registry
**Description:** Public registry of reusable agent skills and prompts.

#### 4.2 Conversation Sharing
**Description:** Share conversations with team members and collaborate on agent tasks.

#### 4.3 Agent Marketplace
**Description:** Marketplace for pre-built agents and workflows.

---

### 🔬 Phase 5: Advanced Orchestration
**Timeline:** Q4 2026 (8 weeks)  
**Goal:** Enable complex multi-agent workflows  
**Status:** 📋 Planned

#### 5.1 Multi-Agent Orchestration
**Description:** Support for multiple specialized agents working together on complex tasks.

---

### 🏢 Phase 6: Enterprise & Integration
**Timeline:** Q1 2027 (12 weeks)  
**Goal:** Enterprise-grade collaboration and integration  
**Status:** 📋 Planned

#### 6.1 Team Collaboration
**Description:** Multi-user workspaces, role-based access control (RBAC), and team billing.

#### 6.2 CI/CD Integration
**Description:** Native plugins for GitHub Actions, GitLab CI, and Jenkins.

#### 6.3 Enterprise Connectors
**Description:** Slack, Jira, Linear, and Microsoft Teams integrations.
