import React, { useState, useEffect, useMemo } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';

import SessionAnalytics from '../../superadmin/components/SessionAnalytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Search, 
  Clock, 
  Users, 
  Share2,
  CheckCircle2,
  Loader2,
  ChevronDown,
  BarChart2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    inactive: "bg-gray-100 text-gray-700 border-gray-200",
  };
  
  const labels = {
    active: "Active",
    completed: "Completed", 
    inactive: "Closed"
  };

  const currentStatus = status === 'active' ? 'active' : 'inactive';

  return (
    <Badge variant="outline" className={`${styles[currentStatus]} px-2 py-0.5`}>
      {labels[currentStatus]}
    </Badge>
  );
};

const CollegeSessionsTab = () => {
  const { college, trainers, loadTrainers, sessions, loadSessions, loading } = useAdminData();
  
  // local loading state derived from context
  const isSessionsLoading = loading.sessions && sessions.length === 0;

  // State
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    course: 'all',
    department: 'all',
    year: 'all',
    batch: 'all',
    trainer: 'all'
  });

  // Ensure sessions and trainers are loaded on mount
  useEffect(() => {
    if (college?.id) {
       loadTrainers();
       if (sessions.length === 0) loadSessions();
    }
  }, [college, loadTrainers, loadSessions, sessions.length]);

  // Derived Active & Recent Sessions from Context Data
  const { activeSessions, recentSessions } = useMemo(() => {
     if (!sessions.length) return { activeSessions: [], recentSessions: [] };
     
     const active = [];
     const recent = [];
     
     sessions.forEach(s => {
        if (s.status === 'active') {
           active.push(s);
        } else {
           recent.push(s);
        }
     });

     // Sort active by createdAt desc
     active.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
     
     // Recent is already sorted by sessionDate desc usually, but ensure
     recent.sort((a,b) => new Date(b.sessionDate) - new Date(a.sessionDate));
     
     return { activeSessions: active, recentSessions: recent };
  }, [sessions]);

  // Derived Filter Options
  const filterOptions = useMemo(() => {
    const data = recentSessions;
    return {
      courses: [...new Set(data.map(s => s.course).filter(Boolean))],
      departments: [...new Set(data.map(s => s.branch).filter(Boolean))],
      years: [...new Set(data.map(s => s.year).filter(Boolean))],
      batches: [...new Set(data.map(s => s.batch).filter(Boolean))],
    };
  }, [recentSessions]);

  // Filter Logic
  const filteredRecentSessions = useMemo(() => {
    return recentSessions.filter(session => {
      const matchSearch = (session.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           session.course?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCourse = filters.course === 'all' || session.course === filters.course;
      const matchDept = filters.department === 'all' || session.branch === filters.department;
      const matchYear = filters.year === 'all' || session.year === filters.year;
      const matchBatch = filters.batch === 'all' || session.batch === filters.batch;
      const matchTrainer = filters.trainer === 'all' || session.assignedTrainer?.id === filters.trainer;

      return matchSearch && matchCourse && matchDept && matchYear && matchBatch && matchTrainer;
    });
  }, [recentSessions, searchQuery, filters]);

  const copyLink = (sessionId) => {
    const link = `${window.location.origin}/feedback/anonymous/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success('Feedback link copied to clipboard');
  };

  if (selectedSession) {
    return (
      <SessionAnalytics 
        session={selectedSession} 
        onBack={() => setSelectedSession(null)} 
      />
    );
  }

  // Render Loading State (Initial only)
  if (isSessionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Active Sessions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
             <div className="relative">
                <CheckCircle2 className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse border-2 border-background"></span>
             </div>
             Active Sessions
           </h2>
        </div>

        {activeSessions.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-6 text-muted-foreground text-center">
              <p>No currently active sessions.</p>
              <p className="text-sm">Sessions started by Superadmin will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map(session => (
              <Card key={session.id} className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-2">Live Now</Badge>
                    <StatusBadge status={session.status} />
                  </div>
                  <CardTitle className="text-base font-semibold leading-tight pt-2">
                    {session.topic}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {session.course} • {session.branch} • Year {session.year}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{session.assignedTrainer?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(session.sessionDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                     <Button 
                        size="sm" 
                        className="w-full flex items-center gap-2"
                        onClick={() => copyLink(session.id)}
                     >
                        <Share2 className="h-3.5 w-3.5" /> Share Link
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 2. Recent History Section */}
      <section className="space-y-4 pt-4 border-t">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent History
            </h2>
            <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topic..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          
          {/* Filters Bar (Order: Course -> Dept -> Year -> Batch -> Trainer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 w-full">
             <Select value={filters.course} onValueChange={(v) => setFilters(prev => ({ ...prev, course: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {filterOptions.courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
             </Select>

             <Select value={filters.department} onValueChange={(v) => setFilters(prev => ({ ...prev, department: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {filterOptions.departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
             </Select>

             <Select value={filters.year} onValueChange={(v) => setFilters(prev => ({ ...prev, year: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {filterOptions.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
             </Select>

             <Select value={filters.batch} onValueChange={(v) => setFilters(prev => ({ ...prev, batch: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {filterOptions.batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
             </Select>

             <Select value={filters.trainer} onValueChange={(v) => setFilters(prev => ({ ...prev, trainer: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trainers</SelectItem>
                  {trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
             </Select>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Topic</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Batch Info</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Trainer</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredRecentSessions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="h-24 text-center text-muted-foreground">
                      No sessions found.
                    </td>
                  </tr>
                ) : (
                  filteredRecentSessions.map((session) => (
                    <tr key={session.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">{session.topic}</td>
                      <td className="p-4 align-middle">
                        {format(new Date(session.sessionDate), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {session.course} - {session.branch} (Y{session.year})
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                             {session.assignedTrainer?.name?.charAt(0) || 'T'}
                          </div>
                          <span>{session.assignedTrainer?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={session.status} />
                      </td>
                      <td className="p-4 align-middle text-right">
                        {session.status === 'active' ? (
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-primary"
                                  onClick={() => copyLink(session.id)}
                               >
                                  <Share2 className="h-4 w-4" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>Share Feedback Link</TooltipContent>
                           </Tooltip>
                        ) : (
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => setSelectedSession(session)}
                               >
                                  <BarChart2 className="h-4 w-4" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>View Analytics</TooltipContent>
                           </Tooltip>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        

      </section>
    </div>
  );
};

export default CollegeSessionsTab;
