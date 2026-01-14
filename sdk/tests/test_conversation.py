"""
Tests for conversation module
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from chofesh.conversation import Conversation
from chofesh.agent import Agent
from chofesh.message import Message, MessageRole, StreamChunk


class TestConversation:
    """Test Conversation class"""
    
    @patch('chofesh.agent.LLM')
    def test_create_conversation(self, mock_llm_class):
        """Test creating a conversation"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        assert conversation.agent == agent
        assert conversation.conversation_id is None
        assert len(conversation.messages) == 0
    
    @patch('chofesh.agent.LLM')
    def test_create_conversation_with_system_message(self, mock_llm_class):
        """Test creating conversation with system message"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(
            agent=agent,
            system_message="You are a helpful assistant"
        )
        
        assert len(conversation.messages) == 1
        assert conversation.messages[0].role == MessageRole.SYSTEM
        assert conversation.messages[0].content == "You are a helpful assistant"
    
    @patch('chofesh.agent.LLM')
    def test_create_conversation_with_id(self, mock_llm_class):
        """Test creating conversation with ID"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(
            agent=agent,
            conversation_id="conv_123"
        )
        
        assert conversation.conversation_id == "conv_123"
    
    @patch('chofesh.agent.LLM')
    def test_send_message(self, mock_llm_class):
        """Test sending a message"""
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="Hello! How can I help?"
        )
        mock_llm.complete.return_value = mock_response
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        response = conversation.send_message("Hi")
        
        assert response.content == "Hello! How can I help?"
        assert len(conversation.messages) == 2  # user + assistant
        assert conversation.messages[0].role == MessageRole.USER
        assert conversation.messages[1].role == MessageRole.ASSISTANT
    
    @patch('chofesh.agent.LLM')
    def test_send_message_with_temperature(self, mock_llm_class):
        """Test sending message with custom temperature"""
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="Response"
        )
        mock_llm.complete.return_value = mock_response
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        response = conversation.send_message("Test", temperature=0.9)
        
        # Verify temperature was passed to agent.process
        call_args = mock_llm.complete.call_args
        assert call_args is not None
    
    @patch('chofesh.agent.LLM')
    def test_send_message_with_max_tokens(self, mock_llm_class):
        """Test sending message with max_tokens"""
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="Response"
        )
        mock_llm.complete.return_value = mock_response
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        response = conversation.send_message("Test", max_tokens=100)
        
        assert response.content == "Response"
    
    @patch('chofesh.agent.LLM')
    def test_stream_message(self, mock_llm_class):
        """Test streaming a message"""
        mock_llm = Mock()
        
        # Mock streaming response
        chunks = [
            StreamChunk(content="Hello", is_final=False),
            StreamChunk(content=" there", is_final=False),
            StreamChunk(content="!", is_final=True),
        ]
        mock_llm.stream.return_value = iter(chunks)
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        # Collect streamed chunks
        collected_chunks = list(conversation.stream_message("Hi"))
        
        assert len(collected_chunks) == 3
        assert collected_chunks[0].content == "Hello"
        assert collected_chunks[1].content == " there"
        assert collected_chunks[2].content == "!"
        
        # Verify messages were added
        assert len(conversation.messages) == 2
        assert conversation.messages[0].role == MessageRole.USER
        assert conversation.messages[1].role == MessageRole.ASSISTANT
        assert conversation.messages[1].content == "Hello there!"
    
    @patch('chofesh.agent.LLM')
    @pytest.mark.asyncio
    async def test_send_message_async(self, mock_llm_class):
        """Test async message sending"""
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="Async response"
        )
        
        # Create async mock
        async def async_process(*args, **kwargs):
            return mock_response
        
        mock_llm.complete_async = AsyncMock(return_value=mock_response)
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        
        # Mock process_async
        agent.process_async = AsyncMock(return_value=mock_response)
        
        conversation = Conversation(agent=agent)
        
        response = await conversation.send_message_async("Hi")
        
        assert response.content == "Async response"
        assert len(conversation.messages) == 2
    
    @patch('chofesh.agent.LLM')
    def test_get_messages(self, mock_llm_class):
        """Test getting messages"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        conversation.messages.append(
            Message(role=MessageRole.USER, content="Test")
        )
        
        messages = conversation.get_messages()
        
        assert len(messages) == 1
        assert messages[0].content == "Test"
        
        # Verify it's a copy
        messages.append(Message(role=MessageRole.USER, content="New"))
        assert len(conversation.messages) == 1
    
    @patch('chofesh.agent.LLM')
    def test_clear(self, mock_llm_class):
        """Test clearing conversation"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(
            agent=agent,
            system_message="You are helpful"
        )
        
        # Add some messages
        conversation.messages.append(
            Message(role=MessageRole.USER, content="Hi")
        )
        conversation.messages.append(
            Message(role=MessageRole.ASSISTANT, content="Hello")
        )
        
        assert len(conversation.messages) == 3
        
        # Clear
        conversation.clear()
        
        # Should only have system message
        assert len(conversation.messages) == 1
        assert conversation.messages[0].role == MessageRole.SYSTEM
    
    @patch('chofesh.agent.LLM')
    def test_clear_without_system_message(self, mock_llm_class):
        """Test clearing conversation without system message"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        # Add messages
        conversation.messages.append(
            Message(role=MessageRole.USER, content="Hi")
        )
        conversation.messages.append(
            Message(role=MessageRole.ASSISTANT, content="Hello")
        )
        
        assert len(conversation.messages) == 2
        
        # Clear
        conversation.clear()
        
        # Should be empty
        assert len(conversation.messages) == 0
    
    @patch('chofesh.agent.LLM')
    def test_to_dict(self, mock_llm_class):
        """Test converting conversation to dict"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(
            agent=agent,
            conversation_id="conv_123"
        )
        
        conversation.messages.append(
            Message(role=MessageRole.USER, content="Hi")
        )
        
        data = conversation.to_dict()
        
        assert data["conversation_id"] == "conv_123"
        assert len(data["messages"]) == 1
        assert data["agent"]["model"] == "gpt-oss-120b"
        assert data["agent"]["tools"] == []
    
    @patch('chofesh.agent.LLM')
    def test_from_dict(self, mock_llm_class):
        """Test creating conversation from dict"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        
        data = {
            "conversation_id": "conv_123",
            "messages": [
                {
                    "role": "user",
                    "content": "Hi",
                    "timestamp": "2026-01-13T10:00:00",
                    "model": None,
                    "tool_calls": [],
                    "metadata": {}
                }
            ]
        }
        
        conversation = Conversation.from_dict(data, agent)
        
        assert conversation.conversation_id == "conv_123"
        assert len(conversation.messages) == 1
        assert conversation.messages[0].content == "Hi"
    
    @patch('chofesh.agent.LLM')
    def test_multiple_messages(self, mock_llm_class):
        """Test multiple message exchanges"""
        mock_llm = Mock()
        responses = [
            Message(role=MessageRole.ASSISTANT, content="Response 1"),
            Message(role=MessageRole.ASSISTANT, content="Response 2"),
            Message(role=MessageRole.ASSISTANT, content="Response 3"),
        ]
        mock_llm.complete.side_effect = responses
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        conversation.send_message("Message 1")
        conversation.send_message("Message 2")
        conversation.send_message("Message 3")
        
        assert len(conversation.messages) == 6  # 3 user + 3 assistant
        assert conversation.messages[1].content == "Response 1"
        assert conversation.messages[3].content == "Response 2"
        assert conversation.messages[5].content == "Response 3"
