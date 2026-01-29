import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageGallery } from "../components/ImageGallery";
import { generateAndDownloadKidsBookPDF } from "../utils/pdfGenerator";
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  File,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id || "";

  const { data: project, isLoading, refetch } = trpc.projects.get.useQuery({ projectId });
  const { data: images } = trpc.projects.getImages.useQuery({ projectId });
  const { data: files } = trpc.projects.getFiles.useQuery({ projectId });

  const shareProjectMutation = trpc.projects.share.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast.success("Share link copied to clipboard!");
    },
    onError: (error) => {
      toast.error(`Failed to generate share link: ${error.message}`);
    },
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!project || project.type !== "kids_book") return;

    setIsGeneratingPDF(true);
    try {
      const outputs = project.outputs as any;
      const pages = outputs?.pages || [];
      const bookImages = images || [];

      await generateAndDownloadKidsBookPDF({
        title: project.title,
        author: "Chofesh.ai",
        coverImageUrl: bookImages[0]?.url,
        pages: pages.map((page: any, index: number) => ({
          pageNumber: index + 1,
          text: page.text || "",
          imageUrl: bookImages[index + 1]?.url,
        })),
      });

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = () => {
    shareProjectMutation.mutate({ projectId });
  };

  const handleRegenerate = () => {
    toast.info("Project regeneration coming soon!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => (window.location.href = "/projects")}>
              Back to My Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    GENERATING: "bg-blue-500",
    COMPLETED: "bg-green-500",
    FAILED: "bg-red-500",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => (window.location.href = "/projects")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Projects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{project.title}</h1>
              <Badge className={`${statusColors[project.status]} text-white`}>
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-lg text-muted-foreground">{project.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {project.type === "kids_book" && project.status === "completed" && (
              <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </Button>
            )}
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
          {project.completedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Completed {new Date(project.completedAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{project.type.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {images && images.length > 0 && (
            <TabsTrigger value="images">
              <ImageIcon className="w-4 h-4 mr-2" />
              Images ({images.length})
            </TabsTrigger>
          )}
          {files && files.length > 0 && (
            <TabsTrigger value="files">
              <File className="w-4 h-4 mr-2" />
              Files ({files.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {project.outputs && (
            <Card>
              <CardHeader>
                <CardTitle>Project Output</CardTitle>
              </CardHeader>
              <CardContent>
                {typeof project.outputs === 'object' && (project.outputs as any).text && (
                  <div className="prose max-w-none">
                    <p>{(project.outputs as any).text}</p>
                  </div>
                )}
                {typeof project.outputs === 'string' && (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap">{project.outputs}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {images && images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Images</CardTitle>
                <CardDescription>
                  All images generated for this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageGallery
                  images={images.map((img) => ({
                    id: img.id,
                    url: img.url,
                    prompt: img.prompt || undefined,
                    type: img.type || undefined,
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Images Tab */}
        {images && images.length > 0 && (
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>All Images</CardTitle>
                <CardDescription>
                  {images.length} images generated for this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageGallery
                  images={images.map((img) => ({
                    id: img.id,
                    url: img.url,
                    prompt: img.prompt || undefined,
                    type: img.type || undefined,
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Files Tab */}
        {files && files.length > 0 && (
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Project Files</CardTitle>
                <CardDescription>
                  {files.length} files associated with this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{file.type}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project ID</label>
                <p className="font-mono text-sm">{project.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p>{project.type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p>{project.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p>{new Date(project.createdAt).toLocaleString()}</p>
              </div>
              {project.completedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Completed</label>
                  <p>{new Date(project.completedAt).toLocaleString()}</p>
                </div>
              )}
              {project.inputs && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Input Parameters</label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-sm overflow-auto">
                    {JSON.stringify(project.inputs, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
