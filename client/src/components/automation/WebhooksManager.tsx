import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, TestTube, Copy, Eye, EyeOff, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const WEBHOOK_EVENTS = [
  { value: "task.completed", label: "Task Completed", description: "Triggered when a scheduled task completes successfully" },
  { value: "task.failed", label: "Task Failed", description: "Triggered when a scheduled task fails" },
  { value: "task.started", label: "Task Started", description: "Triggered when a scheduled task starts execution" },
  { value: "project.created", label: "Project Created", description: "Triggered when a new project is created" },
  { value: "project.completed", label: "Project Completed", description: "Triggered when a project generation completes" },
  { value: "project.failed", label: "Project Failed", description: "Triggered when a project generation fails" },
  { value: "chat.message", label: "Chat Message", description: "Triggered for each chat message" },
  { value: "chat.completed", label: "Chat Completed", description: "Triggered when a chat response is completed" },
];

export default function WebhooksManager() {

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  
  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const { data: webhooks, refetch } = trpc.automation.listWebhooks.useQuery();
  const createWebhook = trpc.automation.createWebhook.useMutation();
  const updateWebhook = trpc.automation.updateWebhook.useMutation();
  const deleteWebhook = trpc.automation.deleteWebhook.useMutation();
  const testWebhook = trpc.automation.testWebhook.useMutation();

  const handleCreate = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      toast.error("Please fill in all fields and select at least one event");
      return;
    }

    try {
      await createWebhook.mutateAsync({
        name,
        url,
        events: selectedEvents,
      });
      
      toast.success("Webhook created successfully");
      
      setIsCreateOpen(false);
      setName("");
      setUrl("");
      setSelectedEvents([]);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create webhook");
    }
  };

  const handleToggle = async (webhookId: string, active: boolean) => {
    try {
      await updateWebhook.mutateAsync({
        webhookId,
        active,
      });
      
      toast.success(`Webhook ${active ? "enabled" : "disabled"}`);
      
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update webhook");
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    
    try {
      await deleteWebhook.mutateAsync({ webhookId });
      
      toast.success("Webhook deleted successfully");
      
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete webhook");
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      const result = await testWebhook.mutateAsync({ webhookId });
      
      toast.success(`Test successful - status ${result.message}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to test webhook");
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("Webhook secret copied to clipboard");
  };

  const toggleEventSelection = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-muted-foreground">Receive real-time notifications when events occur</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook to receive event notifications
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Webhook Name</Label>
                <Input
                  id="name"
                  placeholder="My Webhook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-app.com/webhooks/chofesh"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This URL will receive POST requests when events occur
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="space-y-3 border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-start space-x-3">
                      <Checkbox
                        id={event.value}
                        checked={selectedEvents.includes(event.value)}
                        onCheckedChange={() => toggleEventSelection(event.value)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={event.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {event.label}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select at least one event to receive notifications
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createWebhook.isPending}>
                {createWebhook.isPending ? "Creating..." : "Create Webhook"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      {webhooks && webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No webhooks configured yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks?.map((webhook: any) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{webhook.name}</CardTitle>
                      <Badge variant={webhook.active ? "default" : "secondary"}>
                        {webhook.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      {webhook.url}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={webhook.active}
                    onCheckedChange={(checked) => handleToggle(webhook.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Events */}
                <div>
                  <Label className="text-xs text-muted-foreground">Subscribed Events</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {webhook.events.map((event: string) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Secret */}
                <div>
                  <Label className="text-xs text-muted-foreground">Webhook Secret</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type={showSecret[webhook.id] ? "text" : "password"}
                      value={webhook.secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowSecret(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))}
                    >
                      {showSecret[webhook.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copySecret(webhook.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use this secret to verify webhook signatures
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(webhook.id)}
                    disabled={testWebhook.isPending}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Webhook
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(webhook.id)}
                    disabled={deleteWebhook.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
