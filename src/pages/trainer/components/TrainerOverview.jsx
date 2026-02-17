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
  MessageSquare
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
  PolarRadiusAxis
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { sessionsApi, collegesApi } from '@/lib/dataService';
import { getTrainerCache, getTrainerTrends } from '@/services/superadmin/cacheService';
import { toast } from 'sonner';

const TrainerOverview = () => {
  const { user } = useAuth();
  
  // Data state
  const [cache, setCache] = useState(null);
  const [trends, setTrends] = useState(null);
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

  // Load Trainer Data
  useEffect(() => {
    const loadTrainerData = async () => {
      const trainerId = user?.id || user?.uid;
      
      if (!trainerId) {
         if (user) setIsLoading(false); // Only set false if user loaded but no ID found (rare)
         return;
      }

      setIsLoading(true);
      try {
        // 1. Load Cache & Trends (Fast path for initial view)
        // Check if using local storage or firestore services
        // If sessionsApi is local, we might not have cache/trends in firebase for this user yet
        const [cacheData, trendsData] = await Promise.all([
             getTrainerCache(trainerId).catch(err => {
                console.warn("Cache fetch failed", err); 
                return null; 
             }),
             getTrainerTrends(trainerId).catch(err => {
                console.warn("Trends fetch failed", err);
                return null;
             })
        ]);
        setCache(cacheData);
        setTrends(trendsData);

        // 2. Load Sessions (for granular filtering)
        // In a real app we might defer this or paginate, but for now we load all trainer sessions
        const trainerSessions = sessionsApi.getByTrainer(trainerId);
        setSessions(trainerSessions);

      } catch (error) {
        console.error("Failed to load trainer data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        loadTrainerData();
    }
  }, [user]);

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

  // Unique Colleges from Sessions
  const availableColleges = useMemo(() => {
    const uniqueIds = [...new Set(sessions.map(s => s.collegeId))].filter(Boolean);
    return uniqueIds.map(id => {
        const college = collegesApi.getById(id);
        return { id, name: college?.name || 'Unknown College' };
    });
  }, [sessions]);

  // Unique Courses
  const availableCourses = useMemo(() => {
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    
    const courses = [...new Set(filtered.map(s => s.course))].filter(Boolean);
    return courses.sort();
  }, [sessions, filters.collegeId]);

  // Unique Years (Dependent on Course)
  const availableYears = useMemo(() => {
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    if (filters.course !== 'all') filtered = filtered.filter(s => s.course === filters.course);
    
    const years = [...new Set(filtered.map(s => s.year))].filter(Boolean);
    return years.sort();
  }, [sessions, filters.collegeId, filters.course]);

  // Unique Departments (Dependent on Course AND Year)
  const availableDepartments = useMemo(() => {
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    if (filters.course !== 'all') filtered = filtered.filter(s => s.course === filters.course);
    if (filters.year !== 'all') filtered = filtered.filter(s => s.year === filters.year);

    const depts = [...new Set(filtered.map(s => s.branch || s.department))].filter(Boolean);
    return depts.sort();
  }, [sessions, filters.collegeId, filters.course, filters.year]);

  // Unique Batches (Dependent on Course AND Year AND Dept)
  const availableBatches = useMemo(() => {
    let filtered = sessions;
    if (filters.collegeId !== 'all') filtered = filtered.filter(s => s.collegeId === filters.collegeId);
    if (filters.course !== 'all') filtered = filtered.filter(s => s.course === filters.course);
    if (filters.year !== 'all') filtered = filtered.filter(s => s.year === filters.year);
    if (filters.department !== 'all') filtered = filtered.filter(s => (s.branch || s.department) === filters.department);

    const batches = [...new Set(filtered.map(s => s.batch))].filter(Boolean);
    return batches.sort();
  }, [sessions, filters.collegeId, filters.course, filters.year, filters.department]);


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
          qualitative: { high: [], low: [], avg: [] } // Qualitative not aggregated on fly easily yet
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

  // Response Trend - use cache trends data with day numbers like CollegeAnalytics
  const responseTrend = useMemo(() => {
    if (!trends?.dailyResponses) return [];
    
    return Object.entries(trends.dailyResponses)
      .map(([day, count]) => ({
        day: parseInt(day),
        responses: count
      }))
      .sort((a, b) => a.day - b.day);
  }, [trends]);


  if (isLoading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters (Commented out for now as requested) */}
      {/* 
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                onValueChange={v => setFilters({...filters, course: v, year: 'all', department: 'all', batch: 'all'})}
              >
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {availableCourses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select 
                value={filters.year} 
                onValueChange={v => setFilters({...filters, year: v, department: 'all', batch: 'all'})}
                disabled={filters.course === 'all'}
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
              <Label className="text-xs">Department</Label>
              <Select 
                value={filters.department} 
                onValueChange={v => setFilters({...filters, department: v, batch: 'all'})}
                disabled={filters.year === 'all'}
              >
                <SelectTrigger className={filters.year === 'all' ? 'opacity-50' : ''}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Batch</Label>
              <Select 
                value={filters.batch} 
                onValueChange={v => setFilters({...filters, batch: v})}
                disabled={filters.department === 'all'}
              >
                <SelectTrigger className={filters.department === 'all' ? 'opacity-50' : ''}>
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
      */}

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
        
        {/* Category Breakdown (Now First) */}
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

        {/* Rating Distribution (Now Second) */}
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
            <CardDescription>X: Day | Y: Responses ({trends?.yearMonth || 'current month'})</CardDescription>
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
                              {/* Trainer name is redundant in Trainer Dashboard, showing Course only */}
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

    </div>
  );
};

export default TrainerOverview;
