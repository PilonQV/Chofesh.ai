import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import {
  MessageSquare,
  Image,
  Search,
  Trash2,
  Settings,
  Clock,
  User,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export default function AdminAuditLogs() {
  const [activeTab, setActiveTab] = useState("api-calls");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [uncensoredFilter, setUncensoredFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [page, setPage] = useState(0);
  const limit = 50;

  // API Call Logs Query
  const apiCallLogsQuery = trpc.adminAudit.getApiCallLogs.useQuery({
    userId: userIdFilter ? parseInt(userIdFilter) : undefined,
    userEmail: userEmailFilter || undefined,
    actionType: actionTypeFilter !== "all" ? actionTypeFilter : undefined,
    isUncensored: uncensoredFilter === "uncensored" ? true : uncensoredFilter === "normal" ? false : undefined,
    limit,
    offset: page * limit,
  });

  // Image Access Logs Query
  const imageLogsQuery = trpc.adminAudit.getImageAccessLogs.useQuery({
    userId: userIdFilter ? parseInt(userIdFilter) : undefined,
    actionType: actionTypeFilter !== "all" ? actionTypeFilter : undefined,
    limit,
    offset: page * limit,
  });

  // Stats Query
  const statsQuery = trpc.adminAudit.getApiCallStats.useQuery();

  // Retention Settings
  const retentionQuery = trpc.adminAudit.getRetentionDays.useQuery();
  const setRetentionMutation = trpc.adminAudit.setRetentionDays.useMutation({
    onSuccess: () => {
      toast.success("Retention period updated");
      retentionQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Cleanup Mutation
  const cleanupMutation = trpc.adminAudit.cleanupOldLogs.useMutation({
    onSuccess: (data) => {
      toast.success(`Deleted ${data.apiCallLogsDeleted} API logs and ${data.imageAccessLogsDeleted} image logs`);
      apiCallLogsQuery.refetch();
      imageLogsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">
              View and manage user activity logs for debugging and compliance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                apiCallLogsQuery.refetch();
                imageLogsQuery.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total API Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsQuery.data?.totalCalls?.toLocaleString() || "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsQuery.data?.callsByUser?.length || "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsQuery.data?.totalCalls
                  ? `${statsQuery.data.totalCalls} calls`
                  : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Retention Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {retentionQuery.data?.days || 90} days
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Filter by user ID"
                  value={userIdFilter}
                  onChange={(e) => {
                    setUserIdFilter(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="userEmail">User Email</Label>
                <Input
                  id="userEmail"
                  placeholder="Search by email"
                  value={userEmailFilter}
                  onChange={(e) => {
                    setUserEmailFilter(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="actionType">Action Type</Label>
                <Select
                  value={actionTypeFilter}
                  onValueChange={(value) => {
                    setActionTypeFilter(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="image_generation">Image Generation</SelectItem>
                    <SelectItem value="document_upload">Document Upload</SelectItem>
                    <SelectItem value="code_review">Code Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="uncensoredFilter">Content Filter</Label>
                <Select
                  value={uncensoredFilter}
                  onValueChange={(value) => {
                    setUncensoredFilter(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All content" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="uncensored">Uncensored Only</SelectItem>
                    <SelectItem value="normal">Normal Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUserIdFilter("");
                    setUserEmailFilter("");
                    setActionTypeFilter("all");
                    setUncensoredFilter("all");
                    setPage(0);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="api-calls" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              API Calls
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Image className="h-4 w-4" />
              Image Access
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* API Calls Tab */}
          <TabsContent value="api-calls" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>API Call Logs</CardTitle>
                <CardDescription>
                  Full prompts and responses for all chat interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiCallLogsQuery.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading logs...
                  </div>
                ) : apiCallLogsQuery.data?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs found
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {apiCallLogsQuery.data?.map((log: any) => (
                        <div
                          key={log.id}
                          className={`border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                            log.isUncensored 
                              ? "border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10" 
                              : ""
                          }`}
                          onClick={() => setSelectedLog(log)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{log.actionType}</Badge>
                                <Badge variant="secondary">{log.modelUsed}</Badge>
                                {log.isUncensored && (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Uncensored
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {log.durationMs}ms
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <User className="h-3 w-3" />
                                <span>
                                  User #{log.userId} • {log.userEmail || "No email"}
                                </span>
                                <Clock className="h-3 w-3 ml-2" />
                                <span>{formatDate(log.createdAt)}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Prompt:</span>{" "}
                                {truncateText(log.prompt, 150)}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">Response:</span>{" "}
                                {truncateText(log.response, 150)}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(apiCallLogsQuery.data?.length || 0) < limit}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Image Access Logs</CardTitle>
                <CardDescription>
                  Generated images with prompts used
                </CardDescription>
              </CardHeader>
              <CardContent>
                {imageLogsQuery.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading logs...
                  </div>
                ) : imageLogsQuery.data?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No image logs found
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {imageLogsQuery.data?.map((log: any) => (
                        <div
                          key={log.id}
                          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex gap-4">
                            {log.imageUrl && (
                              <img
                                src={log.imageUrl}
                                alt="Generated"
                                className="w-20 h-20 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{log.actionType}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <User className="h-3 w-3" />
                                <span>
                                  User #{log.userId} • {log.userEmail || "No email"}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Prompt:</span>{" "}
                                {truncateText(log.prompt, 100)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDate(log.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(imageLogsQuery.data?.length || 0) < limit}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Retention Policy</CardTitle>
                  <CardDescription>
                    Configure how long audit logs are kept
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Retention Period (days)</Label>
                      <Select
                        value={retentionQuery.data?.days?.toString() || "90"}
                        onValueChange={(value) => {
                          setRetentionMutation.mutate({ days: parseInt(value) });
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="365">365 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Cleanup</CardTitle>
                  <CardDescription>
                    Delete old logs manually
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clean Up Old Logs
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Delete Old Audit Logs
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all audit logs older than{" "}
                          {retentionQuery.data?.days || 90} days. This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            cleanupMutation.mutate({
                              olderThanDays: retentionQuery.data?.days || 90,
                            });
                          }}
                        >
                          Delete Logs
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>API Call Details</DialogTitle>
              <DialogDescription>
                Full content of the API call log
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">User</Label>
                    <p>
                      #{selectedLog.userId} • {selectedLog.userEmail || "No email"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model</Label>
                    <p>{selectedLog.modelUsed}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Timestamp</Label>
                    <p>{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Duration</Label>
                    <p>{selectedLog.durationMs}ms</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tokens (In/Out)</Label>
                    <p>
                      {selectedLog.tokensInput} / {selectedLog.tokensOutput}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">IP Address</Label>
                    <p>{selectedLog.ipAddress || "Unknown"}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-muted-foreground">System Prompt</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                    {selectedLog.systemPrompt || "No system prompt"}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">User Prompt</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {selectedLog.prompt}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">AI Response</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                    {selectedLog.response}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
