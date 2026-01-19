import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { RatingStars } from '@/components/ui/RatingStars';
import { useAuth } from '@/contexts/AuthContext';
import {
  departmentsApi,
  facultyApi,
  submissionsApi,
  questionsApi,
  Department,
  Faculty,
  FeedbackSubmission,
  Question,
} from '@/lib/storage';
import { Users, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.departmentId || !user?.collegeId) return;

      try {
        const [depts, fac, subs, qs] = await Promise.all([
          departmentsApi.getAll(),
          facultyApi.getByDepartment(user.departmentId),
          submissionsApi.getByCollege(user.collegeId),
          questionsApi.getByCollege(user.collegeId),
        ]);

        const dept = depts.find(d => d.id === user.departmentId);
        setDepartment(dept || null);
        setFaculty(fac);
        setQuestions(qs);

        // Filter submissions for department faculty only
        const deptSubmissions = subs.filter(s =>
          fac.some(f => f.id === s.facultyId)
        );
        setSubmissions(deptSubmissions);
      } catch (error) {
        console.error('Error loading HOD dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.departmentId, user?.collegeId]);

  // Calculate department average
  const deptAverage = submissions.length > 0
    ? submissions.reduce((acc, sub) => {
        const ratings = sub.responses.filter(r => r.rating).map(r => r.rating as number);
        return acc + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
      }, 0) / submissions.length
    : 0;

  // Faculty performance data
  const facultyPerformance = faculty.map(f => {
    const facultySubmissions = submissions.filter(s => s.facultyId === f.id);
    const avgScore = facultySubmissions.length > 0
      ? facultySubmissions.reduce((acc, sub) => {
          const ratings = sub.responses.filter(r => r.rating).map(r => r.rating as number);
          return acc + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
        }, 0) / facultySubmissions.length
      : 0;

    return {
      id: f.id,
      name: f.name,
      score: parseFloat(avgScore.toFixed(2)),
      responses: facultySubmissions.length,
      subjects: f.subjects,
    };
  }).sort((a, b) => b.score - a.score);

  // Category breakdown
  const categories = [...new Set(questions.map(q => q.category))];
  const categoryData = categories.map(cat => {
    const catQuestions = questions.filter(q => q.category === cat);
    const catRatings: number[] = [];

    submissions.forEach(sub => {
      catQuestions.forEach(q => {
        const response = sub.responses.find(r => r.questionId === q.id);
        if (response?.rating) {
          catRatings.push(response.rating);
        }
      });
    });

    const avg = catRatings.length > 0
      ? catRatings.reduce((a, b) => a + b, 0) / catRatings.length
      : 0;

    return {
      category: cat.replace(/\s+/g, '\n'),
      score: parseFloat(avg.toFixed(2)),
    };
  });

  // Recent comments
  const recentComments = submissions
    .flatMap(sub => {
      const facultyMember = faculty.find(f => f.id === sub.facultyId);
      return sub.responses
        .filter(r => r.comment)
        .map(r => ({
          comment: r.comment,
          facultyName: facultyMember?.name || 'Unknown',
          date: sub.submittedAt,
        }));
    })
    .slice(0, 5);

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
        title={`${department?.name || 'Department'} Dashboard`}
        subtitle="Department performance overview and faculty analytics"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Department Average"
            value={deptAverage.toFixed(1)}
            subtitle="Out of 5.0"
            icon={TrendingUp}
          />
          <StatsCard
            title="Faculty Members"
            value={faculty.length}
            subtitle="In your department"
            icon={Users}
          />
          <StatsCard
            title="Total Responses"
            value={submissions.length}
            subtitle="This cycle"
            icon={BarChart3}
          />
          <StatsCard
            title="Comments Received"
            value={submissions.reduce((acc, s) => acc + s.responses.filter(r => r.comment).length, 0)}
            subtitle="Student feedback"
            icon={MessageSquare}
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Faculty Performance Table */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Faculty Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Faculty</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subjects</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Responses</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyPerformance.map((f, index) => (
                    <tr
                      key={f.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors animate-fade-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {f.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{f.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {f.subjects.slice(0, 2).map((sub, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                            >
                              {sub}
                            </span>
                          ))}
                          {f.subjects.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{f.subjects.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-muted-foreground">
                        {f.responses}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <RatingStars value={Math.round(f.score)} readonly size="sm" />
                          <span className="text-sm font-medium text-foreground">{f.score.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {faculty.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No faculty members in your department
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} 
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(213, 96%, 16%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Comments */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Student Comments</h3>
          <div className="space-y-4">
            {recentComments.map((c, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-secondary/50 animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <p className="text-sm text-foreground italic">"{c.comment}"</p>
                <p className="text-xs text-muted-foreground mt-2">
                  About {c.facultyName} • {new Date(c.date).toLocaleDateString()}
                </p>
              </div>
            ))}
            {recentComments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
