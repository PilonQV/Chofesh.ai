"""
Tests for image generation tool
"""
import pytest
import responses
from unittest.mock import patch
from chofesh.tools.image_generation import ImageGenerationTool


class TestImageGenerationTool:
    """Test ImageGenerationTool class"""
    
    def test_create_tool(self):
        """Test creating image generation tool"""
        tool = ImageGenerationTool(api_key="test_key")
        
        assert tool.name == "image_generation"
        assert tool.api_key == "test_key"
        assert "prompt" in tool.parameters["properties"]
    
    def test_create_tool_without_api_key(self):
        """Test creating tool without API key raises error"""
        with pytest.raises(ValueError) as exc_info:
            ImageGenerationTool()
        
        assert "API key" in str(exc_info.value)
    
    @patch.dict('os.environ', {'CHOFESH_API_KEY': 'env_key'})
    def test_create_tool_with_env_var(self):
        """Test creating tool with environment variable"""
        tool = ImageGenerationTool()
        
        assert tool.api_key == "env_key"
    
    @responses.activate
    def test_execute_generate_image(self):
        """Test generating an image"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            json={
                "image_url": "https://example.com/image.png",
                "prompt": "A beautiful sunset",
                "model": "flux-pro",
                "size": "1024x1024"
            },
            status=200
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({
            "prompt": "A beautiful sunset"
        })
        
        assert "image_url" in result
        assert result["image_url"] == "https://example.com/image.png"
        assert result["prompt"] == "A beautiful sunset"
    
    @responses.activate
    def test_execute_with_size(self):
        """Test generating image with custom size"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            json={
                "image_url": "https://example.com/image.png",
                "size": "512x512"
            },
            status=200
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({
            "prompt": "Test image",
            "size": "512x512"
        })
        
        assert result["size"] == "512x512"
    
    @responses.activate
    def test_execute_with_model(self):
        """Test generating image with specific model"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            json={
                "image_url": "https://example.com/image.png",
                "model": "flux-dev"
            },
            status=200
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({
            "prompt": "Test image",
            "model": "flux-dev"
        })
        
        assert result["model"] == "flux-dev"
    
    @responses.activate
    def test_execute_with_quality(self):
        """Test generating image with quality setting"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            json={
                "image_url": "https://example.com/image.png",
                "quality": "hd"
            },
            status=200
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({
            "prompt": "Test image",
            "quality": "hd"
        })
        
        assert result["quality"] == "hd"
    
    @responses.activate
    def test_execute_with_style(self):
        """Test generating image with style"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            json={
                "image_url": "https://example.com/image.png",
                "style": "vivid"
            },
            status=200
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({
            "prompt": "Test image",
            "style": "vivid"
        })
        
        assert result["style"] == "vivid"
    
    def test_execute_without_prompt(self):
        """Test executing without prompt parameter"""
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({})
        
        assert "error" in result
        assert "Prompt" in result["error"]
    
    @responses.activate
    def test_execute_api_error(self):
        """Test handling API error"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            json={"error": "Generation failed"},
            status=500
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({"prompt": "test"})
        
        assert "error" in result
        assert "500" in result["error"]
    
    @responses.activate
    def test_execute_with_all_parameters(self):
        """Test generating image with all parameters"""
        responses.add(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            json={
                "image_url": "https://example.com/image.png",
                "prompt": "A beautiful landscape",
                "model": "flux-pro",
                "size": "1024x1024",
                "quality": "hd",
                "style": "vivid"
            },
            status=200
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({
            "prompt": "A beautiful landscape",
            "model": "flux-pro",
            "size": "1024x1024",
            "quality": "hd",
            "style": "vivid"
        })
        
        assert result["image_url"] == "https://example.com/image.png"
        assert result["model"] == "flux-pro"
        assert result["size"] == "1024x1024"
        assert result["quality"] == "hd"
        assert result["style"] == "vivid"
    
    def test_tool_schema(self):
        """Test tool schema generation"""
        tool = ImageGenerationTool(api_key="test_key")
        schema = tool.to_schema()
        
        assert schema["type"] == "function"
        assert schema["function"]["name"] == "image_generation"
        assert "prompt" in schema["function"]["parameters"]["properties"]
        assert "size" in schema["function"]["parameters"]["properties"]
        assert "model" in schema["function"]["parameters"]["properties"]
    
    @responses.activate
    def test_execute_timeout(self):
        """Test handling timeout error"""
        import requests
        
        def request_callback(request):
            raise requests.Timeout("Request timed out")
        
        responses.add_callback(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            callback=request_callback
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({"prompt": "test"})
        
        assert "error" in result
        assert "timeout" in result["error"].lower() or "timed out" in result["error"].lower()
    
    @responses.activate
    def test_execute_connection_error(self):
        """Test handling connection error"""
        import requests
        
        def request_callback(request):
            raise requests.ConnectionError("Connection failed")
        
        responses.add_callback(
            responses.POST,
            "https://chofesh.ai/api/tools/image-generation",
            callback=request_callback
        )
        
        tool = ImageGenerationTool(api_key="test_key")
        result = tool.execute({"prompt": "test"})
        
        assert "error" in result
        assert "connection" in result["error"].lower() or "failed" in result["error"].lower()
