import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useConversations } from "@/hooks/useConversations";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { Streamdown } from "streamdown";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  MoreVertical,
  Menu,
  X,
  ArrowLeft,
  Loader2,
  Image,
  Settings,
  Zap,
  DollarSign,
  Gauge,
  ChevronDown,
  ChevronUp,
  Bot,
  Crown,
  Rocket,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
  Sliders,
  Copy,
  Share2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type RoutingMode = "auto" | "free" | "manual";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function Chat() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [routingMode, setRoutingMode] = useState<RoutingMode>("auto");
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  
  // Advanced settings
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  
  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const [lastResponse, setLastResponse] = useState<{
    model: string;
    modelName: string;
    tier: string;
    cost: number;
    cached: boolean;
    tokens?: { input: number; output: number; total: number };
    webSearchUsed?: boolean;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversations,
    currentConversation,
    isLoading: conversationsLoading,
    createConversation,
    addMessage,
    deleteConversation,
    selectConversation,
    updateConversationModel,
  } = useConversations();

  const { data: models } = trpc.models.listText.useQuery();
  const { data: templates } = trpc.templates.list.useQuery();
  const { data: myCharacters } = trpc.characters.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: publicCharacters } = trpc.characters.listPublic.useQuery();
  const characters = [...(myCharacters || []), ...(publicCharacters || []).filter(c => !myCharacters?.some(m => m.id === c.id))];
  const chatMutation = trpc.chat.send.useMutation();
  const createShareMutation = trpc.shareLinks.create.useMutation();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join("");
          setInput(transcript);
        };
        
        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast.error("Voice recognition error. Please try again.");
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation?.messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentConversation?.id]);

  // Voice output function
  const speakText = useCallback((text: string) => {
    if (!voiceOutputEnabled || typeof window === "undefined") return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceOutputEnabled]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition not supported in this browser");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Listening... Speak now");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    let conv = currentConversation;
    if (!conv) {
      conv = createConversation();
    }

    const userMessage = input.trim();
    setInput("");
    addMessage(conv.id, "user", userMessage);
    setIsGenerating(true);

    try {
      // Build messages array with system prompt if provided
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
      
      if (systemPrompt.trim()) {
        messages.push({ role: "system", content: systemPrompt.trim() });
      }
      
      messages.push(
        ...conv.messages.map((m) => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
        { role: "user" as const, content: userMessage }
      );

      const response = await chatMutation.mutateAsync({
        messages,
        model: routingMode === "manual" ? selectedModel : undefined,
        routingMode,
        useCache: true,
        temperature,
        topP,
        webSearch: webSearchEnabled,
      });

      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      addMessage(conv.id, "assistant", content);
      
      // Voice output
      if (voiceOutputEnabled) {
        speakText(content);
      }
      
      // Store response metadata for display
      setLastResponse({
        model: response.model,
        modelName: response.modelName || response.model,
        tier: response.tier || "standard",
        cost: response.cost || 0,
        cached: response.cached || false,
        tokens: response.tokens,
        webSearchUsed: response.webSearchUsed,
      });
    } catch (error) {
      toast.error("Failed to generate response. Please try again.");
      console.error("Chat error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    createConversation(currentConversation?.model || "default");
    setSidebarOpen(false);
    setLastResponse(null);
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
    toast.success("Conversation deleted");
  };

  const handleTemplateSelect = (templatePrompt: string) => {
    setInput(templatePrompt);
    inputRef.current?.focus();
  };

  const handleCopyConversation = () => {
    if (!currentConversation?.messages.length) return;
    
    const text = currentConversation.messages
      .map(m => `${m.role === "user" ? "You" : "AI"}: ${m.content}`)
      .join("\n\n");
    
    navigator.clipboard.writeText(text);
    toast.success("Conversation copied to clipboard");
  };

  const handleShareConversation = async () => {
    if (!currentConversation?.messages.length) {
      toast.error("No messages to share");
      return;
    }

    try {
      // Generate a random encryption key
      const encryptionKey = crypto.getRandomValues(new Uint8Array(32));
      const keyHex = Array.from(encryptionKey).map(b => b.toString(16).padStart(2, '0')).join('');

      // Encrypt the conversation
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(currentConversation.messages));
      
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(keyHex),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: encoder.encode("chofesh-share-salt"),
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );

      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
      const encryptedData = `${ivHex}:${encryptedHex}`;

      // Create share link
      const result = await createShareMutation.mutateAsync({
        encryptedData,
        title: currentConversation.title || "Shared Conversation",
        expiresInHours: 168, // 7 days
      });

      const shareUrl = `${window.location.origin}/share/${result.shareId}#${keyHex}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard! Link expires in 7 days.");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to create share link");
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "free":
        return <Zap className="w-3 h-3 text-green-400" />;
      case "standard":
        return <Rocket className="w-3 h-3 text-blue-400" />;
      case "premium":
        return <Crown className="w-3 h-3 text-yellow-400" />;
      default:
        return <Bot className="w-3 h-3" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: "bg-green-500/20 text-green-400 border-green-500/30",
      standard: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      premium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[tier] || colors.standard;
  };

  const getModeDescription = (mode: RoutingMode) => {
    switch (mode) {
      case "auto":
        return "Smart routing - best model for your query";
      case "free":
        return "Free tier - Llama 3.1 via Groq (fast & free)";
      case "manual":
        return "Manual - choose your preferred model";
    }
  };

  if (authLoading || conversationsLoading) {
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
    <div className="h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold gradient-text">Chofesh</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Button className="w-full gap-2" onClick={handleNewChat}>
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversation?.id === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    selectConversation(conv.id);
                    setSidebarOpen(false);
                  }}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">
                    {conv.title || "New conversation"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No conversations yet
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Link href="/characters">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" />
                AI Characters
              </Button>
            </Link>
            <Link href="/image">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Image className="w-4 h-4" />
                Generate Images
              </Button>
            </Link>
            <Link href="/documents">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <MessageSquare className="w-4 h-4" />
                Document Chat
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold truncate">
              {currentConversation?.title || "New Chat"}
            </h1>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Advanced Settings Button */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Sliders className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Chat Settings</DialogTitle>
                  <DialogDescription>
                    Customize AI behavior for this conversation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* System Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">System Prompt</Label>
                    <Textarea
                      id="system-prompt"
                      placeholder="You are a helpful assistant that..."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Custom instructions that shape how the AI responds
                    </p>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Temperature: {temperature.toFixed(1)}</Label>
                      <span className="text-xs text-muted-foreground">
                        {temperature < 0.3 ? "Focused" : temperature > 0.7 ? "Creative" : "Balanced"}
                      </span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={([v]) => setTemperature(v)}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>

                  {/* Top P */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Top P: {topP.toFixed(1)}</Label>
                    </div>
                    <Slider
                      value={[topP]}
                      onValueChange={([v]) => setTopP(v)}
                      min={0.1}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls response diversity
                    </p>
                  </div>

                  {/* Web Search Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Web Search</Label>
                      <p className="text-xs text-muted-foreground">
                        Include real-time web results
                      </p>
                    </div>
                    <Switch
                      checked={webSearchEnabled}
                      onCheckedChange={setWebSearchEnabled}
                    />
                  </div>

                  {/* Voice Output Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Voice Output</Label>
                      <p className="text-xs text-muted-foreground">
                        Read responses aloud
                      </p>
                    </div>
                    <Switch
                      checked={voiceOutputEnabled}
                      onCheckedChange={setVoiceOutputEnabled}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Routing Mode Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {routingMode === "auto" && <Zap className="w-4 h-4 text-primary" />}
                  {routingMode === "free" && <Zap className="w-4 h-4 text-green-400" />}
                  {routingMode === "manual" && <Settings className="w-4 h-4" />}
                  <span className="hidden sm:inline">
                    {routingMode === "auto" ? "Auto" : routingMode === "free" ? "Free" : "Manual"}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Model Selection Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRoutingMode("auto")}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-medium">Auto (Recommended)</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      Smart routing picks the best model for each query
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoutingMode("free")}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="font-medium">Free Tier</span>
                      <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                        $0
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      Llama 3.1 via Groq - fast & completely free
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoutingMode("manual")}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="font-medium">Manual</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      Choose your preferred model manually
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Manual Model Selector (only shown in manual mode) */}
            {routingMode === "manual" && models && (
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        {getTierIcon(model.tier)}
                        <span>{model.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Copy Conversation */}
            {currentConversation?.messages.length ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCopyConversation}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy conversation</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleShareConversation}
                      disabled={createShareMutation.isPending}
                    >
                      {createShareMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share conversation</TooltipContent>
                </Tooltip>
              </>
            ) : null}

            {/* Last Response Info */}
            {lastResponse && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {getTierIcon(lastResponse.tier)}
                    <span>{lastResponse.modelName}</span>
                    {lastResponse.webSearchUsed && (
                      <Globe className="w-3 h-3 text-blue-400" />
                    )}
                    {lastResponse.cached && (
                      <Badge variant="outline" className="text-[10px] px-1">cached</Badge>
                    )}
                    {!lastResponse.cached && lastResponse.cost > 0 && (
                      <span className="text-green-400">${lastResponse.cost.toFixed(4)}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <div>Model: {lastResponse.modelName}</div>
                    <div>Tier: {lastResponse.tier}</div>
                    {lastResponse.tokens && (
                      <div>Tokens: {lastResponse.tokens.total} ({lastResponse.tokens.input} in / {lastResponse.tokens.output} out)</div>
                    )}
                    <div>Cost: ${lastResponse.cost.toFixed(6)}</div>
                    {lastResponse.webSearchUsed && <div className="text-blue-400">Web search used</div>}
                    {lastResponse.cached && <div className="text-green-400">Served from cache</div>}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>

        {/* Active Settings Indicators */}
        {(systemPrompt || webSearchEnabled || temperature !== 0.7) && (
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active:</span>
            {systemPrompt && (
              <Badge variant="outline" className="text-xs">
                System Prompt
              </Badge>
            )}
            {webSearchEnabled && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                <Globe className="w-3 h-3 mr-1" />
                Web Search
              </Badge>
            )}
            {temperature !== 0.7 && (
              <Badge variant="outline" className="text-xs">
                Temp: {temperature.toFixed(1)}
              </Badge>
            )}
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Mode Info Banner */}
            {!currentConversation?.messages.length && (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Start a conversation</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {getModeDescription(routingMode)}
                  </p>
                </div>
                
                {/* Quick Templates */}
                {templates && templates.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Or try a template:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {templates.slice(0, 4).map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTemplateSelect(template.prompt)}
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-8">
                  <div className={`p-3 rounded-lg border ${routingMode === "free" ? "border-green-500/50 bg-green-500/10" : "border-border"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-sm">Free</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Llama 3.1 8B - Fast & free</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${routingMode === "auto" ? "border-blue-500/50 bg-blue-500/10" : "border-border"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-sm">Standard</span>
                    </div>
                    <p className="text-xs text-muted-foreground">GPT-4o-mini - Best value</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-sm">Premium</span>
                    </div>
                    <p className="text-xs text-muted-foreground">GPT-4o, Claude - Best quality</p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {currentConversation?.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{message.content}</Streamdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {webSearchEnabled ? "Searching & generating..." : 
                       routingMode === "auto" ? "Selecting best model..." : "Generating..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              {/* Voice Input Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isListening ? "default" : "outline"}
                    size="icon"
                    onClick={toggleVoiceInput}
                    className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isListening ? "Stop listening" : "Voice input"}
                </TooltipContent>
              </Tooltip>

              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                disabled={isGenerating}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Your conversations are encrypted and stored locally on your device.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
