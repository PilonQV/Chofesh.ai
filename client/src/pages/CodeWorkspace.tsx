import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  Code2,
  FileCode,
  FolderOpen,
  File,
  FilePlus,
  FolderPlus,
  Trash2,
  Play,
  Save,
  Download,
  Upload,
  Settings,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Loader2,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Sun,
  Moon,
  ArrowLeft,
  RefreshCw,
  Wand2,
  FileText,
  Terminal,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: FileNode[];
  expanded?: boolean;
}

// Language detection based on file extension
const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    rs: "rust",
    go: "go",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
  };
  return langMap[ext] || "plaintext";
};

// Default starter files
const defaultFiles: FileNode[] = [
  {
    id: "1",
    name: "src",
    type: "folder",
    expanded: true,
    children: [
      {
        id: "2",
        name: "index.html",
        type: "file",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Hello, World!</h1>
    <p>Welcome to your code workspace.</p>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
      },
      {
        id: "3",
        name: "styles.css",
        type: "file",
        language: "css",
        content: `/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

#app {
  background: white;
  padding: 2rem 3rem;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
}

h1 {
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

p {
  color: #666;
}`,
      },
      {
        id: "4",
        name: "main.js",
        type: "file",
        language: "javascript",
        content: `// Main JavaScript file
console.log('Hello from main.js!');

// Example: Add interactivity
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  // Add a button dynamically
  const button = document.createElement('button');
  button.textContent = 'Click me!';
  button.style.cssText = \`
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  \`;
  
  button.addEventListener('click', () => {
    alert('Button clicked! 🎉');
  });
  
  app.appendChild(button);
});`,
      },
    ],
  },
  {
    id: "5",
    name: "README.md",
    type: "file",
    language: "markdown",
    content: `# My Project

Welcome to your code workspace! This is a simple starter project.

## Features

- HTML, CSS, and JavaScript files
- Live preview support
- AI code assistance

## Getting Started

1. Edit the files in the \`src\` folder
2. Click "Run Preview" to see your changes
3. Use AI assistance to help write code

Happy coding! 🚀`,
  },
];

