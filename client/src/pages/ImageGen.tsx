import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  Sliders,
  Copy,
  RefreshCw,
  Shuffle,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Users,
  Edit,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  seed?: number;
  steps?: number;
  cfgScale?: number;
  timestamp: number;
}

const STORAGE_KEY = "chofesh-ai-generated-images";

const ASPECT_RATIOS = [
  { id: "1:1", name: "Square", icon: Square, width: 1024, height: 1024 },
  { id: "16:9", name: "Landscape", icon: RectangleHorizontal, width: 1344, height: 768 },
  { id: "9:16", name: "Portrait", icon: RectangleVertical, width: 768, height: 1344 },
  { id: "4:3", name: "Standard", icon: RectangleHorizontal, width: 1152, height: 896 },
  { id: "3:4", name: "Portrait 4:3", icon: RectangleVertical, width: 896, height: 1152 },
  { id: "21:9", name: "Ultrawide", icon: RectangleHorizontal, width: 1536, height: 640 },
];

export default function ImageGen() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState("flux");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [useSeed, setUseSeed] = useState(false);
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const { data: models } = trpc.models.listImage.useQuery();
  const generateMutation = trpc.image.generate.useMutation();
  const editMutation = trpc.imageEdit.edit.useMutation();
  
  // Image editing state
  const [editMode, setEditMode] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  const generateRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 2147483647);
    setSeed(newSeed);
    setUseSeed(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generateMutation.isPending) return;

    const currentSeed = useSeed ? (seed || Math.floor(Math.random() * 2147483647)) : undefined;
    if (useSeed && !seed) {
      setSeed(currentSeed);
    }

    try {
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        model,
        aspectRatio,
        seed: currentSeed,
        steps,
        cfgScale,
      });

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.url!,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        seed: currentSeed,
        steps,
        cfgScale,
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

  // Image editing handlers
  const handleEditImage = async () => {
    if (!prompt.trim() || !editImageUrl || editMutation.isPending) return;

    try {
      const result = await editMutation.mutateAsync({
        prompt: prompt.trim(),
        originalImageUrl: editImageUrl,
        originalImageMimeType: 'image/png',
      });

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: result.url!,
        prompt: `[Edit] ${prompt.trim()}`,
        timestamp: Date.now(),
      };

      saveImages([newImage, ...images]);
      setSelectedImage(newImage);
      setEditMode(false);
      setEditImageUrl(null);
      toast.success("Image edited successfully!");
    } catch (error) {
      toast.error("Failed to edit image. Please try again.");
      console.error("Image edit error:", error);
    }
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    // Convert to data URL for preview, but we'll need to upload to S3 for the API
    const reader = new FileReader();
    reader.onload = () => {
      // For now, we'll use the selected image's URL if available
      // In a full implementation, you'd upload this to S3 first
      toast.info("For editing, please select an existing generated image or provide a URL");
    };
    reader.readAsDataURL(file);
  };

  const startEditFromImage = (image: GeneratedImage) => {
    setEditMode(true);
    setEditImageUrl(image.url);
    setPrompt("");
    toast.info("Enter a prompt to describe how you want to edit this image");
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditImageUrl(null);
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
      a.download = `chofesh-ai-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleUseSettings = (image: GeneratedImage) => {
    setPrompt(image.prompt);
    if (image.negativePrompt) setNegativePrompt(image.negativePrompt);
    if (image.aspectRatio) setAspectRatio(image.aspectRatio);
    if (image.seed) {
      setSeed(image.seed);
      setUseSeed(true);
    }
    if (image.steps) setSteps(image.steps);
    if (image.cfgScale) setCfgScale(image.cfgScale);
    toast.success("Settings loaded from image");
  };

  const handleCopyPrompt = (image: GeneratedImage) => {
    let text = image.prompt;
    if (image.negativePrompt) {
      text += `\n\nNegative: ${image.negativePrompt}`;
    }
    if (image.seed) {
      text += `\nSeed: ${image.seed}`;
    }
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && e.target instanceof HTMLInputElement) {
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
            <img src="/chofesh-logo.png" alt="Chofesh" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold gradient-text">Chofesh</span>
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
                        startEditFromImage(image);
                      }}
                      title="Edit this image"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
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
          <Link href="/characters">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Users className="w-4 h-4" />
              AI Characters
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
          <div className="flex items-center gap-2">
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
          </div>
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
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {selectedImage.prompt}
                  </p>
                  {selectedImage.negativePrompt && (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-red-400">Negative:</span> {selectedImage.negativePrompt}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {selectedImage.aspectRatio && (
                      <span className="px-2 py-1 bg-muted rounded">
                        {selectedImage.aspectRatio}
                      </span>
                    )}
                    {selectedImage.seed && (
                      <span className="px-2 py-1 bg-muted rounded">
                        Seed: {selectedImage.seed}
                      </span>
                    )}
                    {selectedImage.steps && (
                      <span className="px-2 py-1 bg-muted rounded">
                        Steps: {selectedImage.steps}
                      </span>
                    )}
                    {selectedImage.cfgScale && (
                      <span className="px-2 py-1 bg-muted rounded">
                        CFG: {selectedImage.cfgScale}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                      onClick={() => handleUseSettings(selectedImage)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Use Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPrompt(selectedImage)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Prompt
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
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Edit Mode Banner */}
            {editMode && editImageUrl && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <img
                  src={editImageUrl}
                  alt="Image being edited"
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-primary">Edit Mode</div>
                  <div className="text-xs text-muted-foreground">Describe how you want to modify this image</div>
                </div>
                <Button variant="ghost" size="icon" onClick={cancelEditMode}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Main Prompt */}
            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                    if (editMode) {
                      handleEditImage();
                    } else {
                      handleGenerate();
                    }
                  }
                }}
                placeholder={editMode ? "Describe how to edit this image..." : "Describe the image you want to create..."}
                disabled={generateMutation.isPending || editMutation.isPending}
                className="flex-1"
              />
              {editMode ? (
                <Button
                  onClick={handleEditImage}
                  disabled={!prompt.trim() || editMutation.isPending}
                  className="bg-primary"
                >
                  {editMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Image
                    </>
                  )}
                </Button>
              ) : (
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
              )}
            </div>

            {/* Advanced Settings Collapsible */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2">
                  <Sliders className="w-4 h-4" />
                  Advanced Settings
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Negative Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="negative-prompt">Negative Prompt</Label>
                  <Textarea
                    id="negative-prompt"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid in the image (e.g., blurry, distorted, low quality)"
                    className="min-h-[60px]"
                  />
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <div className="flex flex-wrap gap-2">
                    {ASPECT_RATIOS.map((ratio) => {
                      const Icon = ratio.icon;
                      return (
                        <Tooltip key={ratio.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={aspectRatio === ratio.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAspectRatio(ratio.id)}
                              className="gap-2"
                            >
                              <Icon className="w-4 h-4" />
                              {ratio.id}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {ratio.name} ({ratio.width}x{ratio.height})
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>

                {/* Seed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Seed (for reproducibility)</Label>
                    <Switch
                      checked={useSeed}
                      onCheckedChange={setUseSeed}
                    />
                  </div>
                  {useSeed && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={seed || ""}
                        onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Random seed"
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon" onClick={generateRandomSeed}>
                        <Shuffle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Steps: {steps}</Label>
                    <span className="text-xs text-muted-foreground">
                      {steps < 20 ? "Fast" : steps > 40 ? "High Quality" : "Balanced"}
                    </span>
                  </div>
                  <Slider
                    value={[steps]}
                    onValueChange={([v]) => setSteps(v)}
                    min={10}
                    max={50}
                    step={5}
                  />
                </div>

                {/* CFG Scale */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>CFG Scale: {cfgScale}</Label>
                    <span className="text-xs text-muted-foreground">
                      {cfgScale < 5 ? "Creative" : cfgScale > 10 ? "Strict" : "Balanced"}
                    </span>
                  </div>
                  <Slider
                    value={[cfgScale]}
                    onValueChange={([v]) => setCfgScale(v)}
                    min={1}
                    max={20}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">
                    How closely the image follows your prompt
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <p className="text-xs text-muted-foreground/50 text-center">
              Create without limits
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
