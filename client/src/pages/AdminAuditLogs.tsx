import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Settings,
  Clock,
  User,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Flag,
  Shield,
  Loader2,
} from "lucide-react";

// Flag reason labels for display
const FLAG_REASON_LABELS: Record<string, string> = {
  nsfw_content: "NSFW/Adult Content",
  violence: "Violence/Threats",
  hate_speech: "Hate Speech",
  illegal_activity: "Illegal Activity",
  self_harm: "Self-Harm",
  spam: "Spam",
  harassment: "Harassment",
  other: "Other Violation",
};

// Flag severity colors
const FLAG_SEVERITY_COLORS: Record<string, string> = {
  nsfw_content: "bg-orange-500/20 text-orange-500 border-orange-500/50",
  violence: "bg-red-500/20 text-red-500 border-red-500/50",
  hate_speech: "bg-red-500/20 text-red-500 border-red-500/50",
  illegal_activity: "bg-red-600/20 text-red-600 border-red-600/50",
  self_harm: "bg-red-600/20 text-red-600 border-red-600/50",
  spam: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
  harassment: "bg-orange-500/20 text-orange-500 border-orange-500/50",
  other: "bg-gray-500/20 text-gray-500 border-gray-500/50",
};

export default function AdminAuditLogs() {
  const [activeTab, setActiveTab] = useState("api-calls");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [flaggedOnlyFilter, setFlaggedOnlyFilter] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 50;

  // API Call Logs Query
  const apiCallLogsQuery = trpc.adminAudit.getApiCallLogs.useQuery({
    userId: userIdFilter ? parseInt(userIdFilter) : undefined,
    userEmail: userEmailFilter || undefined,
    actionType: actionTypeFilter !== "all" ? actionTypeFilter : undefined,
    isFlagged: flaggedOnlyFilter ? true : undefined,
    limit,
    offset: page * limit,
  }, {
    refetchOnWindowFocus: false,
  });

  // Image Access Logs Query
  const imageLogsQuery = trpc.adminAudit.getImageAccessLogs.useQuery({
    userId: userIdFilter ? parseInt(userIdFilter) : undefined,
    actionType: actionTypeFilter !== "all" ? actionTypeFilter : undefined,
    limit,
    offset: page * limit,
  }, {
    refetchOnWindowFocus: false,
  });

  // Stats Query
  const statsQuery = trpc.adminAudit.getApiCallStats.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Retention Settings
  const retentionQuery = trpc.adminAudit.getRetentionDays.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  
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
      handleRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        apiCallLogsQuery.refetch(),
        imageLogsQuery.refetch(),
        statsQuery.refetch(),
      ]);
      toast.success("Logs refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh logs");
    } finally {
      setIsRefreshing(false);
    }
  }, [apiCallLogsQuery, imageLogsQuery, statsQuery]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Count flagged logs
  const flaggedCount = apiCallLogsQuery.data?.filter((log: any) => log.isFlagged).length || 0;

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
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <Card className={flaggedCount > 0 ? "border-red-500/50 bg-red-500/5" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flag className="h-4 w-4 text-red-500" />
                Flagged Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${flaggedCount > 0 ? "text-red-500" : ""}`}>
                {flaggedCount}
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

              <div className="flex items-end gap-2">
                <Button
                  variant={flaggedOnlyFilter ? "destructive" : "outline"}
                  onClick={() => {
                    setFlaggedOnlyFilter(!flaggedOnlyFilter);
                    setPage(0);
                  }}
                  className="gap-2"
                >
                  <Flag className="h-4 w-4" />
                  {flaggedOnlyFilter ? "Showing Flagged Only" : "Show Flagged Only"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUserIdFilter("");
                    setUserEmailFilter("");
                    setActionTypeFilter("all");
                    setFlaggedOnlyFilter(false);
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
                <CardTitle className="flex items-center gap-2">
                  API Call Logs
                  {flaggedCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {flaggedCount} Flagged
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Full prompts and responses for all chat interactions. Red flags indicate policy violations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiCallLogsQuery.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
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
                            log.isFlagged 
                              ? "border-red-500/50 bg-red-500/5 hover:bg-red-500/10" 
                              : ""
                          }`}
                          onClick={() => setSelectedLog(log)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {/* Flag indicator */}
                                {log.isFlagged && (
                                  <Badge 
                                    variant="outline" 
                                    className={`gap-1 ${FLAG_SEVERITY_COLORS[log.flagReason] || FLAG_SEVERITY_COLORS.other}`}
                                  >
                                    <Flag className="h-3 w-3" />
                                    {FLAG_REASON_LABELS[log.flagReason] || "Flagged"}
                                  </Badge>
                                )}
                                <Badge variant="outline">{log.actionType}</Badge>
                                <Badge variant="secondary">{log.modelUsed}</Badge>
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
                                <span className={log.isFlagged ? "text-red-400" : ""}>
                                  {truncateText(log.prompt, 150)}
                                </span>
                              </div>
                              {log.flagDetails && (
                                <div className="text-sm text-red-400 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {log.flagDetails}
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">Response:</span>{" "}
                                {truncateText(log.response, 150)}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
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
                    Page {page + 1} • {apiCallLogsQuery.data?.length || 0} results
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
                  Generated images with prompts used. Red flags indicate policy violations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {imageLogsQuery.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
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
                          className={`border rounded-lg p-4 hover:bg-accent/50 transition-colors ${
                            log.isFlagged 
                              ? "border-red-500/50 bg-red-500/5 hover:bg-red-500/10" 
                              : ""
                          }`}
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
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {/* Flag indicator */}
                                {log.isFlagged && (
                                  <Badge 
                                    variant="outline" 
                                    className={`gap-1 ${FLAG_SEVERITY_COLORS[log.flagReason] || FLAG_SEVERITY_COLORS.other}`}
                                  >
                                    <Flag className="h-3 w-3" />
                                    {FLAG_REASON_LABELS[log.flagReason] || "Flagged"}
                                  </Badge>
                                )}
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
                                <span className={log.isFlagged ? "text-red-400" : ""}>
                                  {truncateText(log.prompt, 100)}
                                </span>
                              </div>
                              {log.flagDetails && (
                                <div className="text-sm text-red-400 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {log.flagDetails}
                                </div>
                              )}
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
                    Page {page + 1} • {imageLogsQuery.data?.length || 0} results
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
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Content Moderation
                  </CardTitle>
                  <CardDescription>
                    Automatic content moderation flags policy-violating prompts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(FLAG_REASON_LABELS).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`gap-1 ${FLAG_SEVERITY_COLORS[key]}`}
                          >
                            <Flag className="h-3 w-3" />
                            {label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Content is automatically analyzed for policy violations including NSFW content, 
                      violence, hate speech, illegal activities, self-harm, spam, and harassment.
                      Flagged content is highlighted in red in the logs above.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retention Settings</CardTitle>
                  <CardDescription>
                    Configure how long audit logs are retained
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Retention Period (days)</Label>
                      <Input
                        type="number"
                        min={7}
                        max={365}
                        defaultValue={retentionQuery.data?.days || 90}
                        onChange={(e) => {
                          const days = parseInt(e.target.value);
                          if (days >= 7 && days <= 365) {
                            setRetentionMutation.mutate({ days });
                          }
                        }}
                      />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          Cleanup Old Logs
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Old Logs?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all logs older than {retentionQuery.data?.days || 90} days.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cleanupMutation.mutate({ olderThanDays: retentionQuery.data?.days || 90 })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Log Details
                {selectedLog?.isFlagged && (
                  <Badge 
                    variant="outline" 
                    className={`gap-1 ${FLAG_SEVERITY_COLORS[selectedLog.flagReason] || FLAG_SEVERITY_COLORS.other}`}
                  >
                    <Flag className="h-3 w-3" />
                    {FLAG_REASON_LABELS[selectedLog.flagReason] || "Flagged"}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Full details for log #{selectedLog?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                {selectedLog.isFlagged && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50">
                    <div className="flex items-center gap-2 text-red-500 font-medium mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      Content Moderation Alert
                    </div>
                    <p className="text-sm text-red-400">
                      <strong>Reason:</strong> {FLAG_REASON_LABELS[selectedLog.flagReason] || selectedLog.flagReason}
                    </p>
                    {selectedLog.flagDetails && (
                      <p className="text-sm text-red-400 mt-1">
                        <strong>Details:</strong> {selectedLog.flagDetails}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">User</Label>
                    <p>#{selectedLog.userId} - {selectedLog.userEmail || "No email"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Action Type</Label>
                    <p>{selectedLog.actionType}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model Used</Label>
                    <p>{selectedLog.modelUsed || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Duration</Label>
                    <p>{selectedLog.durationMs}ms</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tokens</Label>
                    <p>In: {selectedLog.tokensInput || 0} / Out: {selectedLog.tokensOutput || 0}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p>{selectedLog.status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">IP Address</Label>
                    <p>{selectedLog.ipAddress || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created At</Label>
                    <p>{formatDate(selectedLog.createdAt)}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">System Prompt</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedLog.systemPrompt || "No system prompt"}
                  </pre>
                </div>
                
                <div>
                  <Label className={`text-muted-foreground ${selectedLog.isFlagged ? "text-red-400" : ""}`}>
                    Prompt {selectedLog.isFlagged && "(Flagged)"}
                  </Label>
                  <pre className={`mt-1 p-3 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto ${
                    selectedLog.isFlagged ? "bg-red-500/10 border border-red-500/30" : "bg-muted"
                  }`}>
                    {selectedLog.prompt || "No prompt"}
                  </pre>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Response</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {selectedLog.response || "No response"}
                  </pre>
                </div>
                
                {selectedLog.errorMessage && (
                  <div>
                    <Label className="text-red-500">Error Message</Label>
                    <pre className="mt-1 p-3 bg-red-500/10 rounded-lg text-sm text-red-500 whitespace-pre-wrap">
                      {selectedLog.errorMessage}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
