"""
Conversation module for managing chat sessions
"""
from typing import List, Optional, Iterator
from .message import Message, MessageRole, StreamChunk
from .agent import Agent


class Conversation:
    """Conversation manager for chat sessions"""
    
    def __init__(
        self,
        agent: Agent,
        system_message: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ):
        """
        Initialize conversation
        
        Args:
            agent: Agent instance
            system_message: Optional system message
            conversation_id: Optional conversation ID for persistence
        """
        self.agent = agent
        self.conversation_id = conversation_id
        self.messages: List[Message] = []
        
        if system_message:
            self.messages.append(
                Message(role=MessageRole.SYSTEM, content=system_message)
            )
    
    def send_message(
        self,
        content: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Message:
        """
        Send a message and get response
        
        Args:
            content: User message content
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Returns:
            Assistant response message
        """
        # Add user message
        user_message = Message(role=MessageRole.USER, content=content)
        self.messages.append(user_message)
        
        # Get response from agent
        response = self.agent.process(
            self.messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        # Add assistant message
        self.messages.append(response)
        
        return response
    
    def stream_message(
        self,
        content: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Iterator[StreamChunk]:
        """
        Send a message and stream response
        
        Args:
            content: User message content
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Yields:
            Stream chunks
        """
        # Add user message
        user_message = Message(role=MessageRole.USER, content=content)
        self.messages.append(user_message)
        
        # Stream response from agent
        full_content = ""
        for chunk in self.agent.stream(
            self.messages,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            full_content += chunk.content
            yield chunk
        
        # Add complete assistant message
        assistant_message = Message(
            role=MessageRole.ASSISTANT,
            content=full_content,
            model=self.agent.model,
        )
        self.messages.append(assistant_message)
    
    async def send_message_async(
        self,
        content: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Message:
        """
        Async version of send_message()
        
        Args:
            content: User message content
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
        
        Returns:
            Assistant response message
        """
        # Add user message
        user_message = Message(role=MessageRole.USER, content=content)
        self.messages.append(user_message)
        
        # Get response from agent
        response = await self.agent.process_async(
            self.messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        # Add assistant message
        self.messages.append(response)
        
        return response
    
    def get_messages(self) -> List[Message]:
        """Get all messages in conversation"""
        return self.messages.copy()
    
    def clear(self):
        """Clear conversation history (except system message)"""
        system_messages = [
            msg for msg in self.messages
            if msg.role == MessageRole.SYSTEM
        ]
        self.messages = system_messages
    
    def to_dict(self) -> dict:
        """Convert conversation to dictionary"""
        return {
            "conversation_id": self.conversation_id,
            "messages": [msg.to_dict() for msg in self.messages],
            "agent": {
                "model": self.agent.model,
                "tools": [tool.name for tool in self.agent.tools],
            }
        }
    
    @classmethod
    def from_dict(cls, data: dict, agent: Agent) -> "Conversation":
        """Create conversation from dictionary"""
        conversation = cls(
            agent=agent,
            conversation_id=data.get("conversation_id"),
        )
        
        conversation.messages = [
            Message.from_dict(msg_data)
            for msg_data in data.get("messages", [])
        ]
        
        return conversation
