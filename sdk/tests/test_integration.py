"""
Integration tests for Chofesh SDK
"""
import pytest
from unittest.mock import Mock, patch
from chofesh import Agent, Conversation
from chofesh.message import Message, MessageRole
from chofesh.tools import Tool


class MockCalculatorTool(Tool):
    """Mock calculator tool for testing"""
    name = "calculator"
    description = "Perform calculations"
    parameters = {
        "type": "object",
        "properties": {
            "operation": {"type": "string", "enum": ["add", "subtract"]},
            "a": {"type": "number"},
            "b": {"type": "number"}
        },
        "required": ["operation", "a", "b"]
    }
    
    def execute(self, parameters):
        op = parameters.get("operation")
        a = parameters.get("a", 0)
        b = parameters.get("b", 0)
        
        if op == "add":
            return {"result": a + b}
        elif op == "subtract":
            return {"result": a - b}
        else:
            return {"error": "Unknown operation"}


class TestIntegration:
    """Integration tests"""
    
    @patch('chofesh.llm.LLM')
    def test_agent_with_tool_integration(self, mock_llm_class):
        """Test agent with tool integration"""
        # Setup mock LLM
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="The result is 5"
        )
        mock_llm.complete.return_value = mock_response
        mock_llm_class.return_value = mock_llm
        
        # Create agent with tool
        tool = MockCalculatorTool()
        agent = Agent(model="gpt-oss-120b", tools=[tool])
        agent.llm = mock_llm
        
        # Process message
        messages = [Message(role=MessageRole.USER, content="What is 2 + 3?")]
        response = agent.process(messages)
        
        assert response.content == "The result is 5"
        mock_llm.complete.assert_called()
    
    @patch('chofesh.llm.LLM')
    def test_conversation_flow(self, mock_llm_class):
        """Test conversation flow"""
        # Setup mock LLM
        mock_llm = Mock()
        responses = [
            Message(role=MessageRole.ASSISTANT, content="Hello!"),
            Message(role=MessageRole.ASSISTANT, content="I'm doing well, thanks!"),
        ]
        mock_llm.complete.side_effect = responses
        mock_llm_class.return_value = mock_llm
        
        # Create conversation
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(agent=agent)
        
        # Send messages
        response1 = conversation.send_message("Hi")
        response2 = conversation.send_message("How are you?")
        
        assert response1.content == "Hello!"
        assert response2.content == "I'm doing well, thanks!"
        assert len(conversation.messages) == 4  # 2 user + 2 assistant
    
    @patch('chofesh.llm.LLM')
    def test_conversation_with_system_message(self, mock_llm_class):
        """Test conversation with system message"""
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="I'm a helpful assistant"
        )
        mock_llm.complete.return_value = mock_response
        mock_llm_class.return_value = mock_llm
        
        # Create conversation with system message
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        conversation = Conversation(
            agent=agent,
            system_message="You are a helpful assistant"
        )
        
        response = conversation.send_message("Who are you?")
        
        assert response.content == "I'm a helpful assistant"
        # Should have system message + user message + assistant message
        assert len(conversation.messages) == 3
        assert conversation.messages[0].role == MessageRole.SYSTEM
    
    def test_tool_execution_flow(self):
        """Test tool execution flow"""
        tool = MockCalculatorTool()
        
        # Test add operation
        result = tool.execute({
            "operation": "add",
            "a": 5,
            "b": 3
        })
        assert result["result"] == 8
        
        # Test subtract operation
        result = tool.execute({
            "operation": "subtract",
            "a": 10,
            "b": 4
        })
        assert result["result"] == 6
    
    @patch('chofesh.llm.LLM')
    def test_multiple_tools(self, mock_llm_class):
        """Test agent with multiple tools"""
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="Done"
        )
        mock_llm.complete.return_value = mock_response
        mock_llm_class.return_value = mock_llm
        
        # Create agent with multiple tools
        tool1 = MockCalculatorTool()
        
        class MockTool2(Tool):
            name = "tool2"
            description = "Test tool 2"
            parameters = {}
            def execute(self, parameters):
                return {"result": "ok"}
        
        tool2 = MockTool2()
        
        agent = Agent(model="gpt-oss-120b", tools=[tool1, tool2])
        agent.llm = mock_llm
        
        assert len(agent.tools) == 2
        assert "calculator" in agent._tool_registry
        assert "tool2" in agent._tool_registry
