import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Link2, Unlink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GitLabSettings() {
  const { data: connection, isLoading, refetch } = trpc.gitlab.getConnection.useQuery();
  const disconnectMutation = trpc.gitlab.disconnect.useMutation({
    onSuccess: () => {
      toast.success("GitLab disconnected");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleConnect = () => {
    window.location.href = "/api/gitlab/auth";
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">GitLab Integration</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            GitLab Connection
          </CardTitle>
          <CardDescription>
            Connect your GitLab account to access repositories, create merge requests, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">{connection.gitlabUsername}</p>
                    <p className="text-sm text-muted-foreground">{connection.gitlabEmail}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-500">Connected</Badge>
              </div>
              <Button variant="destructive" onClick={handleDisconnect} className="w-full gap-2">
                <Unlink className="w-4 h-4" />
                Disconnect GitLab
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Connect your GitLab account to enable repository access and version control features.
              </p>
              <Button onClick={handleConnect} className="w-full gap-2">
                <GitBranch className="w-4 h-4" />
                Connect GitLab
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
