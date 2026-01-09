import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  Upload,
  Trash2,
  MessageSquare,
  Send,
  Loader2,
  File,
  X,
  ChevronLeft,
  CheckSquare,
  Square,
  Files,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Documents() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  const { data: documents, isLoading: docsLoading } = trpc.documents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get selected documents from the list
  const selectedDocs = documents?.filter(d => selectedDocIds.includes(d.id)) || [];

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      utils.documents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload document");
    },
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      utils.documents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });

  // Single document chat mutation (for single doc selection)
  const chatMutation = trpc.documents.chat.useMutation({
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to get response");
      setChatMessages((prev) => prev.slice(0, -1)); // Remove loading message
    },
  });

  // Multi-document chat mutation
  const multiChatMutation = trpc.documents.multiChat.useMutation({
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to get response");
      setChatMessages((prev) => prev.slice(0, -1)); // Remove loading message
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ["text/plain", "text/markdown", "application/pdf"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".md") && !file.name.endsWith(".txt")) {
      toast.error("Please upload a text, markdown, or PDF file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      
      if (isPdf) {
        // For PDFs, read as base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Content = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        await uploadMutation.mutateAsync({
          filename: file.name,
          mimeType: 'application/pdf',
          content: base64Content,
          isBase64: true,
        });
        toast.success("PDF uploaded! The AI will analyze it directly when you ask questions.");
      } else {
        // For text files, read as text
        const textContent = await file.text();
        
        await uploadMutation.mutateAsync({
          filename: file.name,
          mimeType: file.type || "text/plain",
          content: textContent,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || selectedDocIds.length === 0 || chatMutation.isPending || multiChatMutation.isPending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    if (selectedDocIds.length === 1) {
      // Single document chat
      await chatMutation.mutateAsync({
        documentId: selectedDocIds[0],
        question: userMessage,
      });
    } else {
      // Multi-document chat
      await multiChatMutation.mutateAsync({
        documentIds: selectedDocIds,
        question: userMessage,
      });
    }
  };

  const handleToggleDocument = (docId: number) => {
    setSelectedDocIds(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
    // Clear chat when selection changes
    setChatMessages([]);
  };

  const handleSelectAll = () => {
    if (documents) {
      setSelectedDocIds(documents.map(d => d.id));
      setChatMessages([]);
    }
  };

  const handleDeselectAll = () => {
    setSelectedDocIds([]);
    setChatMessages([]);
  };

  const handleDeleteDocument = (docId: number) => {
    // Remove from selection if selected
    setSelectedDocIds(prev => prev.filter(id => id !== docId));
    deleteMutation.mutate({ id: docId });
  };

  const isPending = chatMutation.isPending || multiChatMutation.isPending;

  if (authLoading || docsLoading) {
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Document Chat</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 h-screen flex">
        {/* Sidebar - Document List */}
        <div className={`w-80 border-r border-border flex flex-col ${selectedDocIds.length > 0 ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Document
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Supports .txt, .md, .pdf files (max 5MB)
            </p>
          </div>

          {/* Selection Controls */}
          {documents && documents.length > 0 && (
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedDocIds.length} of {documents.length} selected
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={selectedDocIds.length === documents.length}
                  className="h-7 text-xs"
                >
                  <CheckSquare className="w-3 h-3 mr-1" />
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={selectedDocIds.length === 0}
                  className="h-7 text-xs"
                >
                  <Square className="w-3 h-3 mr-1" />
                  None
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDocIds.includes(doc.id)
                        ? "bg-primary/10 border border-primary/50"
                        : "hover:bg-muted border border-transparent"
                    }`}
                    onClick={() => handleToggleDocument(doc.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedDocIds.includes(doc.id)}
                        onCheckedChange={() => handleToggleDocument(doc.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.originalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.fileSize / 1024).toFixed(1)} KB • {doc.chunkCount ?? 0} chunks
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a document to start chatting with it.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedDocIds.length > 0 ? 'flex' : 'hidden md:flex'}`}>
          {selectedDocIds.length > 0 && selectedDocs.length > 0 ? (
            <>
              {/* Document Header */}
              <div className="p-4 border-b border-border flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedDocIds([])}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  {selectedDocs.length === 1 ? (
                    <>
                      <h2 className="font-semibold truncate">{selectedDocs[0].originalName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedDocs[0].chunkCount ?? 0} chunks • Ready for questions
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Files className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">{selectedDocs.length} Documents Selected</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedDocs.reduce((acc, d) => acc + (d.chunkCount || 0), 0)} total chunks • Ask questions across all documents
                      </p>
                    </>
                  )}
                </div>
                {selectedDocs.length > 1 && (
                  <div className="hidden sm:flex flex-wrap gap-1 max-w-xs">
                    {selectedDocs.slice(0, 3).map(doc => (
                      <span key={doc.id} className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[100px]">
                        {doc.originalName}
                      </span>
                    ))}
                    {selectedDocs.length > 3 && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        +{selectedDocs.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        {selectedDocs.length === 1 ? (
                          <MessageSquare className="w-8 h-8 text-primary" />
                        ) : (
                          <Files className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <h3 className="font-semibold mb-2">
                        {selectedDocs.length === 1 
                          ? "Ask About This Document" 
                          : `Ask About ${selectedDocs.length} Documents`}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {selectedDocs.length === 1 
                          ? `Ask any question about "${selectedDocs[0].originalName}" and get answers based on its content.`
                          : "Ask any question and get answers based on the content of all selected documents."}
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <Streamdown>{msg.content}</Streamdown>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-4 rounded-2xl">
                        <img src="/chofesh-logo-48.webp" alt="AI analyzing document" className="w-5 h-5 animate-pulse" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="max-w-3xl mx-auto flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder={selectedDocs.length === 1 
                      ? "Ask a question about this document..." 
                      : `Ask a question across ${selectedDocs.length} documents...`}
                    disabled={isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Select Documents</h2>
                <p className="text-muted-foreground max-w-md">
                  Choose one or more documents from the sidebar to start asking questions.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
