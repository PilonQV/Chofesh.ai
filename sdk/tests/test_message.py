"""
Tests for message module
"""
import pytest
from chofesh.message import Message, MessageRole, ToolCall, StreamChunk


class TestMessage:
    """Test Message class"""
    
    def test_create_user_message(self):
        """Test creating a user message"""
        msg = Message(role=MessageRole.USER, content="Hello")
        assert msg.role == MessageRole.USER
        assert msg.content == "Hello"
        assert msg.tool_calls == []
        assert msg.metadata == {}
    
    def test_create_assistant_message(self):
        """Test creating an assistant message"""
        msg = Message(role=MessageRole.ASSISTANT, content="Hi there")
        assert msg.role == MessageRole.ASSISTANT
        assert msg.content == "Hi there"
    
    def test_create_system_message(self):
        """Test creating a system message"""
        msg = Message(role=MessageRole.SYSTEM, content="You are helpful")
        assert msg.role == MessageRole.SYSTEM
        assert msg.content == "You are helpful"
    
    def test_message_with_metadata(self):
        """Test message with metadata"""
        msg = Message(
            role=MessageRole.USER,
            content="Test",
            metadata={"source": "test"}
        )
        assert msg.metadata["source"] == "test"
    
    def test_message_to_dict(self):
        """Test message serialization"""
        msg = Message(role=MessageRole.USER, content="Hello")
        data = msg.to_dict()
        
        assert data["role"] == "user"
        assert data["content"] == "Hello"
        assert "tool_calls" in data
        assert "metadata" in data
    
    def test_message_from_dict(self):
        """Test message deserialization"""
        data = {
            "role": "user",
            "content": "Hello",
            "tool_calls": [],
            "metadata": {}
        }
        msg = Message.from_dict(data)
        
        assert msg.role == MessageRole.USER
        assert msg.content == "Hello"


class TestToolCall:
    """Test ToolCall class"""
    
    def test_create_tool_call(self):
        """Test creating a tool call"""
        tool_call = ToolCall(
            id="call_123",
            name="web_search",
            parameters={"query": "test"}
        )
        
        assert tool_call.id == "call_123"
        assert tool_call.name == "web_search"
        assert tool_call.parameters == {"query": "test"}
        assert tool_call.result is None
        assert tool_call.error is None
    
    def test_tool_call_with_result(self):
        """Test tool call with result"""
        tool_call = ToolCall(
            id="call_123",
            name="web_search",
            parameters={"query": "test"},
            result={"results": []}
        )
        
        assert tool_call.result == {"results": []}
    
    def test_tool_call_with_error(self):
        """Test tool call with error"""
        tool_call = ToolCall(
            id="call_123",
            name="web_search",
            parameters={"query": "test"},
            error="API error"
        )
        
        assert tool_call.error == "API error"
    
    def test_tool_call_to_dict(self):
        """Test tool call serialization"""
        tool_call = ToolCall(
            id="call_123",
            name="web_search",
            parameters={"query": "test"}
        )
        data = tool_call.to_dict()
        
        assert data["id"] == "call_123"
        assert data["name"] == "web_search"
        assert data["parameters"] == {"query": "test"}
    
    def test_tool_call_from_dict(self):
        """Test tool call deserialization"""
        data = {
            "id": "call_123",
            "name": "web_search",
            "parameters": {"query": "test"},
            "result": None,
            "error": None
        }
        tool_call = ToolCall.from_dict(data)
        
        assert tool_call.id == "call_123"
        assert tool_call.name == "web_search"


class TestStreamChunk:
    """Test StreamChunk class"""
    
    def test_create_stream_chunk(self):
        """Test creating a stream chunk"""
        chunk = StreamChunk(content="Hello", is_final=False)
        
        assert chunk.content == "Hello"
        assert chunk.is_final is False
        assert chunk.metadata == {}
    
    def test_final_stream_chunk(self):
        """Test final stream chunk"""
        chunk = StreamChunk(content="", is_final=True)
        
        assert chunk.is_final is True
    
    def test_stream_chunk_with_metadata(self):
        """Test stream chunk with metadata"""
        chunk = StreamChunk(
            content="Test",
            is_final=False,
            metadata={"model": "gpt-oss-120b"}
        )
        
        assert chunk.metadata["model"] == "gpt-oss-120b"
