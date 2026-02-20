import React, { useState, useMemo, useEffect } from "react";
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
  FolderCode,
  RefreshCw,
  Clock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminData } from "@/contexts/AdminDataContext";
import { getAcademicConfig } from "@/services/superadmin/academicService";
import { getAnalyticsSessions } from "@/services/superadmin/sessionService"; // New import
import { Sparkles, Hash } from "lucide-react";

const CollegeOverviewTab = () => {
  const {
    sessions,
    trainers,
    college,
    cache,
    trends,
    loadSessions,
    loadTrainers,
    refreshAll,
    loading,
  } = useAdminData();

  // Auto-load trainers for the filter dropdown
  useEffect(() => {
    if (trainers.length === 0 && loadTrainers) {
      loadTrainers();
    }
  }, [trainers.length, loadTrainers]);

  // Filter state
  const [filters, setFilters] = useState({
    projectCode: "all",
    trainerId: "all",
    course: "all",
    department: "all",
    year: "all",
    batch: "all",
    dateRange: "all",
  });

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null); // Stores compiled stats for current view
  const [analyticsCache, setAnalyticsCache] = useState({}); // Local Cache: { filterKeyString: statsObject }
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);

  // Academic config for current college
  const [academicOptions, setAcademicOptions] = useState(null);

  const resetFilters = () => {
    setFilters({
      projectCode: "all",
      trainerId: "all",
      course: "all",
      department: "all",
      year: "all",
      batch: "all",
      dateRange: "all",
    });
  };

  // Calculate date range boundaries
  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let startDate = null;

    switch (range) {
      case "7days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
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
          console.error("Failed to load academic config:", err);
          setAcademicOptions({});
        }
      }
    };
    loadAcademicConfig();
  }, [college?.id]);

  // Extract available lists for filters
  const availableCourses = useMemo(() => {
    if (!academicOptions?.courses) return [];
    return Object.keys(academicOptions.courses);
  }, [academicOptions]);

  // New Structure: Course -> Year -> Department -> Batch

  const availableYears = useMemo(() => {
    if (!academicOptions?.courses || filters.course === "all") return [];

    // Years are directly under courses
    const course = academicOptions.courses[filters.course];
    if (course?.years) {
      return Object.keys(course.years).sort();
    }
    return [];
  }, [academicOptions, filters.course]);

  const availableDepartments = useMemo(() => {
    if (!academicOptions?.courses || filters.course === "all") return [];
    const allDepts = new Set();
    const course = academicOptions.courses[filters.course];

    if (course?.years) {
      // If year is selected, get depts for that year
      if (filters.year !== "all") {
        const yearData = course.years[filters.year];
        if (yearData?.departments) {
          Object.keys(yearData.departments).forEach((d) => allDepts.add(d));
        }
      } else {
        // Aggregate from all years
        Object.values(course.years).forEach((yearData) => {
          if (yearData?.departments) {
            Object.keys(yearData.departments).forEach((d) => allDepts.add(d));
          }
        });
      }
    }
    return [...allDepts].sort();
  }, [academicOptions, filters.course, filters.year]);

  const availableBatches = useMemo(() => {
    if (!academicOptions?.courses || filters.course === "all") return [];
    const allBatches = new Set();
    const course = academicOptions.courses[filters.course];

    if (course?.years) {
      // Filter by Year
      const yearsToScan =
        filters.year !== "all" ? [filters.year] : Object.keys(course.years);

      yearsToScan.forEach((yearKey) => {
        const yearData = course.years[yearKey];
        if (!yearData?.departments) return;

        // Filter by Department
        const deptsToScan =
          filters.department !== "all"
            ? [filters.department]
            : Object.keys(yearData.departments);

        deptsToScan.forEach((deptKey) => {
          const deptData = yearData.departments[deptKey];
          if (deptData?.batches) {
            deptData.batches.forEach((b) => allBatches.add(b));
          }
        });
      });
    }

    return [...allBatches].sort();
  }, [academicOptions, filters.course, filters.department, filters.year]);

  // Extract unique Project Codes from sessions (only if sessions loaded)
  const availableProjectCodes = useMemo(() => {
    // Session-dependent, keep as is or return empty if sessions not loaded
    if (!sessions.length) return [];
    const codes = new Set();
    sessions.forEach((s) => {
      if (s.projectId) codes.add(s.projectId);
    });
    return [...codes].sort();
  }, [sessions]);

  // Removed auto-load of sessions to optimize performance as requested
  // useEffect(() => {
  //    if (sessions.length === 0 && loadSessions) {
  //       loadSessions();
  //    }
  // }, [sessions.length, loadSessions]);

  // NOTE: filteredSessions is no longer used for aggregation in the dynamic model.
  // We keep it empty or could use it if we wanted to show a list of the 30 fetched sessions.
  // For now, to match the dynamic stats approach, we don't rely on loading all sessions.
  const filteredSessions = useMemo(() => {
    // If we wanted to populate this with the sessions fetched for analytics, we would need to store them in state.
    // But purely for stats aggregation, we used 'analyticsData'.
    return [];
  }, []);

  // --- Dynamic Analytics Fetching ---

  // Helper to generate cache key
  const getCacheKey = (filters) => {
    return JSON.stringify({
      collegeId: college?.id,
      ...filters,
    });
  };

  // Helper to Aggregate Stats from Sessions List
  const aggregateStatsFromSessions = (sessionList) => {
    const stats = {
      totalResponses: 0,
      totalRatingsCount: 0,
      ratingSum: 0,
      totalHours: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryTotals: {},
      categoryCounts: {},
      totalSessions: sessionList.length,
    };

    sessionList.forEach((session) => {
      const cs = session.compiledStats;
      // Only count valid stats
      if (!cs) return;

      stats.totalResponses += cs.totalResponses || 0;
      stats.totalHours += (Number(session.sessionDuration) || 60) / 60;

      Object.entries(cs.ratingDistribution || {}).forEach(([rating, count]) => {
        stats.ratingDistribution[rating] =
          (stats.ratingDistribution[rating] || 0) + count;
        stats.ratingSum += Number(rating) * count;
        stats.totalRatingsCount += count;
      });

      Object.entries(cs.categoryAverages || {}).forEach(([cat, avg]) => {
        const count = cs.totalResponses || 1;
        stats.categoryTotals[cat] =
          (stats.categoryTotals[cat] || 0) + avg * count;
        stats.categoryCounts[cat] = (stats.categoryCounts[cat] || 0) + count;
      });
    });

    const avgRating =
      stats.totalRatingsCount > 0
        ? (stats.ratingSum / stats.totalRatingsCount).toFixed(2)
        : "0.00";

    const categoryAverages = {};
    Object.keys(stats.categoryTotals).forEach((cat) => {
      categoryAverages[cat] =
        stats.categoryCounts[cat] > 0
          ? (stats.categoryTotals[cat] / stats.categoryCounts[cat]).toFixed(2)
          : 0;
    });

    return {
      totalSessions: stats.totalSessions,
      totalResponses: stats.totalResponses,
      totalRatingsCount: stats.totalRatingsCount,
      totalHours: stats.totalHours,
      avgRating,
      ratingDistribution: stats.ratingDistribution,
      categoryAverages,
      topicsLearned: Object.entries(
        sessionList.reduce((acc, s) => {
          (s.compiledStats?.topicsLearned || []).forEach((t) => {
            acc[t.name] = (acc[t.name] || 0) + t.count;
          });
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))
        .slice(0, 15),
      qualitative: { high: [], low: [], avg: [], future: [] },
    };
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!college?.id) return;

      // Skip dynamic fetch when default view — global cache is used instead
      const isDefault =
        filters.trainerId === "all" &&
        filters.course === "all" &&
        filters.projectCode === "all" &&
        filters.year === "all" &&
        filters.department === "all" &&
        filters.batch === "all" &&
        filters.dateRange === "all";
      if (isDefault) {
        setAnalyticsData(null);
        return;
      }

      // 1. Check Cache
      const cacheKey = getCacheKey(filters);
      if (analyticsCache[cacheKey]) {
        setAnalyticsData(analyticsCache[cacheKey]);
        return;
      }

      setIsFetchingAnalytics(true);
      try {
        // 2. Fetch Sessions
        const fetchedSessions = await getAnalyticsSessions({
          collegeId: college.id,
          ...filters,
          limitCount: 30,
        });

        // 3. Aggregate Stats
        const computedStats = aggregateStatsFromSessions(fetchedSessions);

        // 4. Update Cache & State
        setAnalyticsCache((prev) => ({ ...prev, [cacheKey]: computedStats }));
        setAnalyticsData(computedStats);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        setAnalyticsData(null);
      } finally {
        setIsFetchingAnalytics(false);
      }
    };

    // Debounce slightly to prevent rapid firing
    const timer = setTimeout(fetchAnalytics, 300);
    return () => clearTimeout(timer);
  }, [filters, college?.id]);

  // Combined Stats: Prefer Global Cache for Default View, otherwise Dynamic Data
  const aggregatedStats = useMemo(() => {
    // 1. If global view (no filters), return root cache
    const isDefaultView =
      filters.trainerId === "all" &&
      filters.course === "all" &&
      filters.projectCode === "all" &&
      filters.year === "all" &&
      filters.department === "all" &&
      filters.batch === "all" &&
      filters.dateRange === "all";

    if (isDefaultView && cache) {
      const avgRating =
        cache.totalRatingsCount > 0
          ? (cache.ratingSum / cache.totalRatingsCount).toFixed(2)
          : "0.00";

      const categoryAverages = {};
      if (cache.categoryData) {
        Object.entries(cache.categoryData).forEach(([cat, data]) => {
          categoryAverages[cat] =
            data.count > 0 ? (data.sum / data.count).toFixed(2) : 0;
        });
      }

      return {
        totalSessions: cache.totalSessions || 0,
        totalResponses: cache.totalResponses || 0,
        totalRatingsCount: cache.totalRatingsCount || 0,
        totalHours: cache.totalHours || 0,
        avgRating,
        ratingDistribution: cache.ratingDistribution || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        categoryAverages,
        qualitative: cache.qualitative || {
          high: [],
          low: [],
          avg: [],
          future: [],
        },
        topicsLearned: Object.entries(cache.topicsLearned || {})
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }))
          .slice(0, 15),
      };
    }

    // 2. Use Dynamic Data (or empty if loading/error)
    return (
      analyticsData || {
        totalSessions: 0,
        totalResponses: 0,
        totalRatingsCount: 0,
        totalHours: 0,
        avgRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {},
        qualitative: { high: [], low: [], avg: [], future: [] },
        topicsLearned: cache?.topicsLearned
          ? Object.entries(cache.topicsLearned)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => ({ name, count }))
              .slice(0, 15)
          : [],
      }
    );
  }, [analyticsData, cache, filters]);

  // Response trend - use cache trends data with day numbers like CollegeAnalytics
  // Response trend - use normalized trends data (YYYY-MM-DD keys)
  const responseTrend = useMemo(() => {
    if (!trends || Object.keys(trends).length === 0) return [];

    return Object.entries(trends)
      .map(([dateStr, data]) => ({
        day: parseInt(dateStr.split("-")[2]),
        responses: data.responses || 0,
        fullDate: dateStr,
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [trends]);

  // Category radar data
  const categoryRadarData = useMemo(() => {
    const categoryLabels = {
      knowledge: "Knowledge",
      communication: "Communication",
      engagement: "Engagement",
      content: "Content Quality",
      delivery: "Delivery",
      overall: "Overall",
    };

    return Object.entries(aggregatedStats.categoryAverages).map(
      ([key, value]) => ({
        category: categoryLabels[key] || key,
        score: parseFloat(value) || 0,
        fullMark: 5,
      }),
    );
  }, [aggregatedStats]);

  // Rating distribution bar chart data (from collegeCache)
  const ratingDistributionData = useMemo(() => {
    const distribution = aggregatedStats.ratingDistribution || {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating} Star`,
      count: count || 0,
    }));
  }, [aggregatedStats]);

  // Domain Analytics Data (from collegeCache.domains)
  const domainAnalyticsData = useMemo(() => {
    const domains = cache?.domains || {};

    const domainEntries = Object.entries(domains);

    if (domainEntries.length === 0) {
      return { chartData: [], totalResponses: 0 };
    }

    let totalResponses = 0;
    const chartData = domainEntries.map(([domainName, data]) => {
      const avgRating =
        data.totalRatingsCount > 0
          ? (data.ratingSum / data.totalRatingsCount).toFixed(2)
          : "0.00";
      totalResponses += data.totalResponses || 0;

      return {
        name: domainName.replace(/_/g, " "), // Clean up sanitized names
        responses: data.totalResponses || 0,
        avgRating: parseFloat(avgRating),
        totalRatings: data.totalRatingsCount || 0,
      };
    });

    return { chartData, totalResponses };
  }, [cache]);

  // Top trainers
  const topTrainers = useMemo(() => {
    const trainerStats = {};

    filteredSessions.forEach((session) => {
      const trainerId = session.assignedTrainer?.id;
      const trainerName = session.assignedTrainer?.name || "Unknown";
      if (!trainerId) return;

      if (!trainerStats[trainerId]) {
        trainerStats[trainerId] = {
          name: trainerName,
          ratingSum: 0,
          ratingCount: 0,
          sessions: 0,
          responses: 0,
          recentComments: [],
        };
      }

      const cs = session.compiledStats;
      if (cs) {
        Object.entries(cs.ratingDistribution || {}).forEach(
          ([rating, count]) => {
            trainerStats[trainerId].ratingSum += Number(rating) * count;
            trainerStats[trainerId].ratingCount += count;
          },
        );
        trainerStats[trainerId].responses += cs.totalResponses || 0;
        trainerStats[trainerId].sessions += 1;
        const comments = cs.comments || [];
        comments.slice(0, 2).forEach((c) => {
          if (trainerStats[trainerId].recentComments.length < 3) {
            trainerStats[trainerId].recentComments.push({
              text: c.text || c,
              date: session.sessionDate,
            });
          }
        });
      }
    });

    return Object.entries(trainerStats)
      .map(([id, data]) => ({
        id,
        ...data,
        avgRating:
          data.ratingCount > 0
            ? (data.ratingSum / data.ratingCount).toFixed(1)
            : 0,
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
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={resetFilters}
                className="gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={refreshAll}
                className="gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading.college ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Course</Label>
              <Select
                value={filters.course}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    course: v,
                    year: "all",
                    department: "all",
                    batch: "all",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {availableCourses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select
                value={filters.year}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    year: v,
                    department: "all",
                    batch: "all",
                  })
                }
                disabled={filters.course === "all"}
              >
                <SelectTrigger
                  className={filters.course === "all" ? "opacity-50" : ""}
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      Year {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Select
                value={filters.department}
                onValueChange={(v) =>
                  setFilters({ ...filters, department: v, batch: "all" })
                }
                disabled={filters.year === "all"}
              >
                <SelectTrigger
                  className={filters.year === "all" ? "opacity-50" : ""}
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Batch</Label>
              <Select
                value={filters.batch}
                onValueChange={(v) => setFilters({ ...filters, batch: v })}
                disabled={filters.department === "all"}
              >
                <SelectTrigger
                  className={filters.department === "all" ? "opacity-50" : ""}
                >
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {availableBatches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Trainer</Label>
              <Select
                value={filters.trainerId}
                onValueChange={(v) => setFilters({ ...filters, trainerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trainers</SelectItem>
                  {trainers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(v) => setFilters({ ...filters, dateRange: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
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
            <CardTitle className="text-sm font-medium">
              Total Responses
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {aggregatedStats.totalResponses}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Student Responses
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {aggregatedStats.avgRating}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i <= Math.round(Number(aggregatedStats.avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                out of 5.0
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {aggregatedStats.totalSessions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Conducted Sessions
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {aggregatedStats.totalHours || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Training Hours Delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Row - 3 Charts: Domain Performance, Category Breakdown, Rating Distribution */}
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
                    <defs>
                      <linearGradient
                        id="barGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      vertical={false}
                    />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 5]} tickCount={6} className="text-xs" />
                    <RechartsTooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [value.toFixed(2), "Avg Rating"]}
                    />
                    <Bar
                      dataKey="avgRating"
                      fill="url(#barGradient)"
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
                  <RadarChart
                    cx="50%"
                    cy="53%"
                    outerRadius="50%"
                    data={categoryRadarData}
                  >
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={(props) => {
                        const { payload, x, y, textAnchor, index } = props;
                        const categoryData = categoryRadarData[index];
                        if (categoryData) {
                          const isBottom = y > 128; // Center is roughly 128 for h-64
                          return (
                            <g>
                              <text
                                x={x}
                                y={isBottom ? y + 12 : y - 15}
                                textAnchor={textAnchor}
                                fill="hsl(var(--foreground))"
                                fontSize={10}
                                fontWeight="normal"
                              >
                                {payload.value}
                              </text>
                              <text
                                x={x}
                                y={isBottom ? y + 26 : y - 1}
                                textAnchor={textAnchor}
                                fill="hsl(var(--primary))"
                                fontSize={11}
                                fontWeight="bold"
                              >
                                {categoryData.score.toFixed(1)}
                              </text>
                            </g>
                          );
                        }
                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            fill="hsl(var(--foreground))"
                            fontSize={10}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 9,
                      }}
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
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [
                        parseFloat(value).toFixed(2),
                        "Score",
                      ]}
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
            <CardDescription>
              X: Star Rating | Y: Response Count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistributionData}>
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={1}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    vertical={false}
                  />
                  <XAxis dataKey="rating" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <RechartsTooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [value, "Responses"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Trend & Student Voices - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Response Trend Line Chart - LEFT */}
        <Card>
          <CardHeader>
            <CardTitle>Response Trend</CardTitle>
            <CardDescription>
              X: Day | Y: Responses (Current Month)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {responseTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={responseTrend}>
                    <defs>
                      <linearGradient
                        id="colorResponses"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="fullDate"
                      className="text-xs"
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                      }}
                    />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="responses"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                      fillOpacity={1}
                      fill="url(#colorResponses)"
                    />
                  </AreaChart>
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
            <CardDescription>Direct feedback and insights</CardDescription>
          </CardHeader>
          <CardContent>
            {aggregatedStats.qualitative && (
              <Tabs defaultValue="high" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger
                    value="high"
                    className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800 text-xs"
                  >
                    Praise
                  </TabsTrigger>
                  <TabsTrigger
                    value="low"
                    className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800 text-xs"
                  >
                    Concerns
                  </TabsTrigger>
                  <TabsTrigger
                    value="topics"
                    className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 text-xs"
                  >
                    Learned
                  </TabsTrigger>
                  <TabsTrigger
                    value="future"
                    className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 text-xs"
                  >
                    Future
                  </TabsTrigger>
                </TabsList>

                {["high", "low"].map((type) => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {aggregatedStats.qualitative?.[type]?.length > 0 ? (
                        aggregatedStats.qualitative[type]
                          .slice(0, 5)
                          .map((comment, idx) => (
                            <div
                              key={idx}
                              className={`flex flex-col p-3 rounded-lg border ${type === "high" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${star <= Math.round(Number(comment.rating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(comment.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm italic text-foreground/80 mb-2 truncate-2-lines">
                                "{comment.text}"
                              </p>
                              <div
                                className={`pt-2 border-t flex justify-between items-center text-xs text-muted-foreground font-medium ${type === "high" ? "border-green-100" : "border-red-100"}`}
                              >
                                <span
                                  className="truncate max-w-[120px]"
                                  title={comment.trainerName}
                                >
                                  {comment.trainerName || "Unknown Trainer"}
                                </span>
                                <span
                                  className={`opacity-70 px-1.5 py-0.5 bg-white/50 rounded-md border ${type === "high" ? "border-green-200/50" : "border-red-200/50"}`}
                                >
                                  {comment.course}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm italic">
                          No {type === "high" ? "praise" : "concerns"} yet.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}

                {/* Topics Learned Tab */}
                <TabsContent value="topics" className="mt-0">
                  <div className="max-h-80 overflow-y-auto pr-1">
                    {aggregatedStats.topicsLearned?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 p-2">
                        <TooltipProvider>
                          {aggregatedStats.topicsLearned.map((topic, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-sm font-semibold hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all cursor-default shadow-sm hover:shadow-md">
                                  <div className="flex items-center justify-center bg-white/80 group-hover:bg-amber-500 group-hover:text-white rounded px-1 min-w-[20px] h-5 text-[10px] border border-amber-200/50 transition-colors">
                                    {topic.count}
                                  </div>
                                  {topic.name}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-semibold text-xs">
                                  {topic.count} Student Mentions
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm italic">
                        No topics recorded yet.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Future Topics Tab */}
                <TabsContent value="future" className="mt-0">
                  <div className="max-h-80 overflow-y-auto pr-1">
                    {aggregatedStats.qualitative?.future?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 p-2">
                        {aggregatedStats.qualitative.future.map(
                          (topic, idx) => (
                            <div
                              key={idx}
                              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-sm font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all cursor-default shadow-sm hover:shadow-md"
                            >
                              <Sparkles className="h-3.5 w-3.5 opacity-70 group-hover:animate-pulse" />
                              {topic.text}
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm italic">
                        No future topics suggested yet.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CollegeOverviewTab;
