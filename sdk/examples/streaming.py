"""
Streaming response example
"""
from chofesh import Agent, Conversation

def main():
    # Create agent
    agent = Agent(model="gpt-oss-120b")
    
    # Start conversation
    conversation = Conversation(agent=agent)
    
    print("Assistant: ", end="", flush=True)
    
    # Stream response
    for chunk in conversation.stream_message(
        "Write a short story about a robot learning to paint"
    ):
        print(chunk.content, end="", flush=True)
        
        if chunk.is_final:
            print("\n\n[Stream complete]")

if __name__ == "__main__":
    main()
