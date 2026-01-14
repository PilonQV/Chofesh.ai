"""
Tests for exceptions module
"""
import pytest
from chofesh.exceptions import (
    ChofeshError,
    AuthenticationError,
    APIError,
    RateLimitError,
    ToolExecutionError,
    ValidationError,
)


class TestExceptions:
    """Test exception classes"""
    
    def test_chofesh_error(self):
        """Test base ChofeshError"""
        error = ChofeshError("Test error")
        assert str(error) == "Test error"
        assert isinstance(error, Exception)
    
    def test_authentication_error(self):
        """Test AuthenticationError"""
        error = AuthenticationError("Invalid API key")
        assert str(error) == "Invalid API key"
        assert isinstance(error, ChofeshError)
    
    def test_api_error(self):
        """Test APIError"""
        error = APIError("API request failed", status_code=500)
        assert "API request failed" in str(error)
        assert error.status_code == 500
        assert isinstance(error, ChofeshError)
    
    def test_api_error_with_response(self):
        """Test APIError with response"""
        error = APIError(
            "Request failed",
            status_code=400,
            response={"error": "Bad request"}
        )
        assert error.status_code == 400
        assert error.response == {"error": "Bad request"}
    
    def test_rate_limit_error(self):
        """Test RateLimitError"""
        error = RateLimitError("Rate limit exceeded", retry_after=60)
        assert "Rate limit exceeded" in str(error)
        assert error.retry_after == 60
        assert isinstance(error, APIError)
    
    def test_tool_execution_error(self):
        """Test ToolExecutionError"""
        error = ToolExecutionError(
            tool_name="web_search",
            message="Search failed"
        )
        assert error.tool_name == "web_search"
        assert "Search failed" in str(error)
        assert isinstance(error, ChofeshError)
    
    def test_tool_execution_error_with_original(self):
        """Test ToolExecutionError with original error"""
        original = ValueError("Invalid parameter")
        error = ToolExecutionError(
            tool_name="web_search",
            message="Search failed",
            original_error=original
        )
        assert error.original_error == original
    
    def test_validation_error(self):
        """Test ValidationError"""
        error = ValidationError("Invalid input")
        assert str(error) == "Invalid input"
        assert isinstance(error, ChofeshError)
