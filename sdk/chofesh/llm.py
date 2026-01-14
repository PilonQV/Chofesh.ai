"""
LLM module for interacting with Chofesh AI models
"""
import os
from typing import Optional, List, Dict, Any, Iterator
import requests
from .message import Message, MessageRole, StreamChunk
from .exceptions import APIError, AuthenticationError, RateLimitError


class LLM:
    """LLM client for Chofesh AI"""
    
    def __init__(
        self,
        model: str = "gpt-oss-120b",
        api_key: Optional[str] = None,
        api_url: Optional[str] = None,
        timeout: int = 60,
    ):
        """
        Initialize LLM client
        
        Args:
            model: Model name (default: gpt-oss-120b)
            api_key: Chofesh API key (or set CHOFESH_API_KEY env var)
            api_url: API base URL (default: https://chofesh.ai/api)
            timeout: Request timeout in seconds
        """
        self.model = model
        self.api_key = api_key or os.getenv("CHOFESH_API_KEY")
        self.api_url = api_url or os.getenv("CHOFESH_API_URL", "https://chofesh.ai/api")
        self.timeout = timeout
        
        if not self.api_key:
            raise AuthenticationError(
                "API key is required. Set CHOFESH_API_KEY environment variable "
                "or pass api_key parameter."
            )
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
    
    def _handle_error(self, response: requests.Response):
        """Handle API error responses"""
        if response.status_code == 401:
            raise AuthenticationError("Invalid API key")
        elif response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            raise RateLimitError(
                retry_after=int(retry_after) if retry_after else None
            )
        elif response.status_code >= 400:
            try:
                error_data = response.json()
                message = error_data.get("error", response.text)
            except:
                message = response.text
            
            raise APIError(
                message=message,
                status_code=response.status_code,
                response=error_data if 'error_data' in locals() else None
            )
    
    def complete(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Message:
        """
        Complete a conversation
        
        Args:
            messages: List of messages
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            tools: Available tools for the model
            **kwargs: Additional model parameters
        
        Returns:
            Assistant message response
        """
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": msg.role.value if isinstance(msg.role, MessageRole) else msg.role,
                    "content": msg.content
                }
                for msg in messages
            ],
            "temperature": temperature,
            "stream": False,
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        if tools:
            payload["tools"] = tools
        
        payload.update(kwargs)
        
        response = requests.post(
            f"{self.api_url}/chat/completions",
            headers=self._get_headers(),
            json=payload,
            timeout=self.timeout,
        )
        
        if response.status_code != 200:
            self._handle_error(response)
        
        data = response.json()
        choice = data["choices"][0]
        message_data = choice["message"]
        
        # Parse tool calls if present
        tool_calls = []
        if "tool_calls" in message_data:
            from .message import ToolCall
            tool_calls = [
                ToolCall(
                    id=tc["id"],
                    name=tc["function"]["name"],
                    parameters=tc["function"]["arguments"],
                )
                for tc in message_data["tool_calls"]
            ]
        
        return Message(
            role=MessageRole.ASSISTANT,
            content=message_data.get("content", ""),
            model=self.model,
            tool_calls=tool_calls,
            metadata={
                "usage": data.get("usage", {}),
                "finish_reason": choice.get("finish_reason"),
            }
        )
    
    def stream(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Iterator[StreamChunk]:
        """
        Stream a conversation completion
        
        Args:
            messages: List of messages
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            tools: Available tools for the model
            **kwargs: Additional model parameters
        
        Yields:
            Stream chunks
        """
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": msg.role.value if isinstance(msg.role, MessageRole) else msg.role,
                    "content": msg.content
                }
                for msg in messages
            ],
            "temperature": temperature,
            "stream": True,
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        if tools:
            payload["tools"] = tools
        
        payload.update(kwargs)
        
        response = requests.post(
            f"{self.api_url}/chat/completions",
            headers=self._get_headers(),
            json=payload,
            timeout=self.timeout,
            stream=True,
        )
        
        if response.status_code != 200:
            self._handle_error(response)
        
        for line in response.iter_lines():
            if not line:
                continue
            
            line = line.decode('utf-8')
            if line.startswith('data: '):
                line = line[6:]
            
            if line == '[DONE]':
                yield StreamChunk(content="", is_final=True)
                break
            
            try:
                import json
                data = json.loads(line)
                choice = data["choices"][0]
                delta = choice.get("delta", {})
                
                content = delta.get("content", "")
                is_final = choice.get("finish_reason") is not None
                
                yield StreamChunk(
                    content=content,
                    is_final=is_final,
                    metadata={
                        "finish_reason": choice.get("finish_reason"),
                    }
                )
            except json.JSONDecodeError:
                continue
    
    async def complete_async(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Message:
        """
        Async version of complete()
        
        Args:
            messages: List of messages
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens to generate
            tools: Available tools for the model
            **kwargs: Additional model parameters
        
        Returns:
            Assistant message response
        """
        import aiohttp
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": msg.role.value if isinstance(msg.role, MessageRole) else msg.role,
                    "content": msg.content
                }
                for msg in messages
            ],
            "temperature": temperature,
            "stream": False,
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        if tools:
            payload["tools"] = tools
        
        payload.update(kwargs)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.api_url}/chat/completions",
                headers=self._get_headers(),
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.timeout),
            ) as response:
                if response.status != 200:
                    # Create a mock response object for error handling
                    class MockResponse:
                        def __init__(self, status, text, headers):
                            self.status_code = status
                            self.text = text
                            self.headers = headers
                        def json(self):
                            import json
                            return json.loads(self.text)
                    
                    mock_resp = MockResponse(
                        response.status,
                        await response.text(),
                        response.headers
                    )
                    self._handle_error(mock_resp)
                
                data = await response.json()
                choice = data["choices"][0]
                message_data = choice["message"]
                
                # Parse tool calls if present
                tool_calls = []
                if "tool_calls" in message_data:
                    from .message import ToolCall
                    tool_calls = [
                        ToolCall(
                            id=tc["id"],
                            name=tc["function"]["name"],
                            parameters=tc["function"]["arguments"],
                        )
                        for tc in message_data["tool_calls"]
                    ]
                
                return Message(
                    role=MessageRole.ASSISTANT,
                    content=message_data.get("content", ""),
                    model=self.model,
                    tool_calls=tool_calls,
                    metadata={
                        "usage": data.get("usage", {}),
                        "finish_reason": choice.get("finish_reason"),
                    }
                )
