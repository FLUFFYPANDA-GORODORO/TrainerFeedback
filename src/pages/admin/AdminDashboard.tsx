import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  departmentsApi,
  facultyApi,
  feedbackCyclesApi,
  submissionsApi,
  Department,
  Faculty,
  FeedbackCycle,
  FeedbackSubmission,
} from '@/lib/storage';
import { Users, ClipboardCheck, Building2, TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isAfter } from 'date-fns';

const CHART_COLORS = ['hsl(213, 96%, 16%)', 'hsl(213, 80%, 25%)', 'hsl(213, 60%, 35%)', 'hsl(160, 84%, 39%)'];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [cycles, setCycles] = useState<FeedbackCycle[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.collegeId) return;

      try {
        const [depts, fac, cyc, subs] = await Promise.all([
          departmentsApi.getByCollege(user.collegeId),
          facultyApi.getByCollege(user.collegeId),
          feedbackCyclesApi.getByCollege(user.collegeId),
          submissionsApi.getByCollege(user.collegeId),
        ]);

        setDepartments(depts);
        setFaculty(fac);
        setCycles(cyc);
        setSubmissions(subs);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.collegeId]);

  // Calculate stats
  const activeCycles = cycles.filter(c => c.status === 'active');
  const todaySubmissions = submissions.filter(s => 
    isAfter(new Date(s.submittedAt), subDays(new Date(), 1))
  );
  const weekSubmissions = submissions.filter(s => 
    isAfter(new Date(s.submittedAt), subDays(new Date(), 7))
  );

  // Calculate average rating
  const avgRating = submissions.length > 0
    ? (submissions.reduce((acc, sub) => {
        const ratings = sub.responses.filter(r => r.rating).map(r => r.rating as number);
        return acc + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
      }, 0) / submissions.length).toFixed(1)
    : '0.0';

  // Department performance data
  const deptPerformance = departments.map(dept => {
    const deptFaculty = faculty.filter(f => f.departmentId === dept.id);
    const deptSubmissions = submissions.filter(s => 
      deptFaculty.some(f => f.id === s.facultyId)
    );
    const avgScore = deptSubmissions.length > 0
      ? deptSubmissions.reduce((acc, sub) => {
          const ratings = sub.responses.filter(r => r.rating).map(r => r.rating as number);
          return acc + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
        }, 0) / deptSubmissions.length
      : 0;

    return {
      name: dept.code,
      score: parseFloat(avgScore.toFixed(2)),
      responses: deptSubmissions.length,
    };
  });

  // Response trend data (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySubmissions = submissions.filter(s => {
      const subDate = new Date(s.submittedAt);
      return subDate.toDateString() === date.toDateString();
    });

    return {
      date: format(date, 'EEE'),
      responses: daySubmissions.length,
    };
  });

  // Status distribution
  const statusData = [
    { name: 'Active', value: cycles.filter(c => c.status === 'active').length },
    { name: 'Completed', value: cycles.filter(c => c.status === 'completed').length },
    { name: 'Draft', value: cycles.filter(c => c.status === 'draft').length },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}. Here's what's happening.`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Cycles"
            value={activeCycles.length}
            subtitle="Currently running"
            icon={RefreshCw}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Responses"
            value={submissions.length}
            subtitle={`${todaySubmissions.length} today, ${weekSubmissions.length} this week`}
            icon={ClipboardCheck}
          />
          <StatsCard
            title="Faculty Members"
            value={faculty.length}
            subtitle={`Across ${departments.length} departments`}
            icon={Users}
          />
          <StatsCard
            title="Average Rating"
            value={avgRating}
            subtitle="Out of 5.0"
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Department Performance */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Department Performance</h3>
                <p className="text-sm text-muted-foreground">Average scores by department</p>
              </div>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="score" fill="hsl(213, 96%, 16%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Trend */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Response Trend</h3>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="responses"
                    stroke="hsl(213, 96%, 16%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(213, 96%, 16%)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cycle Status */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Cycle Status</h3>
            <div className="h-48 flex items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No cycles yet</p>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {statusData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {submissions.slice(0, 5).map((sub, index) => {
                const facultyMember = faculty.find(f => f.id === sub.facultyId);
                const avgRating = sub.responses.filter(r => r.rating).reduce((acc, r) => acc + (r.rating || 0), 0) / 
                  sub.responses.filter(r => r.rating).length;

                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0 animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Feedback submitted for {facultyMember?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sub.submittedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-foreground">{avgRating.toFixed(1)}</span>
                      <span className="text-warning">★</span>
                    </div>
                  </div>
                );
              })}
              {submissions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
