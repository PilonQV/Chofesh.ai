import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Server, Container, Globe, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type WorkspaceType = "local" | "docker" | "remote";

export default function WorkspaceSettings() {
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>("local");
  const [dockerImage, setDockerImage] = useState("node:18-alpine");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save workspace settings
      localStorage.setItem("workspace_type", workspaceType);
      if (workspaceType === "docker") {
        localStorage.setItem("docker_image", dockerImage);
      } else if (workspaceType === "remote") {
        localStorage.setItem("remote_url", remoteUrl);
      }
      toast.success("Workspace settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Workspace Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Execution Environment</CardTitle>
          <CardDescription>
            Choose where your code will be executed. Different environments offer different levels of isolation and capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={workspaceType} onValueChange={(v) => setWorkspaceType(v as WorkspaceType)}>
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="local" id="local" />
              <div className="flex-1">
                <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
                  <Server className="w-4 h-4" />
                  Local Execution
                  <Badge variant="secondary">Default</Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Execute code directly on the server. Fast but less isolated.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="docker" id="docker" />
              <div className="flex-1">
                <Label htmlFor="docker" className="flex items-center gap-2 cursor-pointer">
                  <Container className="w-4 h-4" />
                  Docker Container
                  <Badge variant="secondary">Recommended</Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Execute code in an isolated Docker container. Secure and reproducible.
                </p>
                {workspaceType === "docker" && (
                  <div className="mt-3">
                    <Label htmlFor="docker-image" className="text-sm">Docker Image</Label>
                    <Input
                      id="docker-image"
                      value={dockerImage}
                      onChange={(e) => setDockerImage(e.target.value)}
                      placeholder="node:18-alpine"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="remote" id="remote" />
              <div className="flex-1">
                <Label htmlFor="remote" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  Remote Server
                  <Badge variant="outline">Coming Soon</Badge>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Execute code on a remote server via SSH or WebSocket.
                </p>
                {workspaceType === "remote" && (
                  <div className="mt-3">
                    <Label htmlFor="remote-url" className="text-sm">Remote URL</Label>
                    <Input
                      id="remote-url"
                      value={remoteUrl}
                      onChange={(e) => setRemoteUrl(e.target.value)}
                      placeholder="ssh://user@host:22"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
          
          <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
            <Check className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
