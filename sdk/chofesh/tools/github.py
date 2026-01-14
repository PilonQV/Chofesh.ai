"""
GitHub integration tool for Chofesh SDK
"""
import os
from typing import Dict, Any, Optional, List
from .base import Tool

try:
    from github import Github, GithubException
    GITHUB_AVAILABLE = True
except ImportError:
    GITHUB_AVAILABLE = False


class GitHubTool(Tool):
    """Tool for GitHub operations"""
    
    name = "github"
    description = "Interact with GitHub repositories: read files, create branches, make commits, create pull requests, manage issues."
    parameters = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "description": "Action to perform",
                "enum": [
                    "read_file",
                    "write_file",
                    "create_branch",
                    "create_pr",
                    "list_files",
                    "create_issue",
                    "comment_issue",
                    "list_issues",
                    "list_prs",
                ]
            },
            "path": {
                "type": "string",
                "description": "File path (for read_file, write_file)"
            },
            "content": {
                "type": "string",
                "description": "File content (for write_file)"
            },
            "branch": {
                "type": "string",
                "description": "Branch name (for create_branch, write_file)"
            },
            "base_branch": {
                "type": "string",
                "description": "Base branch for new branch (default: main)"
            },
            "title": {
                "type": "string",
                "description": "Title (for create_pr, create_issue)"
            },
            "body": {
                "type": "string",
                "description": "Body/description (for create_pr, create_issue, comment_issue)"
            },
            "head": {
                "type": "string",
                "description": "Head branch for PR"
            },
            "base": {
                "type": "string",
                "description": "Base branch for PR (default: main)"
            },
            "issue_number": {
                "type": "integer",
                "description": "Issue number (for comment_issue)"
            },
            "directory": {
                "type": "string",
                "description": "Directory path (for list_files)"
            },
        },
        "required": ["action"]
    }
    
    def __init__(
        self,
        token: Optional[str] = None,
        repo: Optional[str] = None,
        **config
    ):
        """
        Initialize GitHub tool
        
        Args:
            token: GitHub personal access token (or set GITHUB_TOKEN env var)
            repo: Repository in format "owner/repo" (or set GITHUB_REPO env var)
            **config: Additional configuration
        """
        if not GITHUB_AVAILABLE:
            raise ImportError(
                "PyGithub is required for GitHub integration. "
                "Install with: pip install chofesh-sdk[github]"
            )
        
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.repo_name = repo or os.getenv("GITHUB_REPO")
        
        super().__init__(**config)
        
        # Initialize GitHub client
        if self.token:
            self.github = Github(self.token)
            if self.repo_name:
                self.repo = self.github.get_repo(self.repo_name)
            else:
                self.repo = None
        else:
            self.github = None
            self.repo = None
    
    def validate_config(self):
        """Validate configuration"""
        if not self.token:
            raise ValueError(
                "GitHub token is required. "
                "Set GITHUB_TOKEN environment variable or pass token parameter."
            )
    
    def _ensure_repo(self):
        """Ensure repository is set"""
        if not self.repo:
            raise ValueError(
                "Repository not set. "
                "Set GITHUB_REPO environment variable or pass repo parameter."
            )
    
    def execute(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute GitHub operation
        
        Args:
            parameters: Operation parameters
        
        Returns:
            Operation result
        """
        action = parameters.get("action")
        
        if not action:
            return {"error": "Action parameter is required"}
        
        try:
            if action == "read_file":
                return self._read_file(parameters)
            elif action == "write_file":
                return self._write_file(parameters)
            elif action == "create_branch":
                return self._create_branch(parameters)
            elif action == "create_pr":
                return self._create_pr(parameters)
            elif action == "list_files":
                return self._list_files(parameters)
            elif action == "create_issue":
                return self._create_issue(parameters)
            elif action == "comment_issue":
                return self._comment_issue(parameters)
            elif action == "list_issues":
                return self._list_issues(parameters)
            elif action == "list_prs":
                return self._list_prs(parameters)
            else:
                return {"error": f"Unknown action: {action}"}
        
        except GithubException as e:
            return {
                "error": f"GitHub API error: {e.data.get('message', str(e))}",
                "status": e.status
            }
        except Exception as e:
            return {"error": f"Operation failed: {str(e)}"}
    
    def _read_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Read file from repository"""
        self._ensure_repo()
        
        path = params.get("path")
        branch = params.get("branch", "main")
        
        if not path:
            return {"error": "Path parameter is required"}
        
        try:
            file_content = self.repo.get_contents(path, ref=branch)
            content = file_content.decoded_content.decode('utf-8')
            
            return {
                "path": path,
                "content": content,
                "sha": file_content.sha,
                "size": file_content.size,
                "branch": branch,
            }
        except GithubException as e:
            if e.status == 404:
                return {"error": f"File not found: {path}"}
            raise
    
    def _write_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Write file to repository"""
        self._ensure_repo()
        
        path = params.get("path")
        content = params.get("content")
        branch = params.get("branch", "main")
        message = params.get("message", f"Update {path}")
        
        if not path or content is None:
            return {"error": "Path and content parameters are required"}
        
        try:
            # Check if file exists
            try:
                file_content = self.repo.get_contents(path, ref=branch)
                # Update existing file
                result = self.repo.update_file(
                    path,
                    message,
                    content,
                    file_content.sha,
                    branch=branch
                )
            except GithubException as e:
                if e.status == 404:
                    # Create new file
                    result = self.repo.create_file(
                        path,
                        message,
                        content,
                        branch=branch
                    )
                else:
                    raise
            
            return {
                "path": path,
                "branch": branch,
                "commit_sha": result["commit"].sha,
                "message": message,
            }
        except GithubException:
            raise
    
    def _create_branch(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new branch"""
        self._ensure_repo()
        
        branch = params.get("branch")
        base_branch = params.get("base_branch", "main")
        
        if not branch:
            return {"error": "Branch parameter is required"}
        
        # Get base branch SHA
        base_ref = self.repo.get_git_ref(f"heads/{base_branch}")
        base_sha = base_ref.object.sha
        
        # Create new branch
        self.repo.create_git_ref(f"refs/heads/{branch}", base_sha)
        
        return {
            "branch": branch,
            "base_branch": base_branch,
            "sha": base_sha,
        }
    
    def _create_pr(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create a pull request"""
        self._ensure_repo()
        
        title = params.get("title")
        body = params.get("body", "")
        head = params.get("head")
        base = params.get("base", "main")
        
        if not title or not head:
            return {"error": "Title and head parameters are required"}
        
        pr = self.repo.create_pull(
            title=title,
            body=body,
            head=head,
            base=base,
        )
        
        return {
            "number": pr.number,
            "title": pr.title,
            "url": pr.html_url,
            "state": pr.state,
            "head": head,
            "base": base,
        }
    
    def _list_files(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """List files in directory"""
        self._ensure_repo()
        
        directory = params.get("directory", "")
        branch = params.get("branch", "main")
        
        contents = self.repo.get_contents(directory, ref=branch)
        
        files = []
        for content in contents:
            files.append({
                "name": content.name,
                "path": content.path,
                "type": content.type,
                "size": content.size if content.type == "file" else None,
            })
        
        return {
            "directory": directory,
            "branch": branch,
            "files": files,
        }
    
    def _create_issue(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create an issue"""
        self._ensure_repo()
        
        title = params.get("title")
        body = params.get("body", "")
        
        if not title:
            return {"error": "Title parameter is required"}
        
        issue = self.repo.create_issue(title=title, body=body)
        
        return {
            "number": issue.number,
            "title": issue.title,
            "url": issue.html_url,
            "state": issue.state,
        }
    
    def _comment_issue(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Comment on an issue"""
        self._ensure_repo()
        
        issue_number = params.get("issue_number")
        body = params.get("body")
        
        if not issue_number or not body:
            return {"error": "Issue_number and body parameters are required"}
        
        issue = self.repo.get_issue(issue_number)
        comment = issue.create_comment(body)
        
        return {
            "issue_number": issue_number,
            "comment_id": comment.id,
            "url": comment.html_url,
        }
    
    def _list_issues(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """List issues"""
        self._ensure_repo()
        
        state = params.get("state", "open")
        
        issues = self.repo.get_issues(state=state)
        
        issue_list = []
        for issue in issues[:10]:  # Limit to 10
            issue_list.append({
                "number": issue.number,
                "title": issue.title,
                "state": issue.state,
                "url": issue.html_url,
                "created_at": issue.created_at.isoformat(),
            })
        
        return {
            "state": state,
            "issues": issue_list,
        }
    
    def _list_prs(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """List pull requests"""
        self._ensure_repo()
        
        state = params.get("state", "open")
        
        prs = self.repo.get_pulls(state=state)
        
        pr_list = []
        for pr in prs[:10]:  # Limit to 10
            pr_list.append({
                "number": pr.number,
                "title": pr.title,
                "state": pr.state,
                "url": pr.html_url,
                "head": pr.head.ref,
                "base": pr.base.ref,
                "created_at": pr.created_at.isoformat(),
            })
        
        return {
            "state": state,
            "pull_requests": pr_list,
        }
