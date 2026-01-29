import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Webhook, Clock, History, Zap } from "lucide-react";
import WebhooksManager from "@/components/automation/WebhooksManager";
import ScheduledTasksManager from "@/components/automation/ScheduledTasksManager";
import DeliveryHistory from "@/components/automation/DeliveryHistory";
import ExecutionHistory from "@/components/automation/ExecutionHistory";

export default function Automation() {
  const [activeTab, setActiveTab] = useState("webhooks");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold">Automation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Connect Chofesh.ai to your workflows with webhooks and scheduled tasks. 
          Automate AI operations and integrate with Zapier, Make.com, n8n, and custom apps.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to receive events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Running on schedule</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deliveries (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Webhooks delivered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Executions (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Tasks
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Delivery History
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Execution History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhooksManager />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ScheduledTasksManager />
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <DeliveryHistory />
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <ExecutionHistory />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="mt-8 border-purple-500/20 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Getting Started with Automation
          </CardTitle>
          <CardDescription>
            Learn how to connect Chofesh.ai to your favorite tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
              <a href="/docs/integrations/zapier" target="_blank">
                <div className="text-left">
                  <div className="font-semibold mb-1">Zapier Integration</div>
                  <div className="text-xs text-muted-foreground">Connect to 5000+ apps</div>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
              <a href="/docs/integrations/make" target="_blank">
                <div className="text-left">
                  <div className="font-semibold mb-1">Make.com Integration</div>
                  <div className="text-xs text-muted-foreground">Build visual workflows</div>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
              <a href="/docs/integrations/n8n" target="_blank">
                <div className="text-left">
                  <div className="font-semibold mb-1">n8n Integration</div>
                  <div className="text-xs text-muted-foreground">Self-hosted automation</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
