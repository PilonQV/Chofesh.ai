"""
Tests for LLM module
"""
import pytest
import responses
from unittest.mock import patch, Mock
from chofesh.llm import LLM
from chofesh.message import Message, MessageRole, StreamChunk
from chofesh.exceptions import APIError, AuthenticationError, RateLimitError


class TestLLM:
    """Test LLM class"""
    
    def test_create_llm_with_api_key(self):
        """Test creating LLM with API key"""
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        
        assert llm.model == "gpt-oss-120b"
        assert llm.api_key == "test_key"
        assert llm.api_url == "https://chofesh.ai/api"
        assert llm.timeout == 60
    
    @patch.dict('os.environ', {'CHOFESH_API_KEY': 'env_key'})
    def test_create_llm_with_env_var(self):
        """Test creating LLM with environment variable"""
        llm = LLM(model="gpt-oss-120b")
        
        assert llm.api_key == "env_key"
    
    def test_create_llm_without_api_key(self):
        """Test creating LLM without API key"""
        llm = LLM(model="gpt-oss-120b")
        
        # Should not raise error at init
        assert llm.api_key is None
    
    def test_create_llm_with_custom_url(self):
        """Test creating LLM with custom API URL"""
        llm = LLM(
            model="gpt-oss-120b",
            api_key="test_key",
            api_url="https://custom.api.com"
        )
        
        assert llm.api_url == "https://custom.api.com"
    
    def test_create_llm_with_custom_timeout(self):
        """Test creating LLM with custom timeout"""
        llm = LLM(
            model="gpt-oss-120b",
            api_key="test_key",
            timeout=120
        )
        
        assert llm.timeout == 120
    
    def test_get_headers_with_api_key(self):
        """Test getting headers with API key"""
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        headers = llm._get_headers()
        
        assert headers["Authorization"] == "Bearer test_key"
        assert headers["Content-Type"] == "application/json"
    
    def test_get_headers_without_api_key(self):
        """Test getting headers without API key raises error"""
        llm = LLM(model="gpt-oss-120b")
        
        with pytest.raises(AuthenticationError) as exc_info:
            llm._get_headers()
        
        assert "API key" in str(exc_info.value)
    
    @responses.activate
    def test_complete_success(self):
        """Test successful completion"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            json={
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Hello! How can I help?"
                    }
                }],
                "model": "gpt-oss-120b"
            },
            status=200
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Hi")]
        
        response = llm.complete(messages)
        
        assert response.role == MessageRole.ASSISTANT
        assert response.content == "Hello! How can I help?"
        assert response.model == "gpt-oss-120b"
    
    @responses.activate
    def test_complete_with_temperature(self):
        """Test completion with custom temperature"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            json={
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Response"
                    }
                }]
            },
            status=200
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Test")]
        
        response = llm.complete(messages, temperature=0.9)
        
        assert response.content == "Response"
        
        # Verify temperature was sent in request
        request_body = responses.calls[0].request.body
        assert b'"temperature": 0.9' in request_body
    
    @responses.activate
    def test_complete_with_max_tokens(self):
        """Test completion with max_tokens"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            json={
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Response"
                    }
                }]
            },
            status=200
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Test")]
        
        response = llm.complete(messages, max_tokens=100)
        
        assert response.content == "Response"
    

    
    @responses.activate
    def test_complete_401_error(self):
        """Test handling 401 authentication error"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            json={"error": "Invalid API key"},
            status=401
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="invalid_key")
        messages = [Message(role=MessageRole.USER, content="Test")]
        
        with pytest.raises(AuthenticationError) as exc_info:
            llm.complete(messages)
        
        assert "Invalid API key" in str(exc_info.value)
    
    @responses.activate
    def test_complete_429_rate_limit(self):
        """Test handling 429 rate limit error"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            json={"error": "Rate limit exceeded"},
            status=429,
            headers={"Retry-After": "60"}
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Test")]
        
        with pytest.raises(RateLimitError) as exc_info:
            llm.complete(messages)
        
        assert exc_info.value.retry_after == 60
    
    @responses.activate
    def test_complete_500_error(self):
        """Test handling 500 server error"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            json={"error": "Internal server error"},
            status=500
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Test")]
        
        with pytest.raises(APIError) as exc_info:
            llm.complete(messages)
        
        assert exc_info.value.status_code == 500
    
    @responses.activate
    def test_stream_success(self):
        """Test successful streaming"""
        # Mock streaming response
        stream_data = """data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" there"}}]}

data: {"choices":[{"delta":{"content":"!"}}]}

data: [DONE]

"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            body=stream_data,
            status=200,
            stream=True
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Hi")]
        
        chunks = list(llm.stream(messages))
        
        assert len(chunks) >= 3
        assert any("Hello" in chunk.content for chunk in chunks)
    
    @responses.activate
    def test_stream_with_temperature(self):
        """Test streaming with custom temperature"""
        stream_data = """data: {"choices":[{"delta":{"content":"Response"}}]}

data: [DONE]

"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            body=stream_data,
            status=200,
            stream=True
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Test")]
        
        chunks = list(llm.stream(messages, temperature=0.9))
        
        assert len(chunks) > 0
    
    @responses.activate
    def test_handle_error_with_response_body(self):
        """Test error handling with response body"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/chat/completions",
            json={"error": {"message": "Bad request", "type": "invalid_request"}},
            status=400
        )
        
        llm = LLM(model="gpt-oss-120b", api_key="test_key")
        messages = [Message(role=MessageRole.USER, content="Test")]
        
        with pytest.raises(APIError) as exc_info:
            llm.complete(messages)
        
        assert exc_info.value.status_code == 400
        assert exc_info.value.response is not None
    

    

