"""
Web search tool for Chofesh SDK
"""
import os
import requests
from typing import Dict, Any, Optional
from .base import Tool


class WebSearchTool(Tool):
    """Tool for web search"""
    
    name = "web_search"
    description = "Search the web for information. Returns search results with titles, URLs, and snippets."
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query"
            },
            "num_results": {
                "type": "integer",
                "description": "Number of results to return (default: 5)",
                "default": 5
            }
        },
        "required": ["query"]
    }
    
    def __init__(self, api_key: Optional[str] = None, **config):
        """
        Initialize web search tool
        
        Args:
            api_key: Chofesh API key (or set CHOFESH_API_KEY env var)
            **config: Additional configuration
        """
        self.api_key = api_key or os.getenv("CHOFESH_API_KEY")
        super().__init__(**config)
    
    def validate_config(self):
        """Validate configuration"""
        if not self.api_key:
            raise ValueError(
                "API key is required for web search. "
                "Set CHOFESH_API_KEY environment variable or pass api_key parameter."
            )
    
    def execute(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute web search
        
        Args:
            parameters: Search parameters (query, num_results)
        
        Returns:
            Search results
        """
        query = parameters.get("query")
        num_results = parameters.get("num_results", 5)
        
        if not query:
            return {"error": "Query parameter is required"}
        
        # Call Chofesh API for web search
        api_url = os.getenv("CHOFESH_API_URL", "https://chofesh.ai/api")
        
        try:
            response = requests.post(
                f"{api_url}/tools/web-search",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "query": query,
                    "num_results": num_results,
                },
                timeout=30,
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "error": f"Search failed with status {response.status_code}",
                    "details": response.text
                }
        
        except Exception as e:
            return {
                "error": f"Search failed: {str(e)}"
            }
