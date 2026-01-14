"""
Tests for code execution tool
"""
import pytest
import responses
from unittest.mock import patch
from chofesh.tools.code_execution import CodeExecutionTool


class TestCodeExecutionTool:
    """Test CodeExecutionTool class"""
    
    def test_create_tool(self):
        """Test creating code execution tool"""
        tool = CodeExecutionTool(api_key="test_key")
        
        assert tool.name == "code_execution"
        assert tool.api_key == "test_key"
    
    def test_create_tool_without_api_key(self):
        """Test creating tool without API key raises error"""
        with pytest.raises(ValueError) as exc_info:
            CodeExecutionTool()
        
        assert "API key" in str(exc_info.value)
    
    @patch.dict('os.environ', {'CHOFESH_API_KEY': 'env_key'})
    def test_create_tool_with_env_var(self):
        """Test creating tool with environment variable"""
        tool = CodeExecutionTool()
        
        assert tool.api_key == "env_key"
    
    @responses.activate
    def test_execute_code(self):
        """Test executing code"""
        # Mock API response
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/code-execution",
            json={
                "stdout": "Hello, World!\n",
                "stderr": "",
                "status": "success",
                "exit_code": 0
            },
            status=200
        )
        
        tool = CodeExecutionTool(api_key="test_key")
        result = tool.execute({
            "code": "print('Hello, World!')",
            "language": "python"
        })
        
        assert result["stdout"] == "Hello, World!\n"
        assert result["status"] == "success"
        assert result["exit_code"] == 0
    
    def test_execute_without_code(self):
        """Test executing without code parameter"""
        tool = CodeExecutionTool(api_key="test_key")
        result = tool.execute({})
        
        assert "error" in result
        assert "Code" in result["error"]
    
    @responses.activate
    def test_execute_with_stdin(self):
        """Test executing code with stdin"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/code-execution",
            json={
                "stdout": "Input: test\n",
                "stderr": "",
                "status": "success",
                "exit_code": 0
            },
            status=200
        )
        
        tool = CodeExecutionTool(api_key="test_key")
        result = tool.execute({
            "code": "x = input(); print(f'Input: {x}')",
            "language": "python",
            "stdin": "test"
        })
        
        assert "Input: test" in result["stdout"]
    
    @responses.activate
    def test_execute_api_error(self):
        """Test handling API error"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/code-execution",
            json={"error": "Execution failed"},
            status=500
        )
        
        tool = CodeExecutionTool(api_key="test_key")
        result = tool.execute({"code": "print('test')"})
        
        assert "error" in result
        assert "500" in result["error"]
