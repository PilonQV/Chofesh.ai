"""
Chofesh SDK - Build autonomous AI agents with privacy
"""

__version__ = "0.1.0"

from .agent import Agent
from .conversation import Conversation
from .llm import LLM
from .message import Message, MessageRole
from .exceptions import (
    ChofeshError,
    AuthenticationError,
    APIError,
    RateLimitError,
    ToolExecutionError,
)

__all__ = [
    "Agent",
    "Conversation",
    "LLM",
    "Message",
    "MessageRole",
    "ChofeshError",
    "AuthenticationError",
    "APIError",
    "RateLimitError",
    "ToolExecutionError",
]
