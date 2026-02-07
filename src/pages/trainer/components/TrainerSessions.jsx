import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateSession, closeSessionWithStats } from '@/services/superadmin/sessionService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { 
  Share2,
  BarChart3,
  Pencil,
  PlayCircle,
  Loader2,
  MoreHorizontal,
  Power,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { FiCheckSquare } from "react-icons/fi";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import SessionAnalytics from '@/pages/superadmin/components/SessionAnalytics';

const TrainerSessions = ({ sessions, loading, onEdit, onRefresh }) => {
  const { user } = useAuth();
  
  // UI State
  const [selectedSession, setSelectedSession] = useState(null); // For Analytics
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Export State
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [sessionToExport, setSessionToExport] = useState(null);

  // Session Stats
  const sessionStats = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter(s => s.status === 'active').length;
    const inactive = sessions.filter(s => s.status === 'inactive').length;
    return { total, active, inactive };
  }, [sessions]);

  // Filter Logic
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Tab filter
      if (activeTab === 'active' && session.status !== 'active') return false;
      if (activeTab === 'inactive' && session.status !== 'inactive') return false;

      // Search filter
      const matchSearch = !searchQuery || 
        session.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.course?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchSearch;
    }).sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
  }, [sessions, activeTab, searchQuery]);

  // Actions
  const copyLink = (sessionId) => {
    const link = `${window.location.origin}/feedback/anonymous/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success('Feedback link copied to clipboard');
  };

  const handleToggleStatus = async (session) => {
    try {
      if (session.status === 'active') {
        // Deactivating - compile stats and close
        toast.loading('Compiling feedback statistics...');
        await closeSessionWithStats(session.id);
        toast.dismiss();
        toast.success('Session closed and statistics compiled');
      } else {
        // Reactivating
        await updateSession(session.id, { status: 'active' });
        toast.success('Session activated');
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to update status');
    }
  };

  const handleExportResponses = (session) => {
    setSessionToExport(session);
    setExportDialogOpen(true);
  };

  const confirmExport = async () => {
    const session = sessionToExport;
    if (!session) return;

    try {
      const stats = session.compiledStats;
      if (!stats) {
        toast.error('No compiled stats available');
        return;
      }

      toast.loading('Generating Excel report...');

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Gryphon Academy';
      workbook.created = new Date();

      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Field', key: 'field', width: 25 },
        { header: 'Value', key: 'value', width: 40 }
      ];
      summarySheet.addRows([
        { field: 'Session Topic', value: session.topic },
        { field: 'Course', value: session.course },
        { field: 'Batch', value: session.batch },
        { field: 'Session Date', value: session.sessionDate },
        { field: 'Total Responses', value: stats.totalResponses },
        { field: 'Average Rating', value: stats.avgRating }
      ]);
      
      // Rating Distribution Sheet
      const ratingSheet = workbook.addWorksheet('Rating Distribution');
      ratingSheet.columns = [
        { header: 'Rating', key: 'rating', width: 15 },
        { header: 'Count', key: 'count', width: 15 }
      ];
      Object.entries(stats.ratingDistribution || {}).forEach(([rating, count]) => {
        ratingSheet.addRow({ rating: `${rating} Star`, count: count });
      });

      // Comments Sheet
      const commentsSheet = workbook.addWorksheet('Comments');
      commentsSheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Comment', key: 'comment', width: 60 },
        { header: 'Avg Rating', key: 'avgRating', width: 15 }
      ];
      (stats.topComments || []).forEach(c => commentsSheet.addRow({ category: 'Top Rated', comment: c.text, avgRating: c.avgRating }));
      (stats.avgComments || []).forEach(c => commentsSheet.addRow({ category: 'Average', comment: c.text, avgRating: c.avgRating }));
      (stats.leastRatedComments || []).forEach(c => commentsSheet.addRow({ category: 'Least Rated', comment: c.text, avgRating: c.avgRating }));

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `feedback_${session.topic.replace(/[^a-z0-9]/gi, '_')}_${session.sessionDate}.xlsx`);

      toast.dismiss();
      toast.success('Excel report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('Failed to export report');
    } finally {
      setExportDialogOpen(false);
      setSessionToExport(null);
    }
  };

  if (selectedSession) {
    return <SessionAnalytics session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 p-4 bg-card border rounded-xl">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{sessionStats.total}</p>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-card border rounded-xl">
          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{sessionStats.active}</p>
            <p className="text-sm text-muted-foreground">Active Sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 bg-card border rounded-xl">
          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <FiCheckSquare className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{sessionStats.inactive}</p>
            <p className="text-sm text-muted-foreground">Completed Sessions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab('all')}
            className={cn("flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all", activeTab === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}
          >
            All Sessions ({sessionStats.total})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn("flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all", activeTab === 'active' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}
          >
            Active Sessions ({sessionStats.active})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={cn("flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all", activeTab === 'inactive' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}
          >
            Inactive Sessions ({sessionStats.inactive})
          </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic / Domain</TableHead>
              <TableHead>Course / Batch</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : filteredSessions.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No sessions found.</TableCell></TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{session.topic}</div>
                    <div className="text-xs text-muted-foreground">{session.domain}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{session.course} - {session.branch}</div>
                    <div className="text-xs text-muted-foreground">Year {session.year} • Batch {session.batch}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{session.sessionDate ? format(new Date(session.sessionDate), 'MMM d, yyyy') : '-'}</div>
                    <div className="text-xs text-muted-foreground">{session.sessionTime}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", session.status === 'active' ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200")}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        
                        {session.status === 'active' && (
                          <>
                            <DropdownMenuItem onClick={() => copyLink(session.id)}>
                              <Share2 className="mr-2 h-4 w-4" /> Share Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit && onEdit(session)}>
                              <Pencil className="mr-2 h-4 w-4" /> Update
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSelectedSession(session)}>
                              <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportResponses(session)}>
                              <Download className="mr-2 h-4 w-4" /> Export to Excel
                            </DropdownMenuItem>
                            {/* Deactivate disabled for trainers as requested 
                            <DropdownMenuItem onClick={() => handleToggleStatus(session)}>
                              <Power className="mr-2 h-4 w-4" /> Deactivate
                            </DropdownMenuItem>
                            */}
                          </>
                        )}
                        
                        {session.status === 'inactive' && (
                           <>
                             <DropdownMenuItem onClick={() => handleToggleStatus(session)}>
                               <PlayCircle className="mr-2 h-4 w-4" /> Activate
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => onEdit && onEdit(session)}>
                               <Pencil className="mr-2 h-4 w-4" /> Update
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => copyLink(session.id)}>
                               <Share2 className="mr-2 h-4 w-4" /> Share Link
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => setSelectedSession(session)}>
                               <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleExportResponses(session)}>
                               <Download className="mr-2 h-4 w-4" /> Export to Excel
                             </DropdownMenuItem>
                           </>
                        )}
                        
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Export Confirmation Dialog */}
      <Modal open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <div className="p-6">
          <ModalHeader>
             <ModalTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Feedback Report
            </ModalTitle>
            <ModalDescription className="space-y-2 mt-2">
              <p>You are about to export feedback data for:</p>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium text-foreground">{sessionToExport?.topic}</p>
                <p>{sessionToExport?.course} • {sessionToExport?.sessionDate}</p>
              </div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg mt-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">
                  This report contains <strong>{sessionToExport?.compiledStats?.totalResponses || 0}</strong> responses.
                </p>
              </div>
            </ModalDescription>
          </ModalHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmExport} className="gradient-hero text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default TrainerSessions;
