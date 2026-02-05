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
  FolderCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminData } from '@/contexts/AdminDataContext';
import { getAcademicConfig } from '@/services/superadmin/academicService';

const CollegeOverviewTab = () => {
  const { sessions, trainers, college, cache, trends, loadSessions } = useAdminData();

  // Filter state
  const [filters, setFilters] = useState({
    projectCode: 'all',
    trainerId: 'all',
    course: 'all',
    year: 'all',
    batch: 'all',
    dateRange: 'all'
  });

  // Academic config for current college
  const [academicOptions, setAcademicOptions] = useState(null);

  const resetFilters = () => {
    setFilters({
      projectCode: 'all',
      trainerId: 'all',
      course: 'all',
      year: 'all',
      batch: 'all',
      dateRange: 'all'
    });
  };

  // Calculate date range boundaries
  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate = null;
    
    switch (range) {
      case '7days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        today.setDate(0); // Last day of previous month
        break;
      default:
        return { startDate: null, endDate: null };
    }
    
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: today };
  };

  // Load academic config
  useEffect(() => {
    const loadAcademicConfig = async () => {
      if (college?.id) {
        try {
          const config = await getAcademicConfig(college.id);
          setAcademicOptions(config || {});
        } catch (err) {
          console.error('Failed to load academic config:', err);
          setAcademicOptions({});
        }
      }
    };
    loadAcademicConfig();
  }, [college]);

  // Extract available lists for filters
  const availableCourses = useMemo(() => {
    if (!academicOptions?.courses) return [];
    return Object.keys(academicOptions.courses);
  }, [academicOptions]);

  const availableYears = useMemo(() => {
    if (!academicOptions?.courses || filters.course === 'all') return [];
    const yearsSet = new Set();
    const course = academicOptions.courses[filters.course];
    if (course?.departments) {
      Object.values(course.departments).forEach(dept => {
        if (dept?.years) {
          Object.keys(dept.years).forEach(year => yearsSet.add(year));
        }
      });
    }
    return [...yearsSet].sort();
  }, [academicOptions, filters.course]);

  const availableBatches = useMemo(() => {
    if (!academicOptions?.courses || filters.course === 'all') return [];
    const allBatches = new Set();
    const course = academicOptions.courses[filters.course];
    if (course?.departments) {
      Object.values(course.departments).forEach(dept => {
        if (dept?.years) {
          const yearsToScan = filters.year !== 'all' ? [filters.year] : Object.keys(dept.years);
          yearsToScan.forEach(yearKey => {
            const year = dept.years[yearKey];
            if (year?.batches) {
              year.batches.forEach(batch => allBatches.add(batch));
            }
          });
        }
      });
    }
    return [...allBatches];
  }, [academicOptions, filters.course, filters.year]);

  // Extract unique Project Codes from sessions (only if sessions loaded)
  const availableProjectCodes = useMemo(() => {
    if (!sessions.length) return [];
    const codes = new Set();
    sessions.forEach(s => {
      if (s.projectId) codes.add(s.projectId);
    });
    return [...codes].sort();
  }, [sessions]);

  // Load sessions on mount to ensure Top Trainers and other detailed stats are available
  useEffect(() => {
     if (sessions.length === 0 && loadSessions) {
        loadSessions();
     }
  }, [sessions.length, loadSessions]);

  const filteredSessions = useMemo(() => {
    if (sessions.length === 0) return [];

    return sessions.filter(session => {
      // Only include closed sessions with compiled stats
      if (session.status !== 'inactive' || !session.compiledStats) return false;
      
      if (filters.projectCode !== 'all' && session.projectId !== filters.projectCode) return false;
      if (filters.trainerId !== 'all' && session.assignedTrainer?.id !== filters.trainerId) return false;
      if (filters.course !== 'all' && session.course !== filters.course) return false;
      if (filters.year !== 'all' && session.year !== filters.year) return false;
      if (filters.batch !== 'all' && session.batch !== filters.batch) return false;
      
      // Date filtering
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

  // Aggregate stats: Use Cache if available and no filters, otherwise use sessions
  const aggregatedStats = useMemo(() => {
    // Primary Source: Server Cache (Scalable)
    // We strictly use the server-side cache to avoid fetching 1000+ sessions on the client.
    // If this cache is out of sync, use the 'Sync Data' button in the user profile.
    const isDefaultView = filters.projectCode === 'all' && 
                          filters.trainerId === 'all' && 
                          filters.course === 'all' && 
                          filters.year === 'all' && 
                          filters.batch === 'all' &&
                          filters.dateRange === 'all';
    
    if (isDefaultView && cache) {
      const avgRating = cache.totalRatingsCount > 0 
        ? (cache.ratingSum / cache.totalRatingsCount).toFixed(2) 
        : '0.00';
        
      // Prepare category averages from cache.categoryData
      const categoryAverages = {};
      if (cache.categoryData) {
         Object.entries(cache.categoryData).forEach(([cat, data]) => {
            categoryAverages[cat] = data.count > 0 
               ? (data.sum / data.count).toFixed(2) 
               : 0;
         });
      }
 
      return {
        totalSessions: cache.totalSessions || 0,
        totalResponses: cache.totalResponses || 0,
        avgRating,
        ratingDistribution: cache.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages,
        qualitative: cache.qualitative || { high: [], low: [], avg: [] }
      };
    }
 
    // Fallback: Aggregate from Filtered Sessions (Only when filters are active)
    // This is unavoidable for filtered views unless we build complex backend aggregation queries.
    if (!isDefaultView && filteredSessions.length > 0) {
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
           const count = cs.totalResponses || 1;
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
         avgRating,
         ratingDistribution: stats.ratingDistribution,
         categoryAverages
       };
    }

    // Default Empty State
    return {
      totalSessions: 0,
      totalResponses: 0,
      avgRating: '0.00',
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryAverages: {}
    };
  }, [filteredSessions, cache, filters]);

  // Response trend
  const responseTrend = useMemo(() => {
    const days = {};
    const today = new Date();
    // Initialize last 7 days keys
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayNum = String(date.getDate()).padStart(2, '0'); // using 01, 02 keys
         // Format for display
        const displayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        days[i] = { day: displayKey, responses: 0, dayNum: dayNum };
    }

    const isDefaultView = filters.projectCode === 'all' && 
                          filters.trainerId === 'all' && 
                          filters.course === 'all' && 
                          filters.year === 'all' && 
                          filters.batch === 'all' &&
                          filters.dateRange === 'all';

    // Use Trends Cache if available and default view
    if (isDefaultView && trends && trends.dailyResponses) {
        return Object.values(days).map(d => ({
            day: d.day,
            responses: trends.dailyResponses[d.dayNum] || 0
        }));
    }

    // Fallback: Calculate from filtered sessions
    const calculatedDays = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      calculatedDays[key] = { day: key, responses: 0 };
    }

    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.sessionDate);
      const key = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (calculatedDays[key]) {
        calculatedDays[key].responses += session.compiledStats?.totalResponses || 0;
      }
    });

    return Object.values(calculatedDays);
  }, [filteredSessions, trends, filters]);

  // Category radar data
  const categoryRadarData = useMemo(() => {
    const categoryLabels = {
      knowledge: 'Knowledge',
      communication: 'Communication',
      engagement: 'Engagement',
      content: 'Content Quality',
      delivery: 'Delivery',
      overall: 'Overall'
    };

    return Object.entries(aggregatedStats.categoryAverages)
      .map(([key, value]) => ({
        category: categoryLabels[key] || key,
        score: parseFloat(value) || 0,
        fullMark: 5
      }));
  }, [aggregatedStats]);

  // Top trainers
  const topTrainers = useMemo(() => {
    const trainerStats = {};
    
    filteredSessions.forEach(session => {
      const trainerId = session.assignedTrainer?.id;
      const trainerName = session.assignedTrainer?.name || 'Unknown';
      if (!trainerId) return;

      if (!trainerStats[trainerId]) {
        trainerStats[trainerId] = { 
          name: trainerName, 
          ratingSum: 0, 
          ratingCount: 0, 
          sessions: 0,
          responses: 0,
          recentComments: []
        };
      }

      const cs = session.compiledStats;
      if (cs) {
        Object.entries(cs.ratingDistribution || {}).forEach(([rating, count]) => {
          trainerStats[trainerId].ratingSum += Number(rating) * count;
          trainerStats[trainerId].ratingCount += count;
        });
        trainerStats[trainerId].responses += cs.totalResponses || 0;
        trainerStats[trainerId].sessions += 1;
        const comments = cs.comments || [];
        comments.slice(0, 2).forEach(c => {
          if (trainerStats[trainerId].recentComments.length < 3) {
            trainerStats[trainerId].recentComments.push({
              text: c.text || c,
              date: session.sessionDate
            });
          }
        });
      }
    });

    return Object.entries(trainerStats)
      .map(([id, data]) => ({
        id,
        ...data,
        avgRating: data.ratingCount > 0 ? (data.ratingSum / data.ratingCount).toFixed(1) : 0
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);
  }, [filteredSessions]);

  return (
    <div className="space-y-6">
      {/* Filters */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Project Code</Label>
              <Select value={filters.projectCode} onValueChange={v => setFilters({...filters, projectCode: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {availableProjectCodes.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Trainer</Label>
              <Select value={filters.trainerId} onValueChange={v => setFilters({...filters, trainerId: v})}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trainers</SelectItem>
                  {trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Course</Label>
              <Select 
                value={filters.course} 
                onValueChange={v => setFilters({...filters, course: v, year: 'all', batch: 'all'})}
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
                onValueChange={v => setFilters({...filters, year: v, batch: 'all'})}
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
              <Label className="text-xs">Batch</Label>
              <Select 
                value={filters.batch} 
                onValueChange={v => setFilters({...filters, batch: v})}
                disabled={filters.course === 'all'}
              >
                <SelectTrigger className={filters.course === 'all' ? 'opacity-50' : ''}>
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
              from {aggregatedStats.totalSessions} session{aggregatedStats.totalSessions !== 1 ? 's' : ''}
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
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(aggregatedStats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">out of 5.0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trainers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trainers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for assignment</p>
          </CardContent>
        </Card>
        
        {/* Placeholder for Project Count or other metric */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">{availableProjectCodes.length}</div>
             <p className="text-xs text-muted-foreground mt-1">Project Codes</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Response Trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Performance by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryRadarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 5]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
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
                      formatter={(value) => [parseFloat(value).toFixed(2), 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No category data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Voices Section */}
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
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="high" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                  Top Compliments
                </TabsTrigger>
                <TabsTrigger value="avg" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                  Recent Thoughts
                </TabsTrigger>
                <TabsTrigger value="low" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                  Areas for Improvement
                </TabsTrigger>
              </TabsList>
              
              {['high', 'avg', 'low'].map(type => (
                <TabsContent key={type} value={type} className="mt-0">
                  <div className="grid gap-4 md:grid-cols-3">
                    {aggregatedStats.qualitative[type]?.length > 0 ? (
                      aggregatedStats.qualitative[type].map((comment, idx) => (
                        <div key={idx} className="flex flex-col p-4 rounded-lg bg-muted/30 border border-border/50 h-full">
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
                          
                          <p className="text-sm italic text-foreground/80 flex-grow mb-3">"{comment.text}"</p>
                          
                          <div className="mt-auto pt-2 border-t border-border/30 flex justify-between items-center text-xs text-muted-foreground">
                            <span className="truncate max-w-[120px]" title={comment.trainerName}>
                               {comment.trainerName || 'Unknown Trainer'}
                            </span>
                            <span className="opacity-70">{comment.course}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No comments available in this category yet.
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Top Trainers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Trainers</CardTitle>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {topTrainers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {topTrainers.map((trainer, index) => (
                <div 
                  key={trainer.id} 
                  className="flex flex-col p-4 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-primary/20 text-primary'
                    }`}>
                      {index < 3 ? index + 1 : trainer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{trainer.name}</p>
                      <p className="text-xs text-muted-foreground">{trainer.sessions} session{trainer.sessions !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg">{trainer.avgRating}</span>
                      <span className="text-xs text-muted-foreground">/ 5.0</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{trainer.responses} responses</span>
                  </div>

                  {trainer.recentComments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MessageSquare className="h-3 w-3" />
                        Recent
                      </div>
                      <p className="text-xs italic text-muted-foreground line-clamp-2">
                        "{trainer.recentComments[0]?.text || trainer.recentComments[0]}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trainer data available. Complete some sessions first.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollegeOverviewTab;
