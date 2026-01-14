# Changelog

All notable changes to the Chofesh SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-13

### Added
- Initial release of Chofesh SDK
- Core components: Agent, Conversation, LLM, Message
- Extensible tool system with base Tool class
- Built-in tools:
  - WebSearchTool - Search the web for information
  - CodeExecutionTool - Execute code in 60+ languages
  - ImageGenerationTool - Generate images from text
  - GitHubTool - Automate GitHub operations
- Async/await support for all operations
- Streaming response support
- Comprehensive examples and documentation
- PyPI package distribution

### Features
- Support for 25+ AI models
- Tool execution with automatic retry
- Privacy-first architecture
- BYOK (Bring Your Own API Keys) support
- Type hints and Pydantic models
- Error handling and validation

### Documentation
- README with quick start guide
- 7 example scripts
- API documentation
- Contributing guidelines

## [Unreleased]

### Planned
- GitLab integration
- Workspace abstraction
- Multi-agent orchestration
- Skills registry
- Agent marketplace
- Additional built-in tools
- CLI tool improvements
- Performance optimizations
