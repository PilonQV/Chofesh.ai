"""
Multi-tool agent example
"""
from chofesh import Agent, Conversation
from chofesh.tools import WebSearchTool, CodeExecutionTool, GitHubTool

def main():
    # Create agent with multiple tools
    agent = Agent(
        model="gpt-oss-120b",
        tools=[
            WebSearchTool(),
            CodeExecutionTool(),
            GitHubTool(repo="username/repo"),
        ],
    )
    
    # Start conversation
    conversation = Conversation(
        agent=agent,
        system_message="You are a helpful coding assistant with access to web search, code execution, and GitHub."
    )
    
    # Complex task requiring multiple tools
    response = conversation.send_message("""
    I need to add a new feature to my project:
    1. Search for best practices for implementing authentication in Node.js
    2. Write a simple example code
    3. Test the code to make sure it works
    4. Create a new branch in my repo and add the code
    """)
    
    print("Assistant:", response.content)
    
    # Show all tool executions
    print("\n" + "="*50)
    print("Tool Execution Summary:")
    print("="*50)
    
    if response.tool_calls:
        for i, tool_call in enumerate(response.tool_calls, 1):
            print(f"\n{i}. {tool_call.name}")
            print(f"   Parameters: {tool_call.parameters}")
            if tool_call.result:
                result_str = str(tool_call.result)
                if len(result_str) > 200:
                    result_str = result_str[:200] + "..."
                print(f"   Result: {result_str}")
            if tool_call.error:
                print(f"   Error: {tool_call.error}")

if __name__ == "__main__":
    main()
