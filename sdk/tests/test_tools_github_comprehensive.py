"""
Comprehensive tests for GitHub tool - targeting 95%+ coverage
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from chofesh.tools.github import GitHubTool, GITHUB_AVAILABLE


class TestGitHubToolComprehensive:
    """Comprehensive tests for GitHubTool"""
    
    def test_github_not_available(self):
        """Test when PyGithub is not installed"""
        with patch('chofesh.tools.github.GITHUB_AVAILABLE', False):
            with pytest.raises(ImportError) as exc_info:
                GitHubTool(token="test_token", repo="owner/repo")
            assert "PyGithub is required" in str(exc_info.value)
    
    @patch('chofesh.tools.github.Github')
    def test_init_with_token_and_repo(self, mock_github_class):
        """Test initialization with token and repo"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        
        assert tool.token == "test_token"
        assert tool.repo_name == "owner/repo"
        assert tool.github == mock_github
        assert tool.repo == mock_repo
        mock_github_class.assert_called_once_with("test_token")
        mock_github.get_repo.assert_called_once_with("owner/repo")
    
    @patch('chofesh.tools.github.Github')
    def test_init_with_token_only(self, mock_github_class):
        """Test initialization with token but no repo"""
        mock_github = Mock()
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token")
        
        assert tool.token == "test_token"
        assert tool.repo_name is None
        assert tool.github == mock_github
        assert tool.repo is None
    
    @patch('chofesh.tools.github.Github')
    @patch.dict('os.environ', {'GITHUB_TOKEN': 'env_token', 'GITHUB_REPO': 'env/repo'})
    def test_init_with_env_vars(self, mock_github_class):
        """Test initialization with environment variables"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool()
        
        assert tool.token == "env_token"
        assert tool.repo_name == "env/repo"
    
    @patch('chofesh.tools.github.Github')
    def test_validate_config_without_token(self, mock_github_class):
        """Test validate_config raises error without token"""
        tool = GitHubTool.__new__(GitHubTool)
        tool.token = None
        
        with pytest.raises(ValueError) as exc_info:
            tool.validate_config()
        assert "GitHub token is required" in str(exc_info.value)
    
    @patch('chofesh.tools.github.Github')
    def test_ensure_repo_without_repo(self, mock_github_class):
        """Test _ensure_repo raises error without repo"""
        mock_github = Mock()
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token")
        
        with pytest.raises(ValueError) as exc_info:
            tool._ensure_repo()
        assert "Repository not set" in str(exc_info.value)
    
    @patch('chofesh.tools.github.Github')
    def test_execute_without_action(self, mock_github_class):
        """Test execute without action parameter"""
        mock_github = Mock()
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({})
        
        assert "error" in result
        assert "Action parameter is required" in result["error"]
    
    @patch('chofesh.tools.github.Github')
    def test_execute_unknown_action(self, mock_github_class):
        """Test execute with unknown action"""
        mock_github = Mock()
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({"action": "unknown_action"})
        
        assert "error" in result
        assert "Unknown action" in result["error"]
    
    @patch('chofesh.tools.github.Github')
    def test_read_file_success(self, mock_github_class):
        """Test read_file action success"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_file = Mock()
        mock_file.decoded_content = b"file content"
        mock_file.sha = "abc123"
        mock_file.size = 12
        mock_repo.get_contents.return_value = mock_file
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "read_file",
            "path": "README.md",
            "branch": "main"
        })
        
        assert result["path"] == "README.md"
        assert result["content"] == "file content"
        assert result["sha"] == "abc123"
        assert result["size"] == 12
        assert result["branch"] == "main"
        mock_repo.get_contents.assert_called_once_with("README.md", ref="main")
    
    @patch('chofesh.tools.github.Github')
    def test_read_file_without_path(self, mock_github_class):
        """Test read_file without path parameter"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({"action": "read_file"})
        
        assert "error" in result
        assert "Path parameter is required" in result["error"]
    
    @patch('chofesh.tools.github.Github')
    def test_read_file_not_found(self, mock_github_class):
        """Test read_file with 404 error"""
        from github import GithubException
        
        mock_github = Mock()
        mock_repo = Mock()
        
        # Create a proper GithubException
        github_error = GithubException(404, {"message": "Not Found"}, None)
        mock_repo.get_contents.side_effect = github_error
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "read_file",
            "path": "nonexistent.md"
        })
        
        assert "error" in result
        assert "File not found" in result["error"]
    
    @patch('chofesh.tools.github.Github')
    def test_write_file_create_new(self, mock_github_class):
        """Test write_file creating new file"""
        from github import GithubException
        
        mock_github = Mock()
        mock_repo = Mock()
        mock_commit = Mock()
        mock_commit.sha = "commit123"
        
        # File doesn't exist (404)
        github_error = GithubException(404, {"message": "Not Found"}, None)
        mock_repo.get_contents.side_effect = github_error
        
        # Create file succeeds
        mock_repo.create_file.return_value = {"commit": mock_commit}
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "write_file",
            "path": "new_file.md",
            "content": "new content",
            "branch": "main"
        })
        
        assert result["path"] == "new_file.md"
        assert result["branch"] == "main"
        assert result["commit_sha"] == "commit123"
        mock_repo.create_file.assert_called_once()
    
    @patch('chofesh.tools.github.Github')
    def test_write_file_update_existing(self, mock_github_class):
        """Test write_file updating existing file"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_file = Mock()
        mock_file.sha = "file123"
        mock_commit = Mock()
        mock_commit.sha = "commit456"
        
        # File exists
        mock_repo.get_contents.return_value = mock_file
        
        # Update file succeeds
        mock_repo.update_file.return_value = {"commit": mock_commit}
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "write_file",
            "path": "existing.md",
            "content": "updated content",
            "branch": "main"
        })
        
        assert result["path"] == "existing.md"
        assert result["commit_sha"] == "commit456"
        mock_repo.update_file.assert_called_once()
    
    @patch('chofesh.tools.github.Github')
    def test_write_file_without_path_or_content(self, mock_github_class):
        """Test write_file without required parameters"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        
        # Without path
        result = tool.execute({
            "action": "write_file",
            "content": "content"
        })
        assert "error" in result
        
        # Without content
        result = tool.execute({
            "action": "write_file",
            "path": "file.md"
        })
        assert "error" in result
    
    @patch('chofesh.tools.github.Github')
    def test_create_branch_success(self, mock_github_class):
        """Test create_branch action success"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_ref = Mock()
        mock_ref.object.sha = "sha123"
        mock_repo.get_git_ref.return_value = mock_ref
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "create_branch",
            "branch": "feature-branch",
            "base_branch": "main"
        })
        
        assert result["branch"] == "feature-branch"
        assert result["base_branch"] == "main"
        assert result["sha"] == "sha123"
        mock_repo.get_git_ref.assert_called_once_with("heads/main")
        mock_repo.create_git_ref.assert_called_once_with("refs/heads/feature-branch", "sha123")
    
    @patch('chofesh.tools.github.Github')
    def test_create_branch_without_name(self, mock_github_class):
        """Test create_branch without branch name"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({"action": "create_branch"})
        
        assert "error" in result
        assert "Branch parameter is required" in result["error"]
    
    @patch('chofesh.tools.github.Github')
    def test_create_pr_success(self, mock_github_class):
        """Test create_pr action success"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_pr = Mock()
        mock_pr.number = 42
        mock_pr.title = "Test PR"
        mock_pr.html_url = "https://github.com/owner/repo/pull/42"
        mock_pr.state = "open"
        mock_repo.create_pull.return_value = mock_pr
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "create_pr",
            "title": "Test PR",
            "body": "PR description",
            "head": "feature-branch",
            "base": "main"
        })
        
        assert result["number"] == 42
        assert result["title"] == "Test PR"
        assert result["url"] == "https://github.com/owner/repo/pull/42"
        assert result["state"] == "open"
        assert result["head"] == "feature-branch"
        assert result["base"] == "main"
    
    @patch('chofesh.tools.github.Github')
    def test_create_pr_without_required_params(self, mock_github_class):
        """Test create_pr without required parameters"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        
        # Without title
        result = tool.execute({
            "action": "create_pr",
            "head": "feature"
        })
        assert "error" in result
        
        # Without head
        result = tool.execute({
            "action": "create_pr",
            "title": "Test"
        })
        assert "error" in result
    
    @patch('chofesh.tools.github.Github')
    def test_list_files_success(self, mock_github_class):
        """Test list_files action success"""
        mock_github = Mock()
        mock_repo = Mock()
        
        mock_file1 = Mock()
        mock_file1.name = "file1.py"
        mock_file1.path = "src/file1.py"
        mock_file1.type = "file"
        mock_file1.size = 100
        
        mock_dir = Mock()
        mock_dir.name = "subdir"
        mock_dir.path = "src/subdir"
        mock_dir.type = "dir"
        mock_dir.size = None
        
        mock_repo.get_contents.return_value = [mock_file1, mock_dir]
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "list_files",
            "directory": "src",
            "branch": "main"
        })
        
        assert result["directory"] == "src"
        assert result["branch"] == "main"
        assert len(result["files"]) == 2
        assert result["files"][0]["name"] == "file1.py"
        assert result["files"][0]["type"] == "file"
        assert result["files"][1]["name"] == "subdir"
        assert result["files"][1]["type"] == "dir"
    
    @patch('chofesh.tools.github.Github')
    def test_create_issue_success(self, mock_github_class):
        """Test create_issue action success"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_issue = Mock()
        mock_issue.number = 123
        mock_issue.title = "Bug report"
        mock_issue.html_url = "https://github.com/owner/repo/issues/123"
        mock_issue.state = "open"
        mock_repo.create_issue.return_value = mock_issue
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "create_issue",
            "title": "Bug report",
            "body": "Issue description"
        })
        
        assert result["number"] == 123
        assert result["title"] == "Bug report"
        assert result["url"] == "https://github.com/owner/repo/issues/123"
        assert result["state"] == "open"
    
    @patch('chofesh.tools.github.Github')
    def test_create_issue_without_title(self, mock_github_class):
        """Test create_issue without title"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({"action": "create_issue"})
        
        assert "error" in result
        assert "Title parameter is required" in result["error"]
    
    @patch('chofesh.tools.github.Github')
    def test_comment_issue_success(self, mock_github_class):
        """Test comment_issue action success"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_issue = Mock()
        mock_comment = Mock()
        mock_comment.id = 456
        mock_comment.html_url = "https://github.com/owner/repo/issues/123#comment-456"
        mock_issue.create_comment.return_value = mock_comment
        mock_repo.get_issue.return_value = mock_issue
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "comment_issue",
            "issue_number": 123,
            "body": "Comment text"
        })
        
        assert result["issue_number"] == 123
        assert result["comment_id"] == 456
        assert result["url"] == "https://github.com/owner/repo/issues/123#comment-456"
    
    @patch('chofesh.tools.github.Github')
    def test_comment_issue_without_required_params(self, mock_github_class):
        """Test comment_issue without required parameters"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        
        # Without issue_number
        result = tool.execute({
            "action": "comment_issue",
            "body": "comment"
        })
        assert "error" in result
        
        # Without body
        result = tool.execute({
            "action": "comment_issue",
            "issue_number": 123
        })
        assert "error" in result
    
    @patch('chofesh.tools.github.Github')
    def test_list_issues_success(self, mock_github_class):
        """Test list_issues action success"""
        from datetime import datetime
        
        mock_github = Mock()
        mock_repo = Mock()
        
        mock_issue1 = Mock()
        mock_issue1.number = 1
        mock_issue1.title = "Issue 1"
        mock_issue1.state = "open"
        mock_issue1.html_url = "https://github.com/owner/repo/issues/1"
        mock_issue1.created_at = datetime(2024, 1, 1, 12, 0, 0)
        
        mock_issue2 = Mock()
        mock_issue2.number = 2
        mock_issue2.title = "Issue 2"
        mock_issue2.state = "open"
        mock_issue2.html_url = "https://github.com/owner/repo/issues/2"
        mock_issue2.created_at = datetime(2024, 1, 2, 12, 0, 0)
        
        mock_repo.get_issues.return_value = [mock_issue1, mock_issue2]
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "list_issues",
            "state": "open"
        })
        
        assert result["state"] == "open"
        assert len(result["issues"]) == 2
        assert result["issues"][0]["number"] == 1
        assert result["issues"][1]["number"] == 2
    
    @patch('chofesh.tools.github.Github')
    def test_list_prs_success(self, mock_github_class):
        """Test list_prs action success"""
        from datetime import datetime
        
        mock_github = Mock()
        mock_repo = Mock()
        
        mock_pr1 = Mock()
        mock_pr1.number = 10
        mock_pr1.title = "PR 1"
        mock_pr1.state = "open"
        mock_pr1.html_url = "https://github.com/owner/repo/pull/10"
        mock_pr1.head.ref = "feature-1"
        mock_pr1.base.ref = "main"
        mock_pr1.created_at = datetime(2024, 1, 1, 12, 0, 0)
        
        mock_repo.get_pulls.return_value = [mock_pr1]
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "list_prs",
            "state": "open"
        })
        
        assert result["state"] == "open"
        assert len(result["pull_requests"]) == 1
        assert result["pull_requests"][0]["number"] == 10
        assert result["pull_requests"][0]["head"] == "feature-1"
        assert result["pull_requests"][0]["base"] == "main"
    
    @patch('chofesh.tools.github.Github')
    def test_execute_with_github_exception(self, mock_github_class):
        """Test execute handling GithubException"""
        from github import GithubException
        
        mock_github = Mock()
        mock_repo = Mock()
        
        github_error = GithubException(403, {"message": "Forbidden"}, None)
        mock_repo.get_contents.side_effect = github_error
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "read_file",
            "path": "file.md"
        })
        
        assert "error" in result
        assert "GitHub API error" in result["error"]
        assert result["status"] == 403
    
    @patch('chofesh.tools.github.Github')
    def test_execute_with_general_exception(self, mock_github_class):
        """Test execute handling general exceptions"""
        mock_github = Mock()
        mock_repo = Mock()
        mock_repo.get_contents.side_effect = ValueError("Something went wrong")
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "read_file",
            "path": "file.md"
        })
        
        assert "error" in result
        assert "Operation failed" in result["error"]
    
    @patch('chofesh.tools.github.Github')
    def test_write_file_with_github_exception(self, mock_github_class):
        """Test write_file handling non-404 GithubException"""
        from github import GithubException
        
        mock_github = Mock()
        mock_repo = Mock()
        
        # Non-404 error
        github_error = GithubException(403, {"message": "Forbidden"}, None)
        mock_repo.get_contents.side_effect = github_error
        
        mock_github.get_repo.return_value = mock_repo
        mock_github_class.return_value = mock_github
        
        tool = GitHubTool(token="test_token", repo="owner/repo")
        result = tool.execute({
            "action": "write_file",
            "path": "file.md",
            "content": "content"
        })
        
        assert "error" in result
        assert "GitHub API error" in result["error"]
