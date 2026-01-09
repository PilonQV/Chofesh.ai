import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Settings as SettingsIcon,
  Shield,
  BarChart3,
  Sun,
  Moon,
  Palette,
  CreditCard,
  Zap,
  Crown,
  Sparkles,
  Clock,
  Brain,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  ImageIcon,
  Lock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  User,
  Bell,
  Database,
  Sliders,
  MessageSquare,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

type ApiProvider = "openai" | "anthropic" | "google" | "groq";

interface ApiKeyDisplay {
  id: number;
  provider: ApiProvider;
  keyHint: string | null;
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
}

// Settings sections
type SettingsSection = "general" | "ai" | "privacy" | "account";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  
  // API Keys state
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState<ApiProvider>("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  
  // Uncensored mode state
  const [ageVerifyOpen, setAgeVerifyOpen] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  
  // Response format state
  const [responseFormat, setResponseFormat] = useState<string>("auto");
  
  const utils = trpc.useUtils();
  
  // NSFW status query
  const { data: nsfwStatus, isLoading: nsfwLoading } = trpc.nsfw.getStatus.useQuery(undefined, {
    enabled: !!user,
  });
  
  // API Keys query
  const { data: apiKeys, isLoading: keysLoading } = trpc.apiKeys.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Mutations
  const verifyAgeMutation = trpc.nsfw.verifyAge.useMutation({
    onSuccess: () => {
      toast.success("Age verified! Uncensored mode unlocked for chat and images.");
      setAgeVerifyOpen(false);
      setConfirmAge(false);
      utils.nsfw.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify age");
    },
  });
  
  const addKeyMutation = trpc.apiKeys.add.useMutation({
    onSuccess: () => {
      toast.success("API key added successfully");
      setShowAddKey(false);
      setNewKeyValue("");
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add API key");
    },
  });
  
  const deleteKeyMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API key deleted");
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete API key");
    },
  });

  // Handle URL hash for direct navigation
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#nsfw-section" || hash === "#uncensored") {
      setActiveSection("ai");
    } else if (hash === "#api-keys") {
      setActiveSection("privacy");
    } else if (hash === "#account") {
      setActiveSection("account");
    }
  }, []);

  const sections = [
    { id: "general" as const, label: "General", icon: SettingsIcon },
    { id: "ai" as const, label: "AI Settings", icon: Brain },
    { id: "privacy" as const, label: "Privacy & Data", icon: Shield },
    { id: "account" as const, label: "Account", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto py-6 px-4">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <nav className="w-48 shrink-0">
            <div className="sticky top-20 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* General Section */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">General</h2>
                  <p className="text-sm text-muted-foreground">
                    Customize your app experience
                  </p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {/* Appearance */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Appearance</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose light or dark theme
                        </p>
                      </div>
                      <Select value={theme} onValueChange={() => toggleTheme?.()}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border-t pt-6">
                      {/* Language - placeholder for future */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Language</Label>
                          <p className="text-sm text-muted-foreground">
                            Interface language
                          </p>
                        </div>
                        <Select defaultValue="en">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Settings Section */}
            {activeSection === "ai" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">AI Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure AI behavior and content preferences
                  </p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {/* Response Format */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Response Format</Label>
                        <p className="text-sm text-muted-foreground">
                          How AI formats its responses
                        </p>
                      </div>
                      <Select value={responseFormat} onValueChange={setResponseFormat}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="concise">Concise</SelectItem>
                          <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border-t pt-6">
                      {/* Deep Research Mode */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Deep Research Mode
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Enable comprehensive research for complex queries
                          </p>
                        </div>
                        <Button variant="outline" disabled>
                          Disabled
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-6" id="nsfw-section">
                      {/* Uncensored Mode - CONSOLIDATED */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base flex items-center gap-2">
                              <Shield className="h-4 w-4 text-pink-500" />
                              Uncensored Mode
                              {nsfwStatus?.ageVerified && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              )}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Access uncensored AI chat and image generation
                            </p>
                          </div>
                          {nsfwLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : nsfwStatus?.ageVerified ? (
                            <div className="flex items-center gap-2 text-green-500">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="text-sm font-medium">Enabled</span>
                            </div>
                          ) : (
                            <Dialog open={ageVerifyOpen} onOpenChange={setAgeVerifyOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-pink-500/50 text-pink-500 hover:bg-pink-500/10">
                                  <Lock className="w-4 h-4 mr-2" />
                                  Enable
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-pink-500" />
                                    Quick Age Check
                                  </DialogTitle>
                                  <DialogDescription>
                                    One-time verification to unlock all uncensored features
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                  <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                    <p className="text-sm font-medium text-pink-500 mb-2">
                                      This unlocks:
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      <li className="flex items-center gap-2">
                                        <MessageSquare className="h-3 w-3" />
                                        Uncensored AI chat responses
                                      </li>
                                      <li className="flex items-center gap-2">
                                        <ImageIcon className="h-3 w-3" />
                                        Uncensored image generation
                                      </li>
                                      <li className="flex items-center gap-2">
                                        <Sparkles className="h-3 w-3" />
                                        Premium adult content models
                                      </li>
                                    </ul>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id="confirm-age"
                                      checked={confirmAge}
                                      onChange={(e) => setConfirmAge(e.target.checked)}
                                      className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <label htmlFor="confirm-age" className="text-sm">
                                      I confirm I'm 18 years or older
                                    </label>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setAgeVerifyOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => verifyAgeMutation.mutate()}
                                    disabled={!confirmAge || verifyAgeMutation.isPending}
                                    className="bg-pink-500 hover:bg-pink-600 text-white"
                                  >
                                    {verifyAgeMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                    )}
                                    Enable Uncensored Mode
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>

                        {/* Show what's included when enabled */}
                        {nsfwStatus?.ageVerified && (
                          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Uncensored chat</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Adult image generation</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Premium models (Lustify)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Private generation</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Images: 3 credits each (or 10 for 4 variations)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Privacy & Data Section */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Privacy & Data</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your API keys and data preferences
                  </p>
                </div>

                {/* API Keys */}
                <Card id="api-keys">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Keys (BYOK)
                    </CardTitle>
                    <CardDescription>
                      Use your own API keys for AI providers. Keys are encrypted and stored securely.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Existing keys */}
                    {keysLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : apiKeys && apiKeys.length > 0 ? (
                      <div className="space-y-2">
                        {apiKeys.map((key: ApiKeyDisplay) => (
                          <div
                            key={key.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${key.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                              <div>
                                <p className="font-medium capitalize">{key.provider}</p>
                                <p className="text-xs text-muted-foreground">
                                  {key.keyHint || "••••••••"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteKeyMutation.mutate({ id: key.id })}
                              disabled={deleteKeyMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No API keys added yet
                      </p>
                    )}

                    {/* Add new key */}
                    {showAddKey ? (
                      <div className="space-y-3 p-4 rounded-lg border">
                        <Select value={newKeyProvider} onValueChange={(v) => setNewKeyProvider(v as ApiProvider)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="groq">Groq</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="password"
                          placeholder="Enter API key"
                          value={newKeyValue}
                          onChange={(e) => setNewKeyValue(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddKey(false);
                              setNewKeyValue("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => addKeyMutation.mutate({ provider: newKeyProvider, apiKey: newKeyValue })}
                            disabled={!newKeyValue || addKeyMutation.isPending}
                          >
                            {addKeyMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Add Key
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => setShowAddKey(true)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add API Key
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Data & Privacy Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Your Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Conversations stored locally</p>
                        <p className="text-sm text-muted-foreground">
                          Your chats are encrypted and saved on your device
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">No data collection</p>
                        <p className="text-sm text-muted-foreground">
                          We don't track or sell your conversations
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account Section */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Account</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your account and credits
                  </p>
                </div>

                {/* User Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user?.name || user?.email || "User"}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Credits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Credits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Balance</span>
                      <span className="font-semibold">View in Credits page</span>
                    </div>
                    <Link href="/credits">
                      <Button className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Credits
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/usage">
                      <Button variant="outline" className="w-full">
                        View Usage Dashboard
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Logout */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        await logout();
                        setLocation("/");
                      }}
                    >
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
