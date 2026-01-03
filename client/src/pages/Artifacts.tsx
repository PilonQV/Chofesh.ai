import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Code,
  Table,
  GitBranch,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Copy,
  Download,
  History,
  Search,
  Filter,
  X,
  Save,
  Eye,
  Maximize2,
  Minimize2,
  FileCode,
  FileType,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type ArtifactType = "document" | "code" | "table" | "diagram" | "markdown";

interface Artifact {
  id: number;
  title: string;
  type: ArtifactType;
  content: string;
  language: string | null;
  version: number;
  conversationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TYPE_CONFIG = {
  document: {
    label: "Document",
    icon: FileText,
    color: "bg-blue-500/20 text-blue-500",
    description: "Rich text documents",
  },
  code: {
    label: "Code",
    icon: Code,
    color: "bg-green-500/20 text-green-500",
    description: "Code snippets and files",
  },
  table: {
    label: "Table",
    icon: Table,
    color: "bg-purple-500/20 text-purple-500",
    description: "Structured data tables",
  },
  diagram: {
    label: "Diagram",
    icon: GitBranch,
    color: "bg-orange-500/20 text-orange-500",
    description: "Visual diagrams",
  },
  markdown: {
    label: "Markdown",
    icon: FileType,
    color: "bg-cyan-500/20 text-cyan-500",
    description: "Markdown documents",
  },
};

const LANGUAGE_OPTIONS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "html",
  "css",
  "sql",
  "json",
  "yaml",
  "markdown",
  "bash",
  "other",
];

