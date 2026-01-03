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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  BarChart3,
  UserPlus,
  Eye,
  Trash2,
  ExternalLink,
  ImageIcon,
  X,
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
  const [imagePage, setImagePage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [imageStatusFilter, setImageStatusFilter] = useState<string>("all");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const pageSize = 20;
  const imagePageSize = 24;

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.auditStats.useQuery();
  const { data: dashboardStats, isLoading: dashboardLoading, refetch: refetchDashboard } = trpc.admin.dashboardStats.useQuery();
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = trpc.admin.auditLogs.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    actionType: actionFilter === "all" ? undefined : actionFilter,
  });
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.users.useQuery();
  
  // Generated images queries
  const { data: imagesData, isLoading: imagesLoading, refetch: refetchImages } = trpc.admin.generatedImages.useQuery({
    limit: imagePageSize,
    offset: imagePage * imagePageSize,
    status: imageStatusFilter === "all" ? undefined : imageStatusFilter as "completed" | "failed",
  });
  const { data: imageStats, isLoading: imageStatsLoading } = trpc.admin.generatedImageStats.useQuery();
  
  // User details query
  const { data: userDetails, isLoading: userDetailsLoading } = trpc.admin.userDetails.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      refetchUsers();
    },
    onError: () => {
      toast.error("Failed to update user role");
    },
  });

  const deleteImageMutation = trpc.admin.deleteGeneratedImage.useMutation({
    onSuccess: () => {
      toast.success("Image deleted");
      refetchImages();
    },
    onError: () => {
      toast.error("Failed to delete image");
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

    setCountdown(autoRefreshInterval / 1000);

    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return autoRefreshInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    const refreshTimer = setInterval(() => {
      refetchStats();
      refetchDashboard();
      refetchLogs();
      refetchUsers();
      refetchImages();
      setLastRefresh(new Date());
    }, autoRefreshInterval);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(refreshTimer);
    };
  }, [autoRefreshInterval, refetchStats, refetchDashboard, refetchLogs, refetchUsers, refetchImages]);

  const handleRefresh = () => {
    refetchStats();
    refetchDashboard();
    refetchLogs();
    refetchUsers();
    refetchImages();
    setLastRefresh(new Date());
    setCountdown(autoRefreshInterval / 1000);
    toast.success("Data refreshed");
  };

  const handleRoleChange = (userId: number, newRole: "user" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteImage = (imageId: number) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteImageMutation.mutate({ imageId });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              {!isAuthenticated 
                ? "You need to log in to access the admin dashboard."
                : "You don't have permission to access the admin dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={!isAuthenticated ? "/login" : "/"}>
              <Button className="w-full">
                {!isAuthenticated ? "Log In" : "Go Home"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.ceil((logsData?.total || 0) / pageSize);
  const totalImagePages = Math.ceil((imagesData?.total || 0) / imagePageSize);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-refresh controls */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Auto-refresh:</span>
              <Select 
                value={autoRefreshInterval.toString()} 
                onValueChange={(v) => setAutoRefreshInterval(Number(v))}
              >
                <SelectTrigger className="w-20 h-8">
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
                <span className="text-xs tabular-nums">{countdown}s</span>
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

      <main className="container py-6 px-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="MRR"
            value={`$${dashboardStats?.revenue.mrr || 0}`}
            icon={<DollarSign className="w-5 h-5" />}
            loading={dashboardLoading}
            subtitle={`ARR: $${dashboardStats?.revenue.projectedArr || 0}`}
          />
          <StatsCard
            title="Conversion"
            value={`${dashboardStats?.revenue.conversionRate || 0}%`}
            icon={<CreditCard className="w-5 h-5" />}
            loading={dashboardLoading}
            subtitle={`${dashboardStats?.revenue.paidUsers || 0} paid users`}
          />
          <StatsCard
            title="Total Users"
            value={dashboardStats?.users.total || 0}
            icon={<Users className="w-5 h-5" />}
            loading={dashboardLoading}
          />
          <StatsCard
            title="Queries Today"
            value={dashboardStats?.usage.queriesToday || 0}
            icon={<Activity className="w-5 h-5" />}
            loading={dashboardLoading}
          />
          <StatsCard
            title="Images Generated"
            value={imageStats?.total || 0}
            icon={<ImageIcon className="w-5 h-5" />}
            loading={imageStatsLoading}
            subtitle={`${imageStats?.last24h || 0} in 24h`}
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
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Images ({imagesData?.total || 0})
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
                            <TableHead>Type</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Content Hash</TableHead>
                            <TableHead>Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logsData?.logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <div className={`inline-flex items-center gap-2 px-2 py-1 rounded ${ACTION_COLORS[log.actionType]}`}>
                                  {ACTION_ICONS[log.actionType]}
                                  <span className="capitalize text-sm">
                                    {log.actionType.replace("_", " ")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-mono">
                                  {log.userOpenId?.slice(0, 8)}...
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.modelUsed || "-"}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {log.ipAddress}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {log.contentHash?.slice(0, 12)}...
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
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
                  View and manage all registered users. Click on a user to see their activity details.
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
                          <TableHead>Actions</TableHead>
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
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedUserId(u.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>User Details: {u.name || "Anonymous"}</DialogTitle>
                                    <DialogDescription>
                                      View detailed activity and generated images for this user
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {userDetailsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                  ) : userDetails ? (
                                    <div className="space-y-6">
                                      {/* User Info */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-3 rounded-lg bg-muted">
                                          <p className="text-xs text-muted-foreground">Email</p>
                                          <p className="font-medium">{userDetails.user?.email || "-"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted">
                                          <p className="text-xs text-muted-foreground">Subscription</p>
                                          <p className="font-medium capitalize">{userDetails.user?.subscriptionTier || "free"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted">
                                          <p className="text-xs text-muted-foreground">Daily Queries</p>
                                          <p className="font-medium">{userDetails.user?.dailyQueries || 0}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted">
                                          <p className="text-xs text-muted-foreground">Last Active</p>
                                          <p className="font-medium">
                                            {userDetails.user?.lastSignedIn 
                                              ? new Date(userDetails.user.lastSignedIn).toLocaleDateString() 
                                              : "-"}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Generated Images */}
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <ImageIcon className="w-4 h-4" />
                                          Generated Images ({userDetails.images?.length || 0})
                                        </h4>
                                        {userDetails.images && userDetails.images.length > 0 ? (
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {userDetails.images.map((img) => (
                                              <div key={img.id} className="group relative">
                                                {img.imageUrl ? (
                                                  <img 
                                                    src={img.imageUrl} 
                                                    alt={img.prompt.slice(0, 50)}
                                                    className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setSelectedImage(img.imageUrl)}
                                                  />
                                                ) : (
                                                  <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                                                    <X className="w-8 h-8 text-muted-foreground" />
                                                  </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <p className="text-xs text-white truncate">{img.prompt}</p>
                                                  <p className="text-xs text-white/60">
                                                    {new Date(img.createdAt).toLocaleDateString()}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground text-sm">No images generated yet</p>
                                        )}
                                      </div>

                                      {/* Recent Activity */}
                                      <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                          <Activity className="w-4 h-4" />
                                          Recent Activity
                                        </h4>
                                        {userDetails.recentActivity && userDetails.recentActivity.length > 0 ? (
                                          <div className="space-y-2">
                                            {userDetails.recentActivity.slice(0, 10).map((activity) => (
                                              <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-2">
                                                  <div className={`p-1.5 rounded ${ACTION_COLORS[activity.actionType] || "bg-gray-500/10"}`}>
                                                    {ACTION_ICONS[activity.actionType] || <Activity className="w-4 h-4" />}
                                                  </div>
                                                  <span className="text-sm capitalize">{activity.actionType.replace("_", " ")}</span>
                                                  {activity.modelUsed && (
                                                    <Badge variant="outline" className="text-xs">{activity.modelUsed}</Badge>
                                                  )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                  {new Date(activity.timestamp).toLocaleString()}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground text-sm">No recent activity</p>
                                        )}
                                      </div>
                                    </div>
                                  ) : null}
                                </DialogContent>
                              </Dialog>
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

          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Images</CardTitle>
                    <CardDescription>
                      All AI-generated images with prompts and user information
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={imageStatusFilter} onValueChange={setImageStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Image Stats */}
                {imageStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Total Images</p>
                      <p className="text-xl font-bold">{imageStats.total}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Last 24 Hours</p>
                      <p className="text-xl font-bold">{imageStats.last24h}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Last 7 Days</p>
                      <p className="text-xl font-bold">{imageStats.last7d}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">By Model</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(imageStats.byModel || {}).map(([model, count]) => (
                          <Badge key={model} variant="secondary" className="text-xs">
                            {model}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {imagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Image Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {imagesData?.images.map((img) => (
                        <div key={img.id} className="group relative">
                          {img.imageUrl ? (
                            <img 
                              src={img.imageUrl} 
                              alt={img.prompt.slice(0, 50)}
                              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedImage(img.imageUrl)}
                            />
                          ) : (
                            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                              <X className="w-8 h-8 text-destructive" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <Badge 
                            variant={img.status === "completed" ? "default" : "destructive"} 
                            className="absolute top-2 left-2 text-xs"
                          >
                            {img.status}
                          </Badge>
                          
                          {/* Edit Badge */}
                          {img.isEdit && (
                            <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                              Edit
                            </Badge>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white truncate">{img.prompt}</p>
                            <p className="text-xs text-white/60">{img.userName || "Unknown"}</p>
                            <p className="text-xs text-white/60">
                              {new Date(img.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {img.imageUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 bg-white/20 hover:bg-white/30"
                                  onClick={() => window.open(img.imageUrl, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 text-white" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 bg-red-500/50 hover:bg-red-500/70"
                                onClick={() => handleDeleteImage(img.id)}
                              >
                                <Trash2 className="w-3 h-3 text-white" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {imagePage * imagePageSize + 1} - {Math.min((imagePage + 1) * imagePageSize, imagesData?.total || 0)} of {imagesData?.total || 0}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImagePage(p => Math.max(0, p - 1))}
                          disabled={imagePage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                          Page {imagePage + 1} of {totalImagePages || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImagePage(p => p + 1)}
                          disabled={imagePage >= totalImagePages - 1}
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
        </Tabs>
      </main>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
