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
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
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
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  const { data: documents, isLoading: docsLoading } = trpc.documents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get selected document from the list
  const selectedDoc = documents?.find(d => d.id === selectedDocId);

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
      if (selectedDocId) setSelectedDocId(null);
      utils.documents.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });

  const chatMutation = trpc.documents.chat.useMutation({
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
      // Read file content
      const textContent = await file.text();
      
      await uploadMutation.mutateAsync({
        filename: file.name,
        mimeType: file.type || "text/plain",
        content: textContent,
      });
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
    if (!inputMessage.trim() || !selectedDocId || chatMutation.isPending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    await chatMutation.mutateAsync({
      documentId: selectedDocId,
      question: userMessage,
    });
  };

  const handleSelectDocument = (docId: number) => {
    setSelectedDocId(docId);
    setChatMessages([]);
  };

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
        <div className={`w-80 border-r border-border flex flex-col ${selectedDocId ? 'hidden md:flex' : 'flex'}`}>
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
              Supports .txt, .md files (max 5MB)
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDocId === doc.id
                        ? "bg-primary/10 border border-primary/50"
                        : "hover:bg-muted border border-transparent"
                    }`}
                    onClick={() => handleSelectDocument(doc.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.originalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.fileSize / 1024).toFixed(1)} KB • {doc.chunkCount} chunks
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
                          deleteMutation.mutate({ id: doc.id });
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
        <div className={`flex-1 flex flex-col ${selectedDocId ? 'flex' : 'hidden md:flex'}`}>
          {selectedDocId && selectedDoc ? (
            <>
              {/* Document Header */}
              <div className="p-4 border-b border-border flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedDocId(null)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{selectedDoc.originalName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedDoc.chunkCount} chunks • Ready for questions
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">Ask About This Document</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Ask any question about "{selectedDoc.originalName}" and get answers based on its content.
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
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-4 rounded-2xl">
                        <Loader2 className="w-5 h-5 animate-spin" />
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
                    placeholder="Ask a question about this document..."
                    disabled={chatMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatMutation.isPending}
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
                <h2 className="text-xl font-semibold mb-2">Select a Document</h2>
                <p className="text-muted-foreground max-w-md">
                  Choose a document from the sidebar to start asking questions about it.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
