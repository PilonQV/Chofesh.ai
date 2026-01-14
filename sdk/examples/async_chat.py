"""
Async chat example
"""
import asyncio
from chofesh import Agent, Conversation

async def main():
    # Create agent
    agent = Agent(model="gpt-oss-120b")
    
    # Start conversation
    conversation = Conversation(agent=agent)
    
    # Send message asynchronously
    response = await conversation.send_message_async(
        "Explain async programming in Python"
    )
    
    print("Assistant:", response.content)
    
    # Multiple concurrent requests
    tasks = [
        conversation.send_message_async("What is asyncio?"),
        conversation.send_message_async("What are coroutines?"),
        conversation.send_message_async("What is the event loop?"),
    ]
    
    responses = await asyncio.gather(*tasks)
    
    print("\nConcurrent responses:")
    for i, response in enumerate(responses, 1):
        print(f"\n{i}. {response.content[:100]}...")

if __name__ == "__main__":
    asyncio.run(main())
