"""
Extended tests for agent module to achieve 95%+ coverage
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from chofesh.agent import Agent
from chofesh.message import Message, MessageRole, ToolCall, StreamChunk
from chofesh.tools import Tool
from chofesh.exceptions import ToolExecutionError


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


class TestAgentExtended:
    """Extended tests for Agent class to achieve 95%+ coverage"""
    
    @patch('chofesh.agent.LLM')
    def test_execute_tool_with_generic_exception(self, mock_llm_class):
        """Test tool execution that raises generic exception"""
        mock_llm = Mock()
        mock_llm_class.return_value = mock_llm
        
        # Create tool that raises exception
        mock_tool = Mock()
        mock_tool.name = "failing_tool"
        mock_tool.execute.side_effect = ValueError("Tool failed")
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"failing_tool": mock_tool}
        
        # Execute tool should raise ToolExecutionError
        with pytest.raises(ToolExecutionError) as exc_info:
            agent._execute_tool("failing_tool", {})
        
        assert "Tool failed" in str(exc_info.value)
    
    @patch('chofesh.agent.LLM')
    def test_process_with_tool_call_error(self, mock_llm_class):
        """Test processing with tool that raises error"""
        mock_llm = Mock()
        
        # First response with tool call
        first_response = Message(
            role=MessageRole.ASSISTANT,
            content="I'll use the tool",
            tool_calls=[
                ToolCall(
                    id="call_1",
                    name="failing_tool",
                    parameters={}
                )
            ]
        )
        
        # Second response after error
        second_response = Message(
            role=MessageRole.ASSISTANT,
            content="The tool failed"
        )
        
        mock_llm.complete.side_effect = [first_response, second_response]
        mock_llm_class.return_value = mock_llm
        
        # Create tool that raises exception
        mock_tool = Mock()
        mock_tool.name = "failing_tool"
        mock_tool.execute.side_effect = ValueError("Tool error")
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"failing_tool": mock_tool}
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = agent.process(messages)
        
        # Should handle error and continue
        assert response.content == "The tool failed"
        assert mock_llm.complete.call_count == 2
    
    @patch('chofesh.agent.LLM')
    def test_process_multiple_tool_iterations(self, mock_llm_class):
        """Test multiple tool call iterations"""
        mock_llm = Mock()
        
        # First response with tool call
        first_response = Message(
            role=MessageRole.ASSISTANT,
            content="Using tool 1",
            tool_calls=[
                ToolCall(id="call_1", name="test_tool", parameters={"query": "test1"})
            ]
        )
        
        # Second response with another tool call
        second_response = Message(
            role=MessageRole.ASSISTANT,
            content="Using tool 2",
            tool_calls=[
                ToolCall(id="call_2", name="test_tool", parameters={"query": "test2"})
            ]
        )
        
        # Final response without tool calls
        final_response = Message(
            role=MessageRole.ASSISTANT,
            content="Done"
        )
        
        mock_llm.complete.side_effect = [first_response, second_response, final_response]
        mock_llm_class.return_value = mock_llm
        
        mock_tool = Mock()
        mock_tool.name = "test_tool"
        mock_tool.execute.return_value = {"result": "success"}
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"test_tool": mock_tool}
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = agent.process(messages)
        
        assert response.content == "Done"
        assert mock_llm.complete.call_count == 3
        assert mock_tool.execute.call_count == 2
    
    @patch('chofesh.agent.LLM')
    def test_process_max_iterations_limit(self, mock_llm_class):
        """Test max iterations limit for tool calls"""
        mock_llm = Mock()
        
        # Always return response with tool call
        response_with_tool = Message(
            role=MessageRole.ASSISTANT,
            content="Using tool",
            tool_calls=[
                ToolCall(id="call_1", name="test_tool", parameters={})
            ]
        )
        
        mock_llm.complete.return_value = response_with_tool
        mock_llm_class.return_value = mock_llm
        
        mock_tool = Mock()
        mock_tool.name = "test_tool"
        mock_tool.execute.return_value = {"result": "success"}
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"test_tool": mock_tool}
        agent.max_tool_iterations = 3
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = agent.process(messages)
        
        # Should stop after max iterations
        assert mock_llm.complete.call_count == 4  # 1 initial + 3 iterations
        assert mock_tool.execute.call_count == 3
    
    @patch('chofesh.agent.LLM')
    def test_stream_without_tools(self, mock_llm_class):
        """Test streaming without tools"""
        mock_llm = Mock()
        
        chunks = [
            StreamChunk(content="Hello", is_final=False),
            StreamChunk(content=" world", is_final=True),
        ]
        mock_llm.stream.return_value = iter(chunks)
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        
        messages = [Message(role=MessageRole.USER, content="Hi")]
        collected = list(agent.stream(messages))
        
        assert len(collected) == 2
        assert collected[0].content == "Hello"
        assert collected[1].content == " world"
    
    @patch('chofesh.agent.LLM')
    @pytest.mark.asyncio
    async def test_process_async_without_tools(self, mock_llm_class):
        """Test async processing without tools"""
        mock_llm = Mock()
        mock_response = Message(
            role=MessageRole.ASSISTANT,
            content="Async response"
        )
        mock_llm.complete_async = AsyncMock(return_value=mock_response)
        mock_llm_class.return_value = mock_llm
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = await agent.process_async(messages)
        
        assert response.content == "Async response"
        mock_llm.complete_async.assert_called_once()
    
    @patch('chofesh.agent.LLM')
    @pytest.mark.asyncio
    async def test_process_async_with_tools(self, mock_llm_class):
        """Test async processing with tool calls"""
        mock_llm = Mock()
        
        # First response with tool call
        first_response = Message(
            role=MessageRole.ASSISTANT,
            content="Using tool",
            tool_calls=[
                ToolCall(id="call_1", name="test_tool", parameters={"query": "test"})
            ]
        )
        
        # Second response without tool calls
        second_response = Message(
            role=MessageRole.ASSISTANT,
            content="Tool result processed"
        )
        
        mock_llm.complete_async = AsyncMock(side_effect=[first_response, second_response])
        mock_llm_class.return_value = mock_llm
        
        mock_tool = Mock()
        mock_tool.name = "test_tool"
        mock_tool.execute.return_value = {"result": "success"}
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"test_tool": mock_tool}
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = await agent.process_async(messages)
        
        assert response.content == "Tool result processed"
        assert mock_llm.complete_async.call_count == 2
        assert mock_tool.execute.call_count == 1
    
    @patch('chofesh.agent.LLM')
    @pytest.mark.asyncio
    async def test_process_async_with_tool_error(self, mock_llm_class):
        """Test async processing with tool error"""
        mock_llm = Mock()
        
        # First response with tool call
        first_response = Message(
            role=MessageRole.ASSISTANT,
            content="Using tool",
            tool_calls=[
                ToolCall(id="call_1", name="failing_tool", parameters={})
            ]
        )
        
        # Second response after error
        second_response = Message(
            role=MessageRole.ASSISTANT,
            content="Handled error"
        )
        
        mock_llm.complete_async = AsyncMock(side_effect=[first_response, second_response])
        mock_llm_class.return_value = mock_llm
        
        mock_tool = Mock()
        mock_tool.name = "failing_tool"
        mock_tool.execute.side_effect = ValueError("Tool failed")
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"failing_tool": mock_tool}
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = await agent.process_async(messages)
        
        assert response.content == "Handled error"
        assert mock_llm.complete_async.call_count == 2
    
    @patch('chofesh.agent.LLM')
    @pytest.mark.asyncio
    async def test_process_async_multiple_iterations(self, mock_llm_class):
        """Test async processing with multiple tool iterations"""
        mock_llm = Mock()
        
        # Multiple responses with tool calls
        responses = [
            Message(
                role=MessageRole.ASSISTANT,
                content=f"Iteration {i}",
                tool_calls=[
                    ToolCall(id=f"call_{i}", name="test_tool", parameters={})
                ]
            )
            for i in range(3)
        ]
        
        # Final response
        responses.append(Message(
            role=MessageRole.ASSISTANT,
            content="Done"
        ))
        
        mock_llm.complete_async = AsyncMock(side_effect=responses)
        mock_llm_class.return_value = mock_llm
        
        mock_tool = Mock()
        mock_tool.name = "test_tool"
        mock_tool.execute.return_value = {"result": "success"}
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"test_tool": mock_tool}
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = await agent.process_async(messages)
        
        assert response.content == "Done"
        assert mock_llm.complete_async.call_count == 4
        assert mock_tool.execute.call_count == 3
    
    @patch('chofesh.agent.LLM')
    @pytest.mark.asyncio
    async def test_process_async_max_iterations(self, mock_llm_class):
        """Test async processing respects max iterations"""
        mock_llm = Mock()
        
        # Always return response with tool call
        response_with_tool = Message(
            role=MessageRole.ASSISTANT,
            content="Using tool",
            tool_calls=[
                ToolCall(id="call_1", name="test_tool", parameters={})
            ]
        )
        
        mock_llm.complete_async = AsyncMock(return_value=response_with_tool)
        mock_llm_class.return_value = mock_llm
        
        mock_tool = Mock()
        mock_tool.name = "test_tool"
        mock_tool.execute.return_value = {"result": "success"}
        
        agent = Agent(model="gpt-oss-120b")
        agent.llm = mock_llm
        agent.tools = [mock_tool]
        agent._tool_registry = {"test_tool": mock_tool}
        agent.max_tool_iterations = 2
        
        messages = [Message(role=MessageRole.USER, content="Test")]
        response = await agent.process_async(messages)
        
        # Should stop after max iterations
        assert mock_llm.complete_async.call_count == 3  # 1 initial + 2 iterations
        assert mock_tool.execute.call_count == 2
