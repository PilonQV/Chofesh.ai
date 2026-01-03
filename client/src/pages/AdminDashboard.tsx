import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Users,
  FileText,
  Activity,
  Shield,
  MessageSquare,
  Image,
  LogIn,
  LogOut,
  Settings,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  CreditCard,
  Zap,
  Star,
  Crown,
  Infinity,
  Key,
  BarChart3,
  UserPlus,
  UserCheck,
  Timer,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="w-4 h-4" />,
  image_generation: <Image className="w-4 h-4" />,
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
  settings_change: <Settings className="w-4 h-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  chat: "bg-blue-500/10 text-blue-500",
  image_generation: "bg-purple-500/10 text-purple-500",
  login: "bg-green-500/10 text-green-500",
  logout: "bg-orange-500/10 text-orange-500",
  settings_change: "bg-gray-500/10 text-gray-500",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-4 h-4" />,
  starter: <Star className="w-4 h-4" />,
  pro: <Crown className="w-4 h-4" />,
  unlimited: <Infinity className="w-4 h-4" />,
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/10 text-blue-500",
  pro: "bg-primary/10 text-primary",
  unlimited: "bg-amber-500/10 text-amber-500",
};

function StatsCard({ 
  title, 
  value, 
  icon, 
  loading, 
  subtitle,
  trend,
  className = ""
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  loading?: boolean;
  subtitle?: string;
  trend?: { value: number; label: string };
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold">{value}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
                {trend && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className={`w-3 h-3 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={trend.value >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {trend.value >= 0 ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-muted-foreground">{trend.label}</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionPieChart({ data }: { data: { free: number; starter: number; pro: number; unlimited: number } }) {
  const total = data.free + data.starter + data.pro + data.unlimited;
  if (total === 0) return <p className="text-muted-foreground text-center py-4">No users yet</p>;
  
  const segments = [
    { key: 'free', label: 'Free', count: data.free, color: 'bg-muted' },
    { key: 'starter', label: 'Starter', count: data.starter, color: 'bg-blue-500' },
    { key: 'pro', label: 'Pro', count: data.pro, color: 'bg-primary' },
    { key: 'unlimited', label: 'Unlimited', count: data.unlimited, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-3">
      {segments.map(seg => (
        <div key={seg.key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${seg.color}`} />
              <span>{seg.label}</span>
            </div>
            <span className="font-medium">{seg.count} ({Math.round(seg.count / total * 100)}%)</span>
          </div>
          <Progress value={seg.count / total * 100} className="h-2" />
        </div>
      ))}
    </div>
  );
}

