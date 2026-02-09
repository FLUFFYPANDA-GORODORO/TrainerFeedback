import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Star,
  TrendingUp,
  ClipboardList,
  Calendar,
  Filter,
  RotateCcw,
  MessageSquare,
  ArrowLeft,
  Loader2,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';
import { getTrainerCache, getTrainerTrends } from '@/services/superadmin/cacheService';
import { getSessionsByTrainer } from '@/services/superadmin/sessionService';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

const TrainerAnalytics = ({ trainerId, trainerName, onBack }) => {
  // Data state
  const [cache, setCache] = useState(null);
  const [trends, setTrends] = useState({});
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState({
    collegeId: 'all',
    course: 'all',
    department: 'all',
    year: 'all',
    batch: 'all',
    dateRange: 'all'
  });

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!trainerId) return;
      
      setIsLoading(true);
      try {
        const today = new Date();
        const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const isEarlyMonth = today.getDate() <= 7;

        const promises = [
             getTrainerCache(trainerId),
             getTrainerTrends(trainerId, currentYearMonth),
             getSessionsByTrainer(trainerId)
        ];

        if (isEarlyMonth) {
             const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
             const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
             promises.push(getTrainerTrends(trainerId, prevYearMonth));
        }

        const results = await Promise.all(promises);
        const cacheData = results[0];
        const trendData = results[1] || { dailyResponses: {}, dailySessions: {} };
        const sessionsData = results[2];
        const prevTrendData = isEarlyMonth ? results[3] : null;

        // Process Trends
        const processedTrends = {};
        
        const processTrendDoc = (trendDoc, yearMonth) => {
           if (!trendDoc) return;
           Object.entries(trendDoc.dailyResponses || {}).forEach(([day, count]) => {
              const fullDate = `${yearMonth}-${day}`;
              if (!processedTrends[fullDate]) processedTrends[fullDate] = { responses: 0, sessions: 0 };
              processedTrends[fullDate].responses = count;
           });
           Object.entries(trendDoc.dailySessions || {}).forEach(([day, count]) => {
              const fullDate = `${yearMonth}-${day}`;
              if (!processedTrends[fullDate]) processedTrends[fullDate] = { responses: 0, sessions: 0 };
              processedTrends[fullDate].sessions = count;
           });
        };

        processTrendDoc(trendData, currentYearMonth);
        if (prevTrendData) {
            const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
            processTrendDoc(prevTrendData, prevYearMonth);
        }

        setCache(cacheData);
        setTrends(processedTrends);
        setSessions(sessionsData || []);

      } catch (error) {
        console.error("Failed to load trainer analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [trainerId]);

  // Reset Filters
  const resetFilters = () => {
    setFilters({
      collegeId: 'all',
      course: 'all',
      department: 'all',
      year: 'all',
      batch: 'all',
      dateRange: 'all'
    });
  };

  // Helper: Get Date Range
  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate = null;
    
    switch (range) {
      case '7days': startDate = new Date(today); startDate.setDate(startDate.getDate() - 7); break;
      case '30days': startDate = new Date(today); startDate.setDate(startDate.getDate() - 30); break;
      case '90days': startDate = new Date(today); startDate.setDate(startDate.getDate() - 90); break;
      case 'thisMonth': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case 'lastMonth': startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); today.setDate(0); break;
      default: return { startDate: null, endDate: null };
    }
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: today };
  };

  // --- Derived Filter Options ---

  // Unique Colleges
  const availableColleges = useMemo(() => {
    const uniqueIds = [...new Set(sessions.map(s => s.collegeId))].filter(Boolean);
    return uniqueIds.map(id => {
        const session = sessions.find(s => s.collegeId === id);
        return { id, name: session?.collegeName || 'Unknown College' };
    });
  }, [sessions]);

  // Unique Courses
  const availableCourses = useMemo(() => {
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    
    const courses = [...new Set(filtered.map(s => s.course))].filter(Boolean);
    return courses.sort();
  }, [sessions, filters.collegeId]);

  // Unique Departments
  const availableDepartments = useMemo(() => {
    if (filters.course === 'all') return []; 
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    if (filters.course !== 'all') filtered = filtered.filter(s => s.course === filters.course);

    const depts = [...new Set(filtered.map(s => s.branch || s.department))].filter(Boolean);
    return depts.sort();
  }, [sessions, filters.collegeId, filters.course]);

  // Unique Years
  const availableYears = useMemo(() => {
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    if (filters.course !== 'all') filtered = filtered.filter(s => s.course === filters.course);
    if (filters.department !== 'all') filtered = filtered.filter(s => (s.branch || s.department) === filters.department);

    const years = [...new Set(filtered.map(s => s.year))].filter(Boolean);
    return years.sort();
  }, [sessions, filters]);

  // Unique Batches
  const availableBatches = useMemo(() => {
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    if (filters.course !== 'all') filtered = filtered.filter(s => s.course === filters.course);
    if (filters.department !== 'all') filtered = filtered.filter(s => (s.branch || s.department) === filters.department);
    if (filters.year !== 'all') filtered = filtered.filter(s => s.year === filters.year);

    const batches = [...new Set(filtered.map(s => s.batch))].filter(Boolean);
    return batches.sort();
  }, [sessions, filters]);


  // --- Filtered Data & Stats Aggregation ---

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
       if (session.status !== 'inactive' || !session.compiledStats) return false;

       if (filters.collegeId !== 'all' && session.collegeId !== filters.collegeId) return false;
       if (filters.course !== 'all' && session.course !== filters.course) return false;
       if (filters.department !== 'all' && (session.branch || session.department) !== filters.department) return false;
       if (filters.year !== 'all' && session.year !== filters.year) return false;
       if (filters.batch !== 'all' && session.batch !== filters.batch) return false;

       if (filters.dateRange !== 'all') {
         const { startDate, endDate } = getDateRange(filters.dateRange);
         if (startDate && endDate) {
           const sessionDate = new Date(session.sessionDate);
           if (sessionDate < startDate || sessionDate > endDate) return false;
         }
       }
       return true;
    });
  }, [sessions, filters]);

  const aggregatedStats = useMemo(() => {
     // 1. Initial State / Global View -> Use Cache
     const isDefaultView = 
        filters.collegeId === 'all' && 
        filters.course === 'all' && 
        filters.department === 'all' &&
        filters.year === 'all' &&
        filters.batch === 'all' &&
        filters.dateRange === 'all';
    
      if (isDefaultView && cache) {
          const avgRating = cache.totalRatingsCount > 0 
            ? (cache.ratingSum / cache.totalRatingsCount).toFixed(2) 
            : '0.00';
          
          return {
            totalSessions: cache.totalSessions || 0,
            totalResponses: cache.totalResponses || 0,
            totalRatingsCount: cache.totalRatingsCount || 0,
            avgRating,
            ratingDistribution: cache.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            categoryAverages: cache.categoryData ? 
                Object.fromEntries(Object.entries(cache.categoryData).map(([k, v]) => [k, v.count > 0 ? (v.sum / v.count).toFixed(2) : 0])) 
                : {},
            qualitative: cache.qualitative || { high: [], low: [], avg: [] }
          };
      }

      // 2. Filtered View -> Aggregate from Sessions
      const stats = {
          totalResponses: 0,
          totalRatingsCount: 0,
          ratingSum: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          categoryTotals: {},
          categoryCounts: {}
      };

      filteredSessions.forEach(session => {
          const cs = session.compiledStats;
          if (!cs) return;

          stats.totalResponses += cs.totalResponses || 0;
          
          Object.entries(cs.ratingDistribution || {}).forEach(([rating, count]) => {
              stats.ratingDistribution[rating] = (stats.ratingDistribution[rating] || 0) + count;
              stats.ratingSum += Number(rating) * count;
              stats.totalRatingsCount += count;
          });

          Object.entries(cs.categoryAverages || {}).forEach(([cat, avg]) => {
              const count = cs.totalResponses || 1; // Weighted by responses
              stats.categoryTotals[cat] = (stats.categoryTotals[cat] || 0) + (avg * count);
              stats.categoryCounts[cat] = (stats.categoryCounts[cat] || 0) + count;
          });
      });

      const avgRating = stats.totalRatingsCount > 0 
          ? (stats.ratingSum / stats.totalRatingsCount).toFixed(2) 
          : '0.00';

      const categoryAverages = {};
      Object.keys(stats.categoryTotals).forEach(cat => {
          categoryAverages[cat] = stats.categoryCounts[cat] > 0
            ? (stats.categoryTotals[cat] / stats.categoryCounts[cat]).toFixed(2)
            : 0;
      });

      return {
          totalSessions: filteredSessions.length,
          totalResponses: stats.totalResponses,
          totalRatingsCount: stats.totalRatingsCount,
          avgRating,
          ratingDistribution: stats.ratingDistribution,
          categoryAverages,
          qualitative: { high: [], low: [], avg: [] } 
      };

  }, [filteredSessions, cache, filters]);

  // Chart Data Preparation
  
  // 1. Rating Distribution
  const ratingDistributionData = useMemo(() => {
    const distribution = aggregatedStats.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating} Star`,
      count: count || 0
    }));
  }, [aggregatedStats]);

  // 2. Category Breakdown
  const categoryRadarData = useMemo(() => {
    const labels = {
      knowledge: 'Knowledge',
      communication: 'Communication',
      engagement: 'Engagement',
      content: 'Content Quality',
      delivery: 'Delivery',
      overall: 'Overall'
    };
    return Object.entries(aggregatedStats.categoryAverages || {})
      .map(([key, value]) => ({
        category: labels[key] || key,
        score: parseFloat(value) || 0,
        fullMark: 5
      }));
  }, [aggregatedStats]);

  // Response Trend
  const responseTrend = useMemo(() => {
    return Object.entries(trends)
      .map(([date, data]) => {
         const day = parseInt(date.split('-')[2]); 
         return {
           day: `${day} (${date.split('-')[1]}/${date.split('-')[0].slice(2)})`, 
           fullDate: date,
           responses: data.responses,
           sessions: data.sessions
         };
      })
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [trends]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no cache and no sessions, show empty state
  if (!cache && sessions.length === 0) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              {trainerName || 'Trainer Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overall performance across all sessions
            </p>
          </div>
        </div>

         {/* Filter Reset */}
         <Button variant="outline" size="sm" onClick={resetFilters} disabled={Object.values(filters).every(v => v === 'all')}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Filters
         </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
             <div className="space-y-1">
              <Label className="text-xs">College</Label>
              <Select 
                value={filters.collegeId} 
                onValueChange={v => setFilters({...filters, collegeId: v, course: 'all', department: 'all', year: 'all', batch: 'all'})}
              >
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {availableColleges.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Course</Label>
              <Select 
                value={filters.course} 
                onValueChange={v => setFilters({...filters, course: v, department: 'all', year: 'all', batch: 'all'})}
              >
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {availableCourses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Select 
                value={filters.department} 
                onValueChange={v => setFilters({...filters, department: v, year: 'all', batch: 'all'})}
              >
                <SelectTrigger className={filters.course === 'all' && filters.collegeId === 'all' ? 'opacity-50' : ''}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select 
                value={filters.year} 
                onValueChange={v => setFilters({...filters, year: v, batch: 'all'})}
              >
                <SelectTrigger className={filters.course === 'all' ? 'opacity-50' : ''}>
                   <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(y => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Batch</Label>
              <Select 
                value={filters.batch} 
                onValueChange={v => setFilters({...filters, batch: v})}
              >
                <SelectTrigger className={filters.year === 'all' ? 'opacity-50' : ''}>
                   <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {availableBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date Range</Label>
              <Select value={filters.dateRange} onValueChange={v => setFilters({...filters, dateRange: v})}>
                <SelectTrigger><SelectValue placeholder="All Time" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aggregatedStats.totalResponses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Student Responses
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aggregatedStats.avgRating}</div>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(Number(aggregatedStats.avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">out of 5.0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">{aggregatedStats.totalSessions}</div>
             <p className="text-xs text-muted-foreground mt-1">Conducted Sessions</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rating Count</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">{aggregatedStats.totalRatingsCount}</div>
             <p className="text-xs text-muted-foreground mt-1">Individual Ratings Given</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts - Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
           <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Performance across feedback categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.4}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px' }}
                        formatter={(value) => [parseFloat(value).toFixed(2), 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>X: Star Rating | Y: Response Count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="rating" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ borderRadius: '8px' }}
                    formatter={(value) => [value, 'Responses']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Row 2: Response Trend & Student Voices */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Response Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Response Trend</CardTitle>
            <CardDescription>X: Day | Y: Responses (Recent)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {responseTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs"
                      tickFormatter={(val) => val.split(' ')[0]} // Show only day number on axis to save space
                    />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
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
                  No trend data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Voices */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Student Voices</CardTitle>
            </div>
            <CardDescription>Highlights from student feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {aggregatedStats.qualitative && (
              <Tabs defaultValue="high" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="high" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800 text-xs">
                    Praise
                  </TabsTrigger>
                  <TabsTrigger value="low" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800 text-xs">
                    Concerns
                  </TabsTrigger>
                </TabsList>
                
                {['high', 'low'].map(type => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {aggregatedStats.qualitative[type]?.length > 0 ? (
                        aggregatedStats.qualitative[type].slice(0, 5).map((comment, idx) => (
                          <div key={idx} className="flex flex-col p-3 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(star => (
                                  <Star 
                                    key={star} 
                                    className={`h-3 w-3 ${star <= Math.round(Number(comment.rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} 
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(comment.date).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <p className="text-sm italic text-foreground/80 line-clamp-2 mb-2">"{comment.text}"</p>
                            
                            <div className="pt-2 border-t border-border/30 flex justify-between items-center text-xs text-muted-foreground">
                              {/* Show Course name */}
                              <span className="opacity-70 font-medium">{comment.course}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                          No comments available yet.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Performance Summary (Grid) */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryRadarData.map((item) => (
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
