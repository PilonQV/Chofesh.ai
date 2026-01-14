"""
Tests for GitHub tool
"""
import pytest
from unittest.mock import Mock, patch
from chofesh.tools.github import GitHubTool


class TestGitHubTool:
    """Test GitHubTool class"""
    
    @patch('chofesh.tools.github.Github')
    def test_create_tool(self, mock_github):
        """Test creating GitHub tool"""
        mock_github_instance = Mock()
        mock_github.return_value = mock_github_instance
        
        tool = GitHubTool(token="test_token")
        
        assert tool.name == "github"
        assert tool.token == "test_token"
        mock_github.assert_called_once_with("test_token")
    
    @patch('chofesh.tools.github.Github')
    def test_create_tool_without_token(self, mock_github):
        """Test creating tool without token"""
        # Tool can be created without token if validation is skipped
        tool = GitHubTool(validate=False)
        
        assert tool.token is None
        assert tool.github is None
        
        # Validation should fail when called explicitly
        with pytest.raises(ValueError) as exc_info:
            tool.validate_config()
        
        assert "token" in str(exc_info.value).lower()
    
    @patch.dict('os.environ', {'GITHUB_TOKEN': 'env_token'})
    @patch('chofesh.tools.github.Github')
    def test_create_tool_with_env_var(self, mock_github):
        """Test creating tool with environment variable"""
        mock_github_instance = Mock()
        mock_github.return_value = mock_github_instance
        
        tool = GitHubTool()
        
        assert tool.token == "env_token"
    
    @patch('chofesh.tools.github.Github')
    def test_create_tool_with_repo(self, mock_github):
        """Test creating tool with repository"""
        mock_github_instance = Mock()
        mock_repo = Mock()
        mock_github_instance.get_repo.return_value = mock_repo
        mock_github.return_value = mock_github_instance
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        
        assert tool.repo_name == "owner/repo"
        mock_github_instance.get_repo.assert_called_once_with("owner/repo")
    
    @patch('chofesh.tools.github.Github')
    def test_execute_without_token(self, mock_github):
        """Test executing without token fails"""
        # Create tool without token (skip validation)
        tool = GitHubTool(validate=False)
        
        result = tool.execute({
            "action": "read_file",
            "path": "README.md"
        })
        
        assert "error" in result
        assert "token" in result["error"].lower() or "github" in result["error"].lower() or "repo" in result["error"].lower()
    
    @patch('chofesh.tools.github.Github')
    def test_execute_invalid_action(self, mock_github):
        """Test executing with invalid action"""
        mock_github_instance = Mock()
        mock_github.return_value = mock_github_instance
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "invalid_action"
        })
        
        assert "error" in result
        assert "unknown" in result["error"].lower() or "invalid" in result["error"].lower()
    
    @patch('chofesh.tools.github.Github')
    def test_tool_schema(self, mock_github):
        """Test tool schema generation"""
        mock_github_instance = Mock()
        mock_github.return_value = mock_github_instance
        
        tool = GitHubTool(token="test_token")
        schema = tool.to_schema()
        
        assert schema["type"] == "function"
        assert schema["function"]["name"] == "github"
        assert "action" in schema["function"]["parameters"]["properties"]
        assert "path" in schema["function"]["parameters"]["properties"]
    
    @patch('chofesh.tools.github.Github')
    def test_tool_description(self, mock_github):
        """Test tool has proper description"""
        mock_github_instance = Mock()
        mock_github.return_value = mock_github_instance
        
        tool = GitHubTool(token="test_token")
        
        assert "GitHub" in tool.description or "github" in tool.description.lower()
        assert len(tool.description) > 10
    
    @patch('chofesh.tools.github.Github')
    def test_tool_parameters(self, mock_github):
        """Test tool parameters are defined"""
        mock_github_instance = Mock()
        mock_github.return_value = mock_github_instance
        
        tool = GitHubTool(token="test_token")
        
        assert "properties" in tool.parameters
        assert "action" in tool.parameters["properties"]
        assert "enum" in tool.parameters["properties"]["action"]
        
        # Check supported actions
        actions = tool.parameters["properties"]["action"]["enum"]
        assert "read_file" in actions
        assert "write_file" in actions
        assert "create_branch" in actions
        assert "create_pr" in actions
        assert "create_issue" in actions
