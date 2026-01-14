"""
Agent module for autonomous AI agents
"""
from typing import List, Optional, Iterator, Any, Dict
from .llm import LLM
from .message import Message, MessageRole, StreamChunk
from .exceptions import ToolExecutionError


class Agent:
    """Autonomous AI agent with tool support"""
    
    def __init__(
        self,
        model: str = "gpt-oss-120b",
        api_key: Optional[str] = None,
        api_url: Optional[str] = None,
        tools: Optional[List[Any]] = None,
        max_tool_iterations: int = 5,
        temperature: float = 0.7,
        **kwargs
    ):
        """
        Initialize agent
        
        Args:
            model: Model name
            api_key: Chofesh API key
            api_url: API base URL
            tools: List of tools available to agent
            max_tool_iterations: Maximum tool execution iterations
            temperature: Default sampling temperature
            **kwargs: Additional LLM parameters
        """
        self.model = model
        self.llm = LLM(model=model, api_key=api_key, api_url=api_url)
        self.tools = tools or []
        self.max_tool_iterations = max_tool_iterations
        self.temperature = temperature
        self.llm_kwargs = kwargs
        
        # Build tool registry
        self._tool_registry = {tool.name: tool for tool in self.tools}
    
    def add_tool(self, tool: Any):
        """Add a tool to the agent"""
        self.tools.append(tool)
        self._tool_registry[tool.name] = tool
    
    def remove_tool(self, tool_name: str):
        """Remove a tool from the agent"""
        if tool_name in self._tool_registry:
            tool = self._tool_registry[tool_name]
            self.tools.remove(tool)
            del self._tool_registry[tool_name]
    
    def _get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Get tool schemas for LLM"""
        return [
            {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters,
                }
            }
            for tool in self.tools
        ]
    
    def _execute_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Any:
        """Execute a tool"""
        if tool_name not in self._tool_registry:
            raise ToolExecutionError(
                tool_name=tool_name,
                message=f"Tool '{tool_name}' not found in registry"
            )
        
        tool = self._tool_registry[tool_name]
        
        try:
            result = tool.execute(parameters)
            return result
        except Exception as e:
            raise ToolExecutionError(
                tool_name=tool_name,
                message=str(e),
                original_error=e
            )
    
    def process(
        self,
        messages: List[Message],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Message:
        """
        Process messages and return response
        
        Args:
            messages: List of messages
            temperature: Sampling temperature (overrides default)
            max_tokens: Maximum tokens to generate
        
        Returns:
            Assistant response message
        """
        temp = temperature if temperature is not None else self.temperature
        tool_schemas = self._get_tool_schemas() if self.tools else None
        
        # Initial completion
        response = self.llm.complete(
            messages=messages,
            temperature=temp,
            max_tokens=max_tokens,
            tools=tool_schemas,
            **self.llm_kwargs
        )
        
        # Handle tool calls
        iteration = 0
        current_messages = messages.copy()
        current_messages.append(response)
        
        while response.tool_calls and iteration < self.max_tool_iterations:
            iteration += 1
            
            # Execute all tool calls
            for tool_call in response.tool_calls:
                try:
                    result = self._execute_tool(
                        tool_call.name,
                        tool_call.parameters
                    )
                    tool_call.result = result
                    
                    # Add tool result message
                    tool_message = Message(
                        role=MessageRole.TOOL,
                        content=str(result),
                        metadata={
                            "tool_call_id": tool_call.id,
                            "tool_name": tool_call.name,
                        }
                    )
                    current_messages.append(tool_message)
                    
                except ToolExecutionError as e:
                    tool_call.error = str(e)
                    
                    # Add error message
                    error_message = Message(
                        role=MessageRole.TOOL,
                        content=f"Error: {str(e)}",
                        metadata={
                            "tool_call_id": tool_call.id,
                            "tool_name": tool_call.name,
                            "error": True,
                        }
                    )
                    current_messages.append(error_message)
            
            # Get next response
            response = self.llm.complete(
                messages=current_messages,
                temperature=temp,
                max_tokens=max_tokens,
                tools=tool_schemas,
                **self.llm_kwargs
            )
            current_messages.append(response)
        
        return response
    
    def stream(
        self,
        messages: List[Message],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Iterator[StreamChunk]:
        """
        Stream response
        
        Args:
            messages: List of messages
            temperature: Sampling temperature (overrides default)
            max_tokens: Maximum tokens to generate
        
        Yields:
            Stream chunks
        """
        temp = temperature if temperature is not None else self.temperature
        tool_schemas = self._get_tool_schemas() if self.tools else None
        
        yield from self.llm.stream(
            messages=messages,
            temperature=temp,
            max_tokens=max_tokens,
            tools=tool_schemas,
            **self.llm_kwargs
        )
    
    async def process_async(
        self,
        messages: List[Message],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Message:
        """
        Async version of process()
        
        Args:
            messages: List of messages
            temperature: Sampling temperature (overrides default)
            max_tokens: Maximum tokens to generate
        
        Returns:
            Assistant response message
        """
        temp = temperature if temperature is not None else self.temperature
        tool_schemas = self._get_tool_schemas() if self.tools else None
        
        # Initial completion
        response = await self.llm.complete_async(
            messages=messages,
            temperature=temp,
            max_tokens=max_tokens,
            tools=tool_schemas,
            **self.llm_kwargs
        )
        
        # Handle tool calls
        iteration = 0
        current_messages = messages.copy()
        current_messages.append(response)
        
        while response.tool_calls and iteration < self.max_tool_iterations:
            iteration += 1
            
            # Execute all tool calls
            for tool_call in response.tool_calls:
                try:
                    result = self._execute_tool(
                        tool_call.name,
                        tool_call.parameters
                    )
                    tool_call.result = result
                    
                    # Add tool result message
                    tool_message = Message(
                        role=MessageRole.TOOL,
                        content=str(result),
                        metadata={
                            "tool_call_id": tool_call.id,
                            "tool_name": tool_call.name,
                        }
                    )
                    current_messages.append(tool_message)
                    
                except ToolExecutionError as e:
                    tool_call.error = str(e)
                    
                    # Add error message
                    error_message = Message(
                        role=MessageRole.TOOL,
                        content=f"Error: {str(e)}",
                        metadata={
                            "tool_call_id": tool_call.id,
                            "tool_name": tool_call.name,
                            "error": True,
                        }
                    )
                    current_messages.append(error_message)
            
            # Get next response
            response = await self.llm.complete_async(
                messages=current_messages,
                temperature=temp,
                max_tokens=max_tokens,
                tools=tool_schemas,
                **self.llm_kwargs
            )
            current_messages.append(response)
        
        return response
