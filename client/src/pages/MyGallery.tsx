import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  Loader2,
  Trash2,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wand2,
  Edit,
  Cloud,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function MyGallery() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const pageSize = 24;

  // Fetch user's images
  const { data: images, isLoading, refetch } = trpc.image.myGallery.useQuery(
    { limit: pageSize, offset: page * pageSize },
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.image.deleteMyImage.useMutation({
    onSuccess: () => {
      toast.success("Image deleted successfully");
      refetch();
      setSelectedImage(null);
    },
    onError: () => {
      toast.error("Failed to delete image");
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login?redirect=/gallery&message=signin_required");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chofesh-${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDelete = (imageId: number) => {
    deleteMutation.mutate({ imageId });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your image gallery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalImages = images?.length || 0;
  const hasMore = totalImages === pageSize;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">My Gallery</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/image">
              <Button variant="outline" size="sm">
                <Wand2 className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                Chat
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-6 px-4 max-w-7xl mx-auto">
        {/* Info Banner */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Cloud className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Your images are stored securely</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All your generated images are saved to your account and accessible from any device. 
                  Only you can see and manage your images.
                </p>
              </div>
              <Shield className="w-5 h-5 text-primary/50 ml-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Gallery Stats */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Creations</h2>
            <p className="text-muted-foreground">
              {isLoading ? "Loading..." : `${totalImages} images${page > 0 ? ` (page ${page + 1})` : ""}`}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {/* Image Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : images && images.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelectedImage(img)}
                >
                  {img.imageUrl ? (
                    <img
                      src={img.imageUrl}
                      alt={img.prompt.slice(0, 50)}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                      decoding="async"
                      onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                      style={{ opacity: 0 }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <X className="w-8 h-8 text-destructive" />
                    </div>
                  )}
                  
                  {/* Edit badge */}
                  {img.isEdit && (
                    <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Badge>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(img.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <Card className="py-20">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No images yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Start creating amazing AI-generated images. They'll appear here automatically.
              </p>
              <Link href="/image">
                <Button>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Create Your First Image
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Image Details
                </DialogTitle>
                <DialogDescription>
                  Created on {new Date(selectedImage.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="relative">
                  {selectedImage.imageUrl ? (
                    <img
                      src={selectedImage.imageUrl}
                      alt={selectedImage.prompt}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <X className="w-12 h-12 text-destructive" />
                    </div>
                  )}
                  {selectedImage.isEdit && (
                    <Badge className="absolute top-2 left-2">
                      <Edit className="w-3 h-3 mr-1" />
                      Edited Image
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  {/* Prompt */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Prompt</label>
                    <div className="mt-1 p-3 rounded-lg bg-muted relative group">
                      <p className="text-sm pr-8">{selectedImage.prompt}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopyPrompt(selectedImage.prompt)}
                      >
                        {copiedPrompt ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Negative Prompt */}
                  {selectedImage.negativePrompt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Negative Prompt</label>
                      <p className="mt-1 p-3 rounded-lg bg-muted text-sm">{selectedImage.negativePrompt}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="font-medium">{selectedImage.model || "flux"}</p>
                    </div>
                    {selectedImage.aspectRatio && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Aspect Ratio</p>
                        <p className="font-medium">{selectedImage.aspectRatio}</p>
                      </div>
                    )}
                    {selectedImage.seed && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Seed</p>
                        <p className="font-medium font-mono">{selectedImage.seed}</p>
                      </div>
                    )}
                    {selectedImage.steps && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Steps</p>
                        <p className="font-medium">{selectedImage.steps}</p>
                      </div>
                    )}
                  </div>

                  {/* Original Image (for edits) */}
                  {selectedImage.isEdit && selectedImage.originalImageUrl && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Original Image</label>
                      <img
                        src={selectedImage.originalImageUrl}
                        alt="Original"
                        className="mt-1 w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    {selectedImage.imageUrl && (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.prompt)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(selectedImage.imageUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The image will be permanently deleted from your gallery.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(selectedImage.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
