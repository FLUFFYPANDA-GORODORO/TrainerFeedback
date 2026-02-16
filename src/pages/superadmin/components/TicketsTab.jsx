import React, { useState, useEffect } from "react";
import {
  getAllTickets,
  updateTicketStatus,
  deleteTicket,
  isTicketOverdue,
  getTicketAgeDays,
} from "@/services/superadmin/ticketService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageSquare,
  Filter,
  RefreshCw,
  RotateCcw,
  Bug,
  Megaphone,
  Lightbulb,
  HelpCircle,
  Search,
} from "lucide-react";

const CATEGORY_CONFIG = {
  bug: { label: "Bug Report", icon: Bug },
  complaint: { label: "Complaint", icon: Megaphone },
  feature: { label: "Feature Request", icon: Lightbulb },
  other: { label: "Other", icon: HelpCircle },
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const TicketsTab = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all",
  });

  const resetFilters = () => {
    setFilters({ status: "all", category: "all", priority: "all" });
    setSearchQuery("");
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (error) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      await updateTicketStatus(ticketId, newStatus, adminNotes[ticketId] || "");
      toast.success(
        `Ticket status updated to ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus}`,
      );
      await loadTickets();
    } catch (error) {
      toast.error("Failed to update ticket");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await deleteTicket(ticketId);
      toast.success("Ticket deleted");
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (error) {
      toast.error("Failed to delete ticket");
    }
  };

  // Sort: overdue first, then by creation date
  const sortedTickets = [...tickets].sort((a, b) => {
    const aOverdue = isTicketOverdue(a);
    const bOverdue = isTicketOverdue(b);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return 0;
  });

  const filteredTickets = sortedTickets.filter((t) => {
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.category !== "all" && t.category !== filters.category)
      return false;
    if (filters.priority !== "all" && t.priority !== filters.priority)
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchName = t.raisedBy?.name?.toLowerCase().includes(q);
      const matchEmail = t.raisedBy?.email?.toLowerCase().includes(q);
      if (!matchSubject && !matchName && !matchEmail) return false;
    }
    return true;
  });

  const overdueCount = tickets.filter((t) => isTicketOverdue(t)).length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in-progress",
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Stats Cards — Neutral, non-interactive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">7+ days old</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting action
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar — Dashboard style */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Subject, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters({ ...filters, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(v) => setFilters({ ...filters, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(v) => setFilters({ ...filters, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTickets}
          className="gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No tickets found
          </h3>
          <p className="text-sm text-muted-foreground">
            {filters.status !== "all" ||
            filters.category !== "all" ||
            filters.priority !== "all" ||
            searchQuery
              ? "Try changing your filters."
              : "No tickets have been raised yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const overdue = isTicketOverdue(ticket);
            const ageDays = getTicketAgeDays(ticket);
            const isExpanded = expandedTicket === ticket.id;
            const catConfig =
              CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;
            const CatIcon = catConfig.icon;

            return (
              <div
                key={ticket.id}
                className="rounded-xl border bg-card transition-all hover:shadow-sm"
              >
                {/* Ticket Header Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedTicket(isExpanded ? null : ticket.id)
                  }
                >
                  {/* Category Icon */}
                  <div className="h-9 w-9 rounded-lg border bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <CatIcon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Subject + Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground truncate">
                        {ticket.subject}
                      </p>
                      {overdue && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 gap-1 flex-shrink-0"
                        >
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{ticket.raisedBy?.name || "Unknown"}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {ticket.raisedBy?.role || "—"}
                      </span>
                      <span>•</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                      <span>•</span>
                      <span>{ageDays}d ago</span>
                    </div>
                  </div>

                  {/* Priority */}
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 capitalize"
                  >
                    {ticket.priority || "—"}
                  </Badge>

                  {/* Status */}
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2 capitalize"
                  >
                    {STATUS_OPTIONS.find((s) => s.value === ticket.status)
                      ?.label || ticket.status}
                  </Badge>

                  {/* Expand Icon */}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 bg-muted/20 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Description
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-card rounded-lg border p-3">
                        {ticket.description || "No description provided."}
                      </p>
                    </div>

                    {/* Raised By Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Email
                        </p>
                        <p className="text-sm truncate">
                          {ticket.raisedBy?.email || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Role
                        </p>
                        <p className="text-sm capitalize">
                          {ticket.raisedBy?.role || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Created
                        </p>
                        <p className="text-sm">
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Age
                        </p>
                        <p className="text-sm font-medium">
                          {ageDays} day{ageDays !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Admin Notes
                      </p>
                      <textarea
                        className="w-full text-sm border rounded-lg p-2.5 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        rows={2}
                        placeholder="Add resolution notes..."
                        value={adminNotes[ticket.id] ?? ticket.adminNotes ?? ""}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({
                            ...prev,
                            [ticket.id]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">
                        Change status:
                      </span>
                      {STATUS_OPTIONS.map(({ value, label }) => (
                        <Button
                          key={value}
                          size="sm"
                          variant={
                            ticket.status === value ? "default" : "outline"
                          }
                          className="text-xs h-7"
                          disabled={
                            ticket.status === value || updatingId === ticket.id
                          }
                          onClick={() => handleStatusChange(ticket.id, value)}
                        >
                          {label}
                        </Button>
                      ))}
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(ticket.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketsTab;
