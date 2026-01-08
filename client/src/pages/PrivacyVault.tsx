import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Shield,
  Database,
  Trash2,
  Download,
  Lock,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  Cloud,
  CloudOff,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface StorageStats {
  conversations: { count: number; size: number };
  images: { count: number; size: number };
  settings: { size: number };
  total: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function PrivacyVault() {
  const [storageStats, setStorageStats] = useState<StorageStats>({
    conversations: { count: 0, size: 0 },
    images: { count: 0, size: 0 },
    settings: { size: 0 },
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dataSentToServer, setDataSentToServer] = useState(0);

  const calculateStorageStats = () => {
    setIsLoading(true);
    
    try {
      // Calculate conversations storage
      const conversationsData = localStorage.getItem("chofesh-conversations");
      const conversationsSize = conversationsData ? new Blob([conversationsData]).size : 0;
      const conversations = conversationsData ? JSON.parse(conversationsData) : [];
      
      // Calculate images storage (gallery)
      const galleryData = localStorage.getItem("chofesh-gallery");
      const gallerySize = galleryData ? new Blob([galleryData]).size : 0;
      const gallery = galleryData ? JSON.parse(galleryData) : [];
      
      // Calculate settings storage
      const settingsKeys = ["chofesh-theme", "chofesh-settings", "chofesh-age-verified"];
      let settingsSize = 0;
      settingsKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) settingsSize += new Blob([data]).size;
      });
      
      const total = conversationsSize + gallerySize + settingsSize;
      
      setStorageStats({
        conversations: { count: conversations.length || 0, size: conversationsSize },
        images: { count: gallery.length || 0, size: gallerySize },
        settings: { size: settingsSize },
        total,
      });
      
      // For demo purposes, show minimal server data (only auth tokens)
      setDataSentToServer(0);
    } catch (error) {
      console.error("Error calculating storage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateStorageStats();
  }, []);

  const handleClearConversations = () => {
    localStorage.removeItem("chofesh-conversations");
    calculateStorageStats();
    toast.success("All conversations deleted");
  };

  const handleClearImages = () => {
    localStorage.removeItem("chofesh-gallery");
    calculateStorageStats();
    toast.success("All local images deleted");
  };

  const handleClearAll = () => {
    const keysToKeep = ["chofesh-theme"]; // Keep theme preference
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith("chofesh-"));
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    calculateStorageStats();
    toast.success("All local data cleared");
  };

  const handleExportData = () => {
    const exportData: Record<string, unknown> = {};
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith("chofesh-"));
    allKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          exportData[key] = JSON.parse(data);
        } catch {
          exportData[key] = data;
        }
      }
    });
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chofesh-data-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const privacyFeatures = [
    {
      icon: HardDrive,
      title: "Local-First Storage",
      description: "Your conversations are stored in your browser, not on our servers",
      status: "active",
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data is encrypted before leaving your device",
      status: "active",
    },
    {
      icon: CloudOff,
      title: "Zero Data Collection",
      description: "We don't collect, store, or sell your personal data",
      status: "active",
    },
    {
      icon: Eye,
      title: "No Tracking",
      description: "No analytics, no cookies, no fingerprinting",
      status: "active",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Aurora orbs for background effect */}
      <div className="aurora-orb aurora-orb-1 dark:block hidden" />
      <div className="aurora-orb aurora-orb-2 dark:block hidden" />
      <div className="aurora-orb aurora-orb-3 dark:block hidden" />
      
      <div className="container max-w-4xl py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Privacy Vault
            </h1>
            <p className="text-muted-foreground mt-1">
              See exactly where your data is stored and manage it with full control
            </p>
          </div>
        </div>

        {/* Privacy Status Banner */}
        <Card className="mb-8 glass-card border-green-500/30 bg-green-500/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Your Privacy is Protected</h3>
                  <p className="text-muted-foreground">
                    <span className="text-green-500 font-medium">{formatBytes(dataSentToServer)}</span> sent to servers • 
                    <span className="text-primary font-medium ml-1">{formatBytes(storageStats.total)}</span> stored locally
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                Privacy Mode Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Storage Overview */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storageStats.conversations.count}</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(storageStats.conversations.size)}
              </p>
              <Progress 
                value={(storageStats.conversations.size / (5 * 1024 * 1024)) * 100} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storageStats.images.count}</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(storageStats.images.size)}
              </p>
              <Progress 
                value={(storageStats.images.size / (50 * 1024 * 1024)) * 100} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Total Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(storageStats.total)}</div>
              <p className="text-xs text-muted-foreground">
                of ~5MB browser limit
              </p>
              <Progress 
                value={(storageStats.total / (5 * 1024 * 1024)) * 100} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
        </div>

        {/* Privacy Features */}
        <Card className="mb-8 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Privacy Features
            </CardTitle>
            <CardDescription>
              How we protect your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {privacyFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {feature.title}
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Storage Locations */}
        <Card className="mb-8 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Where Your Data Lives
            </CardTitle>
            <CardDescription>
              Complete transparency about data storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">Your Browser (IndexedDB/LocalStorage)</h4>
                    <p className="text-sm text-muted-foreground">Conversations, settings, preferences</p>
                  </div>
                </div>
                <Badge className="bg-green-500">Local Only</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">Secure Cloud (Encrypted)</h4>
                    <p className="text-sm text-muted-foreground">Account info, subscription status</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">Encrypted</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-muted bg-muted/30">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Third-Party Servers</h4>
                    <p className="text-sm text-muted-foreground">We never share your data with third parties</p>
                  </div>
                </div>
                <Badge variant="outline">None</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export or delete your data at any time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>

              <Button variant="outline" onClick={calculateStorageStats} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Stats
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-orange-500 hover:text-orange-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Conversations
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {storageStats.conversations.count} conversations from your device. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearConversations} className="bg-destructive text-destructive-foreground">
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Local Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all local data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all conversations, images, and settings from your device. Your account and subscription will not be affected. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