export default function ArtifactsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Form state for new artifact
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ArtifactType>("document");
  const [newContent, setNewContent] = useState("");
  const [newLanguage, setNewLanguage] = useState("javascript");

  const utils = trpc.useUtils();

  const { data: artifacts, isLoading: artifactsLoading } = trpc.artifacts.list.useQuery(
    filterType !== "all" ? { type: filterType as ArtifactType } : undefined,
    { enabled: isAuthenticated }
  );

  const { data: versionHistory } = trpc.artifacts.getVersionHistory.useQuery(
    { id: selectedArtifact?.id || 0 },
    { enabled: !!selectedArtifact && showVersionHistory }
  );

  const createMutation = trpc.artifacts.create.useMutation({
    onSuccess: () => {
      toast.success("Artifact created");
      setCreateDialogOpen(false);
      resetForm();
      utils.artifacts.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create artifact");
    },
  });

  const updateMutation = trpc.artifacts.update.useMutation({
    onSuccess: () => {
      toast.success("Artifact saved");
      setIsEditing(false);
      utils.artifacts.list.invalidate();
      if (selectedArtifact) {
        utils.artifacts.get.invalidate({ id: selectedArtifact.id });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save artifact");
    },
  });

  const deleteMutation = trpc.artifacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Artifact deleted");
      setSelectedArtifact(null);
      utils.artifacts.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete artifact");
    },
  });

  const createVersionMutation = trpc.artifacts.createVersion.useMutation({
    onSuccess: () => {
      toast.success("New version created");
      utils.artifacts.list.invalidate();
      utils.artifacts.getVersionHistory.invalidate({ id: selectedArtifact?.id || 0 });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create version");
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const resetForm = () => {
    setNewTitle("");
    setNewType("document");
    setNewContent("");
    setNewLanguage("javascript");
  };

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    createMutation.mutate({
      title: newTitle.trim(),
      type: newType,
      content: newContent,
      language: newType === "code" ? newLanguage : undefined,
    });
  };

  const handleSave = () => {
    if (!selectedArtifact) return;
    updateMutation.mutate({
      id: selectedArtifact.id,
      title: editTitle,
      content: editContent,
    });
  };

  const handleSaveAsNewVersion = () => {
    if (!selectedArtifact) return;
    createVersionMutation.mutate({
      originalId: selectedArtifact.id,
      newContent: editContent,
    });
  };

  const handleSelectArtifact = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    setEditContent(artifact.content);
    setEditTitle(artifact.title);
    setIsEditing(false);
    setShowVersionHistory(false);
  };

  const handleCopy = () => {
    if (!selectedArtifact) return;
    navigator.clipboard.writeText(selectedArtifact.content);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    if (!selectedArtifact) return;
    const ext = selectedArtifact.type === "code" 
      ? `.${selectedArtifact.language || "txt"}`
      : selectedArtifact.type === "markdown" 
        ? ".md" 
        : ".txt";
    const blob = new Blob([selectedArtifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedArtifact.title}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const filteredArtifacts = artifacts?.filter((artifact: Artifact) => {
    const matchesSearch = artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  if (authLoading || artifactsLoading) {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Artifacts</span>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Artifact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Artifact</DialogTitle>
                <DialogDescription>
                  Create a document, code snippet, or other content to iterate on.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="My Artifact"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as ArtifactType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newType === "code" && (
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={newLanguage} onValueChange={setNewLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((lang) => (
                            <SelectItem key={lang} value={lang}>
                              {lang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder={newType === "code" ? "// Your code here..." : "Start writing..."}
                    rows={10}
                    className="font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      {/* Main Content - Split View */}
      <main className={`pt-16 flex-1 flex ${isFullscreen ? 'fixed inset-0 z-40 bg-background' : ''}`}>
        {/* Sidebar - Artifact List */}
        {!isFullscreen && (
          <div className="w-80 border-r border-border flex flex-col">
            {/* Search and Filter */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search artifacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Artifact List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredArtifacts.length > 0 ? (
                  filteredArtifacts.map((artifact: Artifact) => {
                    const typeConfig = TYPE_CONFIG[artifact.type];
                    const TypeIcon = typeConfig.icon;
                    const isSelected = selectedArtifact?.id === artifact.id;

                    return (
                      <button
                        key={artifact.id}
                        onClick={() => handleSelectArtifact(artifact)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded ${typeConfig.color}`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{artifact.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                v{artifact.version}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(artifact.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No artifacts yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main Panel - Artifact View/Edit */}
        <div className="flex-1 flex flex-col">
          {selectedArtifact ? (
            <>
              {/* Artifact Header */}
              <div className="border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold w-64"
                    />
                  ) : (
                    <h2 className="text-lg font-semibold">{selectedArtifact.title}</h2>
                  )}
                  <Badge variant="outline" className={TYPE_CONFIG[selectedArtifact.type].color}>
                    {TYPE_CONFIG[selectedArtifact.type].label}
                  </Badge>
                  {selectedArtifact.language && (
                    <Badge variant="outline">{selectedArtifact.language}</Badge>
                  )}
                  <Badge variant="outline">v{selectedArtifact.version}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleSaveAsNewVersion}>
                        <History className="w-4 h-4 mr-1" />
                        Save as New Version
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => setShowVersionHistory(!showVersionHistory)}>
                        <History className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCopy}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{selectedArtifact.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: selectedArtifact.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {isFullscreen && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedArtifact(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Artifact Content */}
              <div className="flex-1 flex">
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {isEditing ? (
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[500px] font-mono text-sm"
                        placeholder="Start writing..."
                      />
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {selectedArtifact.type === "code" ? (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code className={`language-${selectedArtifact.language || "plaintext"}`}>
                              {selectedArtifact.content}
                            </code>
                          </pre>
                        ) : selectedArtifact.type === "markdown" ? (
                          <Streamdown>{selectedArtifact.content}</Streamdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{selectedArtifact.content}</div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Version History Panel */}
                {showVersionHistory && versionHistory && versionHistory.length > 0 && (
                  <div className="w-64 border-l border-border p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Version History
                    </h3>
                    <div className="space-y-2">
                      {versionHistory.map((version: Artifact) => (
                        <button
                          key={version.id}
                          onClick={() => handleSelectArtifact(version)}
                          className={`w-full text-left p-2 rounded-lg text-sm ${
                            version.id === selectedArtifact.id
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="font-medium">Version {version.version}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <FileCode className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">Select an Artifact</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose an artifact from the list or create a new one
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Artifact
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
