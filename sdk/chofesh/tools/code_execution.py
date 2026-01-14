"""
Code execution tool for Chofesh SDK
"""
import os
import requests
from typing import Dict, Any, Optional
from .base import Tool


class CodeExecutionTool(Tool):
    """Tool for executing code in various languages"""
    
    name = "code_execution"
    description = "Execute code in Python, JavaScript, Java, C++, Go, Rust, and 60+ other languages. Returns stdout, stderr, and execution status."
    parameters = {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "The code to execute"
            },
            "language": {
                "type": "string",
                "description": "Programming language (python, javascript, java, cpp, go, rust, etc.)",
                "default": "python"
            },
            "stdin": {
                "type": "string",
                "description": "Standard input for the program",
                "default": ""
            }
        },
        "required": ["code"]
    }
    
    def __init__(self, api_key: Optional[str] = None, **config):
        """
        Initialize code execution tool
        
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
                "API key is required for code execution. "
                "Set CHOFESH_API_KEY environment variable or pass api_key parameter."
            )
    
    def execute(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute code
        
        Args:
            parameters: Execution parameters (code, language, stdin)
        
        Returns:
            Execution result with stdout, stderr, and status
        """
        code = parameters.get("code")
        language = parameters.get("language", "python")
        stdin = parameters.get("stdin", "")
        
        if not code:
            return {"error": "Code parameter is required"}
        
        # Call Chofesh API for code execution
        api_url = os.getenv("CHOFESH_API_URL", "https://chofesh.ai/api")
        
        try:
            response = requests.post(
                f"{api_url}/tools/code-execution",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "code": code,
                    "language": language,
                    "stdin": stdin,
                },
                timeout=60,
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "error": f"Execution failed with status {response.status_code}",
                    "details": response.text
                }
        
        except Exception as e:
            return {
                "error": f"Execution failed: {str(e)}"
            }
