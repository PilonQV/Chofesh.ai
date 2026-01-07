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

// NSFW Subscription Section Component
function NsfwSubscriptionSection() {
  const { user } = useAuth();
  const [ageVerifyOpen, setAgeVerifyOpen] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  
  const utils = trpc.useUtils();
  
  const { data: nsfwStatus, isLoading: statusLoading } = trpc.nsfw.getStatus.useQuery(undefined, {
    enabled: !!user,
  });
  
  const verifyAgeMutation = trpc.nsfw.verifyAge.useMutation({
    onSuccess: () => {
      toast.success("Age verified successfully");
      setAgeVerifyOpen(false);
      setConfirmAge(false);
      utils.nsfw.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify age");
    },
  });
  
  const createCheckoutMutation = trpc.nsfw.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout");
    },
  });
  
  const cancelSubscriptionMutation = trpc.nsfw.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription will be canceled at the end of the billing period");
      utils.nsfw.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });
  
  if (statusLoading) {
    return (
      <Card className="mb-6 border-pink-500/20">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6 border-pink-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-pink-500" />
          Uncensored Image Generation
          <span className="text-xs bg-pink-500/20 text-pink-500 px-2 py-0.5 rounded-full ml-2">
            Add-on
          </span>
        </CardTitle>
        <CardDescription>
          Generate uncensored images with premium AI. Requires age verification (18+).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Verification Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              nsfwStatus?.ageVerified 
                ? "bg-green-500/20 text-green-500" 
                : "bg-yellow-500/20 text-yellow-500"
            }`}>
              {nsfwStatus?.ageVerified ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-medium">
                Age Verification: {nsfwStatus?.ageVerified ? "Verified (18+)" : "Not Verified"}
              </p>
              <p className="text-sm text-muted-foreground">
                {nsfwStatus?.ageVerified 
                  ? "You can access uncensored content" 
                  : "Required to access adult content"}
              </p>
            </div>
          </div>
          {!nsfwStatus?.ageVerified && (
            <Dialog open={ageVerifyOpen} onOpenChange={setAgeVerifyOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                  <Lock className="w-4 h-4 mr-2" />
                  Verify Age
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-yellow-500" />
                    Age Verification Required
                  </DialogTitle>
                  <DialogDescription>
                    You must be 18 years or older to access uncensored content.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-500">
                      By verifying your age, you confirm that:
                    </p>
                    <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                      <li>• You are at least 18 years old</li>
                      <li>• You understand this content is for adults only</li>
                      <li>• You accept responsibility for accessing adult content</li>
                      <li>• You comply with your local laws regarding adult content</li>
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
                      I confirm I am 18 years or older
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
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    {verifyAgeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Verify I'm 18+
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Uncensored Subscription Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              nsfwStatus?.hasNsfwSubscription 
                ? "bg-pink-500/20 text-pink-500" 
                : "bg-muted text-muted-foreground"
            }`}>
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">
                Uncensored Add-on: {nsfwStatus?.hasNsfwSubscription ? "Active" : "Not Subscribed"}
              </p>
              <p className="text-sm text-muted-foreground">
                {nsfwStatus?.hasNsfwSubscription 
                  ? `${nsfwStatus.nsfwImagesUsed}/${nsfwStatus.nsfwImagesLimit} images used this month` 
                  : "$7.99/month • 100 images/month"}
              </p>
            </div>
          </div>
          {nsfwStatus?.hasNsfwSubscription ? (
            <Button 
              variant="outline" 
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={() => cancelSubscriptionMutation.mutate()}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancel
            </Button>
          ) : (
            <Button 
              className="bg-pink-500 hover:bg-pink-600 text-white"
              onClick={() => createCheckoutMutation.mutate()}
              disabled={!nsfwStatus?.ageVerified || createCheckoutMutation.isPending}
            >
              {createCheckoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Subscribe $7.99/mo
            </Button>
          )}
        </div>
        
        {/* Usage Progress */}
        {nsfwStatus?.hasNsfwSubscription && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Usage</span>
              <span className="font-medium">
                {nsfwStatus.nsfwImagesUsed} / {nsfwStatus.nsfwImagesLimit} images
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 transition-all duration-300"
                style={{ 
                  width: `${Math.min((nsfwStatus.nsfwImagesUsed / nsfwStatus.nsfwImagesLimit) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Resets at the start of each billing cycle
            </p>
          </div>
        )}
        
        {/* Features */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-pink-500">
              <Sparkles className="w-4 h-4" />
              What's Included
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 100 uncensored images per month</li>
              <li>• Lustify SDXL & v7 models</li>
              <li>• Multiple aspect ratios</li>
              <li>• Private generation (no logging)</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Privacy & Safety
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Premium uncensored image models</li>
              <li>• Private - no prompts stored externally</li>
              <li>• Age verification required</li>
              <li>• Cancel anytime</li>
            </ul>
          </div>
        </div>
        
        {/* Warning */}
        <div className="p-4 rounded-lg border border-pink-500/20 bg-pink-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-pink-500 mb-1">Content Guidelines</h4>
              <p className="text-sm text-muted-foreground">
                Uncensored content is for personal use only. You are responsible for ensuring 
                your use complies with local laws. Generated content must not depict minors 
                or non-consensual scenarios.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState<ApiProvider>("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  
  // Ollama local model settings
  const [ollamaEndpoint, setOllamaEndpoint] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ollamaEndpoint') || 'http://localhost:11434';
    }
    return 'http://localhost:11434';
  });
  const [ollamaEnabled, setOllamaEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ollamaEnabled') === 'true';
    }
    return false;
  });
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('disconnected');
  const [checkingOllama, setCheckingOllama] = useState(false);

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

  // Check Ollama connection and get available models
  const checkOllamaConnection = async () => {
    setCheckingOllama(true);
    setOllamaStatus('checking');
    try {
      // Try to connect to Ollama API
      const response = await fetch(`${ollamaEndpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map((m: { name: string }) => m.name) || [];
        setOllamaModels(models);
        setOllamaStatus('connected');
        toast.success(`Connected to Ollama! Found ${models.length} model(s)`);
      } else {
        setOllamaStatus('disconnected');
        setOllamaModels([]);
        toast.error('Could not connect to Ollama');
      }
    } catch (error) {
      setOllamaStatus('disconnected');
      setOllamaModels([]);
      toast.error('Ollama not reachable. Make sure it\'s running locally.');
    } finally {
      setCheckingOllama(false);
    }
  };

  // Save Ollama settings to localStorage
  const saveOllamaSettings = () => {
    localStorage.setItem('ollamaEndpoint', ollamaEndpoint);
    localStorage.setItem('ollamaEnabled', ollamaEnabled.toString());
    toast.success('Ollama settings saved');
  };

  // Check Ollama on mount if enabled
  useEffect(() => {
    if (ollamaEnabled) {
      checkOllamaConnection();
    }
  }, []);

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

    if (newKeyProvider === "groq" && !newKeyValue.startsWith("gsk_")) {
      toast.error("Groq API keys should start with 'gsk_'");
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
      case "groq":
        return "Groq (Free Tier)";
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
      case "groq":
        return "bg-purple-500/20 text-purple-500";
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
            <Link href="/memory">
              <Button variant="ghost" size="sm" className="gap-2">
                <Brain className="w-4 h-4" />
                Memory
              </Button>
            </Link>
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
          {/* Subscription Section */}
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and usage limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    user?.subscriptionTier === 'unlimited' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                    user?.subscriptionTier === 'pro' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                    user?.subscriptionTier === 'starter' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    'bg-muted'
                  }`}>
                    {user?.subscriptionTier === 'unlimited' ? <Crown className="w-5 h-5 text-white" /> :
                     user?.subscriptionTier === 'pro' ? <Zap className="w-5 h-5 text-white" /> :
                     user?.subscriptionTier === 'starter' ? <Sparkles className="w-5 h-5 text-white" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">
                      {user?.subscriptionTier || 'Free'} Plan
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.subscriptionTier === 'unlimited' ? 'Unlimited queries per day' :
                       user?.subscriptionTier === 'pro' ? '500 queries per day' :
                       user?.subscriptionTier === 'starter' ? '100 queries per day' :
                       '25 queries per day'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {user?.subscriptionTier === 'unlimited' ? '$27.99' :
                     user?.subscriptionTier === 'pro' ? '$14.99' :
                     user?.subscriptionTier === 'starter' ? '$4.99' :
                     'Free'}
                    {user?.subscriptionTier && user.subscriptionTier !== 'free' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                  </p>
                </div>
              </div>

              {/* Upgrade Options */}
              {(!user?.subscriptionTier || user.subscriptionTier === 'free') && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-green-500/30 hover:border-green-500/50 transition-colors cursor-pointer" onClick={() => window.open('/api/stripe/checkout?tier=starter', '_blank')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        <span className="font-semibold">Starter</span>
                      </div>
                      <p className="text-2xl font-bold">$4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <p className="text-sm text-muted-foreground mt-2">100 queries/day + Grok 3</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer relative" onClick={() => window.open('/api/stripe/checkout?tier=pro', '_blank')}>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Most Popular</div>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold">Pro</span>
                      </div>
                      <p className="text-2xl font-bold">$14.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <p className="text-sm text-muted-foreground mt-2">500 queries/day + GPT-4o</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-500/30 hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => window.open('/api/stripe/checkout?tier=unlimited', '_blank')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold">Unlimited</span>
                      </div>
                      <p className="text-2xl font-bold">$27.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <p className="text-sm text-muted-foreground mt-2">Unlimited everything</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Manage Subscription */}
              <div className="flex gap-2">
                <Link href="/subscription">
                  <Button variant="outline">
                    Manage Subscription
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* NSFW Content Add-on Section */}
          <NsfwSubscriptionSection />

          {/* Appearance Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how Chofesh looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleTheme}
                  className="gap-2"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

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
                            <SelectItem value="groq">Groq (Free Tier)</SelectItem>
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
                                : newKeyProvider === "groq"
                                ? "gsk_..."
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
                          {newKeyProvider === "groq" && (
                            <>Get your FREE API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Groq Console</a> - unlimited free tier!</>
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

          {/* Local Models (Ollama) Card */}
          <Card className="mb-6 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Local Models (Ollama)
                <span className="ml-auto flex items-center gap-2 text-sm font-normal">
                  {ollamaStatus === 'connected' && (
                    <span className="flex items-center gap-1 text-green-500">
                      <Wifi className="w-4 h-4" />
                      Connected
                    </span>
                  )}
                  {ollamaStatus === 'disconnected' && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <WifiOff className="w-4 h-4" />
                      Disconnected
                    </span>
                  )}
                  {ollamaStatus === 'checking' && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </span>
                  )}
                </span>
              </CardTitle>
              <CardDescription>
                Run AI models locally on your computer for maximum privacy. No data leaves your machine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Server className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Enable Local Models</div>
                    <div className="text-sm text-muted-foreground">Use Ollama for completely private AI</div>
                  </div>
                </div>
                <Button
                  variant={ollamaEnabled ? "default" : "outline"}
                  onClick={() => {
                    const newValue = !ollamaEnabled;
                    setOllamaEnabled(newValue);
                    localStorage.setItem('ollamaEnabled', newValue.toString());
                    if (newValue) {
                      checkOllamaConnection();
                    }
                  }}
                >
                  {ollamaEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {ollamaEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Ollama Endpoint URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={ollamaEndpoint}
                        onChange={(e) => setOllamaEndpoint(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={checkOllamaConnection}
                        disabled={checkingOllama}
                      >
                        {checkingOllama ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default: http://localhost:11434. Make sure Ollama is running.
                    </p>
                  </div>

                  {ollamaModels.length > 0 && (
                    <div className="space-y-2">
                      <Label>Available Models ({ollamaModels.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {ollamaModels.map((model) => (
                          <span
                            key={model}
                            className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-500"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-500 mb-1">Maximum Privacy</h4>
                        <p className="text-sm text-muted-foreground">
                          When using local models, your conversations never leave your computer. 
                          Perfect for sensitive data and complete privacy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Don't have Ollama? <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download it here</a></p>
                    <p>Popular models: <code className="bg-muted px-1 rounded">ollama pull llama3.2</code>, <code className="bg-muted px-1 rounded">ollama pull mistral</code>, <code className="bg-muted px-1 rounded">ollama pull codellama</code></p>
                  </div>
                </>
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
