"""
GitHub automation example
"""
from chofesh import Agent, Conversation
from chofesh.tools import GitHubTool

def main():
    # Create GitHub tool
    github = GitHubTool(
        # token="your_github_token",  # or set GITHUB_TOKEN env var
        repo="username/repo"  # or set GITHUB_REPO env var
    )
    
    # Create agent with GitHub tool
    agent = Agent(
        model="deepseek-r1",
        tools=[github],
    )
    
    # Start conversation
    conversation = Conversation(agent=agent)
    
    # Automate GitHub operations
    response = conversation.send_message("""
    Please do the following:
    1. Read the README.md file
    2. Check for any TODO comments in the code
    3. Create an issue for each TODO found
    4. Create a new branch called 'fix-todos'
    """)
    
    print("Assistant:", response.content)
    
    # Show tool executions
    if response.tool_calls:
        print("\nGitHub operations performed:")
        for tool_call in response.tool_calls:
            print(f"- {tool_call.name}: {tool_call.parameters}")
            if tool_call.result:
                print(f"  Result: {tool_call.result}")

if __name__ == "__main__":
    main()
