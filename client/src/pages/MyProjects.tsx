import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  BookOpen,
  Globe,
  Smartphone,
  Megaphone,
  FileText,
  Trash2,
  Share2,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const PROJECT_TYPE_ICONS = {
  kids_book: BookOpen,
  website: Globe,
  app: Smartphone,
  marketing: Megaphone,
  business_plan: FileText,
  other: FileText,
};

const PROJECT_TYPE_LABELS = {
  kids_book: "Kids Book",
  website: "Website",
  app: "App Design",
  marketing: "Marketing Campaign",
  business_plan: "Business Plan",
  other: "Other",
};

const STATUS_ICONS = {
  pending: Clock,
  generating: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const STATUS_COLORS = {
  pending: "bg-yellow-500",
  generating: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

export default function MyProjects() {
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery({
    type: selectedType as any,
    status: selectedStatus as any,
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });

  const shareProjectMutation = trpc.projects.share.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast.success("Share link copied to clipboard!");
    },
    onError: (error) => {
      toast.error(`Failed to generate share link: ${error.message}`);
    },
  });

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate({ projectId });
    }
  };

  const handleShareProject = (projectId: string) => {
    shareProjectMutation.mutate({ projectId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Projects</h1>
        <p className="text-muted-foreground">
          View and manage all your AI-generated projects
        </p>
      </div>

      {/* Filters */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedType(undefined)}>
            All Projects
          </TabsTrigger>
          <TabsTrigger value="kids_book" onClick={() => setSelectedType("KIDS_BOOK")}>
            Kids Books
          </TabsTrigger>
          <TabsTrigger value="website" onClick={() => setSelectedType("WEBSITE")}>
            Websites
          </TabsTrigger>
          <TabsTrigger value="app" onClick={() => setSelectedType("APP")}>
            Apps
          </TabsTrigger>
          <TabsTrigger value="marketing" onClick={() => setSelectedType("MARKETING")}>
            Marketing
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Projects Grid */}
      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating your first project in the chat!
            </p>
            <Button onClick={() => (window.location.href = "/chat")}>
              Go to Chat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const Icon = PROJECT_TYPE_ICONS[project.type as keyof typeof PROJECT_TYPE_ICONS];
            const StatusIcon = STATUS_ICONS[project.status as keyof typeof STATUS_ICONS];
            const statusColor = STATUS_COLORS[project.status as keyof typeof STATUS_COLORS];

            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="w-8 h-8 text-primary" />
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <StatusIcon className={`w-3 h-3 ${statusColor}`} />
                      {project.status}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Thumbnail */}
                    {project.thumbnailUrl && (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{PROJECT_TYPE_LABELS[project.type as keyof typeof PROJECT_TYPE_LABELS]}</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => (window.location.href = `/projects/${project.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareProject(project.id)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