export default function CodeWorkspace() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  
  // File system state
  const [files, setFiles] = useState<FileNode[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("codeWorkspaceFiles");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultFiles;
        }
      }
    }
    return defaultFiles;
  });
  
  // Editor state
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // UI state
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  
  // Dialog state
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<"file" | "folder">("file");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("codeWorkspaceOnboardingDone");
    }
    return true;
  });
  
  const chatMutation = trpc.chat.send.useMutation();
  
  // Save files to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("codeWorkspaceFiles", JSON.stringify(files));
    }
  }, [files]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);
  
  // Find file by ID recursively
  const findFileById = useCallback((nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFileById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);
  
  // Update file content
  const updateFileContent = useCallback((id: string, content: string) => {
    const updateRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, content };
        }
        if (node.children) {
          return { ...node, children: updateRecursive(node.children) };
        }
        return node;
      });
    };
    setFiles(updateRecursive(files));
    setUnsavedChanges(false);
    toast.success("File saved");
  }, [files]);
  
  // Toggle folder expansion
  const toggleFolder = useCallback((id: string) => {
    const toggleRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.id === id && node.type === "folder") {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleRecursive(node.children) };
        }
        return node;
      });
    };
    setFiles(toggleRecursive(files));
  }, [files]);
  
  // Create new file or folder
  const createNewFile = useCallback(() => {
    if (!newFileName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    
    const newNode: FileNode = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      type: newFileType,
      ...(newFileType === "file" && {
        content: "",
        language: getLanguageFromFilename(newFileName.trim()),
      }),
      ...(newFileType === "folder" && {
        children: [],
        expanded: true,
      }),
    };
    
    if (selectedFolder) {
      // Add to selected folder
      const addToFolder = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.id === selectedFolder && node.type === "folder") {
            return {
              ...node,
              children: [...(node.children || []), newNode],
              expanded: true,
            };
          }
          if (node.children) {
            return { ...node, children: addToFolder(node.children) };
          }
          return node;
        });
      };
      setFiles(addToFolder(files));
    } else {
      // Add to root
      setFiles([...files, newNode]);
    }
    
    setNewFileDialogOpen(false);
    setNewFileName("");
    setSelectedFolder(null);
    toast.success(`${newFileType === "file" ? "File" : "Folder"} created`);
  }, [newFileName, newFileType, selectedFolder, files]);
  
  // Delete file or folder
  const deleteFile = useCallback((id: string) => {
    const deleteRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter((node) => {
        if (node.id === id) return false;
        if (node.children) {
          node.children = deleteRecursive(node.children);
        }
        return true;
      });
    };
    setFiles(deleteRecursive(files));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      setEditorContent("");
    }
    toast.success("Deleted");
  }, [files, selectedFile]);
  
  // Handle file selection
  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === "folder") {
      toggleFolder(file.id);
      return;
    }
    
    if (unsavedChanges && selectedFile) {
      // Auto-save before switching
      updateFileContent(selectedFile.id, editorContent);
    }
    
    setSelectedFile(file);
    setEditorContent(file.content || "");
    setUnsavedChanges(false);
  }, [toggleFolder, unsavedChanges, selectedFile, editorContent, updateFileContent]);
  
  // Generate preview HTML
  const generatePreview = useCallback(() => {
    // Find HTML, CSS, and JS files
    const findFile = (name: string): FileNode | null => {
      const search = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (node.type === "file" && node.name.toLowerCase() === name.toLowerCase()) {
            return node;
          }
          if (node.children) {
            const found = search(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      return search(files);
    };
    
    const htmlFile = findFile("index.html");
    const cssFile = findFile("styles.css");
    const jsFile = findFile("main.js");
    
    if (!htmlFile) {
      toast.error("No index.html found");
      return;
    }
    
    let html = htmlFile.content || "";
    
    // Inject CSS
    if (cssFile?.content) {
      html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        `<style>${cssFile.content}</style>`
      );
    }
    
    // Inject JS
    if (jsFile?.content) {
      html = html.replace(
        '<script src="main.js"></script>',
        `<script>${jsFile.content}</script>`
      );
    }
    
    setPreviewHtml(html);
    setShowPreview(true);
  }, [files]);
  
  // AI code assistance
  const handleAiAssist = useCallback(async (action: "explain" | "refactor" | "generate" | "fix") => {
    if (!selectedFile && action !== "generate") {
      toast.error("Please select a file first");
      return;
    }
    
    if (action === "generate" && !aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    setAiLoading(true);
    setAiResponse("");
    
    try {
      const prompts: Record<string, string> = {
        explain: `Explain this code in detail:\n\n\`\`\`${selectedFile?.language || "code"}\n${editorContent}\n\`\`\``,
        refactor: `Refactor this code to be cleaner and more efficient. Return only the improved code:\n\n\`\`\`${selectedFile?.language || "code"}\n${editorContent}\n\`\`\``,
        fix: `Fix any bugs or issues in this code. Return only the fixed code:\n\n\`\`\`${selectedFile?.language || "code"}\n${editorContent}\n\`\`\``,
        generate: aiPrompt,
      };
      
      const response = await chatMutation.mutateAsync({
        messages: [
          {
            role: "system",
            content: "You are an expert programmer. Provide clear, concise code assistance. When asked to generate or modify code, return only the code without explanations unless asked.",
          },
          { role: "user", content: prompts[action] },
        ],
        routingMode: "auto",
      });
      
      const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      setAiResponse(content);
      
      // If refactor or fix, offer to apply changes
      if ((action === "refactor" || action === "fix") && content.includes("```")) {
        // Extract code from markdown code block
        const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          setAiResponse(codeMatch[1].trim());
        }
      }
    } catch (error) {
      toast.error("AI assistance failed");
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  }, [selectedFile, editorContent, aiPrompt, chatMutation]);
  
  // Apply AI suggestion to editor
  const applyAiSuggestion = useCallback(() => {
    if (aiResponse && selectedFile) {
      setEditorContent(aiResponse);
      setUnsavedChanges(true);
      toast.success("Applied AI suggestion");
    }
  }, [aiResponse, selectedFile]);
  
  // Render file tree recursively
  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-muted/50 rounded ${
            selectedFile?.id === node.id ? "bg-primary/20" : ""
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleFileSelect(node)}
        >
          {node.type === "folder" ? (
            <>
              {node.expanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <FolderOpen className="w-4 h-4 text-yellow-500" />
            </>
          ) : (
            <>
              <span className="w-4" />
              <FileCode className="w-4 h-4 text-blue-500" />
            </>
          )}
          <span className="text-sm truncate flex-1">{node.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {node.type === "folder" && (
                <>
                  <DropdownMenuItem onClick={() => {
                    setSelectedFolder(node.id);
                    setNewFileType("file");
                    setNewFileDialogOpen(true);
                  }}>
                    <FilePlus className="w-4 h-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedFolder(node.id);
                    setNewFileType("folder");
                    setNewFileDialogOpen(true);
                  }}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteFile(node.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {node.type === "folder" && node.expanded && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-12 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">Code Workspace</span>
          </div>
          {selectedFile && (
            <Badge variant="outline" className="ml-2">
              {selectedFile.name}
              {unsavedChanges && " •"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedFile && updateFileContent(selectedFile.id, editorContent)}
                disabled={!selectedFile || !unsavedChanges}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save file (Ctrl+S)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={generatePreview}>
                <Play className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>Run preview</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showAiPanel ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAiPanel(!showAiPanel)}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI Assist
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI code assistance</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div
          className="border-r bg-card flex flex-col"
          style={{ width: sidebarWidth }}
        >
          <div className="p-2 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Explorer</span>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => {
                      setSelectedFolder(null);
                      setNewFileType("file");
                      setNewFileDialogOpen(true);
                    }}
                  >
                    <FilePlus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New File</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => {
                      setSelectedFolder(null);
                      setNewFileType("folder");
                      setNewFileDialogOpen(true);
                    }}
                  >
                    <FolderPlus className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Folder</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1 group">{renderFileTree(files)}</div>
          </ScrollArea>
        </div>
        
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <Editor
              height="100%"
              language={selectedFile.language || "plaintext"}
              value={editorContent}
              onChange={(value) => {
                setEditorContent(value || "");
                setUnsavedChanges(true);
              }}
              theme={theme === "dark" ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
              }}
              onMount={(editor, monaco) => {
                // Add Ctrl+S save shortcut
                editor.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                  () => {
                    if (selectedFile) {
                      updateFileContent(selectedFile.id, editor.getValue());
                    }
                  }
                );
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No file selected</p>
                <p className="text-sm">Select a file from the explorer to start editing</p>
              </div>
            </div>
          )}
        </div>
        
        {/* AI Assistant Panel */}
        {showAiPanel && (
          <div className="w-80 border-l bg-card flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">AI Assistant</span>
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowAiPanel(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 border-b space-y-2">
              <p className="text-xs text-muted-foreground">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAiAssist("explain")}
                  disabled={aiLoading || !selectedFile}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Explain
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAiAssist("refactor")}
                  disabled={aiLoading || !selectedFile}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refactor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAiAssist("fix")}
                  disabled={aiLoading || !selectedFile}
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Fix Bugs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (aiResponse) {
                      navigator.clipboard.writeText(aiResponse);
                      toast.success("Copied to clipboard");
                    }
                  }}
                  disabled={!aiResponse}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="p-3 border-b">
              <p className="text-xs text-muted-foreground mb-2">Generate Code</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe what to generate..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiAssist("generate")}
                  className="text-sm"
                />
                <Button
                  size="icon"
                  onClick={() => handleAiAssist("generate")}
                  disabled={aiLoading || !aiPrompt.trim()}
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-3">
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : aiResponse ? (
                <div className="space-y-3">
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {aiResponse}
                  </pre>
                  {selectedFile && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={applyAiSuggestion}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Apply to Editor
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select an action or generate code to see AI suggestions
                </p>
              )}
            </ScrollArea>
          </div>
        )}
        
        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 border-l flex flex-col">
            <div className="p-2 border-b flex items-center justify-between bg-card">
              <span className="text-sm font-medium">Preview</span>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowPreview(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="flex-1 bg-white"
              sandbox="allow-scripts"
              title="Preview"
            />
          </div>
        )}
      </div>
      
      {/* New File Dialog */}
      <Dialog open={newFileDialogOpen} onOpenChange={setNewFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {newFileType === "file" ? "File" : "Folder"}</DialogTitle>
            <DialogDescription>
              Enter a name for the new {newFileType}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={newFileType === "file" ? "default" : "outline"}
                size="sm"
                onClick={() => setNewFileType("file")}
              >
                <File className="w-4 h-4 mr-1" />
                File
              </Button>
              <Button
                variant={newFileType === "folder" ? "default" : "outline"}
                size="sm"
                onClick={() => setNewFileType("folder")}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                Folder
              </Button>
            </div>
            <Input
              placeholder={newFileType === "file" ? "filename.js" : "folder-name"}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNewFile()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createNewFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={(open) => {
        setShowOnboarding(open);
        if (!open) {
          localStorage.setItem("codeWorkspaceOnboardingDone", "true");
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              Welcome to Code Workspace!
            </DialogTitle>
            <DialogDescription>
              Your AI-powered code editor with intelligent assistance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FileCode className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">File Management</h4>
                <p className="text-sm text-muted-foreground">Create, edit, and organize files in the sidebar. Supports 20+ languages.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">AI Assistance</h4>
                <p className="text-sm text-muted-foreground">Click the AI button to explain, refactor, fix bugs, or generate code.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Live Preview</h4>
                <p className="text-sm text-muted-foreground">Click Preview to see your HTML/CSS/JS code running in real-time.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowOnboarding(false);
              localStorage.setItem("codeWorkspaceOnboardingDone", "true");
            }}>
              Get Started
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
