import React, { useState, useEffect } from 'react';
import { 
  getAllTickets, 
  updateTicketStatus, 
  deleteTicket, 
  isTicketOverdue, 
  getTicketAgeDays 
} from '@/services/superadmin/ticketService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageSquare,
  Filter,
  RefreshCw,
  Bug,
  Megaphone,
  Lightbulb,
  HelpCircle
} from 'lucide-react';

const CATEGORY_CONFIG = {
  bug: { label: 'Bug Report', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200' },
  complaint: { label: 'Complaint', icon: Megaphone, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  feature: { label: 'Feature Request', icon: Lightbulb, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  other: { label: 'Other', icon: HelpCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' }
};

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-300' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-300' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'High', color: 'bg-red-100 text-red-700' }
};

const TicketsTab = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      await updateTicketStatus(ticketId, newStatus, adminNotes[ticketId] || '');
      toast.success(`Ticket status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      await loadTickets();
    } catch (error) {
      toast.error('Failed to update ticket');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await deleteTicket(ticketId);
      toast.success('Ticket deleted');
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  // Sort: overdue first, then by creation date
  const sortedTickets = [...tickets].sort((a, b) => {
    const aOverdue = isTicketOverdue(a);
    const bOverdue = isTicketOverdue(b);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return 0; // maintain original order (already sorted by createdAt desc)
  });

  const filteredTickets = filter === 'all' 
    ? sortedTickets 
    : filter === 'overdue'
      ? sortedTickets.filter(t => isTicketOverdue(t))
      : sortedTickets.filter(t => t.status === filter);

  const overdueCount = tickets.filter(t => isTicketOverdue(t)).length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue Card — prominent */}
        <div 
          className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
            filter === 'overdue' ? 'border-red-500 bg-red-50 shadow-md' : 'border-red-200 bg-red-50/50'
          } ${overdueCount > 0 ? 'animate-pulse-subtle' : ''}`}
          onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
              <p className="text-xs text-red-600 font-medium">Overdue (7+ days)</p>
            </div>
          </div>
        </div>

        <div 
          className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
            filter === 'open' ? 'border-yellow-500 bg-yellow-50 shadow-md' : 'bg-white'
          }`}
          onClick={() => setFilter(filter === 'open' ? 'all' : 'open')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{openCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Open</p>
            </div>
          </div>
        </div>

        <div 
          className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
            filter === 'in-progress' ? 'border-blue-500 bg-blue-50 shadow-md' : 'bg-white'
          }`}
          onClick={() => setFilter(filter === 'in-progress' ? 'all' : 'in-progress')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground font-medium">In Progress</p>
            </div>
          </div>
        </div>

        <div 
          className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
            filter === 'resolved' ? 'border-green-500 bg-green-50 shadow-md' : 'bg-white'
          }`}
          onClick={() => setFilter(filter === 'resolved' ? 'all' : 'resolved')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Showing {filteredTickets.length} of {tickets.length} tickets
            {filter !== 'all' && (
              <button 
                className="ml-2 text-primary underline text-xs" 
                onClick={() => setFilter('all')}
              >
                Clear filter
              </button>
            )}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={loadTickets} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No tickets found</h3>
          <p className="text-sm text-muted-foreground">
            {filter !== 'all' ? 'Try changing your filter.' : 'No tickets have been raised yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => {
            const overdue = isTicketOverdue(ticket);
            const ageDays = getTicketAgeDays(ticket);
            const isExpanded = expandedTicket === ticket.id;
            const catConfig = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;
            const CatIcon = catConfig.icon;

            return (
              <div
                key={ticket.id}
                className={`rounded-xl border bg-white transition-all hover:shadow-sm ${
                  overdue ? 'border-red-300 ring-1 ring-red-200' : ''
                }`}
              >
                {/* Ticket Header Row */}
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                >
                  {/* Category Icon */}
                  <div className={`h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${catConfig.color}`}>
                    <CatIcon className="h-4 w-4" />
                  </div>

                  {/* Subject + Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground truncate">{ticket.subject}</p>
                      {overdue && (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-[10px] px-1.5 py-0 gap-1 flex-shrink-0">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{ticket.raisedBy?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span className="capitalize">{ticket.raisedBy?.role || '—'}</span>
                      <span>•</span>
                      <span>{formatDate(ticket.createdAt)}</span>
                      <span>•</span>
                      <span className={ageDays >= 7 ? 'text-red-600 font-medium' : ''}>
                        {ageDays}d ago
                      </span>
                    </div>
                  </div>

                  {/* Priority */}
                  <Badge variant="outline" className={`text-[10px] px-2 ${PRIORITY_CONFIG[ticket.priority]?.color || ''}`}>
                    {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                  </Badge>

                  {/* Status */}
                  <Badge variant="outline" className={`text-[10px] px-2 ${STATUS_CONFIG[ticket.status]?.color || ''}`}>
                    {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                  </Badge>

                  {/* Expand Icon */}
                  {isExpanded 
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> 
                    : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  }
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 bg-muted/20 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-white rounded-lg border p-3">
                        {ticket.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Raised By Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Email</p>
                        <p className="text-sm truncate">{ticket.raisedBy?.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Role</p>
                        <p className="text-sm capitalize">{ticket.raisedBy?.role || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Created</p>
                        <p className="text-sm">{formatDate(ticket.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Age</p>
                        <p className={`text-sm font-medium ${ageDays >= 7 ? 'text-red-600' : 'text-foreground'}`}>
                          {ageDays} day{ageDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Admin Notes
                      </p>
                      <textarea
                        className="w-full text-sm border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        rows={2}
                        placeholder="Add resolution notes..."
                        value={adminNotes[ticket.id] ?? ticket.adminNotes ?? ''}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Change status:</span>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <Button
                          key={key}
                          size="sm"
                          variant={ticket.status === key ? 'default' : 'outline'}
                          className={`text-xs h-7 ${ticket.status === key ? '' : config.color}`}
                          disabled={ticket.status === key || updatingId === ticket.id}
                          onClick={() => handleStatusChange(ticket.id, key)}
                        >
                          {config.label}
                        </Button>
                      ))}
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
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
