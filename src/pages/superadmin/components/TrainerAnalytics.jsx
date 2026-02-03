import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  TrendingUp,
  Calendar,
  User,
  Loader2,
  BookOpen
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { getTrainerCache, getTrainerTrends } from '@/services/superadmin/cacheService';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

const TrainerAnalytics = ({ trainerId, trainerName, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState(null);
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!trainerId) return;
      
      setLoading(true);
      try {
        const [cacheData, trendData] = await Promise.all([
          getTrainerCache(trainerId),
          getTrainerTrends(trainerId)
        ]);
        setCache(cacheData);
        setTrends(trendData);
      } catch (error) {
        console.error('Failed to load trainer analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [trainerId]);

  // Compute stats from cache
  const stats = useMemo(() => {
    if (!cache) return null;

    // Use totalRatingsCount for accurate avg (not totalResponses)
    const ratingsCount = cache.totalRatingsCount || 
      Object.values(cache.ratingDistribution || {}).reduce((sum, c) => sum + c, 0);

    return {
      totalSessions: cache.totalSessions || 0,
      totalResponses: cache.totalResponses || 0,
      avgRating: ratingsCount > 0 
        ? (cache.ratingSum / ratingsCount).toFixed(2) 
        : 0,
      ratingDistribution: cache.ratingDistribution || {},
      categoryData: cache.categoryData || {}
    };
  }, [cache]);

  // Rating distribution chart data
  const ratingData = useMemo(() => {
    if (!stats?.ratingDistribution) return [];
    return Object.entries(stats.ratingDistribution).map(([rating, count]) => ({
      name: `${rating} Star`,
      value: count,
      rating: parseInt(rating)
    })).sort((a, b) => a.rating - b.rating);
  }, [stats]);

  // Radar chart data from category averages
  const radarData = useMemo(() => {
    if (!stats?.categoryData) return [];
    
    const categoryLabels = {
      knowledge: 'Knowledge',
      communication: 'Communication',
      engagement: 'Engagement',
      content: 'Content',
      delivery: 'Delivery',
      overall: 'Overall'
    };

    return Object.entries(stats.categoryData).map(([key, data]) => ({
      category: categoryLabels[key] || key,
      score: data.count > 0 ? (data.sum / data.count) : 0,
      fullMark: 5
    }));
  }, [stats]);

  // Trend data for line chart
  const trendData = useMemo(() => {
    if (!trends?.dailyResponses) return [];
    
    return Object.entries(trends.dailyResponses)
      .map(([day, count]) => ({
        day: parseInt(day),
        responses: count,
        sessions: trends.dailySessions?.[day] || 0
      }))
      .sort((a, b) => a.day - b.day);
  }, [trends]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cache) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available for this trainer yet.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              {trainerName || 'Trainer Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overall performance across all sessions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating || '0.00'}</div>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(stats?.avgRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendData.reduce((sum, d) => sum + d.responses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of all ratings received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.rating - 1]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Average scores across evaluation categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 5]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickCount={6}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [value.toFixed(2), 'Score']}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No category data available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Response Trend</CardTitle>
          <CardDescription>Daily responses for {trends?.yearMonth || 'current month'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="day" 
                    className="text-xs"
                    tickFormatter={(day) => `${day}`}
                  />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(day) => `Day ${day}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responses" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No trend data available for this month yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {radarData.map((item) => (
              <div key={item.category} className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">{item.category}</p>
                <p className="text-xl font-bold">{item.score.toFixed(2)}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-2 w-2 ${i <= Math.round(item.score) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerAnalytics;
