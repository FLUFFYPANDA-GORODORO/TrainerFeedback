import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Building2,
  BookOpen,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line
} from 'recharts';
import { getCollegeCache, getCollegeTrends } from '@/services/superadmin/cacheService';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

const CollegeAnalytics = ({ collegeId, collegeName, filters, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState(null);
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!collegeId) return;
      
      setLoading(true);
      try {
        const [cacheData, trendData] = await Promise.all([
          getCollegeCache(collegeId),
          getCollegeTrends(collegeId)
        ]);
        setCache(cacheData);
        setTrends(trendData);
      } catch (error) {
        console.error('Failed to load college analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [collegeId]);

  // Compute filtered stats based on active filters
  const stats = useMemo(() => {
    if (!cache) return null;

    // If no course/batch filters, use top-level aggregates
    if (!filters?.course || filters.course === 'all') {
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
    }

    // Filter by course
    const courseData = cache.courses?.[filters.course];
    if (!courseData) return null;

    // If year filter is active
    if (filters.year && filters.year !== 'all') {
      const yearData = courseData.years?.[filters.year];
      if (!yearData) return null;

      // If batch filter is active
      if (filters.batch && filters.batch !== 'all') {
        const batchData = yearData.batches?.[filters.batch];
        if (!batchData) return null;

        const batchRatingsCount = batchData.totalRatingsCount || batchData.totalResponses || 0;
        return {
          totalResponses: batchData.totalResponses || 0,
          avgRating: batchRatingsCount > 0 
            ? (batchData.ratingSum / batchRatingsCount).toFixed(2) 
            : 0
        };
      }

      const yearRatingsCount = yearData.totalRatingsCount || yearData.totalResponses || 0;
      return {
        totalResponses: yearData.totalResponses || 0,
        avgRating: yearRatingsCount > 0 
          ? (yearData.ratingSum / yearRatingsCount).toFixed(2) 
          : 0
      };
    }

    const courseRatingsCount = courseData.totalRatingsCount || courseData.totalResponses || 0;
    return {
      totalResponses: courseData.totalResponses || 0,
      avgRating: courseRatingsCount > 0 
        ? (courseData.ratingSum / courseRatingsCount).toFixed(2) 
        : 0
    };
  }, [cache, filters]);

  // Prepare chart data
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
        <p className="text-muted-foreground">No analytics data available for this college yet.</p>
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
              <Building2 className="h-6 w-6" />
              {collegeName || 'College Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Aggregate performance across all sessions
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

      {/* Course Breakdown */}
      {cache.courses && Object.keys(cache.courses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Breakdown</CardTitle>
            <CardDescription>Performance by course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(cache.courses).map(([course, data]) => {
                // Use totalRatingsCount for accurate average (not totalResponses)
                const ratingsCount = data.totalRatingsCount || data.totalResponses || 0;
                const courseAvg = ratingsCount > 0 
                  ? (data.ratingSum / ratingsCount).toFixed(2) 
                  : '0.00';
                return (
                  <div key={course} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{course}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.totalResponses} responses
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{courseAvg}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CollegeAnalytics;
