"""
Image generation tool for Chofesh SDK
"""
import os
import requests
from typing import Dict, Any, Optional
from .base import Tool


class ImageGenerationTool(Tool):
    """Tool for generating images from text prompts"""
    
    name = "image_generation"
    description = "Generate images from text descriptions using AI. Returns image URLs."
    parameters = {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "Text description of the image to generate"
            },
            "model": {
                "type": "string",
                "description": "Image generation model (flux, sdxl, dalle3)",
                "default": "flux"
            },
            "size": {
                "type": "string",
                "description": "Image size (1024x1024, 1792x1024, etc.)",
                "default": "1024x1024"
            }
        },
        "required": ["prompt"]
    }
    
    def __init__(self, api_key: Optional[str] = None, **config):
        """
        Initialize image generation tool
        
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
                "API key is required for image generation. "
                "Set CHOFESH_API_KEY environment variable or pass api_key parameter."
            )
    
    def execute(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate image
        
        Args:
            parameters: Generation parameters (prompt, model, size)
        
        Returns:
            Generated image URL
        """
        prompt = parameters.get("prompt")
        model = parameters.get("model", "flux")
        size = parameters.get("size", "1024x1024")
        
        if not prompt:
            return {"error": "Prompt parameter is required"}
        
        # Call Chofesh API for image generation
        api_url = os.getenv("CHOFESH_API_URL", "https://chofesh.ai/api")
        
        try:
            response = requests.post(
                f"{api_url}/tools/image-generation",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "prompt": prompt,
                    "model": model,
                    "size": size,
                },
                timeout=120,
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "error": f"Generation failed with status {response.status_code}",
                    "details": response.text
                }
        
        except Exception as e:
            return {
                "error": f"Generation failed: {str(e)}"
            }
