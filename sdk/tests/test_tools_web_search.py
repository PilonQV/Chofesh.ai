"""
Tests for web search tool
"""
import pytest
import responses
from unittest.mock import patch
from chofesh.tools.web_search import WebSearchTool


class TestWebSearchTool:
    """Test WebSearchTool class"""
    
    def test_create_tool(self):
        """Test creating web search tool"""
        tool = WebSearchTool(api_key="test_key")
        
        assert tool.name == "web_search"
        assert tool.api_key == "test_key"
    
    def test_create_tool_without_api_key(self):
        """Test creating tool without API key raises error"""
        with pytest.raises(ValueError) as exc_info:
            WebSearchTool()
        
        assert "API key" in str(exc_info.value)
    
    @patch.dict('os.environ', {'CHOFESH_API_KEY': 'env_key'})
    def test_create_tool_with_env_var(self):
        """Test creating tool with environment variable"""
        tool = WebSearchTool()
        
        assert tool.api_key == "env_key"
    
    @responses.activate
    def test_execute_search(self):
        """Test executing a search"""
        # Mock API response
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/web-search",
            json={
                "results": [
                    {
                        "title": "Test Result",
                        "url": "https://example.com",
                        "snippet": "Test snippet"
                    }
                ]
            },
            status=200
        )
        
        tool = WebSearchTool(api_key="test_key")
        result = tool.execute({"query": "test query", "num_results": 5})
        
        assert "results" in result
        assert len(result["results"]) == 1
        assert result["results"][0]["title"] == "Test Result"
    
    def test_execute_without_query(self):
        """Test executing without query parameter"""
        tool = WebSearchTool(api_key="test_key")
        result = tool.execute({})
        
        assert "error" in result
        assert "Query" in result["error"]
    
    @responses.activate
    def test_execute_api_error(self):
        """Test handling API error"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/web-search",
            json={"error": "API error"},
            status=500
        )
        
        tool = WebSearchTool(api_key="test_key")
        result = tool.execute({"query": "test"})
        
        assert "error" in result
        assert "500" in result["error"]
