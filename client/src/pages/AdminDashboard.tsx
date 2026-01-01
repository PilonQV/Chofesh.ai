import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Sparkles,
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

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const pageSize = 20;

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.auditStats.useQuery();
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

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
    refetchUsers();
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Events"
            value={stats?.total || 0}
            icon={<Activity className="w-5 h-5" />}
            loading={statsLoading}
          />
          <StatsCard
            title="Last 24 Hours"
            value={stats?.last24h || 0}
            icon={<FileText className="w-5 h-5" />}
            loading={statsLoading}
          />
          <StatsCard
            title="Last 7 Days"
            value={stats?.last7d || 0}
            icon={<FileText className="w-5 h-5" />}
            loading={statsLoading}
          />
          <StatsCard
            title="Total Users"
            value={users?.length || 0}
            icon={<Users className="w-5 h-5" />}
            loading={usersLoading}
          />
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
              Users
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
                              <TableCell>{log.modelUsed || "-"}</TableCell>
                              <TableCell className="font-mono text-xs max-w-[120px] truncate">
                                {log.contentHash || "-"}
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={page === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
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
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                                {u.name?.[0]?.toUpperCase() || "U"}
                              </div>
                              <span className="font-medium">{u.name || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.email || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.lastSignedIn).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(value) => handleRoleChange(u.id, value as "user" | "admin")}
                              disabled={u.openId === user?.openId}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
