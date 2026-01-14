"""
Tests for agent module
"""
import pytest
from unittest.mock import Mock, MagicMock, patch
from chofesh.agent import Agent
from chofesh.message import Message, MessageRole, ToolCall
from chofesh.tools import Tool


class MockTool(Tool):
    """Mock tool for testing"""
    name = "mock_tool"
    description = "A mock tool"
    parameters = {
        "type": "object",
        "properties": {
            "input": {"type": "string"}
        },
        "required": ["input"]
    }
    
    def execute(self, parameters):
        return {"result": f"Processed: {parameters.get('input')}"}


class TestAgent:
    """Test Agent class"""
    
    def test_create_agent(self):
        """Test creating an agent"""
        agent = Agent(model="gpt-oss-120b")
        
        assert agent.model == "gpt-oss-120b"
        assert agent.tools == []
        assert agent.temperature == 0.7
        assert agent.max_tool_iterations == 5
    
    def test_create_agent_with_tools(self):
        """Test creating an agent with tools"""
        tool = MockTool()
        agent = Agent(model="gpt-oss-120b", tools=[tool])
        
        assert len(agent.tools) == 1
        assert agent.tools[0].name == "mock_tool"
        assert "mock_tool" in agent._tool_registry
    
    def test_add_tool(self):
        """Test adding a tool to agent"""
        agent = Agent(model="gpt-oss-120b")
        tool = MockTool()
        
        agent.add_tool(tool)
        
        assert len(agent.tools) == 1
        assert "mock_tool" in agent._tool_registry
    
    def test_remove_tool(self):
        """Test removing a tool from agent"""
        tool = MockTool()
        agent = Agent(model="gpt-oss-120b", tools=[tool])
        
        agent.remove_tool("mock_tool")
        
        assert len(agent.tools) == 0
        assert "mock_tool" not in agent._tool_registry
    
    def test_get_tool_schemas(self):
        """Test getting tool schemas"""
        tool = MockTool()
        agent = Agent(model="gpt-oss-120b", tools=[tool])
        
        schemas = agent._get_tool_schemas()
        
        assert len(schemas) == 1
        assert schemas[0]["type"] == "function"
        assert schemas[0]["function"]["name"] == "mock_tool"
    
    def test_execute_tool(self):
        """Test executing a tool"""
        tool = MockTool()
        agent = Agent(model="gpt-oss-120b", tools=[tool])
        
        result = agent._execute_tool("mock_tool", {"input": "test"})
        
        assert result == {"result": "Processed: test"}
    
    def test_execute_nonexistent_tool(self):
        """Test executing a nonexistent tool"""
        agent = Agent(model="gpt-oss-120b")
        
        with pytest.raises(Exception) as exc_info:
            agent._execute_tool("nonexistent", {})
        
        assert "not found" in str(exc_info.value).lower()
    
    @patch('chofesh.agent.LLM')
    def test_process_without_tools(self, mock_llm_class):
        """Test processing messages without tools"""
        # Setup mock
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="Hello!"
        )
        mock_llm.complete.return_value = mock_response
        mock_llm_class.return_value = mock_llm
        
        # Create agent and process
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        
        messages = [Message(role=MessageRole.USER, content="Hi")]
        response = agent.process(messages)
        
        assert response.content == "Hello!"
        mock_llm.complete.assert_called_once()
    
    @patch('chofesh.agent.LLM')
    def test_process_with_tool_calls(self, mock_llm_class):
        """Test processing messages with tool calls"""
        # Setup mock
        mock_llm = Mock()
        
        # First response with tool call
        tool_call = ToolCall(
            id="call_1",
            name="mock_tool",
            parameters={"input": "test"}
        )
        first_response = Message(
            role=MessageRole.ASSISTANT,
            content="",
            tool_calls=[tool_call]
        )
        
        # Second response after tool execution
        second_response = Message(
            role=MessageRole.ASSISTANT,
            content="Tool executed successfully"
        )
        
        mock_llm.complete.side_effect = [first_response, second_response]
        mock_llm_class.return_value = mock_llm
        
        # Create agent with tool
        tool = MockTool()
        agent = Agent(model="gpt-oss-120b", tools=[tool])
        agent.llm = mock_llm
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = agent.process(messages)
        
        assert response.content == "Tool executed successfully"
        assert mock_llm.complete.call_count == 2
