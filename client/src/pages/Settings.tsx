import { useAuth } from "@/_core/hooks/useAuth";
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
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Sparkles,
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
} from "lucide-react";
import { toast } from "sonner";

type ApiProvider = "openai" | "anthropic" | "google";

interface ApiKeyDisplay {
  id: number;
  provider: ApiProvider;
  keyHint: string | null;
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
}

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState<ApiProvider>("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);

  const utils = trpc.useUtils();
  
  const { data: apiKeys, isLoading: keysLoading } = trpc.apiKeys.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addKeyMutation = trpc.apiKeys.add.useMutation({
    onSuccess: () => {
      toast.success("API key added successfully");
      setAddKeyOpen(false);
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

  const toggleKeyMutation = trpc.apiKeys.toggle.useMutation({
    onSuccess: () => {
      utils.apiKeys.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update API key");
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleAddKey = async () => {
    if (!newKeyValue.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    // Basic validation
    if (newKeyProvider === "openai" && !newKeyValue.startsWith("sk-")) {
      toast.error("OpenAI API keys should start with 'sk-'");
      return;
    }

    if (newKeyProvider === "anthropic" && !newKeyValue.startsWith("sk-ant-")) {
      toast.error("Anthropic API keys should start with 'sk-ant-'");
      return;
    }

    setValidating(true);
    try {
      await addKeyMutation.mutateAsync({
        provider: newKeyProvider,
        apiKey: newKeyValue,
      });
    } finally {
      setValidating(false);
    }
  };

  const getProviderName = (provider: ApiProvider) => {
    switch (provider) {
      case "openai":
        return "OpenAI";
      case "anthropic":
        return "Anthropic";
      case "google":
        return "Google AI";
      default:
        return provider;
    }
  };

  const getProviderColor = (provider: ApiProvider) => {
    switch (provider) {
      case "openai":
        return "bg-green-500/20 text-green-500";
      case "anthropic":
        return "bg-orange-500/20 text-orange-500";
      case "google":
        return "bg-blue-500/20 text-blue-500";
      default:
        return "bg-primary/20 text-primary";
    }
  };

  if (authLoading || keysLoading) {
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
                <SettingsIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Settings</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/usage">
              <Button variant="ghost" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Usage
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* API Keys Section */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Add your own API keys to use your preferred AI providers. Your keys are encrypted and stored securely.
                  </CardDescription>
                </div>
                <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add API Key</DialogTitle>
                      <DialogDescription>
                        Add your API key to use your own account with AI providers.
                        Your key will be encrypted before storage.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select
                          value={newKeyProvider}
                          onValueChange={(v) => setNewKeyProvider(v as ApiProvider)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="google">Google AI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="relative">
                          <Input
                            type={showKey ? "text" : "password"}
                            value={newKeyValue}
                            onChange={(e) => setNewKeyValue(e.target.value)}
                            placeholder={
                              newKeyProvider === "openai"
                                ? "sk-..."
                                : newKeyProvider === "anthropic"
                                ? "sk-ant-..."
                                : "AIza..."
                            }
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowKey(!showKey)}
                          >
                            {showKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {newKeyProvider === "openai" && (
                            <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Dashboard</a></>
                          )}
                          {newKeyProvider === "anthropic" && (
                            <>Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Anthropic Console</a></>
                          )}
                          {newKeyProvider === "google" && (
                            <>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></>
                          )}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddKeyOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddKey} disabled={validating || addKeyMutation.isPending}>
                        {validating || addKeyMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Add Key
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys && apiKeys.length > 0 ? (
                <div className="space-y-3">
                  {apiKeys.map((key: ApiKeyDisplay) => (
                    <div
                      key={key.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        key.isActive ? "border-border" : "border-border/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProviderColor(key.provider)}`}>
                          {getProviderName(key.provider)}
                        </div>
                        <div>
                          <div className="font-mono text-sm">
                            ••••••••{key.keyHint}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Added {new Date(key.createdAt).toLocaleDateString()}
                            {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyMutation.mutate({ id: key.id, isActive: !key.isActive })}
                        >
                          {key.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteKeyMutation.mutate({ id: key.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No API Keys</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your own API keys to use your preferred AI providers and control costs.
                  </p>
                  <Button onClick={() => setAddKeyOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Your First Key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                About BYOK (Bring Your Own Key)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Benefits
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pay only for what you use</li>
                    <li>• Access to all model versions</li>
                    <li>• Higher rate limits</li>
                    <li>• Direct relationship with provider</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Security
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Keys encrypted with AES-256</li>
                    <li>• Never stored in plain text</li>
                    <li>• Only decrypted for API calls</li>
                    <li>• Delete anytime</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-500 mb-1">Important</h4>
                    <p className="text-sm text-muted-foreground">
                      When using your own API keys, you are responsible for any charges incurred. 
                      We recommend setting up usage limits and billing alerts with your API provider.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
