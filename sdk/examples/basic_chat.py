"""
Basic chat example with Chofesh SDK
"""
from chofesh import Agent, Conversation

def main():
    # Create an agent with GPT-OSS 120B
    agent = Agent(
        model="gpt-oss-120b",
        # api_key="your_api_key"  # or set CHOFESH_API_KEY env var
    )
    
    # Start a conversation
    conversation = Conversation(agent=agent)
    
    # Send a message
    response = conversation.send_message("Explain quantum computing in simple terms")
    
    print("Assistant:", response.content)
    
    # Continue the conversation
    response = conversation.send_message("Can you give me a code example?")
    
    print("\nAssistant:", response.content)

if __name__ == "__main__":
    main()
