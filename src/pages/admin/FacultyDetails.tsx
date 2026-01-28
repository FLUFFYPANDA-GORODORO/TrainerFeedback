import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { useAuth } from '@/contexts/AuthContext';
import {
  departmentsApi,
  facultyApi,
  submissionsApi,
  feedbackSessionsApi,
  Department,
  Faculty,
  FeedbackSubmission,
  FeedbackSession,
} from '@/lib/storage';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Star,
  BarChart3,
  Filter,
  Download,
  Eye,
  Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isAfter } from 'date-fns';

const CHART_COLORS = ['hsl(213, 96%, 16%)', 'hsl(213, 80%, 25%)', 'hsl(213, 60%, 35%)', 'hsl(160, 84%, 39%)'];

const FacultyDetails: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { facultyId } = useParams<{ facultyId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [sessionPageSelected, setSessionPageSelected] = useState(1);
  const [sessionPageIndividual, setSessionPageIndividual] = useState(1);
  const sessionsPerPage = 5;

  // Find the current faculty
  const currentFaculty = faculty.find(f => f.id === facultyId);
  const currentFacultySubmissions = submissions.filter(sub => sub.facultyId === facultyId);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [depts, fac, subs, sess] = await Promise.all([
          departmentsApi.getByCollege(user!.collegeId!),
          facultyApi.getByCollege(user!.collegeId!),
          submissionsApi.getAll(),
          feedbackSessionsApi.getAll(),
        ]);

        setDepartments(depts);
        setFaculty(fac);
        
        // Filter submissions and sessions by college departments
        const collegeDepartmentIds = depts.map(d => d.id);
        const filteredSessions = sess.filter(s => collegeDepartmentIds.includes(s.departmentId));
        const sessionIds = filteredSessions.map(s => s.id);
        const filteredSubmissions = subs.filter(sub => sessionIds.includes(sub.sessionId));
        
        setSessions(filteredSessions);
        setSubmissions(filteredSubmissions);
      } catch (error) {
        console.error('Error loading faculty details data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.collegeId]);

  // Filter submissions based on selected time range
  const filteredSubmissions = useMemo(() => {
    if (selectedTimeRange === 'all') return currentFacultySubmissions;

    const now = new Date();
    let startDate: Date;

    switch (selectedTimeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      default:
        return currentFacultySubmissions;
    }

    return currentFacultySubmissions.filter(sub => sub.submittedAt && sub.submittedAt.toDate() >= startDate);
  }, [currentFacultySubmissions, selectedTimeRange]);

  // Filter all submissions based on selected time range for overall stats
  const filteredAllSubmissions = useMemo(() => {
    if (selectedTimeRange === 'all') return submissions;

    const now = new Date();
    let startDate: Date;

    switch (selectedTimeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      default:
        return submissions;
    }

    return submissions.filter(sub => sub.submittedAt && sub.submittedAt.toDate() >= startDate);
  }, [submissions, selectedTimeRange]);

  // Current faculty performance data
  const facultyData = useMemo(() => {
    if (!currentFaculty) return null;

    const memberSubs = filteredSubmissions;
    const avgRating = memberSubs.length > 0
      ? memberSubs.reduce((acc, sub) => {
          const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
          return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
        }, 0) / memberSubs.length
      : 0;

    const totalComments = memberSubs.flatMap(sub =>
      sub.responses.filter(r => r.comment && r.comment.trim() !== '').map(r => r.comment!.trim())
    ).filter(comment => comment.length > 0);

    // Session-wise breakdown
    const sessionBreakdown = sessions.map(session => {
      const sessionSubs = memberSubs.filter(sub => sub.sessionId === session.id);
      const sessionAvg = sessionSubs.length > 0
        ? sessionSubs.reduce((acc, sub) => {
            const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
            return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
          }, 0) / sessionSubs.length
        : 0;

      return {
        session: session.subject,
        rating: Math.round(sessionAvg * 10) / 10,
        responses: sessionSubs.length,
        date: format(session.expiresAt.toDate(), 'MMM yyyy')
      };
    }).filter(session => session.responses > 0);

    // Batch-wise analysis (group by batch/year)
    const batchAnalysis = memberSubs.reduce((acc, sub) => {
      const session = sessions.find(s => s.id === sub.sessionId);
      const batch = session?.batch || 'Unknown';
      if (!acc[batch]) {
        acc[batch] = { batch, responses: 0, totalRating: 0, comments: [] };
      }
      acc[batch].responses += 1;
      const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
      acc[batch].totalRating += ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0;
      acc[batch].comments.push(...sub.responses.filter(r => r.comment && r.comment.trim() !== '').map(r => r.comment!.trim()));
      return acc;
    }, {} as Record<string, { batch: string; responses: number; totalRating: number; comments: string[] }>);

    const batchData = Object.values(batchAnalysis).map(item => ({
      batch: item.batch,
      avgRating: Math.round((item.totalRating / item.responses) * 10) / 10,
      responses: item.responses,
      comments: item.comments.length
    }));

    return {
      ...currentFaculty,
      avgRating: Math.round(avgRating * 10) / 10,
      totalResponses: memberSubs.length,
      totalComments: totalComments.length,
      recentComments: totalComments.slice(0, 10),
      sessionBreakdown,
      batchData,
      departmentName: departments.find(d => d.id === currentFaculty.departmentId)?.name || 'Unknown'
    };
  }, [currentFaculty, filteredSubmissions, sessions, departments]);

  // Overall statistics for current faculty
  const overallStats = useMemo(() => {
    const totalResponses = filteredAllSubmissions.length;
    const avgRating = totalResponses > 0
      ? filteredAllSubmissions.reduce((acc, sub) => {
          const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
          return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
        }, 0) / totalResponses
      : 0;

    const totalComments = filteredAllSubmissions.flatMap(sub =>
      sub.responses.filter(r => r.comment && r.comment.trim() !== '').length
    ).reduce((sum, count) => sum + count, 0);

    // Calculate trend (compare with previous period)
    const now = new Date();
    let previousStartDate: Date;
    let currentStartDate: Date;

    switch (selectedTimeRange) {
      case 'week':
        currentStartDate = subDays(now, 7);
        previousStartDate = subDays(now, 14);
        break;
      case 'month':
        currentStartDate = subDays(now, 30);
        previousStartDate = subDays(now, 60);
        break;
      case 'quarter':
        currentStartDate = subDays(now, 90);
        previousStartDate = subDays(now, 180);
        break;
      default:
        currentStartDate = new Date(0); // All time
        previousStartDate = new Date(0);
    }

    const currentPeriodSubs = selectedTimeRange === 'all' 
      ? submissions 
      : submissions.filter(sub => sub.submittedAt && sub.submittedAt.toDate() >= currentStartDate);
    
    const previousPeriodSubs = selectedTimeRange === 'all'
      ? [] // No previous period for all time
      : submissions.filter(sub => {
          if (!sub.submittedAt) return false;
          const subDate = sub.submittedAt.toDate();
          return subDate >= previousStartDate && subDate < currentStartDate;
        });

    const previousAvgRating = previousPeriodSubs.length > 0
      ? previousPeriodSubs.reduce((acc, sub) => {
          const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
          return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
        }, 0) / previousPeriodSubs.length
      : 0;
    
    const trendValue = previousAvgRating > 0 ? ((avgRating - previousAvgRating) / previousAvgRating) * 100 : 0;
    const isPositive = trendValue >= 0;

    return {
      totalResponses,
      avgRating: Math.round(avgRating * 10) / 10,
      totalComments,
      trendValue: Math.abs(trendValue),
      isPositive
    };
  }, [filteredAllSubmissions, submissions, selectedTimeRange]);

  // Top comments for current faculty
  const topComments = useMemo(() => {
    const allComments = filteredAllSubmissions.flatMap(sub =>
      sub.responses
        .filter(r => r.comment && r.comment.trim() !== '')
        .map(r => {
          const session = sessions.find(s => s.id === sub.sessionId);
          return {
            comment: r.comment!.trim(),
            rating: r.rating || 0,
            submittedAt: sub.submittedAt?.toDate(),
            question: r.questionId || 'General Feedback',
            batch: session?.batch || 'Unknown'
          };
        })
    ).filter(item => item.comment.length > 10) // Only substantial comments
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 20);

    return allComments;
  }, [filteredAllSubmissions, sessions]);

  // Function to generate pagination page numbers
  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (current < total - 3) pages.push('...');
      if (total > 1) pages.push(total);
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!facultyId || facultyId.trim() === '') {
    // Show faculty list when no specific faculty is selected
    return (
      <div className="min-h-screen">
        <DashboardHeader
          title="Faculty Performance Overview"
          subtitle="Detailed analysis of all faculty feedback and performance metrics"
        />

        {/* Header with Back Button */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(facultyId && facultyId.trim() !== '' ? '/admin/faculty-details' : '/admin/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {facultyId && facultyId.trim() !== '' ? 'Back to Faculty Overview' : 'Back to Dashboard'}
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                </select>
              </div>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-4 gap-6">
            <StatsCard
              title="Total Faculty"
              value={faculty.length}
              subtitle="Active faculty members"
              icon={Users}
            />
            <StatsCard
              title="Total Responses"
              value={overallStats.totalResponses}
              subtitle={`${selectedTimeRange === 'all' ? 'All time' : `Last ${selectedTimeRange}`}`}
              icon={MessageSquare}
            />
            <StatsCard
              title="Average Rating"
              value={overallStats.avgRating.toFixed(1)}
              subtitle="Out of 5.0"
              icon={TrendingUp}
              trend={{ value: overallStats.trendValue, isPositive: overallStats.isPositive }}
            />
            <StatsCard
              title="Total Comments"
              value={overallStats.totalComments}
              subtitle="Feedback comments"
              icon={BarChart3}
            />
          </div>

          {/* Faculty Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Faculty Performance Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Click on any faculty member to view detailed analysis</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {faculty.map((member) => {
                  const memberSubs = submissions.filter(sub => sub.facultyId === member.id);
                  const avgRating = memberSubs.length > 0
                    ? memberSubs.reduce((acc, sub) => {
                        const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
                        return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
                      }, 0) / memberSubs.length
                    : 0;

                  const departmentName = departments.find(d => d.id === member.departmentId)?.name || 'Unknown';

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedFaculty(member.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFaculty === member.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-secondary/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{member.name}</h4>
                          <p className="text-xs text-muted-foreground">{member.designation}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Rating</span>
                          <div className="flex items-center gap-1">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-xs">
                                  {star <= Math.round(avgRating) ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Responses</span>
                          <span className="text-sm font-medium">{memberSubs.length}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Department</span>
                          <span className="text-xs text-muted-foreground truncate max-w-24">{departmentName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Faculty Detailed View */}
          {selectedFaculty && (() => {
            const selectedFacultyData = faculty.find(f => f.id === selectedFaculty);
            if (!selectedFacultyData) return null;

            const facultyData = (() => {
              const memberSubs = submissions.filter(sub => sub.facultyId === selectedFaculty);
              const avgRating = memberSubs.length > 0
                ? memberSubs.reduce((acc, sub) => {
                    const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
                    return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
                  }, 0) / memberSubs.length
                : 0;

              const totalComments = memberSubs.flatMap(sub =>
                sub.responses.filter(r => r.comment && r.comment.trim() !== '').map(r => r.comment!.trim())
              ).filter(comment => comment.length > 0);

              // Session-wise breakdown
              const sessionBreakdown = sessions.map(session => {
                const sessionSubs = memberSubs.filter(sub => sub.sessionId === session.id);
                const sessionAvg = sessionSubs.length > 0
                  ? sessionSubs.reduce((acc, sub) => {
                      const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
                      return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
                    }, 0) / sessionSubs.length
                  : 0;

                return {
                  session: session.subject,
                  rating: Math.round(sessionAvg * 10) / 10,
                  responses: sessionSubs.length,
                  date: format(session.expiresAt.toDate(), 'MMM yyyy')
                };
              }).filter(session => session.responses > 0);

              // Batch-wise analysis
              const batchAnalysis = memberSubs.reduce((acc, sub) => {
                const session = sessions.find(s => s.id === sub.sessionId);
                const batch = session?.batch || 'Unknown';
                if (!acc[batch]) {
                  acc[batch] = { batch, responses: 0, totalRating: 0, comments: [] };
                }
                acc[batch].responses += 1;
                const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
                acc[batch].totalRating += ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0;
                acc[batch].comments.push(...sub.responses.filter(r => r.comment && r.comment.trim() !== '').map(r => r.comment!.trim()));
                return acc;
              }, {} as Record<string, { batch: string; responses: number; totalRating: number; comments: string[] }>);

              const batchData = Object.values(batchAnalysis).map(item => ({
                batch: item.batch,
                avgRating: Math.round((item.totalRating / item.responses) * 10) / 10,
                responses: item.responses,
                comments: item.comments.length
              }));

              return {
                ...selectedFacultyData,
                avgRating: Math.round(avgRating * 10) / 10,
                totalResponses: memberSubs.length,
                totalComments: totalComments.length,
                recentComments: totalComments.slice(0, 10),
                sessionBreakdown,
                batchData,
                departmentName: departments.find(d => d.id === selectedFacultyData.departmentId)?.name || 'Unknown'
              };
            })();

            return (
              <div className="mt-6 space-y-6">
                {/* Faculty Header */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {selectedFacultyData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selectedFacultyData.name} | {selectedFacultyData.designation} | {facultyData?.departmentName}</h3>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFaculty(null)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Close Details
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">{facultyData?.avgRating.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Average Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{facultyData?.totalResponses}</div>
                        <div className="text-xs text-muted-foreground">Total Responses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{facultyData?.totalComments}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{facultyData?.sessionBreakdown.length}</div>
                        <div className="text-xs text-muted-foreground">Sessions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Section */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Session-wise Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Session-wise Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {facultyData?.sessionBreakdown.length ? (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={facultyData.sessionBreakdown}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="session"
                                tick={{ fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                              <Tooltip
                                formatter={(value: number) => [value.toFixed(1), 'Average Rating']}
                                labelFormatter={(label) => `Session: ${label}`}
                              />
                              <Line
                                type="monotone"
                                dataKey="rating"
                                stroke="hsl(213, 96%, 16%)"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(213, 96%, 16%)', strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">No session data available</p>
                        </div>
                      )}

                      {facultyData?.sessionBreakdown.length ? (
                        <div className="mt-3 space-y-1">
                          {(() => {
                            const totalSessionPagesSelected = Math.ceil(facultyData.sessionBreakdown.length / sessionsPerPage);
                            const paginatedSessionsSelected = facultyData.sessionBreakdown.slice(
                              (sessionPageSelected - 1) * sessionsPerPage,
                              sessionPageSelected * sessionsPerPage
                            );
                            return (
                              <>
                                {paginatedSessionsSelected.map((session, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <h4 className="font-medium text-xs">{session.session}</h4>
                                      <p className="text-xs text-muted-foreground">{session.date}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold text-sm">{session.rating.toFixed(1)}</span>
                                        <span className="text-xs text-muted-foreground">({session.responses})</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex items-center justify-center mt-4">
                                  <Pagination>
                                    <PaginationContent>
                                      <PaginationItem>
                                        <PaginationPrevious
                                          onClick={() => setSessionPageSelected(Math.max(1, sessionPageSelected - 1))}
                                          className={sessionPageSelected === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                      </PaginationItem>
                                      {getPageNumbers(sessionPageSelected, totalSessionPagesSelected).map((page, index) => (
                                        <PaginationItem key={index}>
                                          {page === '...' ? (
                                            <PaginationEllipsis />
                                          ) : (
                                            <PaginationLink
                                              onClick={() => setSessionPageSelected(page as number)}
                                              isActive={page === sessionPageSelected}
                                              className="cursor-pointer"
                                            >
                                              {page}
                                            </PaginationLink>
                                          )}
                                        </PaginationItem>
                                      ))}
                                      <PaginationItem>
                                        <PaginationNext
                                          onClick={() => setSessionPageSelected(Math.min(totalSessionPagesSelected, sessionPageSelected + 1))}
                                          className={sessionPageSelected === totalSessionPagesSelected ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                      </PaginationItem>
                                    </PaginationContent>
                                  </Pagination>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  {/* Batch-wise Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Batch-wise Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {facultyData?.batchData.length ? (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={facultyData.batchData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="batch"
                                tick={{ fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                              <Tooltip
                                formatter={(value: number, name: string) => [
                                  name === 'avgRating' ? value.toFixed(1) : value,
                                  name === 'avgRating' ? 'Average Rating' : 'Responses'
                                ]}
                              />
                              <Bar dataKey="avgRating" fill="hsl(160, 84%, 39%)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">No batch data available</p>
                        </div>
                      )}

                      {facultyData?.batchData.length ? (
                        <div className="mt-3 grid gap-1">
                          {facultyData.batchData.map((batch, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <h4 className="font-medium text-xs">Batch {batch.batch}</h4>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-sm">{batch.avgRating.toFixed(1)}</span>
                                  <span className="text-xs text-muted-foreground">({batch.responses}, {batch.comments})</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                {/* Comments Section */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Recent Comments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Recent Comments & Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {facultyData?.recentComments.length ? (
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {facultyData.recentComments.map((comment, index) => (
                            <div key={index} className="border-l-4 border-primary/50 pl-4 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(), 'MMM d, yyyy')}
                                </span>
                                <Badge variant="secondary" className="text-xs">Recent</Badge>
                              </div>
                              <p className="text-sm text-foreground italic">"{comment}"</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No comments yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Comments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Top Comments & Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topComments.length > 0 ? (
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {topComments.map((comment, index) => (
                            <div key={index} className="border-l-4 border-primary/50 pl-4 py-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {comment.rating}/5
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">Batch {comment.batch}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(comment.submittedAt, 'MMM d, yyyy')}
                                </span>
                              </div>
                              <p className="text-sm text-foreground italic mb-2">"{comment.comment}"</p>
                              <p className="text-xs text-muted-foreground">{comment.question}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No comments available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}


        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title={`${currentFaculty.name} - Performance Details`}
        subtitle={`Department: ${facultyData?.departmentName} | Comprehensive analysis of feedback and performance metrics`}
      />

      {/* Header with Back Button */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-1 border border-border rounded-md text-sm bg-background"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
            </div>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Faculty Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Responses"
            value={overallStats.totalResponses}
            subtitle={`${selectedTimeRange === 'all' ? 'All time' : `Last ${selectedTimeRange}`}`}
            icon={MessageSquare}
          />
          <StatsCard
            title="Average Rating"
            value={overallStats.avgRating.toFixed(1)}
            subtitle="Out of 5.0"
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Total Comments"
            value={overallStats.totalComments}
            subtitle="Feedback comments"
            icon={BarChart3}
          />
          <StatsCard
            title="Sessions Covered"
            value={facultyData?.sessionBreakdown.length || 0}
            subtitle="Feedback cycles"
            icon={Calendar}
          />
        </div>

        {/* Faculty Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Faculty Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Faculty Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-semibold text-primary">
                      {currentFaculty.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{currentFaculty.name}</h3>
                  <p className="text-muted-foreground">{currentFaculty.designation}</p>
                  <p className="text-sm text-muted-foreground">{facultyData?.departmentName}</p>
                </div>

                <div className="space-y-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{facultyData?.avgRating.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Average Rating</div>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-yellow-400 text-sm">
                          {star <= Math.round(facultyData?.avgRating || 0) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{facultyData?.totalResponses}</div>
                      <div className="text-xs text-muted-foreground">Responses</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{facultyData?.totalComments}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-6">
              {/* Session-wise Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Session-wise Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {facultyData?.sessionBreakdown.length ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={facultyData.sessionBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="session"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value: number) => [value.toFixed(1), 'Average Rating']}
                            labelFormatter={(label) => `Session: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="rating"
                            stroke="hsl(213, 96%, 16%)"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(213, 96%, 16%)', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No session data available</p>
                    </div>
                  )}

                  {facultyData?.sessionBreakdown.length ? (
                    <div className="mt-3 space-y-1">
                      {(() => {
                        const totalSessionPagesIndividual = Math.ceil(facultyData.sessionBreakdown.length / sessionsPerPage);
                        const paginatedSessionsIndividual = facultyData.sessionBreakdown.slice(
                          (sessionPageIndividual - 1) * sessionsPerPage,
                          sessionPageIndividual * sessionsPerPage
                        );
                        return (
                          <>
                            {paginatedSessionsIndividual.map((session, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <h4 className="font-medium text-xs">{session.session}</h4>
                                  <p className="text-xs text-muted-foreground">{session.date}</p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold text-sm">{session.rating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({session.responses})</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center justify-center mt-4">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() => setSessionPageIndividual(Math.max(1, sessionPageIndividual - 1))}
                                      className={sessionPageIndividual === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                  </PaginationItem>
                                  {getPageNumbers(sessionPageIndividual, totalSessionPagesIndividual).map((page, index) => (
                                    <PaginationItem key={index}>
                                      {page === '...' ? (
                                        <PaginationEllipsis />
                                      ) : (
                                        <PaginationLink
                                          onClick={() => setSessionPageIndividual(page as number)}
                                          isActive={page === sessionPageIndividual}
                                          className="cursor-pointer"
                                        >
                                          {page}
                                        </PaginationLink>
                                      )}
                                    </PaginationItem>
                                  ))}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() => setSessionPageIndividual(Math.min(totalSessionPagesIndividual, sessionPageIndividual + 1))}
                                      className={sessionPageIndividual === totalSessionPagesIndividual ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Batch-wise Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Batch-wise Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {facultyData?.batchData.length ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={facultyData.batchData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="batch"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              name === 'avgRating' ? value.toFixed(1) : value,
                              name === 'avgRating' ? 'Average Rating' : 'Responses'
                            ]}
                          />
                          <Bar dataKey="avgRating" fill="hsl(160, 84%, 39%)" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No batch data available</p>
                    </div>
                  )}

                  {facultyData?.batchData.length ? (
                    <div className="mt-3 grid gap-1">
                      {facultyData.batchData.map((batch, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <h4 className="font-medium text-xs">Batch {batch.batch}</h4>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm">{batch.avgRating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({batch.responses}, {batch.comments})</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Top Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Top Comments & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topComments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {topComments.map((comment, index) => (
                  <div key={index} className="border-l-4 border-primary/50 pl-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {comment.rating}/5
                        </Badge>
                        <span className="text-xs text-muted-foreground">Batch {comment.batch}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(comment.submittedAt, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground italic mb-2">"{comment.comment}"</p>
                    <p className="text-xs text-muted-foreground">{comment.question}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No comments available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyDetails;