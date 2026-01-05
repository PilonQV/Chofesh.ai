import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Database, 
  Upload, 
  Search, 
  FileText, 
  Folder, 
  FolderPlus,
  Trash2,
  MessageSquare,
  Loader2,
  Send,
  BookOpen,
  X,
  ChevronRight,
  File,
  Plus
} from "lucide-react";
import { Streamdown } from "streamdown";

interface KnowledgeDocument {
  id: number;
  name: string;
  type: string;
  size: number;
  chunks: number;
  folder?: string;
  createdAt: Date;
}

interface KnowledgeFolder {
  name: string;
  documents: KnowledgeDocument[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { docName: string; chunk: string; relevance: number }[];
}

export default function KnowledgeBase() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [folders, setFolders] = useState<string[]>(["General"]);
  const [selectedFolder, setSelectedFolder] = useState("General");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  const documentsQuery = trpc.documents.list.useQuery();
  const uploadMutation = trpc.documents.upload.useMutation();
  const deleteMutation = trpc.documents.delete.useMutation();
  const searchMutation = trpc.knowledge.search.useMutation();
  const chatMutation = trpc.knowledge.chat.useMutation();

  useEffect(() => {
    if (documentsQuery.data) {
      const docs = documentsQuery.data.map((doc: any) => ({
        id: doc.id,
        name: doc.filename,
        type: doc.mimeType || "unknown",
        size: doc.fileSize || 0,
        chunks: doc.chunkCount || 0,
        folder: doc.folder || "General",
        createdAt: new Date(doc.createdAt),
      }));
      setDocuments(docs);
      
      // Extract unique folders
      const uniqueFolders = new Set(["General", ...docs.map((d: KnowledgeDocument) => d.folder || "General")]);
      setFolders(Array.from(uniqueFolders));
    }
  }, [documentsQuery.data]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string)?.split(",")[1];
          if (base64) {
            await uploadMutation.mutateAsync({
              filename: file.name,
              content: base64,
              mimeType: file.type,
            });
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
    
    setIsUploading(false);
    documentsQuery.refetch();
    event.target.value = "";
  }, [uploadMutation, selectedFolder, documentsQuery]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchMutation.mutateAsync({
        query: searchQuery,
        limit: 10,
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchMutation]);

  const handleChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsChatting(true);
    
    try {
      const response = await chatMutation.mutateAsync({
        query: chatInput,
        history: chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      });
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.answer,
        sources: response.sources,
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat failed:", error);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error while searching your knowledge base.",
      }]);
    } finally {
      setIsChatting(false);
    }
  }, [chatInput, chatMessages, chatMutation]);

  const handleDeleteDocument = useCallback(async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      documentsQuery.refetch();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, [deleteMutation, documentsQuery]);

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders(prev => [...prev, newFolderName.trim()]);
      setSelectedFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderDialog(false);
    }
  }, [newFolderName, folders]);

  const filteredDocuments = documents.filter(doc => 
    doc.folder === selectedFolder || selectedFolder === "All"
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Database className="w-16 h-16 text-primary" />
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Upload documents and chat with your own knowledge base using AI-powered semantic search.
        </p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign in to continue</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/50 flex flex-col">
        <div className="p-4 border-b">
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Chat
            </Button>
          </Link>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Folders</h2>
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  />
                  <Button onClick={handleCreateFolder}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-1">
            <Button
              variant={selectedFolder === "All" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setSelectedFolder("All")}
            >
              <Database className="w-4 h-4" />
              All Documents
              <Badge variant="outline" className="ml-auto">{documents.length}</Badge>
            </Button>
            {folders.map(folder => (
              <Button
                key={folder}
                variant={selectedFolder === folder ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setSelectedFolder(folder)}
              >
                <Folder className="w-4 h-4" />
                {folder}
                <Badge variant="outline" className="ml-auto">
                  {documents.filter(d => d.folder === folder).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-auto p-4 border-t">
          <Button 
            className="w-full gap-2" 
            onClick={() => setShowChat(true)}
          >
            <MessageSquare className="w-4 h-4" />
            Chat with Knowledge
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">Knowledge Base</h1>
              <Badge variant="outline">{filteredDocuments.length} documents</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Semantic search..."
                  className="w-64"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button asChild disabled={isUploading}>
                  <span className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Search Results</h2>
                <Button variant="ghost" size="sm" onClick={() => setSearchResults([])}>
                  Clear
                </Button>
              </div>
              <div className="grid gap-4">
                {searchResults.map((result, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {result.documentName}
                        </CardTitle>
                        <Badge variant="outline">
                          {(result.relevance * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.content}</p>
                      {result.page && (
                        <p className="text-xs text-muted-foreground mt-2">Page {result.page}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Documents Yet</h2>
              <p className="text-muted-foreground max-w-md mb-4">
                Upload PDFs, Word documents, or text files to build your knowledge base. 
                Then chat with AI to get answers from your documents.
              </p>
              <label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button asChild size="lg">
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map(doc => (
                <Card key={doc.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <File className="w-8 h-8 text-primary" />
                        <div>
                          <CardTitle className="text-sm line-clamp-1">{doc.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {formatFileSize(doc.size)}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{doc.chunks} chunks</Badge>
                      <span>•</span>
                      <span>{doc.createdAt.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Chat Panel */}
      {showChat && (
        <aside className="w-96 border-l bg-card/50 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Chat with Knowledge</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Ask questions about your documents</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs font-medium mb-1">Sources:</p>
                        {msg.sources.map((source, i) => (
                          <div key={i} className="text-xs text-muted-foreground">
                            <span className="font-medium">{source.docName}</span>
                            <span className="opacity-50"> ({(source.relevance * 100).toFixed(0)}%)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              {isChatting && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Searching knowledge base...</span>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your documents..."
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                disabled={isChatting}
              />
              <Button onClick={handleChat} disabled={isChatting || !chatInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
