import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/contexts/AuthContext';
import {
  facultyApi,
  submissionsApi,
  questionsApi,
  Faculty,
  FeedbackSubmission,
  Question,
} from '@/lib/storage';
import { TrendingUp, MessageSquare, Award, Download, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Button } from '@/components/ui/button';
import { format, subMonths } from 'date-fns';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [facultyProfile, setFacultyProfile] = useState<Faculty | null>(null);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<FeedbackSubmission[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.collegeId) return;

      try {
        const [allFaculty, allSubs, qs] = await Promise.all([
          facultyApi.getByCollege(user.collegeId),
          submissionsApi.getByCollege(user.collegeId),
          questionsApi.getByCollege(user.collegeId),
        ]);

        // Find faculty profile for current user
        const profile = allFaculty.find(f => f.userId === user.id);
        setFacultyProfile(profile || null);
        setAllSubmissions(allSubs);
        setQuestions(qs);

        if (profile) {
          const facultySubs = allSubs.filter(s => s.facultyId === profile.id);
          setSubmissions(facultySubs);
        }
      } catch (error) {
        console.error('Error loading faculty dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.collegeId]);

  // Calculate current score
  const currentScore = submissions.length > 0
    ? submissions.reduce((acc, sub) => {
        const ratings = sub.responses.filter(r => r.rating).map(r => r.rating as number);
        return acc + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
      }, 0) / submissions.length
    : 0;

  // Calculate peer percentile
  const allFacultyScores = [...new Set(allSubmissions.map(s => s.facultyId))].map(fId => {
    const fSubs = allSubmissions.filter(s => s.facultyId === fId);
    if (fSubs.length === 0) return 0;
    return fSubs.reduce((acc, sub) => {
      const ratings = sub.responses.filter(r => r.rating).map(r => r.rating as number);
      return acc + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
    }, 0) / fSubs.length;
  }).filter(s => s > 0);

  const belowMe = allFacultyScores.filter(s => s < currentScore).length;
  const percentile = allFacultyScores.length > 0 
    ? Math.round((belowMe / allFacultyScores.length) * 100) 
    : 0;

  // Category breakdown for radar chart
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
      category: cat,
      score: parseFloat(avg.toFixed(2)),
      fullMark: 5,
    };
  });

  // Historical trend (mock data for demo)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, 'MMM'),
      score: Math.min(5, Math.max(3, currentScore + (Math.random() - 0.5))).toFixed(2),
    };
  });

  // Recent comments about this faculty
  const comments = submissions
    .flatMap(sub =>
      sub.responses
        .filter(r => r.comment)
        .map(r => ({
          comment: r.comment,
          date: sub.submittedAt,
        }))
    )
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
        title="My Performance"
        subtitle="View your feedback scores and student comments"
      />

      <div className="p-6 space-y-6">
        {/* Profile Summary */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-semibold text-primary">
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">{user?.name}</h2>
                <p className="text-muted-foreground">{facultyProfile?.subjects?.join(', ') || 'No subjects assigned'}</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Current Score"
            value={currentScore.toFixed(1)}
            subtitle="This cycle"
            icon={TrendingUp}
          />
          <StatsCard
            title="Peer Percentile"
            value={`${percentile}th`}
            subtitle="Among all faculty"
            icon={Award}
          />
          <StatsCard
            title="Total Responses"
            value={submissions.length}
            subtitle="Student evaluations"
            icon={Users}
          />
          <StatsCard
            title="Comments"
            value={comments.length}
            subtitle="Student feedback"
            icon={MessageSquare}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Historical Trend */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Performance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(213, 96%, 16%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(213, 96%, 16%)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Radar */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Category Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={categoryData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <PolarRadiusAxis 
                    domain={[0, 5]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(213, 96%, 16%)"
                    fill="hsl(213, 96%, 16%)"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Details & Comments */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Details */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Detailed Scores</h3>
            <div className="space-y-4">
              {categoryData.map((cat, index) => (
                <div key={cat.category} className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <RatingStars value={Math.round(cat.score)} readonly size="sm" />
                      <span className="text-sm font-medium text-muted-foreground">{cat.score.toFixed(1)}</span>
                    </div>
                  </div>
                  <ProgressBar value={cat.score} max={5} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Comments */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Student Comments</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {comments.map((c, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-secondary/50 animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <p className="text-sm text-foreground italic">"{c.comment}"</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(c.date), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
