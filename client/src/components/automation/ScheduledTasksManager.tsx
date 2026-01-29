import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, Clock, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import CronBuilder from "./CronBuilder";

const TASK_TYPES = [
  { value: "chat_completion", label: "Chat Completion", description: "Generate AI chat responses" },
  { value: "project_builder", label: "Project Builder", description: "Create autonomous projects (books, websites, apps)" },
  { value: "data_analysis", label: "Data Analysis", description: "Analyze data and generate insights" },
  { value: "document_summary", label: "Document Summary", description: "Summarize documents and text" },
];

const CRON_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 9 AM", value: "0 9 * * *" },
  { label: "Every weekday at 9 AM", value: "0 9 * * 1-5" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "First day of month at 9 AM", value: "0 9 1 * *" },
];

export default function ScheduledTasksManager() {

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleCron, setScheduleCron] = useState("0 9 * * *");
  const [taskType, setTaskType] = useState("chat_completion");
  const [taskConfig, setTaskConfig] = useState("{}");
  const [timeoutMinutes, setTimeoutMinutes] = useState(5);

  const { data: tasks, refetch } = trpc.automation.listScheduledTasks.useQuery();
  const createTask = trpc.automation.createScheduledTask.useMutation();
  const updateTask = trpc.automation.updateScheduledTask.useMutation();
  const deleteTask = trpc.automation.deleteScheduledTask.useMutation();
  const runTask = trpc.automation.runTaskNow.useMutation();
  const validateCron = trpc.automation.validateCron.useQuery(
    { cron: scheduleCron },
    { enabled: scheduleCron.length > 0 }
  );

  const handleCreate = async () => {
    if (!name || !scheduleCron) {
      toast.error("Please fill in all required fields");
      return;
    }

    let config;
    try {
      config = JSON.parse(taskConfig);
    } catch (error) {
      toast.error("Task configuration must be valid JSON");
      return;
    }

    try {
      await createTask.mutateAsync({
        name,
        description,
        scheduleCron,
        taskType,
        taskConfig: config,
        timeoutMinutes,
      });
      
      toast.success("Scheduled task created successfully");
      
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setScheduleCron("0 9 * * *");
    setTaskType("chat_completion");
    setTaskConfig("{}");
    setTimeoutMinutes(5);
  };

  const handleToggle = async (taskId: string, active: boolean) => {
    try {
      await updateTask.mutateAsync({
        taskId,
        active,
      });
      
      toast.success(`Task ${active ? "enabled" : "disabled"}`);
      
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await deleteTask.mutateAsync({ taskId });
      
      toast.success("Task deleted successfully");
      
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    }
  };

  const handleRunNow = async (taskId: string) => {
    try {
      await runTask.mutateAsync({ taskId });
      
      toast.success("Task execution triggered");
    } catch (error: any) {
      toast.error(error.message || "Failed to run task");
    }
  };

  const formatNextRun = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Tasks</h2>
          <p className="text-muted-foreground">Automate AI operations on a schedule</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Scheduled Task</DialogTitle>
              <DialogDescription>
                Configure a task to run automatically on a schedule
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Task Name *</Label>
                  <Input
                    id="name"
                    placeholder="Daily Summary Report"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type *</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this task do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Schedule *</Label>
                <Select value={scheduleCron} onValueChange={setScheduleCron}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    {CRON_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label} ({preset.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter custom cron expression"
                  value={scheduleCron}
                  onChange={(e) => setScheduleCron(e.target.value)}
                  className="font-mono"
                />
                {validateCron.data && (
                  <div className="text-sm">
                    {validateCron.data.valid ? (
                      <div className="text-green-600">
                        ✓ Valid cron expression. Next runs:
                        <ul className="list-disc list-inside mt-1 text-muted-foreground">
                          {validateCron.data.nextRuns?.slice(0, 3).map((run, i) => (
                            <li key={i}>{new Date(run).toLocaleString()}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ✗ Invalid cron expression: {validateCron.data.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taskConfig">Task Configuration (JSON) *</Label>
                <Textarea
                  id="taskConfig"
                  placeholder='{"prompt": "Generate a daily summary", "model": "gpt-4o-mini"}'
                  value={taskConfig}
                  onChange={(e) => setTaskConfig(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Configuration depends on task type. For chat_completion: {"{"}"prompt", "model"{"}"}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (minutes)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min={1}
                  max={60}
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createTask.isPending}>
                {createTask.isPending ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks List */}
      {tasks && tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No scheduled tasks yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks?.map((task: any) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{task.name}</CardTitle>
                      <Badge variant={task.active ? "default" : "secondary"}>
                        {task.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{task.taskType}</Badge>
                    </div>
                    {task.description && (
                      <CardDescription>{task.description}</CardDescription>
                    )}
                  </div>
                  <Switch
                    checked={task.active}
                    onCheckedChange={(checked) => handleToggle(task.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Schedule Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Schedule</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm font-mono">{task.scheduleCron}</code>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Next Run</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatNextRun(task.nextRunAt)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Last Run Status */}
                {task.lastRunAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Run</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">{formatNextRun(task.lastRunAt)}</span>
                      {task.lastStatus && (
                        <Badge variant={task.lastStatus === "success" ? "default" : "destructive"}>
                          {task.lastStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunNow(task.id)}
                    disabled={runTask.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(task.id)}
                    disabled={deleteTask.isPending}
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
