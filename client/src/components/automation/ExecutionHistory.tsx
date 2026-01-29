import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, AlertCircle, Ban } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function ExecutionHistory() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: executions } = trpc.automation.listTaskExecutions.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "timeout":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "cancelled":
        return <Ban className="h-4 w-4 text-gray-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Task Execution History</h2>
          <p className="text-muted-foreground">Monitor scheduled task executions and results</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="timeout">Timeout</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {executions && executions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No task executions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {executions?.map((execution: any) => (
            <Card key={execution.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getStatusIcon(execution.status)}
                      <CardTitle className="text-base">Task Execution</CardTitle>
                      <Badge variant={
                        execution.status === "completed" ? "default" :
                        execution.status === "failed" || execution.status === "timeout" ? "destructive" :
                        execution.status === "running" ? "secondary" : "outline"
                      }>
                        {execution.status}
                      </Badge>
                      <Badge variant="outline">{execution.triggeredBy}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Started: {formatDate(execution.startedAt)}
                    </CardDescription>
                  </div>
                  {execution.durationMs && (
                    <Badge variant="outline" className="font-mono">
                      {formatDuration(execution.durationMs)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {execution.completedAt && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Completed:</span>{" "}
                    <span className="font-medium">{formatDate(execution.completedAt)}</span>
                  </div>
                )}
                
                {execution.errorMessage && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                    <span className="text-red-500 font-medium">Error:</span>{" "}
                    <span className="text-muted-foreground">{execution.errorMessage}</span>
                  </div>
                )}
                
                {execution.result && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View Result
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(execution.result, null, 2)}
                    </pre>
                  </details>
                )}
                
                {execution.errorStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {execution.errorStack}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
