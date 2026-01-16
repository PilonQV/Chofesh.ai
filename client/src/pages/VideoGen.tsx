import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  Video as VideoIcon,
  Download,
  Loader2,
  ArrowLeft,
  Trash2,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Lock,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Play,
  Image as ImageIcon,
  Users,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  duration: string;
  resolution: string;
  aspectRatio?: string;
  timestamp: number;
  model?: string;
  status: "pending" | "processing" | "completed" | "failed";
  queueId?: string;
}

const STORAGE_KEY_PREFIX = "chofesh-ai-generated-videos";

export default function VideoGen() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState("wan-2.5-preview-image-to-video");
  const [duration, setDuration] = useState<"5s" | "10s">("10s");
  const [resolution, setResolution] = useState<"480p" | "720p" | "1080p">("720p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [audio, setAudio] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const { data: videoModels } = trpc.video.getModels.useQuery();
  const queueMutation = trpc.video.queue.useMutation();
  const retrieveMutation = trpc.video.retrieve.useMutation();
  
  // NSFW state and queries
  const [nsfwMode, setNsfwMode] = useState(false);
  const [showNsfwModal, setShowNsfwModal] = useState(false);
  const { data: nsfwStatus } = trpc.nsfw.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get user-specific storage key
  const getStorageKey = () => {
    if (user?.id) {
      return `${STORAGE_KEY_PREFIX}-${user.id}`;
    }
    return null;
  };

  // Load videos from localStorage (user-specific)
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      setVideos([]);
      return;
    }
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setVideos(JSON.parse(stored));
      } catch {
        setVideos([]);
      }
    } else {
      setVideos([]);
    }
  }, [user?.id]);

  // Save videos to localStorage (user-specific)
  const saveVideos = (newVideos: GeneratedVideo[]) => {
    setVideos(newVideos);
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newVideos));
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login?redirect=/video&message=signin_required");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Poll for video status
  useEffect(() => {
    const pendingVideos = videos.filter(
      (v) => v.status === "pending" || v.status === "processing"
    );

    if (pendingVideos.length === 0) return;

    const interval = setInterval(async () => {
      for (const video of pendingVideos) {
        if (!video.queueId) continue;

        try {
          const result = await retrieveMutation.mutateAsync({
            queueId: video.queueId,
          });

          if (result.status === "completed" && result.video_url) {
            // Update video status
            const updatedVideos = videos.map((v) =>
              v.id === video.id
                ? { ...v, status: "completed" as const, url: result.video_url! }
                : v
            );
            saveVideos(updatedVideos);
            toast.success("Video generation completed!");
          } else if (result.status === "failed") {
            const updatedVideos = videos.map((v) =>
              v.id === video.id ? { ...v, status: "failed" as const } : v
            );
            saveVideos(updatedVideos);
            toast.error("Video generation failed");
          } else if (result.status === "processing") {
            const updatedVideos = videos.map((v) =>
              v.id === video.id ? { ...v, status: "processing" as const } : v
            );
            saveVideos(updatedVideos);
          }
        } catch (error) {
          console.error("Failed to check video status:", error);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [videos, retrieveMutation]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      toast.success("Image uploaded! This will be animated into a video.");
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || queueMutation.isPending) return;

    // Check age verification for NSFW
    if (nsfwMode && !user?.ageVerified) {
      toast.error("Age verification required. Go to Settings to verify you're 18+.");
      setShowNsfwModal(true);
      return;
    }

    try {
      const result = await queueMutation.mutateAsync({
        prompt: prompt.trim(),
        model,
        duration,
        imageUrl: uploadedImage || undefined,
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        resolution,
        audio,
        isNsfw: nsfwMode,
      });

      const newVideo: GeneratedVideo = {
        id: crypto.randomUUID(),
        url: "", // Will be filled when completed
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        duration,
        resolution,
        aspectRatio,
        timestamp: Date.now(),
        model: result.model,
        status: "pending",
        queueId: result.queueId,
      };

      saveVideos([newVideo, ...videos]);
      setSelectedVideo(newVideo);
      toast.success(
        `Video queued! Cost: ${result.creditCost} credits. Generation may take 1-3 minutes.`
      );
    } catch (error: any) {
      console.error("Video generation error:", error);
      if (error.message?.includes("credits") || error.message?.includes("insufficient")) {
        toast.error("Insufficient credits. Purchase more credits to continue.");
      } else if (error.message?.includes("age") || error.message?.includes("verify")) {
        toast.error("Age verification required. Go to Settings to verify.");
        setShowNsfwModal(true);
      } else {
        toast.error(error.message || "Failed to queue video generation.");
      }
    }
  };

  const handleDownload = async (video: GeneratedVideo) => {
    if (!video.url) return;
    
    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chofesh-video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Video downloaded!");
    } catch (error) {
      toast.error("Failed to download video");
    }
  };

  const handleDelete = (id: string) => {
    const updated = videos.filter((v) => v.id !== id);
    saveVideos(updated);
    if (selectedVideo?.id === id) {
      setSelectedVideo(updated[0] || null);
    }
    toast.success("Video deleted");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="h-14 border-b border-border flex items-center px-4">
          <h2 className="font-semibold flex items-center gap-2">
            <VideoIcon className="w-5 h-5" />
            Generated Videos
          </h2>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-border space-y-4">
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              placeholder="Describe the video you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24 resize-none"
            />
          </div>

          {/* Image Upload for Image-to-Video */}
          <div className="space-y-2">
            <Label>Image to Animate (Optional)</Label>
            {uploadedImage ? (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Upload preview"
                  className="w-full rounded-lg border"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={clearUploadedImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => imageFileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            )}
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Advanced Settings</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Negative Prompt</Label>
                <Textarea
                  placeholder="What to avoid in the video..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-16 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5s">5 seconds (10 credits)</SelectItem>
                    <SelectItem value="10s">10 seconds (20 credits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={(v) => setResolution(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p (Recommended)</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {videoModels?.aspectRatios.map((ar) => (
                      <SelectItem key={ar.id} value={ar.id}>
                        {ar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Generate Audio</Label>
                <Switch checked={audio} onCheckedChange={setAudio} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={!prompt.trim() || queueMutation.isPending}
          >
            {queueMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Queueing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Video ({duration === "5s" ? "10" : "20"} credits)
              </>
            )}
          </Button>
        </div>

        {/* Gallery */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {videos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No videos yet. Generate your first video!
              </div>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id}
                  className={`group relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                    selectedVideo?.id === video.id
                      ? "border-primary"
                      : "border-transparent hover:border-muted"
                  }`}
                  onClick={() => setSelectedVideo(video)}
                >
                  {video.status === "completed" && video.url ? (
                    <video
                      src={video.url}
                      className="w-full aspect-video object-cover"
                      muted
                      loop
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center">
                      {video.status === "pending" && (
                        <div className="text-center">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Queued</p>
                        </div>
                      )}
                      {video.status === "processing" && (
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                          <p className="text-xs text-muted-foreground">Generating...</p>
                        </div>
                      )}
                      {video.status === "failed" && (
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                          <p className="text-xs text-destructive">Failed</p>
                        </div>
                      )}
                    </div>
                  )}
                  {video.status === "completed" && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(video);
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
                          handleDelete(video.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/image">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <ImageIcon className="w-4 h-4" />
              Image Generation
            </Button>
          </Link>
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
            <h1 className="font-semibold">Video Generation</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* NSFW Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={nsfwMode ? "default" : "outline"}
                  size="sm"
                  className={`gap-2 ${nsfwMode ? "bg-pink-500 hover:bg-pink-600" : ""}`}
                  onClick={() => {
                    if (!user?.ageVerified) {
                      setShowNsfwModal(true);
                    } else {
                      setNsfwMode(!nsfwMode);
                    }
                  }}
                >
                  {user?.ageVerified ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  18+
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {user?.ageVerified
                  ? `Uncensored: ${nsfwMode ? "ON" : "OFF"}`
                  : "Unlock Uncensored Video Generation"}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Video Display */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {selectedVideo ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-card border border-border">
                  {selectedVideo.status === "completed" && selectedVideo.url ? (
                    <video
                      src={selectedVideo.url}
                      controls
                      className="w-full h-auto"
                      autoPlay
                      loop
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center">
                      {selectedVideo.status === "pending" && (
                        <div className="text-center">
                          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg font-medium">Video Queued</p>
                          <p className="text-sm text-muted-foreground">
                            Your video is in the queue. This may take 1-3 minutes.
                          </p>
                        </div>
                      )}
                      {selectedVideo.status === "processing" && (
                        <div className="text-center">
                          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                          <p className="text-lg font-medium">Generating Video...</p>
                          <p className="text-sm text-muted-foreground">
                            This may take 1-3 minutes
                          </p>
                        </div>
                      )}
                      {selectedVideo.status === "failed" && (
                        <div className="text-center">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                          <p className="text-lg font-medium text-destructive">
                            Generation Failed
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Your credits have been refunded
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{selectedVideo.prompt}</p>
                  {selectedVideo.negativePrompt && (
                    <p className="text-xs text-muted-foreground">
                      <span className="text-red-400">Negative:</span>{" "}
                      {selectedVideo.negativePrompt}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded">
                      {selectedVideo.duration}
                    </span>
                    <span className="px-2 py-1 bg-muted rounded">
                      {selectedVideo.resolution}
                    </span>
                    {selectedVideo.aspectRatio && (
                      <span className="px-2 py-1 bg-muted rounded">
                        {selectedVideo.aspectRatio}
                      </span>
                    )}
                    {selectedVideo.model && (
                      <span className="px-2 py-1 bg-muted rounded">
                        {selectedVideo.model}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <VideoIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Video Selected</h2>
                <p className="text-muted-foreground">
                  Generate a video or select one from the sidebar
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
