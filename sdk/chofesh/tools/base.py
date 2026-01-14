"""
Base tool class for Chofesh SDK
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel


class ToolParameter(BaseModel):
    """Tool parameter definition"""
    type: str
    description: str
    required: bool = False
    enum: Optional[list] = None
    default: Optional[Any] = None


class Tool(ABC):
    """Base class for all tools"""
    
    # Tool metadata (override in subclasses)
    name: str = "base_tool"
    description: str = "Base tool class"
    parameters: Dict[str, Any] = {
        "type": "object",
        "properties": {},
        "required": [],
    }
    
    def __init__(self, **config):
        """
        Initialize tool with configuration
        
        Args:
            **config: Tool-specific configuration
        """
        self.config = config
        # Don't validate on init to allow testing
        # Validation happens on execute
        if config.get('validate', True):
            self.validate_config()
    
    def validate_config(self):
        """Validate tool configuration (override if needed)"""
        pass
    
    @abstractmethod
    def execute(self, parameters: Dict[str, Any]) -> Any:
        """
        Execute the tool
        
        Args:
            parameters: Tool parameters
        
        Returns:
            Tool execution result
        """
        pass
    
    def to_schema(self) -> Dict[str, Any]:
        """Convert tool to OpenAI function schema"""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            }
        }
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(name='{self.name}')>"
