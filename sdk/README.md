# Chofesh SDK

Build autonomous AI agents with privacy-first architecture.

## Features

- 🤖 **Agent SDK** - Build custom AI agents programmatically
- 🔧 **Extensible Tools** - Create and register custom tools
- 🔒 **Privacy-First** - Local-first storage, end-to-end encryption
- 🌐 **GitHub Integration** - Automate code operations
- 📦 **25+ AI Models** - Access to GPT-OSS, Llama, DeepSeek, and more
- 🔑 **BYOK Support** - Bring your own API keys

## Installation

```bash
pip install chofesh-sdk
```

With GitHub integration:
```bash
pip install chofesh-sdk[github]
```

All extras:
```bash
pip install chofesh-sdk[all]
```

## Quick Start

```python
from chofesh import Agent, Conversation

# Create an agent
agent = Agent(
    model="gpt-oss-120b",
    api_key="your_chofesh_api_key"  # or set CHOFESH_API_KEY env var
)

# Start a conversation
conversation = Conversation(agent=agent)
response = conversation.send_message("Explain quantum computing")

print(response.content)
```

## With Tools

```python
from chofesh import Agent, Conversation
from chofesh.tools import WebSearchTool, CodeExecutionTool

# Create agent with tools
agent = Agent(
    model="gpt-oss-120b",
    tools=[
        WebSearchTool(),
        CodeExecutionTool()
    ]
)

conversation = Conversation(agent=agent)
response = conversation.send_message(
    "Search for the latest Python best practices and create a code example"
)

print(response.content)
```

## GitHub Integration

```python
from chofesh import Agent, Conversation
from chofesh.tools import GitHubTool

# Create GitHub tool
github = GitHubTool(
    token="your_github_token",  # or set GITHUB_TOKEN env var
    repo="username/repo"
)

agent = Agent(
    model="deepseek-r1",
    tools=[github]
)

conversation = Conversation(agent=agent)

# Automate code operations
response = conversation.send_message("""
1. Read the README.md file
2. Check for any TODO items
3. Create an issue for each TODO
""")

print(response.content)
```

## Custom Tools

```python
from chofesh.tools import Tool

class CustomAPITool(Tool):
    name = "custom_api"
    description = "Call my custom API"
    
    def execute(self, params: dict) -> dict:
        # Your custom logic here
        api_url = params.get("url")
        response = requests.get(api_url)
        return {"result": response.json()}

# Use custom tool
agent = Agent(
    model="gpt-oss-120b",
    tools=[CustomAPITool()]
)
```

## Async Support

```python
import asyncio
from chofesh import Agent, Conversation

async def main():
    agent = Agent(model="gpt-oss-120b")
    conversation = Conversation(agent=agent)
    
    response = await conversation.send_message_async(
        "Explain async programming"
    )
    
    print(response.content)

asyncio.run(main())
```

## Streaming Responses

```python
from chofesh import Agent, Conversation

agent = Agent(model="gpt-oss-120b")
conversation = Conversation(agent=agent)

# Stream response
for chunk in conversation.stream_message("Write a long story"):
    print(chunk.content, end="", flush=True)
```

## Configuration

Set environment variables:

```bash
export CHOFESH_API_KEY="your_api_key"
export CHOFESH_API_URL="https://chofesh.ai/api"  # optional
export GITHUB_TOKEN="your_github_token"  # for GitHub integration
```

Or use `.env` file:

```
CHOFESH_API_KEY=your_api_key
GITHUB_TOKEN=your_github_token
```

## Documentation

- [Full Documentation](https://docs.chofesh.ai/sdk)
- [API Reference](https://docs.chofesh.ai/sdk/api)
- [Examples](https://github.com/chofesh/chofesh-sdk/tree/main/examples)
- [Contributing Guide](https://github.com/chofesh/chofesh-sdk/blob/main/CONTRIBUTING.md)

## Examples

Check out the [examples](./examples) directory for more use cases:

- [Basic Chat](./examples/basic_chat.py)
- [Web Search Agent](./examples/web_search.py)
- [Code Execution](./examples/code_execution.py)
- [GitHub Automation](./examples/github_automation.py)
- [Custom Tools](./examples/custom_tool.py)
- [Multi-Tool Agent](./examples/multi_tool.py)

## Requirements

- Python 3.8+
- Chofesh.ai account (free tier available)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- [Documentation](https://docs.chofesh.ai)
- [GitHub Issues](https://github.com/chofesh/chofesh-sdk/issues)
- [Discord Community](https://discord.gg/chofesh)
- [Email Support](mailto:support@chofesh.ai)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Roadmap

- [x] Core SDK (Agent, Conversation, LLM)
- [x] Tool system
- [x] GitHub integration
- [ ] GitLab integration
- [ ] Workspace abstraction
- [ ] Multi-agent orchestration
- [ ] Skills registry
- [ ] Agent marketplace

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