const REFRESH_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '15s', value: 15000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
];

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000); // Default 30s
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);
  const pageSize = 20;

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.auditStats.useQuery();
  const { data: dashboardStats, isLoading: dashboardLoading, refetch: refetchDashboard } = trpc.admin.dashboardStats.useQuery();
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = trpc.admin.auditLogs.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    actionType: actionFilter === "all" ? undefined : actionFilter,
  });
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.users.useQuery();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      refetchUsers();
    },
    onError: () => {
      toast.error("Failed to update user role");
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshInterval === 0) {
      setCountdown(0);
      return;
    }

    // Set initial countdown
    setCountdown(autoRefreshInterval / 1000);

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return autoRefreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    // Refresh timer
    const refreshTimer = setInterval(() => {
      refetchStats();
      refetchDashboard();
      refetchLogs();
      refetchUsers();
      setLastRefresh(new Date());
    }, autoRefreshInterval);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(refreshTimer);
    };
  }, [autoRefreshInterval, refetchStats, refetchDashboard, refetchLogs, refetchUsers]);

  const handleRefresh = () => {
    refetchStats();
    refetchDashboard();
    refetchLogs();
    refetchUsers();
    setLastRefresh(new Date());
    setCountdown(autoRefreshInterval / 1000);
    toast.success("Data refreshed");
  };

  const handleRoleChange = (userId: number, newRole: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const totalPages = Math.ceil((logsData?.total || 0) / pageSize);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-refresh controls */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={autoRefreshInterval.toString()} 
                onValueChange={(v) => setAutoRefreshInterval(parseInt(v))}
              >
                <SelectTrigger className="w-20 h-7 border-0 bg-transparent p-0 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFRESH_INTERVALS.map(interval => (
                    <SelectItem key={interval.value} value={interval.value.toString()}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {autoRefreshInterval > 0 && (
                <span className="text-xs text-muted-foreground min-w-[24px]">
                  {countdown}s
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </Link>
            <Link href="/image">
              <Button variant="ghost" size="sm">
                <Image className="w-4 h-4 mr-2" />
                Images
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Revenue & Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Monthly Revenue (MRR)"
            value={`$${dashboardStats?.revenue.mrr.toFixed(2) || '0.00'}`}
            icon={<DollarSign className="w-5 h-5" />}
            loading={dashboardLoading}
            subtitle={`ARR: $${dashboardStats?.revenue.projectedArr.toFixed(2) || '0.00'}`}
            className="border-green-500/20"
          />
          <StatsCard
            title="Paid Subscribers"
            value={dashboardStats?.revenue.paidUsers || 0}
            icon={<CreditCard className="w-5 h-5" />}
            loading={dashboardLoading}
            subtitle={`${dashboardStats?.revenue.conversionRate || 0}% conversion`}
          />
          <StatsCard
            title="Total Users"
            value={dashboardStats?.users.total || 0}
            icon={<Users className="w-5 h-5" />}
            loading={dashboardLoading}
            subtitle={`+${dashboardStats?.users.newLast7Days || 0} this week`}
          />
          <StatsCard
            title="Active Users (7d)"
            value={dashboardStats?.users.activeLast7Days || 0}
            icon={<UserCheck className="w-5 h-5" />}
            loading={dashboardLoading}
          />
        </div>

        {/* Second Row - Usage & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Queries Today"
            value={dashboardStats?.usage.queriesToday || 0}
            icon={<MessageSquare className="w-5 h-5" />}
            loading={dashboardLoading}
          />
          <StatsCard
            title="Total Events"
            value={stats?.total || 0}
            icon={<Activity className="w-5 h-5" />}
            loading={statsLoading}
          />
          <StatsCard
            title="Events (24h)"
            value={stats?.last24h || 0}
            icon={<Activity className="w-5 h-5" />}
            loading={statsLoading}
          />
          <StatsCard
            title="New Users Today"
            value={dashboardStats?.users.newToday || 0}
            icon={<UserPlus className="w-5 h-5" />}
            loading={dashboardLoading}
          />
        </div>

        {/* Subscription Breakdown & Top Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Subscription Distribution
              </CardTitle>
              <CardDescription>Breakdown of users by plan tier</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : dashboardStats?.subscriptions ? (
                <SubscriptionPieChart data={dashboardStats.subscriptions} />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Users by Usage
              </CardTitle>
              <CardDescription>Most active users today</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : dashboardStats?.topUsers && dashboardStats.topUsers.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.topUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</span>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${TIER_COLORS[user.tier]}`}>
                            {TIER_ICONS[user.tier]}
                            <span className="capitalize">{user.tier}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{user.queries}</p>
                        <p className="text-xs text-muted-foreground">queries</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No activity yet today</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity by Type */}
        {stats?.byActionType && Object.keys(stats.byActionType).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Activity by Type</CardTitle>
              <CardDescription>Breakdown of all logged activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(stats.byActionType).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted"
                  >
                    <div className={`p-1.5 rounded ${ACTION_COLORS[type] || "bg-gray-500/10"}`}>
                      {ACTION_ICONS[type] || <Activity className="w-4 h-4" />}
                    </div>
                    <span className="font-medium capitalize">{type.replace("_", " ")}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users ({users?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Audit Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>
                      Activity logs for legal compliance. Content is hashed, not stored.
                    </CardDescription>
                  </div>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="image_generation">Image Generation</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="settings_change">Settings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Content Hash</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logsData?.logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${ACTION_COLORS[log.actionType] || ""}`}>
                                  {ACTION_ICONS[log.actionType]}
                                  <span className="capitalize">{log.actionType.replace("_", " ")}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {log.userOpenId?.slice(0, 8) || "Anonymous"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {log.ipAddress}
                              </TableCell>
                              <TableCell className="text-xs">
                                {log.modelUsed || "-"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {log.contentHash?.slice(0, 12) || "-"}...
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, logsData?.total || 0)} of {logsData?.total || 0}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                          Page {page + 1} of {totalPages || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => p + 1)}
                          disabled={page >= totalPages - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Usage Today</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="font-medium">{u.name || "Anonymous"}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {u.openId.slice(0, 8)}...
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {u.email || "-"}
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${TIER_COLORS[u.subscriptionTier || 'free']}`}>
                                {TIER_ICONS[u.subscriptionTier || 'free']}
                                <span className="capitalize">{u.subscriptionTier || 'free'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="font-medium">{u.dailyQueries || 0}</span>
                                <span className="text-muted-foreground"> queries</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.subscriptionStatus === 'active' ? 'default' : 'secondary'} className="capitalize">
                                {u.subscriptionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={u.role}
                                onValueChange={(value) => handleRoleChange(u.id, value as "user" | "admin")}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {u.lastSignedIn 
                                ? new Date(u.lastSignedIn).toLocaleDateString()
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
