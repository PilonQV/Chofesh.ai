import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  ArrowLeft,
  BarChart3,
  MessageSquare,
  Image,
  FileText,
  TrendingUp,
  DollarSign,
  Zap,
  Loader2,
  Settings,
} from "lucide-react";

type TimeRange = "7d" | "30d" | "90d" | "all";

export default function Usage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date | undefined;
    
    switch (timeRange) {
      case "7d":
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        start = undefined;
        break;
    }
    
    return { startDate: start, endDate: end };
  }, [timeRange]);

  const { data: stats, isLoading: statsLoading } = trpc.usage.stats.useQuery(
    timeRange === "all" ? undefined : dateRange,
    { enabled: isAuthenticated }
  );

  const { data: recentUsage, isLoading: recentLoading } = trpc.usage.recent.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCost = (cost: number) => {
    if (cost < 0.01) return "<$0.01";
    return "$" + cost.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Usage Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Your Usage</h1>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Zap className="w-5 h-5" />}
              title="Total Tokens"
              value={formatNumber(stats?.totalTokens || 0)}
              description="Tokens used"
              color="text-yellow-500"
              bgColor="bg-yellow-500/10"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Total Requests"
              value={formatNumber(stats?.totalRequests || 0)}
              description="API calls made"
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              title="Estimated Cost"
              value={formatCost(stats?.totalCost || 0)}
              description="Based on usage"
              color="text-green-500"
              bgColor="bg-green-500/10"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Avg per Day"
              value={formatNumber(Math.round((stats?.totalRequests || 0) / (timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 30)))}
              description="Requests/day"
              color="text-purple-500"
              bgColor="bg-purple-500/10"
            />
          </div>

          {/* Usage by Type */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Type</CardTitle>
                <CardDescription>Breakdown of your activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <UsageTypeRow
                    icon={<MessageSquare className="w-5 h-5" />}
                    label="Chat"
                    count={stats?.byType?.chat?.count || 0}
                    tokens={stats?.byType?.chat?.tokens || 0}
                    color="text-blue-500"
                  />
                  <UsageTypeRow
                    icon={<Image className="w-5 h-5" />}
                    label="Image Generation"
                    count={stats?.byType?.image_generation?.count || 0}
                    tokens={0}
                    color="text-purple-500"
                  />
                  <UsageTypeRow
                    icon={<FileText className="w-5 h-5" />}
                    label="Document Chat"
                    count={stats?.byType?.document_chat?.count || 0}
                    tokens={stats?.byType?.document_chat?.tokens || 0}
                    color="text-green-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>Requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.byDay && stats.byDay.length > 0 ? (
                  <div className="h-48 flex items-end gap-1">
                    {stats.byDay.slice(-14).map((day, index) => {
                      const maxRequests = Math.max(...stats.byDay.map((d) => d.requests));
                      const height = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {day.date}: {day.requests} requests
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No activity data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest API usage</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : recentUsage && recentUsage.length > 0 ? (
                <div className="space-y-2">
                  {recentUsage.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          record.actionType === "chat" ? "bg-blue-500/10 text-blue-500" :
                          record.actionType === "image_generation" ? "bg-purple-500/10 text-purple-500" :
                          "bg-green-500/10 text-green-500"
                        }`}>
                          {record.actionType === "chat" ? <MessageSquare className="w-4 h-4" /> :
                           record.actionType === "image_generation" ? <Image className="w-4 h-4" /> :
                           <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{record.actionType.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(record.totalTokens || 0)} tokens</p>
                        <p className="text-xs text-muted-foreground">
                          ~{formatCost(parseFloat(record.estimatedCost || "0"))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageTypeRow({
  icon,
  label,
  count,
  tokens,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  tokens: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-right">
        <p className="font-medium">{count} requests</p>
        {tokens > 0 && (
          <p className="text-xs text-muted-foreground">{tokens.toLocaleString()} tokens</p>
        )}
      </div>
    </div>
  );
}
