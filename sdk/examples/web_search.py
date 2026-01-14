"""
Web search agent example
"""
from chofesh import Agent, Conversation
from chofesh.tools import WebSearchTool

def main():
    # Create agent with web search tool
    agent = Agent(
        model="gpt-oss-120b",
        tools=[WebSearchTool()],
    )
    
    # Start conversation
    conversation = Conversation(agent=agent)
    
    # Ask agent to search and summarize
    response = conversation.send_message(
        "Search for the latest developments in quantum computing and summarize the top 3 findings"
    )
    
    print("Assistant:", response.content)
    
    # Check if tools were used
    if response.tool_calls:
        print("\nTools used:")
        for tool_call in response.tool_calls:
            print(f"- {tool_call.name}")
            if tool_call.result:
                print(f"  Result: {tool_call.result}")

if __name__ == "__main__":
    main()
