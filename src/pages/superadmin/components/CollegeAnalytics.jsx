import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Users,
  Star,
  TrendingUp,
  ClipboardList,
  Calendar,
  Filter,
  RotateCcw,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getCollegeCache,
  getCollegeTrends,
} from "@/services/superadmin/cacheService";
import { getAllSessions } from "@/services/superadmin/sessionService";
import { getAllTrainers } from "@/services/superadmin/trainerService";
import { getAcademicConfig } from "@/services/superadmin/academicService";

const CollegeAnalytics = ({ collegeId, collegeName, onBack }) => {
  const [loading, setLoading] = useState(true);

  // Data State
  const [cache, setCache] = useState(null);
  const [trends, setTrends] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [academicOptions, setAcademicOptions] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    projectCode: "all",
    trainerId: "all",
    course: "all",
    department: "all",
    year: "all",
    batch: "all",
    dateRange: "all",
  });

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!collegeId) return;

      setLoading(true);
      try {
        const today = new Date();
        const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        const isEarlyMonth = today.getDate() <= 7;

        const promises = [
          getCollegeCache(collegeId),
          getCollegeTrends(collegeId, currentYearMonth),
          getAllSessions(collegeId),
          getAllTrainers(1000),
          getAcademicConfig(collegeId),
        ];

        if (isEarlyMonth) {
          const prevDate = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1,
          );
          const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
          promises.push(getCollegeTrends(collegeId, prevYearMonth));
        }

        const results = await Promise.all(promises);
        const cacheData = results[0];
        const trendData = results[1] || {
          dailyResponses: {},
          dailySessions: {},
        };
        const sessionsData = results[2];
        const trainersData = results[3]?.trainers;
        const academicConfig = results[4];
        const prevTrendData = isEarlyMonth ? results[5] : null;

        // Process Trends similar to AdminDataContext
        const processedTrends = {};

        const processTrendDoc = (trendDoc, yearMonth) => {
          if (!trendDoc) return;
          Object.entries(trendDoc.dailyResponses || {}).forEach(
            ([day, count]) => {
              const fullDate = `${yearMonth}-${day}`;
              if (!processedTrends[fullDate])
                processedTrends[fullDate] = { responses: 0, sessions: 0 };
              processedTrends[fullDate].responses = count;
            },
          );
          Object.entries(trendDoc.dailySessions || {}).forEach(
            ([day, count]) => {
              const fullDate = `${yearMonth}-${day}`;
              if (!processedTrends[fullDate])
                processedTrends[fullDate] = { responses: 0, sessions: 0 };
              processedTrends[fullDate].sessions = count;
            },
          );
        };

        processTrendDoc(trendData, currentYearMonth);
        if (prevTrendData) {
          const prevDate = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1,
          );
          const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
          processTrendDoc(prevTrendData, prevYearMonth);
        }

        setCache(cacheData);
        setTrends(processedTrends);
        setSessions(sessionsData || []);
        setTrainers(trainersData || []);
        setAcademicOptions(academicConfig);
      } catch (error) {
        console.error("Failed to load college analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [collegeId]);

  // Helper Functions
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
        today.setDate(0);
        break;
      default:
        return { startDate: null, endDate: null };
    }

    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: today };
  };

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

  const filteredSessions = useMemo(() => {
    if (sessions.length === 0) return [];

    return sessions.filter((session) => {
      if (session.status !== "inactive" || !session.compiledStats) return false;

      if (
        filters.trainerId !== "all" &&
        session.assignedTrainer?.id !== filters.trainerId
      )
        return false;
      if (filters.course !== "all" && session.course !== filters.course)
        return false;
      if (filters.department !== "all" && session.branch !== filters.department)
        return false;
      if (filters.year !== "all" && session.year !== filters.year) return false;
      if (filters.batch !== "all" && session.batch !== filters.batch)
        return false;

      if (filters.dateRange !== "all") {
        const { startDate, endDate } = getDateRange(filters.dateRange);
        if (startDate && endDate) {
          const sessionDate = new Date(session.sessionDate);
          if (sessionDate < startDate || sessionDate > endDate) return false;
        }
      }
      return true;
    });
  }, [sessions, filters]);

  // Aggregate stats
  const aggregatedStats = useMemo(() => {
    const isDefaultView =
      filters.trainerId === "all" &&
      filters.course === "all" &&
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
        avgRating,
        ratingDistribution: cache.ratingDistribution || {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        categoryAverages,
        qualitative: cache.qualitative || { high: [], low: [], avg: [] },
      };
    }

    // Hierarchy fallback logic...
    if (cache && cache.courses && filters.course !== "all") {
      const courseData = cache.courses[filters.course];
      if (courseData) {
        let targetData = courseData;
        if (
          filters.year !== "all" &&
          targetData.years &&
          targetData.years[filters.year]
        ) {
          targetData = targetData.years[filters.year];
          if (
            filters.batch !== "all" &&
            targetData.batches &&
            targetData.batches[filters.batch]
          ) {
            targetData = targetData.batches[filters.batch];
          }
        }
        if (targetData.totalResponses !== undefined) {
          const avg =
            targetData.totalRatingsCount > 0
              ? (targetData.ratingSum / targetData.totalRatingsCount).toFixed(2)
              : "0.00";
          return {
            totalSessions: 0,
            totalResponses: targetData.totalResponses || 0,
            totalRatingsCount: targetData.totalRatingsCount || 0,
            avgRating: avg,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            categoryAverages: {},
          };
        }
      }
    }

    // Fallback: Aggregate from Filtered Sessions
    if (filteredSessions.length > 0) {
      const stats = {
        totalResponses: 0,
        totalRatingsCount: 0,
        ratingSum: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryTotals: {},
        categoryCounts: {},
      };

      filteredSessions.forEach((session) => {
        const cs = session.compiledStats;
        if (!cs) return;

        stats.totalResponses += cs.totalResponses || 0;

        Object.entries(cs.ratingDistribution || {}).forEach(
          ([rating, count]) => {
            stats.ratingDistribution[rating] =
              (stats.ratingDistribution[rating] || 0) + count;
            stats.ratingSum += Number(rating) * count;
            stats.totalRatingsCount += count;
          },
        );

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
        totalSessions: filteredSessions.length,
        totalResponses: stats.totalResponses,
        totalRatingsCount: stats.totalRatingsCount,
        avgRating,
        ratingDistribution: stats.ratingDistribution,
        categoryAverages,
      };
    }

    return {
      totalSessions: 0,
      totalResponses: 0,
      totalRatingsCount: 0,
      avgRating: "0.00",
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryAverages: {},
    };
  }, [filteredSessions, cache, filters]);

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

    return Object.entries(aggregatedStats.categoryAverages || {}).map(
      ([key, value]) => ({
        category: categoryLabels[key] || key,
        score: parseFloat(value) || 0,
        fullMark: 5,
      }),
    );
  }, [aggregatedStats]);

  // Domain Analytics Data
  const domainAnalyticsData = useMemo(() => {
    const domains = cache?.domains || {};
    const domainEntries = Object.entries(domains);

    if (domainEntries.length === 0) return { chartData: [], totalResponses: 0 };

    let totalResponses = 0;
    const chartData = domainEntries.map(([domainName, data]) => {
      const avgRating =
        data.totalRatingsCount > 0
          ? (data.ratingSum / data.totalRatingsCount).toFixed(2)
          : "0.00";
      totalResponses += data.totalResponses || 0;

      return {
        name: domainName.replace(/_/g, " "),
        responses: data.totalResponses || 0,
        avgRating: parseFloat(avgRating),
        totalRatings: data.totalRatingsCount || 0,
      };
    });

    return { chartData, totalResponses };
  }, [cache]);

  // Rating distribution bar chart data
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cache) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No analytics data available for this college yet.
        </p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {collegeName || "College Analytics"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Aggregate performance across all sessions
            </p>
          </div>
        </div>
      </div>

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
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
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
                    department: "all",
                    year: "all",
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
              <Label className="text-xs">Department</Label>
              <Select
                value={filters.department}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    department: v,
                    year: "all",
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
              <Label className="text-xs">Year</Label>
              <Select
                value={filters.year}
                onValueChange={(v) =>
                  setFilters({ ...filters, year: v, batch: "all" })
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
              <Label className="text-xs">Batch</Label>
              <Select
                value={filters.batch}
                onValueChange={(v) => setFilters({ ...filters, batch: v })}
                disabled={filters.course === "all"}
              >
                <SelectTrigger
                  className={filters.course === "all" ? "opacity-50" : ""}
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
            <CardTitle className="text-sm font-medium">
              Total Rating Count
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {aggregatedStats.totalRatingsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Individual Ratings Given
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
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      vertical={false}
                    />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 5]} tickCount={6} className="text-xs" />
                    <Tooltip
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
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={categoryRadarData}
                  >
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
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
                    <Tooltip
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    vertical={false}
                  />
                  <XAxis dataKey="rating" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip
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
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Trend & Student Voices - Side by Side */}
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
                  <LineChart data={responseTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
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
                    <Tooltip
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
                    <Line
                      type="monotone"
                      dataKey="responses"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
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
            {aggregatedStats.qualitative && (
              <Tabs defaultValue="high" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
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
                </TabsList>

                {["high", "low"].map((type) => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {aggregatedStats.qualitative[type]?.length > 0 ? (
                        aggregatedStats.qualitative[type]
                          .slice(0, 5)
                          .map((comment, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col p-3 rounded-lg bg-muted/30 border border-border/50"
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

                              <p className="text-sm italic text-foreground/80 line-clamp-2 mb-2">
                                "{comment.text}"
                              </p>

                              <div className="pt-2 border-t border-border/30 flex justify-between items-center text-xs text-muted-foreground">
                                <span
                                  className="truncate max-w-[100px]"
                                  title={comment.trainerName}
                                >
                                  {comment.trainerName || "Unknown Trainer"}
                                </span>
                                <span className="opacity-70">
                                  {comment.course}
                                </span>
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

export default CollegeAnalytics;
