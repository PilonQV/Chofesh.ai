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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Headphones,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Send,
  Bell,
  BellRing,
  Filter,
  Search,
  MessageSquare,
  User,
  Mail,
  Calendar,
  Tag,
  Flag,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-gray-500/10 text-gray-500" },
  normal: { label: "Normal", color: "bg-blue-500/10 text-blue-500" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-500/10 text-red-500" },
};

const CATEGORY_CONFIG = {
  general: { label: "General", color: "bg-gray-500/10 text-gray-500" },
  bug: { label: "Bug Report", color: "bg-red-500/10 text-red-500" },
  feature: { label: "Feature Request", color: "bg-purple-500/10 text-purple-500" },
  billing: { label: "Billing", color: "bg-green-500/10 text-green-500" },
  account: { label: "Account", color: "bg-blue-500/10 text-blue-500" },
};

type SupportTicket = {
  id: number;
  name: string;
  email: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  userId: number | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function AdminSupport() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [hasNewTickets, setHasNewTickets] = useState(false);
  const [lastCheckedCount, setLastCheckedCount] = useState(0);

  // Fetch all support tickets
  const { data: tickets, isLoading, refetch } = trpc.support.listAll.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds for new tickets
  });

  // Update ticket mutation
  const updateTicketMutation = trpc.support.updateTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket updated successfully");
      refetch();
      setSelectedTicket(null);
      setAdminResponse("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update ticket");
    },
  });

  // Check for new tickets
  useEffect(() => {
    if (tickets) {
      const openCount = tickets.filter(t => t.status === "open").length;
      if (lastCheckedCount > 0 && openCount > lastCheckedCount) {
        setHasNewTickets(true);
        // Play notification sound
        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
        toast.info(`${openCount - lastCheckedCount} new support ticket(s) received!`, {
          icon: <BellRing className="w-4 h-4" />,
          duration: 10000,
        });
      }
      setLastCheckedCount(openCount);
    }
  }, [tickets, lastCheckedCount]);

  // Filter tickets
  const filteredTickets = tickets?.filter(ticket => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(query) ||
        ticket.name.toLowerCase().includes(query) ||
        ticket.email.toLowerCase().includes(query) ||
        ticket.message.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const handleUpdateTicket = useCallback(() => {
    if (!selectedTicket) return;
    
    updateTicketMutation.mutate({
      ticketId: selectedTicket.id,
      status: (newStatus || selectedTicket.status) as "open" | "in_progress" | "resolved" | "closed",
      adminNotes: adminResponse || selectedTicket.adminNotes || undefined,
    });
  }, [selectedTicket, newStatus, adminResponse, updateTicketMutation]);

  const openTicketCount = tickets?.filter(t => t.status === "open").length || 0;
  const inProgressCount = tickets?.filter(t => t.status === "in_progress").length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Support Dashboard</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasNewTickets && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-yellow-500 border-yellow-500/50"
                onClick={() => {
                  setHasNewTickets(false);
                  setStatusFilter("open");
                }}
              >
                <BellRing className="w-4 h-4 mr-2 animate-pulse" />
                New Tickets!
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className={openTicketCount > 0 ? "border-yellow-500/50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{openTicketCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {tickets?.filter(t => t.status === "resolved" || t.status === "closed").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>
              {filteredTickets.length} ticket(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Headphones className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No support tickets found</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => {
                      const statusConfig = STATUS_CONFIG[ticket.status];
                      const priorityConfig = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
                      const categoryConfig = CATEGORY_CONFIG[ticket.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.general;
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <TableRow 
                          key={ticket.id}
                          className={ticket.status === "open" ? "bg-yellow-500/5" : ""}
                        >
                          <TableCell className="font-mono">#{ticket.id}</TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {ticket.subject}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{ticket.name}</span>
                              <span className="text-xs text-muted-foreground">{ticket.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={categoryConfig.color}>
                              {categoryConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={priorityConfig.color}>
                              {priorityConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket as SupportTicket);
                                setNewStatus(ticket.status);
                                setAdminResponse(ticket.adminNotes || "");
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">#{selectedTicket.id}</span>
                  {selectedTicket.subject}
                </DialogTitle>
                <DialogDescription>
                  Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedTicket.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedTicket.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className={CATEGORY_CONFIG[selectedTicket.category as keyof typeof CATEGORY_CONFIG]?.color || ""}>
                      {CATEGORY_CONFIG[selectedTicket.category as keyof typeof CATEGORY_CONFIG]?.label || selectedTicket.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className={PRIORITY_CONFIG[selectedTicket.priority as keyof typeof PRIORITY_CONFIG]?.color || ""}>
                      {PRIORITY_CONFIG[selectedTicket.priority as keyof typeof PRIORITY_CONFIG]?.label || selectedTicket.priority}
                    </Badge>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Message</h4>
                  <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Admin Response */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Admin Notes / Response</h4>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Add notes or response to the customer..."
                    rows={4}
                  />
                </div>

                {/* Status Update */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Update Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 flex items-end">
                    <Button 
                      onClick={handleUpdateTicket}
                      disabled={updateTicketMutation.isPending}
                      className="w-full"
                    >
                      {updateTicketMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Update Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
