import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  getPopularPersonas,
  PERSONA_CATEGORIES,
  type Persona,
} from "@shared/personas";
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
import { isPuterAvailable, puterChatWithHistory } from "@/lib/puter";
import { useConversations } from "@/hooks/useConversations";
import { useSwipe } from "@/hooks/useSwipe";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { Streamdown } from "streamdown";
import { AskDiaLinks } from "@/components/AskDiaLinks";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
import {
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
  ChevronLeft,
  ChevronRight,
  Bot,
  Crown,
  Rocket,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
  Brain,
  Lightbulb,
  FileCode,
  Sliders,
  Copy,
  RefreshCw,
  Share2,
  Users,
  Sun,
  Moon,
  Sparkles,
  Star,
  Server,
  Code2,
  Workflow,
  Shield,
  Database,
  Pin,
  PinOff,
  Folder,
  FolderPlus,
  FolderOpen,
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

import type { Conversation, ChatFolder } from "@/lib/encryption";

// Conversation Item Component for sidebar
function ConversationItem({
  conv,
  isActive,
  sidebarCollapsed,
  onSelect,
  onDelete,
  onTogglePin,
  onMoveToFolder,
  folders,
}: {
  conv: Conversation;
  isActive: boolean;
  sidebarCollapsed: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onMoveToFolder: (folderId: string | undefined) => void;
  folders: ChatFolder[];
}) {
  return (
    <div
      className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
      } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
      onClick={onSelect}
      title={sidebarCollapsed ? (conv.title || "New conversation") : undefined}
    >
      {conv.pinned && !sidebarCollapsed && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
      {conv.usedUncensored && !sidebarCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Shield className="w-3 h-3 text-pink-400 flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Contains uncensored content</p>
          </TooltipContent>
        </Tooltip>
      )}
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      {!sidebarCollapsed && (
        <>
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
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(); }}>
                {conv.pinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                {conv.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              {folders.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Move to folder</DropdownMenuLabel>
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={(e) => { e.stopPropagation(); onMoveToFolder(folder.id); }}
                    >
                      <Folder className="w-4 h-4 mr-2" style={{ color: folder.color }} />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                  {conv.folderId && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToFolder(undefined); }}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Remove from folder
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

export default function Chat() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Mobile swipe gestures for sidebar
  useSwipe({
    onSwipeRight: () => setSidebarOpen(true),
    onSwipeLeft: () => setSidebarOpen(false),
    enabled: window.innerWidth < 1024, // Only on mobile/tablet
  });
  const [routingMode, setRoutingMode] = useState<RoutingMode>("auto");
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  
  // Advanced settings
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [includeMemories, setIncludeMemories] = useState(true);
  
  // New features: Vision, Deep Research, Response Format
  const [uploadedImages, setUploadedImages] = useState<{ url: string; filename: string }[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [responseFormat, setResponseFormat] = useState<"auto" | "detailed" | "concise" | "bullet" | "table">("auto");
  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  
  // Ollama local models
  const [ollamaEnabled, setOllamaEnabled] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  
  // Persona/Character selection
  const [selectedPersona, setSelectedPersona] = useState<{ name: string; systemPrompt: string } | null>(null);
  const popularPersonas = getPopularPersonas();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Uncensored mode and age verification
  const [isUncensoredMode, setIsUncensoredMode] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  
  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chofesh_sidebar_collapsed') === 'true';
    }
    return false;
  });
  
  // Navigation menu collapse state (for expandable nav section)
  const [navMenuExpanded, setNavMenuExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chofesh_nav_expanded') !== 'false'; // Default to expanded
    }
    return true;
  });
  
  const [lastResponse, setLastResponse] = useState<{
    model: string;
    modelName: string;
    tier: string;
    cost: number;
    cached: boolean;
    tokens?: { input: number; output: number; total: number };
    webSearchUsed?: boolean;
    autoSwitchedToUncensored?: boolean;
  } | null>(null);
  
  // Banner for auto-switched uncensored mode
  const [showUncensoredBanner, setShowUncensoredBanner] = useState(false);
  const [dismissedUncensoredBanner, setDismissedUncensoredBanner] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chofesh_dismissed_uncensored_banner') === 'true';
    }
    return false;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    conversations,
    currentConversation,
    folders,
    isLoading: conversationsLoading,
    createConversation,
    addMessage,
    deleteConversation,
    selectConversation,
    updateConversationModel,
    createFolder,
    deleteFolder,
    renameFolder,
    moveToFolder,
    togglePin,
    sortedConversations,
    markAsUncensored,
  } = useConversations(user?.openId);

  const { data: models } = trpc.models.listText.useQuery();
  const { data: templates } = trpc.templates.list.useQuery();
  const { data: myCharacters } = trpc.characters.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: publicCharacters } = trpc.characters.listPublic.useQuery();
  const characters = [...(myCharacters || []), ...(publicCharacters || []).filter(c => !myCharacters?.some(m => m.id === c.id))];
  const chatMutation = trpc.chat.send.useMutation();
  const createShareMutation = trpc.shareLinks.create.useMutation();
  const uploadImageMutation = trpc.chat.uploadImage.useMutation();

  // Initialize speech recognition with continuous mode for faster capture
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true; // Enable continuous listening
        recognitionRef.current.interimResults = true; // Show results as user speaks
        recognitionRef.current.lang = "en-US";
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          let final = "";
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }
          
          if (final) {
            // Append final transcript to existing input
            setFinalTranscript(prev => prev + final + " ");
            setInput(prev => (prev + final + " ").trim());
          }
          setInterimTranscript(interim);
        };
        
        recognitionRef.current.onerror = (event: Event) => {
          const errorEvent = event as SpeechRecognitionEvent & { error: string };
          // Don't show error for aborted or no-speech - these are normal
          if (errorEvent.error !== "aborted" && errorEvent.error !== "no-speech") {
            toast.error("Voice recognition error. Please try again.");
          }
          setIsListening(false);
          setInterimTranscript("");
        };
        
        recognitionRef.current.onend = () => {
          // Auto-restart if still in listening mode (for continuous capture)
          if (isListening && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Ignore if already started
              setIsListening(false);
            }
          } else {
            setIsListening(false);
            setInterimTranscript("");
          }
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isListening]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Load Ollama settings from localStorage and check connection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem('ollamaEnabled') === 'true';
      const endpoint = localStorage.getItem('ollamaEndpoint') || 'http://localhost:11434';
      setOllamaEnabled(enabled);
      setOllamaEndpoint(endpoint);
      
      if (enabled) {
        // Check Ollama connection and get models
        fetch(`${endpoint}/api/tags`)
          .then(res => res.json())
          .then(data => {
            const models = data.models?.map((m: { name: string }) => m.name) || [];
            setOllamaModels(models);
            setOllamaConnected(true);
          })
          .catch(() => {
            setOllamaConnected(false);
            setOllamaModels([]);
          });
      }
    }
  }, []);

  // Auto-scroll to bottom when messages change or when generating
  const scrollToBottom = useCallback(() => {
    // Try multiple scroll methods for reliability
    requestAnimationFrame(() => {
      // Method 1: Use scrollRef to find the viewport and scroll it
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
      // Method 2: Also try scrollIntoView on the anchor
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    });
  }, []);

  // Trigger scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages?.length, scrollToBottom]);

  // Trigger scroll during generation (for streaming)
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(scrollToBottom, 200);
      return () => clearInterval(interval);
    }
  }, [isGenerating, scrollToBottom]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentConversation?.id]);

  // Load selected character/persona from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("selectedCharacter");
    if (stored) {
      try {
        const character = JSON.parse(stored);
        setSelectedPersona({ name: character.name, systemPrompt: character.systemPrompt });
        setSystemPrompt(character.systemPrompt);
        sessionStorage.removeItem("selectedCharacter");
        toast.success(`Loaded persona: ${character.name}`);
      } catch (e) {
        console.error("Failed to parse selected character", e);
      }
    }
  }, []);

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
      setInterimTranscript("");
      setFinalTranscript("");
    } else {
      // Reset transcripts when starting new session
      setInterimTranscript("");
      setFinalTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening continuously... Click mic to stop");
      } catch (e) {
        toast.error("Could not start voice recognition");
      }
    }
  };

  // Handle Ask Dia Links follow-up questions
  const handleAskFollowUp = useCallback((question: string) => {
    setInput(question);
    // Focus the input
    const inputEl = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
    if (inputEl) {
      inputEl.focus();
    }
  }, []);

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

      // Check if using Puter.js model (runs in browser, no API key needed)
      const isPuterModel = selectedModel.startsWith('puter-');
      
      if (isPuterModel && isPuterAvailable()) {
        // Route to Puter.js (client-side)
        const puterModelId = selectedModel.replace('puter-', '');
        try {
          const puterResponse = await puterChatWithHistory(
            messages.map(m => ({ role: m.role, content: m.content })),
            { model: puterModelId, temperature }
          );
          
          const content = typeof puterResponse === 'string' ? puterResponse : String(puterResponse);
          addMessage(conv.id, "assistant", content);
          
          if (voiceOutputEnabled) {
            speakText(content);
          }
          
          setLastResponse({
            model: selectedModel,
            modelName: `${puterModelId.toUpperCase()} (Puter Free)`,
            tier: "free",
            cost: 0,
            cached: false,
            tokens: {
              input: 0,
              output: 0,
              total: 0,
            },
          });
          
          setIsGenerating(false);
          return;
        } catch (puterError) {
          console.error("Puter.js error:", puterError);
          toast.error("Puter.js request failed. Trying server-side model...");
          // Fall through to server-side handling
        }
      }

      // Check if using local Ollama model
      const isOllamaModel = selectedModel.startsWith('ollama:');
      
      if (isOllamaModel && ollamaEnabled && ollamaConnected) {
        // Route to local Ollama
        const ollamaModelName = selectedModel.replace('ollama:', '');
        const ollamaResponse = await fetch(`${ollamaEndpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModelName,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: false,
            options: {
              temperature,
              top_p: topP,
            },
          }),
        });
        
        if (!ollamaResponse.ok) {
          throw new Error('Ollama request failed');
        }
        
        const ollamaData = await ollamaResponse.json();
        const content = ollamaData.message?.content || 'No response from local model';
        
        addMessage(conv.id, "assistant", content);
        
        if (voiceOutputEnabled) {
          speakText(content);
        }
        
        setLastResponse({
          model: `ollama:${ollamaModelName}`,
          modelName: `${ollamaModelName} (Local)`,
          tier: "local",
          cost: 0,
          cached: false,
          tokens: {
            input: ollamaData.prompt_eval_count || 0,
            output: ollamaData.eval_count || 0,
            total: (ollamaData.prompt_eval_count || 0) + (ollamaData.eval_count || 0),
          },
        });
        
        setIsGenerating(false);
        return;
      }

      // Determine which model to use
      // If uncensored mode is ON, use the uncensored model
      const modelToUse = isUncensoredMode 
        ? "uncensored" 
        : (routingMode === "manual" ? selectedModel : undefined);

      const response = await chatMutation.mutateAsync({
        messages,
        model: modelToUse,
        routingMode,
        useCache: true,
        temperature,
        topP,
        webSearch: webSearchEnabled,
        showThinking,
        includeMemories,
        imageUrls: uploadedImages.length > 0 ? uploadedImages.map(img => img.url) : undefined,
        responseFormat: responseFormat !== "auto" ? responseFormat : undefined,
        deepResearch: deepResearchEnabled,
      });
      
      // Clear uploaded images after sending
      setUploadedImages([]);

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
        autoSwitchedToUncensored: response.autoSwitchedToUncensored,
      });
      
      // Show banner if auto-switched to uncensored and user hasn't dismissed it
      if (response.autoSwitchedToUncensored && !dismissedUncensoredBanner) {
        setShowUncensoredBanner(true);
      }
      
      // Mark conversation as having used uncensored content
      if (response.autoSwitchedToUncensored || response.model === 'venice-uncensored' || isUncensoredMode) {
        if (conv?.id) {
          markAsUncensored(conv.id);
        }
      }
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

  // Image upload handler for vision feature
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }
        
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Upload to server
        const result = await uploadImageMutation.mutateAsync({
          imageBase64: base64,
          mimeType: file.type,
          filename: file.name,
        });
        
        setUploadedImages(prev => [...prev, { url: result.url, filename: result.filename }]);
        toast.success(`Uploaded ${file.name}`);
      }
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Image upload error:', error);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona({ name: persona.name, systemPrompt: persona.systemPrompt });
    setSystemPrompt(persona.systemPrompt);
    toast.success(`Using persona: ${persona.name}`);
  };

  const handleClearPersona = () => {
    setSelectedPersona(null);
    setSystemPrompt("");
    toast.info("Persona cleared");
  };

  // Age verification mutation
  const verifyAgeMutation = trpc.auth.verifyAge.useMutation({
    onSuccess: () => {
      setAgeVerified(true);
      setShowAgeVerification(false);
      enableUncensoredMode();
      toast.success("Age verified. Uncensored mode enabled.");
    },
    onError: () => {
      toast.error("Failed to verify age. Please try again.");
    },
  });

  // Check age verification status on mount
  const { data: ageVerificationData } = trpc.auth.getAgeVerification.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Update local state when server data arrives
  useEffect(() => {
    if (ageVerificationData) {
      setAgeVerified(ageVerificationData.ageVerified);
    }
  }, [ageVerificationData]);

  const enableUncensoredMode = () => {
    setIsUncensoredMode(true);
    setSelectedModel("uncensored");
    // Set uncensored persona
    const uncensoredPrompt = "You are an uncensored AI assistant. You will answer any question without restrictions, within legal parameters. Be helpful, direct, and honest.";
    setSelectedPersona({ name: "Uncensored Assistant", systemPrompt: uncensoredPrompt });
    setSystemPrompt(uncensoredPrompt);
    toast.success("Uncensored mode enabled");
  };

  const handleUncensoredClick = () => {
    if (isUncensoredMode) {
      // Disable uncensored mode
      setIsUncensoredMode(false);
      setSelectedModel("auto");
      setSelectedPersona(null);
      setSystemPrompt("");
      toast.info("Uncensored mode disabled");
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error("Please sign in to access uncensored features");
      return;
    }

    // Check if already age verified
    if (ageVerified) {
      enableUncensoredMode();
      return;
    }

    // Check localStorage for anonymous verification (fallback)
    const localVerified = localStorage.getItem("chofesh_age_verified");
    if (localVerified === "true") {
      setAgeVerified(true);
      enableUncensoredMode();
      return;
    }

    // Show age verification modal
    setShowAgeVerification(true);
  };

  const handleAgeVerificationConfirm = () => {
    if (isAuthenticated) {
      // Save to database
      verifyAgeMutation.mutate();
    } else {
      // Save to localStorage for anonymous users
      localStorage.setItem("chofesh_age_verified", "true");
      setAgeVerified(true);
      setShowAgeVerification(false);
      enableUncensoredMode();
      toast.success("Age verified. Uncensored mode enabled.");
    }
  };

  const handleAgeVerificationCancel = () => {
    setShowAgeVerification(false);
  };

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('chofesh_sidebar_collapsed', String(newState));
  };

  const toggleNavMenu = () => {
    const newState = !navMenuExpanded;
    setNavMenuExpanded(newState);
    localStorage.setItem('chofesh_nav_expanded', String(newState));
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
    <div className="h-[100dvh] bg-background flex overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-all duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "lg:w-16" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`p-4 border-b border-border ${sidebarCollapsed ? 'px-2' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="flex items-center gap-2">
                <img src="/chofesh-logo-48.webp" alt="Chofesh" className="w-8 h-8 object-contain" />
                {!sidebarCollapsed && <span className="text-lg font-bold gradient-text">Chofesh</span>}
              </Link>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex"
                  onClick={toggleSidebarCollapse}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className={`flex-1 gap-2 ${sidebarCollapsed ? 'px-2' : ''}`} onClick={handleNewChat}>
                <Plus className="w-4 h-4" />
                {!sidebarCollapsed && "New Chat"}
              </Button>
              {!sidebarCollapsed && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="New Folder">
                      <FolderPlus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Folder</DialogTitle>
                      <DialogDescription>
                        Organize your chats into folders for easier access.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('folderName') as string;
                      if (name.trim()) {
                        createFolder(name.trim());
                        toast.success(`Folder "${name}" created`);
                        (e.target as HTMLFormElement).reset();
                      }
                    }} className="space-y-4">
                      <Input name="folderName" placeholder="Folder name" required />
                      <Button type="submit" className="w-full">Create Folder</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Conversations List with Folders and Pinning */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {/* Pinned Conversations */}
              {sortedConversations().filter(c => c.pinned).length > 0 && !sidebarCollapsed && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                    <Pin className="w-3 h-3" />
                    <span>Pinned</span>
                  </div>
                  {sortedConversations().filter(c => c.pinned).map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={currentConversation?.id === conv.id}
                      sidebarCollapsed={sidebarCollapsed}
                      onSelect={() => { selectConversation(conv.id); setSidebarOpen(false); }}
                      onDelete={() => handleDeleteConversation(conv.id)}
                      onTogglePin={() => togglePin(conv.id)}
                      onMoveToFolder={(folderId) => moveToFolder(conv.id, folderId)}
                      folders={folders}
                    />
                  ))}
                </div>
              )}

              {/* Folders */}
              {folders.map((folder) => {
                const folderConvs = sortedConversations().filter(c => c.folderId === folder.id && !c.pinned);
                if (folderConvs.length === 0 && sidebarCollapsed) return null;
                return (
                  <Collapsible key={folder.id} defaultOpen className="mb-2">
                    <CollapsibleTrigger asChild>
                      <button className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 text-sm ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{folder.name}</span>
                            <span className="text-xs text-muted-foreground">{folderConvs.length}</span>
                          </>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-2">
                      {folderConvs.map((conv) => (
                        <ConversationItem
                          key={conv.id}
                          conv={conv}
                          isActive={currentConversation?.id === conv.id}
                          sidebarCollapsed={sidebarCollapsed}
                          onSelect={() => { selectConversation(conv.id); setSidebarOpen(false); }}
                          onDelete={() => handleDeleteConversation(conv.id)}
                          onTogglePin={() => togglePin(conv.id)}
                          onMoveToFolder={(folderId) => moveToFolder(conv.id, folderId)}
                          folders={folders}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {/* Unfiled Conversations */}
              {sortedConversations().filter(c => !c.folderId && !c.pinned).length > 0 && (
                <div>
                  {!sidebarCollapsed && folders.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      <span>Chats</span>
                    </div>
                  )}
                  {sortedConversations().filter(c => !c.folderId && !c.pinned).map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={currentConversation?.id === conv.id}
                      sidebarCollapsed={sidebarCollapsed}
                      onSelect={() => { selectConversation(conv.id); setSidebarOpen(false); }}
                      onDelete={() => handleDeleteConversation(conv.id)}
                      onTogglePin={() => togglePin(conv.id)}
                      onMoveToFolder={(folderId) => moveToFolder(conv.id, folderId)}
                      folders={folders}
                    />
                  ))}
                </div>
              )}

              {conversations.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No conversations yet
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Collapsible Navigation Menu */}
          <div className={`border-t border-border ${sidebarCollapsed ? 'px-2 py-2' : 'p-2'}`}>
            {/* Navigation Toggle Header */}
            <button
              onClick={toggleNavMenu}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors text-sm text-muted-foreground ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
            >
              {!sidebarCollapsed && (
                <span className="font-medium">Tools & Features</span>
              )}
              {sidebarCollapsed ? (
                <Menu className="w-4 h-4" />
              ) : navMenuExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Collapsible Navigation Items */}
            {(navMenuExpanded || sidebarCollapsed) && (
              <div className={`space-y-1 ${!sidebarCollapsed ? 'mt-1' : ''}`}>
                <Link href="/characters">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="AI Characters">
                    <Users className="w-4 h-4" />
                    {!sidebarCollapsed && "AI Characters"}
                  </Button>
                </Link>
                <Link href="/image">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Generate Images">
                    <Image className="w-4 h-4" />
                    {!sidebarCollapsed && "Generate Images"}
                  </Button>
                </Link>
                <Link href="/documents">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Document Chat">
                    <MessageSquare className="w-4 h-4" />
                    {!sidebarCollapsed && "Document Chat"}
                  </Button>
                </Link>
                <Link href="/artifacts">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Artifacts">
                    <FileCode className="w-4 h-4" />
                    {!sidebarCollapsed && "Artifacts"}
                  </Button>
                </Link>
                <Link href="/code">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Code Workspace">
                    <Code2 className="w-4 h-4" />
                    {!sidebarCollapsed && "Code Workspace"}
                  </Button>
                </Link>
                <Link href="/workflows">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Workflows">
                    <Workflow className="w-4 h-4" />
                    {!sidebarCollapsed && "Workflows"}
                  </Button>
                </Link>
                <Link href="/code-review">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Code Review">
                    <Shield className="w-4 h-4" />
                    {!sidebarCollapsed && "Code Review"}
                  </Button>
                </Link>
                <Link href="/knowledge">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Knowledge Base">
                    <Database className="w-4 h-4" />
                    {!sidebarCollapsed && "Knowledge Base"}
                  </Button>
                </Link>
                <Link href="/settings#ollama">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Local Models">
                    <Server className="w-4 h-4" />
                    {!sidebarCollapsed && "Local Models"}
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} title="Settings">
                    <Settings className="w-4 h-4" />
                    {!sidebarCollapsed && "Settings"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header */}
        <header className="h-14 min-h-14 shrink-0 border-b border-border flex items-center justify-between px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold truncate text-sm sm:text-base max-w-[120px] sm:max-w-none">
              {currentConversation?.title || "New Chat"}
            </h1>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            
            {/* Advanced Settings Button */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-2">
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
                        Include instant answers from DuckDuckGo
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

                  {/* Thinking Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Thinking Mode
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Show AI reasoning process before answers
                      </p>
                    </div>
                    <Switch
                      checked={showThinking}
                      onCheckedChange={setShowThinking}
                    />
                  </div>

                  {/* Memory Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-500" />
                        Use Memory
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Include your saved memories in context
                      </p>
                    </div>
                    <Switch
                      checked={includeMemories}
                      onCheckedChange={setIncludeMemories}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Routing Mode Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-2">
                  {routingMode === "auto" && <Zap className="w-4 h-4 text-primary" />}
                  {routingMode === "free" && <Zap className="w-4 h-4 text-green-400" />}
                  {routingMode === "manual" && <Settings className="w-4 h-4" />}
                  <span className="hidden sm:inline">
                    {routingMode === "auto" ? "Auto" : routingMode === "free" ? "Free" : "Manual"}
                  </span>
                  <ChevronDown className="w-3 h-3 hidden sm:block" />
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
                <SelectTrigger className="w-[100px] sm:w-[180px] text-xs sm:text-sm">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {/* Cloud models */}
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        {getTierIcon(model.tier)}
                        <span>{model.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {/* Local Ollama models */}
                  {ollamaEnabled && ollamaConnected && ollamaModels.length > 0 && (
                    <>
                      <SelectItem disabled value="__ollama_divider__">
                        <span className="text-xs text-muted-foreground">── Local Models ──</span>
                      </SelectItem>
                      {ollamaModels.map((model) => (
                        <SelectItem key={`ollama:${model}`} value={`ollama:${model}`}>
                          <div className="flex items-center gap-2">
                            <Server className="w-3 h-3 text-green-500" />
                            <span>{model}</span>
                            <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-500 border-green-500/30 ml-1">
                              Local
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}

            {/* Copy Conversation - hidden on mobile */}
            {currentConversation?.messages.length ? (
              <div className="hidden sm:flex items-center gap-1">
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
              </div>
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
        {(selectedPersona || systemPrompt || webSearchEnabled || showThinking || !includeMemories || temperature !== 0.7) && (
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active:</span>
            {selectedPersona && (
              <Badge 
                variant="outline" 
                className="text-xs bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-primary/20"
                onClick={handleClearPersona}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {selectedPersona.name}
                <span className="ml-1 opacity-60">×</span>
              </Badge>
            )}
            {systemPrompt && !selectedPersona && (
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
            {showThinking && (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                <Lightbulb className="w-3 h-3 mr-1" />
                Thinking Mode
              </Badge>
            )}
            {!includeMemories && (
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                <Brain className="w-3 h-3 mr-1" />
                Memory Off
              </Badge>
            )}
          </div>
        )}

        {/* Uncensored Mode Auto-Switch Banner */}
        {showUncensoredBanner && (
          <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-pink-500/20 px-4 py-2">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-pink-400" />
                <span className="text-pink-200">Using enhanced model for unrestricted response</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-pink-300 hover:text-pink-100 hover:bg-pink-500/20"
                onClick={() => {
                  setShowUncensoredBanner(false);
                  setDismissedUncensoredBanner(true);
                  localStorage.setItem('chofesh_dismissed_uncensored_banner', 'true');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-6 p-4">
            {/* Mode Info Banner */}
            {!currentConversation?.messages.length && (
              <div className="text-center py-8 space-y-6 animate-in fade-in-50 duration-500">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto shadow-lg shadow-primary/10">
                  <img src="/chofesh-logo-48.webp" alt="Chofesh AI Logo" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Chofesh AI</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {getModeDescription(routingMode)}
                  </p>
                </div>
                
                {/* Quick Start Suggestions */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                    {[
                      { icon: "💡", text: "Explain quantum computing simply" },
                      { icon: "✍️", text: "Help me write a professional email" },
                      { icon: "🔧", text: "Debug this code for me" },
                      { icon: "📊", text: "Analyze the pros and cons of..." },
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion.text)}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left text-sm group"
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
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

                {/* Quick Persona Selector */}
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Quick start with a persona:</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularPersonas.slice(0, 5).map((persona) => (
                      <Button
                        key={persona.id}
                        variant={selectedPersona?.name === persona.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectPersona(persona)}
                        className="text-xs gap-1"
                      >
                        <span>{persona.avatarEmoji}</span>
                        {persona.name}
                      </Button>
                    ))}
                    <Link href="/characters">
                      <Button variant="ghost" size="sm" className="text-xs gap-1">
                        <Users className="w-3 h-3" />
                        More
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Tier Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8">
                  <button
                    onClick={() => setRoutingMode("free")}
                    className={`p-3 rounded-lg border text-left transition-all hover:scale-105 cursor-pointer ${routingMode === "free" ? "border-green-500/50 bg-green-500/10" : "border-border hover:border-green-500/30 hover:bg-green-500/5"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-sm">Free</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Llama 3.1 8B - Fast & free</p>
                  </button>
                  <button
                    onClick={() => setRoutingMode("auto")}
                    className={`p-3 rounded-lg border text-left transition-all hover:scale-105 cursor-pointer ${routingMode === "auto" ? "border-blue-500/50 bg-blue-500/10" : "border-border hover:border-blue-500/30 hover:bg-blue-500/5"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-sm">Standard</span>
                    </div>
                    <p className="text-xs text-muted-foreground">GPT-4o-mini - Best value</p>
                  </button>
                  <button
                    onClick={() => setRoutingMode("manual")}
                    className={`p-3 rounded-lg border text-left transition-all hover:scale-105 cursor-pointer ${routingMode === "manual" ? "border-yellow-500/50 bg-yellow-500/10" : "border-border hover:border-yellow-500/30 hover:bg-yellow-500/5"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-sm">Premium</span>
                    </div>
                    <p className="text-xs text-muted-foreground">GPT-4o, Claude - Best quality</p>
                  </button>
                  <button
                    onClick={handleUncensoredClick}
                    className={`p-3 rounded-lg border text-left transition-all hover:scale-105 cursor-pointer ${isUncensoredMode ? "border-rose-500/50 bg-rose-500/10" : "border-border hover:border-rose-500/30 hover:bg-rose-500/5"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-rose-400" />
                      <span className="font-medium text-sm">Uncensored</span>
                    </div>
                    <p className="text-xs text-muted-foreground">No content filters</p>
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {currentConversation?.messages.map((message, index) => (
              <div
                key={index}
                className={`group flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {/* Render thinking blocks if present */}
                        {message.content.includes('<think>') ? (
                          <>
                            {/* Extract and render thinking block */}
                            {(() => {
                              const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/);
                              const thinkingContent = thinkMatch ? thinkMatch[1].trim() : '';
                              const mainContent = message.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
                              
                              return (
                                <>
                                  {thinkingContent && (
                                    <Collapsible defaultOpen={false}>
                                      <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-3 w-full">
                                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                                        <span>View reasoning process</span>
                                        <ChevronDown className="w-3 h-3 ml-auto" />
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-sm text-muted-foreground italic">
                                          <Streamdown>{thinkingContent}</Streamdown>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}
                                  <AskDiaLinks content={mainContent} onAskFollowUp={handleAskFollowUp} />
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          <AskDiaLinks content={message.content} onAskFollowUp={handleAskFollowUp} />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {/* Message action buttons - show on hover */}
                  <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            toast.success("Copied to clipboard");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy message</TooltipContent>
                    </Tooltip>
                    {message.role === "assistant" && index === currentConversation.messages.length - 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              // Find the last user message and regenerate
                              const lastUserMsgIndex = currentConversation.messages.findLastIndex(m => m.role === "user");
                              if (lastUserMsgIndex >= 0) {
                                const lastUserMsg = currentConversation.messages[lastUserMsgIndex].content;
                                // Set input to last user message and trigger send
                                setInput(lastUserMsg);
                                toast.info("Regenerating response...");
                              }
                            }}
                            disabled={isGenerating}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate response</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/chofesh-logo-48.webp" 
                      alt="AI generating response" 
                      className="w-5 h-5 object-contain animate-pulse" 
                    />
                    <span className="text-sm text-muted-foreground">
                      {routingMode === "auto" ? "Selecting best model..." : "Generating..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor - always at bottom */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto">
            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="w-16 h-16 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => removeUploadedImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            

            
            <div className="flex gap-2 items-end">
              {/* Hidden file input for images */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Chat Settings Popover */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative"
                  >
                    <Sliders className="w-4 h-4" />
                    {(deepResearchEnabled || isUncensoredMode || responseFormat !== "auto") && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 p-3">
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground mb-2">Chat Settings</DropdownMenuLabel>
                  
                  {/* Response Format */}
                  <div className="mb-3">
                    <Label className="text-xs mb-1.5 block">Response Format</Label>
                    <Select value={responseFormat} onValueChange={(v) => setResponseFormat(v as typeof responseFormat)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="bullet">Bullet Points</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Deep Research Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Deep Research</span>
                    </div>
                    <Switch
                      checked={deepResearchEnabled}
                      onCheckedChange={setDeepResearchEnabled}
                    />
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Uncensored Mode Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-rose-500" />
                      <span className="text-sm">Uncensored Mode</span>
                    </div>
                    {!ageVerified ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAgeVerification(true)}
                        className="h-7 text-xs border-rose-500/50 text-rose-500 hover:bg-rose-500/10"
                      >
                        Verify 18+
                      </Button>
                    ) : (
                      <Switch
                        checked={isUncensoredMode}
                        onCheckedChange={(checked) => {
                          setIsUncensoredMode(checked);
                          if (checked) {
                            setSelectedModel("uncensored");
                            toast.success("Uncensored mode enabled");
                          } else {
                            setSelectedModel("auto");
                            toast.info("Uncensored mode disabled");
                          }
                        }}
                      />
                    )}
                  </div>
                  
                  {isUncensoredMode && (
                    <p className="text-xs text-rose-500/70 mt-1">Content filters disabled</p>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Input container with image/voice buttons inside */}
              <div className="flex-1 relative flex items-end border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {/* Image and Voice buttons inside the input area */}
                <div className="flex items-center gap-1 pl-2 pb-2 self-end">
                  {/* Image Upload Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploadingImage || isGenerating}
                        className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Image className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Upload image for AI to analyze
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Voice Input Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`p-1.5 rounded transition-colors ${isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        {isListening ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isListening ? "Stop listening (continuous mode)" : "Voice input (continuous)"}
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Textarea */}
                <Textarea
                  ref={inputRef}
                  value={isListening && interimTranscript ? input + interimTranscript : input}
                  onChange={(e) => !isListening && setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={uploadedImages.length > 0 ? "Ask about the image..." : (isListening ? "Listening... speak now" : "Type your message...")}
                  disabled={isGenerating || isListening}
                  className={`flex-1 min-h-[44px] max-h-[200px] resize-none pr-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 focus:min-h-[80px] ${isListening ? "bg-red-500/10" : ""}`}
                  rows={1}
                />
                {/* Character count */}
                <span className={`absolute bottom-2 right-2 text-xs transition-colors ${input.length > 4000 ? "text-destructive" : "text-muted-foreground/50"}`}>
                  {input.length > 0 && `${input.length.toLocaleString()}`}
                </span>
              </div>
              <Button 
                onClick={handleSend} 
                disabled={(!input.trim() && uploadedImages.length === 0) || isGenerating}
                className="self-end h-[44px]"
              >
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
      
      {/* Age Verification Modal */}
      <AgeVerificationModal
        open={showAgeVerification}
        onConfirm={handleAgeVerificationConfirm}
        onCancel={handleAgeVerificationCancel}
      />
    </div>
  );
}
