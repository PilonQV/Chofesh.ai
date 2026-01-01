import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Loader2,
  ArrowLeft,
  Wand2,
  Trash2,
  MessageSquare,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

const STORAGE_KEY = "libre-ai-generated-images";

export default function ImageGen() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("flux");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const { data: models } = trpc.models.listImage.useQuery();
  const generateMutation = trpc.image.generate.useMutation();

  // Load images from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setImages(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save images to localStorage
  const saveImages = (newImages: GeneratedImage[]) => {
    setImages(newImages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generateMutation.isPending) return;

    try {
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        model,
      });

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.url!,
        prompt: prompt.trim(),
        timestamp: Date.now(),
      };

      saveImages([newImage, ...images]);
      setSelectedImage(newImage);
      toast.success("Image generated successfully!");
    } catch (error) {
      toast.error("Failed to generate image. Please try again.");
      console.error("Image generation error:", error);
    }
  };

  const handleDelete = (id: string) => {
    const newImages = images.filter((img) => img.id !== id);
    saveImages(newImages);
    if (selectedImage?.id === id) {
      setSelectedImage(newImages[0] || null);
    }
    toast.success("Image deleted");
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `libre-ai-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (authLoading) {
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
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">LibreAI</span>
          </Link>
          <div className="text-sm font-medium text-muted-foreground">
            Image Generation
          </div>
        </div>

        {/* Gallery */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {images.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No images yet. Generate your first image!
              </div>
            ) : (
              images.map((image) => (
                <div
                  key={image.id}
                  className={`group relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                    selectedImage?.id === image.id
                      ? "border-primary"
                      : "border-transparent hover:border-muted"
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-8 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/chat">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </Button>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="w-4 h-4" />
                Admin Dashboard
              </Button>
            </Link>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || "User"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">Image Generation</h1>
          </div>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {models?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        {/* Image Display */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-card border border-border">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground flex-1 truncate">
                    {selectedImage.prompt}
                  </p>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedImage)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(selectedImage.prompt)}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Use Prompt
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Create AI Images</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Describe what you want to see and let AI bring your imagination to life.
                  No restrictions, complete creative freedom.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Gallery */}
        {images.length > 0 && (
          <div className="lg:hidden border-t border-border p-4">
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                      selectedImage?.id === image.id
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the image you want to create..."
                disabled={generateMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/50 text-center mt-2">
              Create without limits
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
