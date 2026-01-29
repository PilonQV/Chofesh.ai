import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function DeliveryHistory() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: deliveries } = trpc.automation.listWebhookDeliveries.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "retrying":
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Webhook Delivery History</h2>
          <p className="text-muted-foreground">Track webhook delivery attempts and responses</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="retrying">Retrying</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {deliveries && deliveries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No webhook deliveries yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deliveries?.map((delivery: any) => (
            <Card key={delivery.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getStatusIcon(delivery.status)}
                      <CardTitle className="text-base">{delivery.eventType}</CardTitle>
                      <Badge variant={delivery.status === "delivered" ? "default" : delivery.status === "failed" ? "destructive" : "secondary"}>
                        {delivery.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {formatDate(delivery.createdAt)}
                    </CardDescription>
                  </div>
                  {delivery.responseStatus && (
                    <Badge variant="outline" className="font-mono">
                      {delivery.responseStatus}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Attempts:</span>{" "}
                    <span className="font-medium">{delivery.attempts} / {delivery.maxAttempts}</span>
                  </div>
                  {delivery.deliveredAt && (
                    <div>
                      <span className="text-muted-foreground">Delivered:</span>{" "}
                      <span className="font-medium">{formatDate(delivery.deliveredAt)}</span>
                    </div>
                  )}
                  {delivery.nextRetryAt && (
                    <div>
                      <span className="text-muted-foreground">Next Retry:</span>{" "}
                      <span className="font-medium">{formatDate(delivery.nextRetryAt)}</span>
                    </div>
                  )}
                </div>
                
                {delivery.errorMessage && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm">
                    <span className="text-red-500 font-medium">Error:</span>{" "}
                    <span className="text-muted-foreground">{delivery.errorMessage}</span>
                  </div>
                )}
                
                {delivery.responseBody && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View Response
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {delivery.responseBody}
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
