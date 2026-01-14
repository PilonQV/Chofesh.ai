"""
Tests for base tool class
"""
import pytest
from chofesh.tools.base import Tool


class TestTool(Tool):
    """Test tool implementation"""
    name = "test_tool"
    description = "A test tool"
    parameters = {
        "type": "object",
        "properties": {
            "input": {"type": "string"}
        },
        "required": ["input"]
    }
    
    def execute(self, parameters):
        return {"result": parameters.get("input")}


class TestBaseTool:
    """Test base Tool class"""
    
    def test_create_tool(self):
        """Test creating a tool"""
        tool = TestTool()
        
        assert tool.name == "test_tool"
        assert tool.description == "A test tool"
        assert "properties" in tool.parameters
    
    def test_tool_with_config(self):
        """Test creating a tool with config"""
        tool = TestTool(api_key="test_key")
        
        assert tool.config["api_key"] == "test_key"
    
    def test_execute_tool(self):
        """Test executing a tool"""
        tool = TestTool()
        result = tool.execute({"input": "test"})
        
        assert result == {"result": "test"}
    
    def test_to_schema(self):
        """Test converting tool to schema"""
        tool = TestTool()
        schema = tool.to_schema()
        
        assert schema["type"] == "function"
        assert schema["function"]["name"] == "test_tool"
        assert schema["function"]["description"] == "A test tool"
        assert "parameters" in schema["function"]
    
    def test_tool_repr(self):
        """Test tool string representation"""
        tool = TestTool()
        repr_str = repr(tool)
        
        assert "TestTool" in repr_str
        assert "test_tool" in repr_str
    
    def test_abstract_execute(self):
        """Test that Tool.execute is abstract"""
        # Cannot instantiate abstract class without implementing execute
        with pytest.raises(TypeError) as exc_info:
            class IncompleteTool(Tool):
                name = "incomplete"
                description = "Incomplete tool"
                parameters = {}
            
            IncompleteTool()
        
        assert "abstract" in str(exc_info.value).lower()
