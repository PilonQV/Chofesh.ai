"""
Message data models for Chofesh SDK
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MessageRole(str, Enum):
    """Message role enum"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class ToolCall(BaseModel):
    """Tool call information"""
    id: str
    name: str
    parameters: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert tool call to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "parameters": self.parameters,
            "result": self.result,
            "error": self.error,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ToolCall":
        """Create tool call from dictionary"""
        return cls(
            id=data["id"],
            name=data["name"],
            parameters=data["parameters"],
            result=data.get("result"),
            error=data.get("error"),
        )


class Message(BaseModel):
    """Message model"""
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    model: Optional[str] = None
    tool_calls: List[ToolCall] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = ConfigDict(use_enum_values=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary"""
        return {
            "role": self.role.value if isinstance(self.role, MessageRole) else self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "model": self.model,
            "tool_calls": [
                {
                    "id": tc.id,
                    "name": tc.name,
                    "parameters": tc.parameters,
                    "result": tc.result,
                    "error": tc.error,
                }
                for tc in self.tool_calls
            ],
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Message":
        """Create message from dictionary"""
        tool_calls = [
            ToolCall(**tc) for tc in data.get("tool_calls", [])
        ]
        
        return cls(
            role=MessageRole(data["role"]),
            content=data["content"],
            timestamp=datetime.fromisoformat(data.get("timestamp", datetime.now().isoformat())),
            model=data.get("model"),
            tool_calls=tool_calls,
            metadata=data.get("metadata", {}),
        )


class StreamChunk(BaseModel):
    """Streaming response chunk"""
    content: str
    is_final: bool = False
    tool_call: Optional[ToolCall] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
