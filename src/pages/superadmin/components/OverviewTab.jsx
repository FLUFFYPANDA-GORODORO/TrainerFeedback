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
import { Input } from '@/components/ui/input';
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
  Legend,
  Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuperAdminData } from '@/contexts/SuperAdminDataContext';
import { getAcademicConfig } from '@/services/superadmin/academicService';
import { getCollegeTrends, getCollegeCache } from '@/services/superadmin/cacheService';
import { getAnalyticsSessions } from '@/services/superadmin/sessionService'; // New import

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const OverviewTab = ({ colleges, admins, projectCodes = [] }) => {
  const { sessions, trainers } = useSuperAdminData();

  // Data State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsCache, setAnalyticsCache] = useState({});
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    projectCode: 'all',
    collegeId: 'all',
    trainerId: 'all',
    course: 'all',
    year: 'all',
    batch: 'all',
    dateRange: 'all'
  });

  // Academic config for selected college
  const [academicOptions, setAcademicOptions] = useState(null);
  
  // College trends cache (for specific college selection)
  const [collegeTrends, setCollegeTrends] = useState(null);
  // Qualitative data cache (for Student Voices)
  const [qualitativeCache, setQualitativeCache] = useState({ high: [], low: [] });
  // Aggregated cache stats from all colleges (for default view)
  const [aggregatedCacheStats, setAggregatedCacheStats] = useState(null);
  // Per-college cache data (for college performance & domain charts)
  const [perCollegeCaches, setPerCollegeCaches] = useState({});
  // Sessions fetched by dynamic query (for charts on filtered view)
  const [fetchedFilteredSessions, setFetchedFilteredSessions] = useState([]);

  const resetFilters = () => {
    setFilters({
      projectCode: 'all',
      collegeId: 'all',
      trainerId: 'all',
      course: 'all',
      year: 'all',
      batch: 'all',
      dateRange: 'all'
    });
    setAcademicOptions(null);
    setCollegeTrends(null);
    setQualitativeCache({ high: [], low: [] });
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

  // Load academic config when college changes
  useEffect(() => {
    const loadAcademicConfig = async () => {
      if (filters.collegeId && filters.collegeId !== 'all') {
        try {
          const config = await getAcademicConfig(filters.collegeId);
          setAcademicOptions(config || {});
        } catch (err) {
          console.error('Failed to load academic config:', err);
          setAcademicOptions({});
        }
      } else {
        setAcademicOptions(null);
      }
    };
    loadAcademicConfig();
  }, [filters.collegeId]);

  // Load college trends when specific college is selected
  // Load college trends and qualitative data (specific or all)
  useEffect(() => {
    const loadCollegeData = async () => {
      try {
        if (filters.collegeId && filters.collegeId !== 'all') {
          // Specific college
          const [trends, cache] = await Promise.all([
            getCollegeTrends(filters.collegeId),
            getCollegeCache(filters.collegeId)
          ]);
          setCollegeTrends(trends);
          setQualitativeCache(cache?.qualitative || { high: [], low: [] });
        } else {
          // All colleges - fetch trends and cache for all
          const promises = colleges.map(c => Promise.all([
            getCollegeTrends(c.id || c.code),
            getCollegeCache(c.id || c.code)
          ]));
          
          const results = await Promise.all(promises);
          
          // Aggregate Trends
          const aggregatedTrends = {
            dailyResponses: {},
            yearMonth: results[0]?.[0]?.yearMonth || 'current month'
          };
          
          // Aggregate Qualitative
          const aggregatedQualitative = { high: [], low: [] };

          // Aggregate Stats from all college caches
          const aggStats = {
            totalSessions: 0,
            totalResponses: 0,
            totalRatingsCount: 0,
            ratingSum: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            categoryTotals: {},
            categoryCounts: {}
          };

          results.forEach(([trend, cache]) => {
            // Aggregate Trends
            if (trend?.dailyResponses) {
              Object.entries(trend.dailyResponses).forEach(([day, count]) => {
                aggregatedTrends.dailyResponses[day] = (aggregatedTrends.dailyResponses[day] || 0) + (count || 0);
              });
            }
            
            // Aggregate Qualitative
            if (cache?.qualitative) {
              if (cache.qualitative.high) aggregatedQualitative.high.push(...cache.qualitative.high);
              if (cache.qualitative.low) aggregatedQualitative.low.push(...cache.qualitative.low);
            }

            // Aggregate Stats
            if (cache) {
              aggStats.totalSessions += cache.totalSessions || 0;
              aggStats.totalResponses += cache.totalResponses || 0;
              aggStats.totalRatingsCount += cache.totalRatingsCount || 0;
              aggStats.ratingSum += cache.ratingSum || 0;
              Object.entries(cache.ratingDistribution || {}).forEach(([r, c]) => {
                aggStats.ratingDistribution[r] = (aggStats.ratingDistribution[r] || 0) + c;
              });
              Object.entries(cache.categoryData || {}).forEach(([cat, data]) => {
                aggStats.categoryTotals[cat] = (aggStats.categoryTotals[cat] || 0) + (data.sum || 0);
                aggStats.categoryCounts[cat] = (aggStats.categoryCounts[cat] || 0) + (data.count || 0);
              });
            }
          });
          
          // Build per-college cache map
          const collegeCacheMap = {};
          colleges.forEach((college, idx) => {
              const cache = results[idx]?.[1];
              if (cache) collegeCacheMap[college.id] = cache;
          });

          setCollegeTrends(aggregatedTrends);
          setQualitativeCache(aggregatedQualitative);
          setAggregatedCacheStats(aggStats);
          setPerCollegeCaches(collegeCacheMap);
        }
      } catch (err) {
        console.error('Failed to load college data:', err);
        setCollegeTrends(null);
        setQualitativeCache({ high: [], low: [] });
      }
    };

    if (colleges && colleges.length > 0) {
      loadCollegeData();
    }
  }, [filters.collegeId, colleges]);

  // Get unique courses from academic config (college-specific)
  const availableCourses = useMemo(() => {
    if (!academicOptions?.courses) return [];
    return Object.keys(academicOptions.courses);
  }, [academicOptions]);

  // Get years - extract from nested structure (Course -> Year)
  const availableYears = useMemo(() => {
    if (!academicOptions?.courses || filters.course === 'all') return [];
    
    // New Structure: courses[course].years
    const course = academicOptions.courses[filters.course];
    if (course?.years) {
        return Object.keys(course.years).sort();
    }
    return [];
  }, [academicOptions, filters.course]);

  // Get Departments - extract from nested structure (Course -> Year -> Dept)
  const availableDepartments = useMemo(() => {
    if (!academicOptions?.courses || filters.course === 'all') return [];
    
    const allDepts = new Set();
    const course = academicOptions.courses[filters.course];
    
    if (course?.years) {
        // If Year is selected, get depts for that year
        if (filters.year !== 'all') {
            const yearData = course.years[filters.year];
            if (yearData?.departments) {
                Object.keys(yearData.departments).forEach(d => allDepts.add(d));
            }
        } else {
            // Aggregate depts from ALL years
            Object.values(course.years).forEach(yearData => {
                if (yearData?.departments) {
                    Object.keys(yearData.departments).forEach(d => allDepts.add(d));
                }
            });
        }
    }
    return [...allDepts].sort();
  }, [academicOptions, filters.course, filters.year]);

  // Get batches - extract from nested structure (Course -> Year -> Dept -> Batch)
  const availableBatches = useMemo(() => {
    if (!academicOptions?.courses || filters.course === 'all') return [];
    
    const allBatches = new Set();
    const course = academicOptions.courses[filters.course];
    
    if (course?.years) {
        const yearsToScan = filters.year !== 'all' ? [filters.year] : Object.keys(course.years);

        yearsToScan.forEach(yearKey => {
            const yearData = course.years[yearKey];
            if (!yearData?.departments) return;

            // If Dept is selected, scan only that dept. Else scan all.
            // Note: OverviewTab filter state doesn't seem to have 'department' in original code, 
            // but it logic implies it might? 
            // Checking original code: availableBatches depended on filters.course and filters.year.
            // Original code didn't seem to have a Department filter in the UI (only Course, Year, Batch).
            // So we aggregate batches from ALL departments in the selected year(s).
            
            Object.values(yearData.departments).forEach(deptData => {
                if (deptData?.batches) {
                    deptData.batches.forEach(b => allBatches.add(b));
                }
            });
        });
    }
    
    return [...allBatches].sort();
  }, [academicOptions, filters.course, filters.year]);

  // Filter sessions based on active filters
  // --- Dynamic Analytics Fetching ---
  
  const getCacheKey = (filters) => {
    return JSON.stringify(filters);
  };
  
  const aggregateStatsFromSessions = (sessionList) => {
      const stats = {
          totalResponses: 0,
          totalRatingsCount: 0,
          ratingSum: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          categoryTotals: {},
          categoryCounts: {},
          totalSessions: sessionList.length,
      };

      sessionList.forEach(session => {
          const cs = session.compiledStats;
          // Only count valid stats
          if (!cs) return;

          stats.totalResponses += cs.totalResponses || 0;
          
          Object.entries(cs.ratingDistribution || {}).forEach(([rating, count]) => {
              stats.ratingDistribution[rating] = (stats.ratingDistribution[rating] || 0) + count;
              stats.ratingSum += Number(rating) * count;
              stats.totalRatingsCount += count;
          });

          // Sum category averages (need to convert back to sum/count for weighted average)
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
          totalSessions: stats.totalSessions,
          totalResponses: stats.totalResponses,
          totalRatingsCount: stats.totalRatingsCount,
          avgRating,
          ratingDistribution: stats.ratingDistribution,
          categoryAverages,
          qualitative: { high: [], low: [], avg: [] } 
      };
  };

  // Helper to check if filters are at default (all)
  const isDefaultView = useMemo(() => {
    return filters.projectCode === 'all' &&
           filters.collegeId === 'all' &&
           filters.trainerId === 'all' &&
           filters.course === 'all' &&
           filters.year === 'all' &&
           filters.batch === 'all' &&
           filters.dateRange === 'all';
  }, [filters]);

  useEffect(() => {
    // Skip dynamic fetch when default view — we use aggregated cache instead
    if (isDefaultView) {
      setAnalyticsData(null);
      setFetchedFilteredSessions([]);
      return;
    }

    const fetchAnalytics = async () => {
        const cacheKey = getCacheKey(filters);
        if (analyticsCache[cacheKey]) {
            setAnalyticsData(analyticsCache[cacheKey].stats);
            setFetchedFilteredSessions(analyticsCache[cacheKey].sessions || []);
            return;
        }

        setIsFetchingAnalytics(true);
        try {
            // [NEW] Calculate and format date range
            const { startDate: sdObj, endDate: edObj } = getDateRange(filters.dateRange);
            const formatDate = (d) => {
                if (!d) return null;
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            const fetchedSessions = await getAnalyticsSessions({
                ...filters,
                startDate: formatDate(sdObj),
                endDate: formatDate(edObj),
                limitCount: 30
            });

            const computedStats = aggregateStatsFromSessions(fetchedSessions);
            
            setAnalyticsCache(prev => ({ ...prev, [cacheKey]: { stats: computedStats, sessions: fetchedSessions } }));
            setAnalyticsData(computedStats);
            setFetchedFilteredSessions(fetchedSessions);
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
            setAnalyticsData(null); 
        } finally {
            setIsFetchingAnalytics(false);
        }
    };

    const timer = setTimeout(fetchAnalytics, 300);
    return () => clearTimeout(timer);

  }, [filters, isDefaultView]); 



  // Calculate aggregated stats — cache-first for default view
  const aggregatedStats = useMemo(() => {
    // 1. Default View -> Use aggregated college cache stats
    if (isDefaultView && aggregatedCacheStats) {
      const avgRating = aggregatedCacheStats.totalRatingsCount > 0 
        ? (aggregatedCacheStats.ratingSum / aggregatedCacheStats.totalRatingsCount).toFixed(2) 
        : '0.00';

      const categoryAverages = {};
      Object.keys(aggregatedCacheStats.categoryTotals || {}).forEach(cat => {
        categoryAverages[cat] = aggregatedCacheStats.categoryCounts[cat] > 0
          ? (aggregatedCacheStats.categoryTotals[cat] / aggregatedCacheStats.categoryCounts[cat]).toFixed(2)
          : 0;
      });

      return {
        totalSessions: aggregatedCacheStats.totalSessions || 0,
        totalResponses: aggregatedCacheStats.totalResponses || 0,
        totalRatingsCount: aggregatedCacheStats.totalRatingsCount || 0,
        avgRating,
        ratingDistribution: aggregatedCacheStats.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages,
        qualitative: qualitativeCache || { high: [], low: [] }
      };
    }

    // 2. Filtered View -> Use dynamic data
    return analyticsData || {
        totalSessions: 0,
        totalResponses: 0,
        totalRatingsCount: 0,
        avgRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {},
        qualitative: { high: [], low: [] } 
    };
  }, [isDefaultView, aggregatedCacheStats, analyticsData, qualitativeCache]);



  // College performance data for bar chart
  const allCollegesPerformance = useMemo(() => {
    if (isDefaultView) {
      // Default view: use per-college cache data
      return colleges.map(college => {
        const cache = perCollegeCaches[college.id];
        const ratingCount = cache?.totalRatingsCount || 0;
        const ratingSum = cache?.ratingSum || 0;
        return {
          name: college.code || college.id,
          fullName: college.name,
          avgRating: ratingCount > 0 ? parseFloat((ratingSum / ratingCount).toFixed(2)) : 0,
          responses: cache?.totalResponses || 0
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 30);
    }

    // Filtered view: use fetched sessions from dynamic query
    const collegeStats = {};
    colleges.forEach(college => {
      collegeStats[college.code || college.id] = {
        id: college.id, fullName: college.name,
        ratingSum: 0, ratingCount: 0, responses: 0
      };
    });
    fetchedFilteredSessions.forEach(session => {
      const college = colleges.find(c => c.id === session.collegeId);
      const code = college?.code || 'UNK';
      if (!collegeStats[code]) {
        collegeStats[code] = { id: session.collegeId, fullName: college?.name || 'Unknown', ratingSum: 0, ratingCount: 0, responses: 0 };
      }
      const cs = session.compiledStats;
      if (cs) {
        Object.entries(cs.ratingDistribution || {}).forEach(([rating, count]) => {
          collegeStats[code].ratingSum += Number(rating) * count;
          collegeStats[code].ratingCount += count;
        });
        collegeStats[code].responses += cs.totalResponses || 0;
      }
    });
    return Object.entries(collegeStats)
      .map(([code, data]) => ({
        name: code, fullName: data.fullName,
        avgRating: data.ratingCount > 0 ? parseFloat((data.ratingSum / data.ratingCount).toFixed(2)) : 0,
        responses: data.responses
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 30);
  }, [isDefaultView, colleges, perCollegeCaches, fetchedFilteredSessions]);

  // Response trend - use cache for specific college, aggregate from sessions for all
  // Response trend - use cache data (now handles both specific and all colleges)
  const responseTrend = useMemo(() => {
    if (!collegeTrends?.dailyResponses) return [];

    return Object.entries(collegeTrends.dailyResponses)
      .map(([day, count]) => ({
        day: parseInt(day),
        responses: count
      }))
      .sort((a, b) => a.day - b.day);
  }, [collegeTrends]);

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

  // Rating distribution bar chart data
  const ratingDistributionData = useMemo(() => {
    const distribution = aggregatedStats.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating} Star`,
      count: count || 0
    }));
  }, [aggregatedStats]);

  // Domain analytics data
  const domainAnalyticsData = useMemo(() => {
    const domains = {};

    if (isDefaultView) {
      // Default view: aggregate domains from all college caches
      Object.values(perCollegeCaches).forEach(cache => {
        Object.entries(cache.domains || {}).forEach(([domain, data]) => {
          if (!domains[domain]) domains[domain] = { ratingSum: 0, ratingCount: 0, responses: 0 };
          domains[domain].ratingSum += data.ratingSum || 0;
          domains[domain].ratingCount += data.totalRatingsCount || 0;
          domains[domain].responses += data.totalResponses || 0;
        });
      });
    } else {
      // Filtered view: use fetched sessions from dynamic query
      fetchedFilteredSessions.forEach(session => {
        const domain = session.domain || 'Unknown';
        if (!domains[domain]) domains[domain] = { ratingSum: 0, ratingCount: 0, responses: 0 };
        const cs = session.compiledStats;
        if (cs) {
          Object.entries(cs.ratingDistribution || {}).forEach(([rating, count]) => {
            domains[domain].ratingSum += Number(rating) * count;
            domains[domain].ratingCount += count;
          });
          domains[domain].responses += cs.totalResponses || 0;
        }
      });
    }

    const chartData = Object.entries(domains).map(([name, data]) => ({
      name: name.replace(/_/g, ' '),
      avgRating: data.ratingCount > 0 ? parseFloat((data.ratingSum / data.ratingCount).toFixed(2)) : 0,
      responses: data.responses
    }));

    return { chartData, totalResponses: chartData.reduce((sum, d) => sum + d.responses, 0) };
  }, [isDefaultView, perCollegeCaches, fetchedFilteredSessions]);

  // Qualitative data (aggregate from filtered sessions)
  // Qualitative data - Filter what we have in cache
  const qualitativeData = useMemo(() => {
    // Helper to filter comments list
    const filterComments = (comments) => {
      if (!comments) return [];
      
      return comments.filter(c => {
        // Filter by Course
        if (filters.course !== 'all' && c.course !== filters.course) return false;
        
        // Filter by Date Range
        if (filters.dateRange !== 'all') {
           const { startDate, endDate } = getDateRange(filters.dateRange);
           if (startDate && endDate) {
             const cDate = new Date(c.date); // assuming c.date exists and is ISO string
             if (cDate < startDate || cDate > endDate) return false;
           }
        }
        
        // Filter by Trainer (Name matching)
        if (filters.trainerId !== 'all') {
           const trainerName = trainers.find(t => t.id === filters.trainerId)?.name;
           if (trainerName && c.trainerName !== trainerName) return false;
        }
        
        return true;
      });
    };

    const highFiltered = filterComments(qualitativeCache.high);
    const lowFiltered = filterComments(qualitativeCache.low);

    // Sort by Date (newest first) and limit to 5
    // cacheService doesn't strictly sort by date in 'high'/'low' (it sorts by rating then date), 
    // so we re-sort to be safe for the "Student Voices" feed feel.
    // Or we stick to Rating sorting? High usually means Top Rated. 
    // But "Student Voices" usually implies recent/relevant.
    // Let's sort by Date descending for relevance.
    const sortByDate = (a, b) => new Date(b.date || 0) - new Date(a.date || 0);

    return {
      high: highFiltered.sort(sortByDate).slice(0, 5),
      low: lowFiltered.sort(sortByDate).slice(0, 5)
    };
  }, [qualitativeCache, filters, trainers]);

  // Top trainers
  const topTrainers = useMemo(() => {
    const trainerStats = {};
    
    // Use context sessions on default view, fetched sessions on filtered view
    const sessionsToUse = isDefaultView ? sessions : fetchedFilteredSessions;
    
    sessionsToUse.forEach(session => {
      // Only count closed sessions with stats
      if (session.status !== 'inactive' || !session.compiledStats) return;
      
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

        // Collect recent comments
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
  }, [isDefaultView, sessions, fetchedFilteredSessions]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Project Code */}
            <div className="space-y-1">
              <Label className="text-xs">Project</Label>
              <Select value={filters.projectCode} onValueChange={v => {
                  setFilters({ ...filters, projectCode: v, collegeId: 'all', course: 'all', year: 'all', batch: 'all' });
              }}
                disabled={filters.collegeId !== 'all'}
              >
                <SelectTrigger className={filters.collegeId !== 'all' ? 'opacity-50' : ''}>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectCodes.filter(pc => pc.collegeId).map(pc => (
                    <SelectItem key={pc.code} value={pc.code}>
                        {pc.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">College</Label>
              <Select value={filters.collegeId} onValueChange={v => {
                setFilters({...filters, collegeId: v, projectCode: 'all', course: 'all', year: 'all', batch: 'all'});
              }}
                disabled={filters.projectCode !== 'all'}
              >
                <SelectTrigger className={filters.projectCode !== 'all' ? 'opacity-50' : ''}><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Course</Label>
              <Select 
                value={filters.course} 
                onValueChange={v => setFilters({...filters, course: v, year: 'all', batch: 'all'})}
                disabled={filters.collegeId === 'all'}
              >
                <SelectTrigger className={filters.collegeId === 'all' ? 'opacity-50' : ''}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
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
            <div className="text-3xl font-bold">{(aggregatedStats.totalResponses || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filters.collegeId === 'all' ? 'Across all colleges' : 'From selected college'}
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
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(aggregatedStats.avgRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
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
            <div className="text-3xl font-bold">{(aggregatedStats.totalSessions || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filters.collegeId === 'all' ? 'Across all colleges' : 'From selected college'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(aggregatedStats.totalRatingsCount || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filters.collegeId === 'all' ? 'Across all colleges' : 'From selected college'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conditional Charts Section */}
      {filters.collegeId === 'all' ? (
        /* All Colleges View - Full Width Bar Chart */
        <Card>
          <CardHeader>
            <CardTitle>All Colleges Performance</CardTitle>
            <CardDescription>Average rating by college (up to 30 colleges)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {allCollegesPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allCollegesPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs" 
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[0, 5]} tickCount={6} className="text-xs" />
                    <Tooltip 
                      cursor={false}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [value, 'Avg Rating']}
                      labelFormatter={(label) => allCollegesPerformance.find(c => c.name === label)?.fullName || label}
                    />
                    <Bar 
                      dataKey="avgRating" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No college data available. Add colleges to see performance.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Specific College View - 3 Charts Grid */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Domain Performance Vertical Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Performance</CardTitle>
              <CardDescription>X: Domain | Y: Avg Rating (0-5)</CardDescription>
            </CardHeader>
            <CardContent>
              {domainAnalyticsData.chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainAnalyticsData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis domain={[0, 5]} tickCount={6} className="text-xs" />
                      <Tooltip 
                        cursor={false}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [value.toFixed(2), 'Avg Rating']}
                      />
                      <Bar 
                        dataKey="avgRating" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No domain data available yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>X: Category | Y: Score (0-5)</CardDescription>
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

          {/* Rating Distribution Bar Chart */}
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
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [value, 'Responses']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Response Trend & Student Voices - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
          {/* Response Trend Line Chart - LEFT */}
          <Card>
            <CardHeader>
              <CardTitle>Response Trend</CardTitle>
              <CardDescription>X: Day | Y: Responses ({collegeTrends?.yearMonth || 'current month'})</CardDescription>
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

          {/* Student Voices Section - RIGHT */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>Student Voices</CardTitle>
              </div>
              <CardDescription>Highlights from student feedback</CardDescription>
            </CardHeader>
            <CardContent>
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
                      {qualitativeData[type]?.length > 0 ? (
                        qualitativeData[type].slice(0, 5).map((comment, idx) => (
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
                              <span className="truncate max-w-[100px]" title={comment.trainerName}>
                                 {comment.trainerName || 'Unknown Trainer'}
                              </span>
                              <span className="opacity-70">{comment.course}</span>
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
            </CardContent>
          </Card>
        </div>

    </div>
  );
};

export default OverviewTab;
