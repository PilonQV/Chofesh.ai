"""
Exception classes for Chofesh SDK
"""


class ChofeshError(Exception):
    """Base exception for all Chofesh SDK errors"""
    pass


class AuthenticationError(ChofeshError):
    """Raised when authentication fails"""
    pass


class APIError(ChofeshError):
    """Raised when API request fails"""
    
    def __init__(self, message: str, status_code: int = None, response: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class RateLimitError(APIError):
    """Raised when rate limit is exceeded"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = None):
        super().__init__(message, status_code=429)
        self.retry_after = retry_after


class ToolExecutionError(ChofeshError):
    """Raised when tool execution fails"""
    
    def __init__(self, tool_name: str, message: str, original_error: Exception = None):
        super().__init__(f"Tool '{tool_name}' execution failed: {message}")
        self.tool_name = tool_name
        self.original_error = original_error


class ValidationError(ChofeshError):
    """Raised when input validation fails"""
    pass


class ConfigurationError(ChofeshError):
    """Raised when configuration is invalid"""
    pass
