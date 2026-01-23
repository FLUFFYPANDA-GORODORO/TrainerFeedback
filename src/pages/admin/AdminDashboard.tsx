import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import {
  departmentsApi,
  facultyApi,
  feedbackSessionsApi,
  submissionsApi,
  resetDemoData,
  Department,
  Faculty,
  FeedbackSession,
  FeedbackSubmission,
  College,
  collegesApi,
} from '@/lib/storage';
import { SessionForm } from '@/components/admin/SessionForm';
import DepartmentForm from '@/components/admin/DepartmentForm';
import FacultyForm from '@/components/admin/FacultyForm';
import QuestionForm from '@/components/admin/QuestionForm';
import FacultyReport from '@/components/admin/FacultyReport';
import AcademicConfig from '@/components/admin/AcademicConfig';
import { SessionTable } from '@/components/admin/SessionTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAcademicConfig } from '@/lib/academicConfig';
import { BarChart3, RefreshCw, Building2, Calendar, Users, FileText, User, TrendingUp, MessageSquare, Plus, Edit, Download, Upload, Trash2, ClipboardCheck, GraduationCap } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  RadarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const CHART_COLORS = ['hsl(213, 96%, 16%)', 'hsl(213, 80%, 25%)', 'hsl(213, 60%, 35%)', 'hsl(160, 84%, 39%)'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [college, setCollege] = useState<College | null>(null);

  // Session form state
  const [sessionFormOpen, setSessionFormOpen] = useState(false);

  // Department form state
  const [departmentFormOpen, setDepartmentFormOpen] = useState(false);

  // Faculty form state
  const [facultyFormOpen, setFacultyFormOpen] = useState(false);

  // Question form state
  const [questionFormOpen, setQuestionFormOpen] = useState(false);

  // Faculty report state
  const [facultyReportOpen, setFacultyReportOpen] = useState(false);

  // Academic config data state
  const [courseData, setCourseData] = useState({});
  const [subjectsData, setSubjectsData] = useState({});

  // Filtering state
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: ''
  });

  // Get available subjects based on current selections
  const availableSubjects = useMemo(() => {
    if (selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all') {
      return [];
    }

    const courseSubjects = subjectsData[selectedCourse as keyof typeof subjectsData];
    if (!courseSubjects) return [];

    const yearSubjects = courseSubjects[selectedYear as keyof typeof courseSubjects];
    if (!yearSubjects) return [];

    const departmentSubjects = yearSubjects[selectedDepartment as keyof typeof yearSubjects];
    return departmentSubjects || [];
  }, [selectedCourse, selectedYear, selectedDepartment, subjectsData]);

  const batches = ['A', 'B', 'C', 'D'];

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';

  // Load data function
  const loadData = useCallback(async () => {
    try {
      const [depts, fac, sess, subs, colleges, config] = await Promise.all([
        departmentsApi.getAll(),
        facultyApi.getAll(),
        feedbackSessionsApi.getAll(),
        submissionsApi.getAll(),
        collegesApi.getAll(),
        user?.collegeId ? getAcademicConfig(user.collegeId) : Promise.resolve({ courseData: {}, subjectsData: {} }),
      ]);

      setDepartments(depts);
      setFaculty(fac);
      setSessions(sess);
      setSubmissions(subs);
      setCourseData(config.courseData);
      setSubjectsData(config.subjectsData);

      // Find user's college
      if (user?.collegeId) {
        const userCollege = colleges.find(c => c.id === user.collegeId);
        setCollege(userCollege || null);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.collegeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered data based on selections
  const filteredData = useMemo(() => {
    let filteredSubs = submissions;
    let filteredFac = faculty;
    let filteredDepts = departments;

    // Filter by course/program
    if (selectedCourse !== 'all') {
      // For now, we'll filter based on faculty department names that match course departments
      const courseDepts = courseData[selectedCourse as keyof typeof courseData]?.departments || [];
      filteredDepts = departments.filter(dept => courseDepts.includes(dept.name));
      filteredFac = faculty.filter(f => filteredDepts.some(d => d.id === f.departmentId));
      filteredSubs = submissions.filter(sub => filteredFac.some(f => f.id === sub.facultyId));
    }

    // Filter by year (this would require additional data structure in submissions)
    // For now, we'll skip year filtering as it requires more complex data modeling

    // Filter by department
    if (selectedDepartment !== 'all') {
      filteredDepts = filteredDepts.filter(dept => dept.name === selectedDepartment);
      filteredFac = filteredFac.filter(f => filteredDepts.some(d => d.id === f.departmentId));
      filteredSubs = filteredSubs.filter(sub => filteredFac.some(f => f.id === sub.facultyId));
    }

    // Filter by subject (this would require subject data in submissions)
    // For now, we'll skip subject filtering

    // Filter by batch (this would require batch data in submissions)
    // For now, we'll skip batch filtering

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      filteredSubs = filteredSubs.filter(sub => {
        if (!sub.submittedAt) return false;
        const submissionDate = sub.submittedAt.toDate();
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        if (fromDate && toDate) {
          return submissionDate >= fromDate && submissionDate <= toDate;
        } else if (fromDate) {
          return submissionDate >= fromDate;
        } else if (toDate) {
          return submissionDate <= toDate;
        }
        return true;
      });
    }

    return {
      submissions: filteredSubs,
      faculty: filteredFac,
      departments: filteredDepts
    };
  }, [submissions, faculty, departments, selectedCourse, selectedDepartment, dateRange]);

  // Calculate metrics
  const activeSessions = sessions.filter(s => s.isActive);
  const todaySubmissions = submissions.filter(s =>
    s.submittedAt && format(s.submittedAt.toDate(), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  const weekSubmissions = submissions.filter(s =>
    s.submittedAt && isAfter(s.submittedAt.toDate(), subDays(new Date(), 7))
  );

  // Calculate average rating
  const avgRating = filteredData.submissions.length > 0
    ? filteredData.submissions.reduce((acc, sub) => {
        const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
        return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
      }, 0) / filteredData.submissions.length
    : 0;

  // Department performance data
  const deptPerformance = filteredData.departments.map(dept => {
    const deptFaculty = filteredData.faculty.filter(f => f.departmentId === dept.id);
    const deptSubs = filteredData.submissions.filter(sub =>
      deptFaculty.some(f => f.id === sub.facultyId)
    );

    const avg = deptSubs.length > 0
      ? deptSubs.reduce((acc, sub) => {
          const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
          return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
        }, 0) / deptSubs.length
      : 0;

    return {
      department: dept.name,
      average: Math.round(avg * 10) / 10,
    };
  }).filter(d => d.average > 0);

  // Response trend data (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySubs = filteredData.submissions.filter(s =>
      s.submittedAt && format(s.submittedAt.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    return {
      date: format(date, 'MMM d'),
      responses: daySubs.length,
    };
  });

  // Status distribution
  const statusData = [
    { name: 'Active', value: sessions.filter(s => s.isActive).length },
    { name: 'Inactive', value: sessions.filter(s => !s.isActive).length },
  ].filter(d => d.value > 0);

  // Performance Trend data (last 6 months)
  const performanceTrendData = [
    { month: 'Aug', responses: 0 },
    { month: 'Sep', responses: 2 },
    { month: 'Oct', responses: 5 },
    { month: 'Nov', responses: 0 },
    { month: 'Dec', responses: 2 },
    { month: 'Jan', responses: 5 },
  ];

  // Category Breakdown data
  const categoryBreakdownData = [
    { category: 'Student Information', score: 4.2 },
    { category: 'Teaching Quality', score: 4.5 },
    { category: 'Class Engagement', score: 3.8 },
    { category: 'Class Environment', score: 4.1 },
    { category: 'Teaching Aids', score: 4.3 },
    { category: 'Relevance', score: 4.0 },
    { category: 'Query Handling', score: 4.4 },
    { category: 'Project Learning', score: 3.9 },
    { category: 'Assignments', score: 4.2 },
    { category: 'Additional Comments', score: 3.7 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome back, ${user?.name}. Here's what's happening.`}
              college={college}
            />

            {/* Hierarchical Filtering */}
            <div className="p-6 border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 backdrop-blur-sm">
              <div className="max-w-full mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Academic Structure Filters</h3>
                      <p className="text-sm text-muted-foreground">Navigate through courses, departments, and more</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Active Filters Display */}
                    {(selectedCourse !== 'all' || selectedYear !== 'all' || selectedDepartment !== 'all' || selectedSubject !== 'all' || selectedBatch !== 'all' || dateRange.from || dateRange.to) && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Filters:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCourse !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Course: {selectedCourse}
                              <button
                                onClick={() => setSelectedCourse('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedYear !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Year: {selectedYear}
                              <button
                                onClick={() => setSelectedYear('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedDepartment !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Dept: {selectedDepartment}
                              <button
                                onClick={() => setSelectedDepartment('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedSubject !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Subject: {selectedSubject}
                              <button
                                onClick={() => setSelectedSubject('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {selectedBatch !== 'all' && (
                            <Badge variant="secondary" className="text-xs">
                              Batch: {selectedBatch}
                              <button
                                onClick={() => setSelectedBatch('all')}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                          {(dateRange.from || dateRange.to) && (
                            <Badge variant="secondary" className="text-xs">
                              Date: {dateRange.from || 'Start'} - {dateRange.to || 'End'}
                              <button
                                onClick={() => setDateRange({ from: '', to: '' })}
                                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse('all');
                        setSelectedYear('all');
                        setSelectedDepartment('all');
                        setSelectedSubject('all');
                        setSelectedBatch('all');
                        setDateRange({ from: '', to: '' });
                      }}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset Filters
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <Label htmlFor="course-select" className="text-sm font-medium">Course/Program</Label>
                    </div>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger id="course-select" className="bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {Object.keys(courseData).map(course => (
                          <SelectItem key={course} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Label htmlFor="year-select" className="text-sm font-medium">Academic Year</Label>
                    </div>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                      disabled={selectedCourse === 'all'}
                    >
                      <SelectTrigger id="year-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {selectedCourse !== 'all' && courseData[selectedCourse as keyof typeof courseData]?.years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <Label htmlFor="department-select" className="text-sm font-medium">Department</Label>
                    </div>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                      disabled={selectedCourse === 'all'}
                    >
                      <SelectTrigger id="department-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {selectedCourse !== 'all' && courseData[selectedCourse as keyof typeof courseData]?.departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Label htmlFor="subject-select" className="text-sm font-medium">Subject</Label>
                    </div>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                      disabled={selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all'}
                    >
                      <SelectTrigger id="subject-select" className={`bg-background/80 backdrop-blur-sm ${selectedCourse === 'all' || selectedYear === 'all' || selectedDepartment === 'all' ? 'opacity-50' : 'border-primary/20 focus:border-primary'}`}>
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {availableSubjects.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <Label htmlFor="batch-select" className="text-sm font-medium">Batch</Label>
                    </div>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger id="batch-select" className="bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select Batch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {batches.map(batch => (
                          <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">Date Range</Label>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary ${
                            !dateRange.from && !dateRange.to ? 'text-muted-foreground' : ''
                          }`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateRange.from || dateRange.to ? (
                            <>
                              {dateRange.from ? format(new Date(dateRange.from), 'd MMM') : 'Start date'} - {' '}
                              {dateRange.to ? format(new Date(dateRange.to), 'd MMM') : 'End date'}
                            </>
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="date-from" className="text-sm font-medium">Start Date</Label>
                            <input
                              id="date-from"
                              type="date"
                              value={dateRange.from}
                              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date-to" className="text-sm font-medium">End Date</Label>
                            <input
                              id="date-to"
                              type="date"
                              value={dateRange.to}
                              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:border-primary focus:outline-none"
                            />
                          </div>
                          {(dateRange.from || dateRange.to) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDateRange({ from: '', to: '' })}
                              className="w-full"
                            >
                              Clear Dates
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Responses"
                  value={filteredData.submissions.length}
                  subtitle={`${todaySubmissions.length} today, ${weekSubmissions.length} this week`}
                  icon={ClipboardCheck}
                />
                <StatsCard
                  title="Average Rating"
                  value={avgRating.toFixed(1)}
                  subtitle="Out of 5.0"
                  icon={TrendingUp}
                  trend={{ value: 5, isPositive: true }}
                />
                <StatsCard
                  title="Departments"
                  value={filteredData.departments.length}
                  subtitle="Academic departments"
                  icon={Building2}
                />
                <StatsCard
                  title="Faculty Members"
                  value={filteredData.faculty.length}
                  subtitle={`Across ${filteredData.departments.length} departments`}
                  icon={Users}
                />
              </div>

              {/* Main Analytics Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Department Performance */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Department Performance</h3>
                      <p className="text-sm text-muted-foreground">Average scores by department</p>
                    </div>
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis dataKey="department" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="average" fill="hsl(213, 96%, 16%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Response Trend */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Response Trend</h3>
                      <p className="text-sm text-muted-foreground">Last 7 days</p>
                    </div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="responses"
                          stroke="hsl(213, 96%, 16%)"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(213, 96%, 16%)', strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance Trend */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Performance Trend</h3>
                      <p className="text-sm text-muted-foreground">Monthly overview</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="responses"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Analytics Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Category Breakdown */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Category Breakdown</h3>
                      <p className="text-sm text-muted-foreground">Performance by category</p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={categoryBreakdownData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          className="text-xs"
                        />
                        <PolarRadiusAxis
                          domain={[0, 5]}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                          tickCount={6}
                        />
                        <Radar
                          name="Average Score"
                          dataKey="score"
                          stroke="hsl(221, 83%, 53%)"
                          fill="hsl(221, 83%, 53%)"
                          fillOpacity={0.2}
                          strokeWidth={2}
                          dot={{ fill: 'hsl(221, 83%, 53%)', strokeWidth: 2, r: 3 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value) => [value, 'Average Score']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Faculty Performance - Full Width */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-6">Faculty Feedback & Comments</h3>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/admin/faculty-details')}
                      className="text-sm"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </div>
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {filteredData.faculty.slice(0, 8).map((member, index) => {
                      const memberSubmissions = filteredData.submissions.filter(sub => sub.facultyId === member.id);
                      const avgRating = memberSubmissions.length > 0
                        ? memberSubmissions.reduce((acc, sub) => {
                            const ratings = sub.responses.filter(r => r.rating).map(r => r.rating || 0);
                            return acc + (ratings.reduce((sum, r) => sum + r, 0) / ratings.length || 0);
                          }, 0) / memberSubmissions.length
                        : 0;

                      const allComments = memberSubmissions
                        .flatMap(sub => sub.responses
                          .filter(r => r.comment && r.comment.trim() !== '')
                          .map(r => ({
                            comment: r.comment!.trim(),
                            date: sub.submittedAt?.toDate(),
                            rating: r.rating
                          }))
                        )
                        .filter(item => item.comment.length > 0)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      // Sort all comments by rating to get highest and lowest
                      const sortedByRating = [...allComments].sort((a, b) => (b.rating || 0) - (a.rating || 0));

                      // Take top 2 highest rated as positive feedback
                      const positiveComments = sortedByRating.slice(0, 2);

                      // Take bottom 2 lowest rated as negative feedback
                      const negativeComments = sortedByRating.slice(-2).reverse(); // Reverse to show lowest first

                      const displayComments = [...positiveComments, ...negativeComments].slice(0, 4);

                      return (
                        <div
                          key={member.id}
                          className="border border-border rounded-lg p-6 hover:bg-secondary/10 transition-colors animate-fade-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {/* Faculty Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-foreground">{member.name}</h4>
                                <p className="text-sm text-muted-foreground">{member.designation}</p>
                              </div>
                            </div>

                            {/* Rating Summary */}
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">/ 5.0</span>
                              </div>
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className="text-sm">
                                    {star <= Math.round(avgRating) ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{memberSubmissions.length} responses</p>
                            </div>
                          </div>

                          {/* Comments Section */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Recent Comments
                            </h5>

                            {displayComments.length > 0 ? (
                              <div className="space-y-3">
                                {/* Positive Comments Row */}
                                {positiveComments.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      Positive Feedback
                                    </h6>
                                    <div className="grid gap-2 md:grid-cols-2">
                                      {positiveComments.map((item, commentIndex) => (
                                        <div
                                          key={`positive-${commentIndex}`}
                                          className="bg-green-50 border border-green-200 rounded-lg p-3"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs text-green-600">
                                              {format(new Date(item.date), 'MMM d, yyyy')}
                                            </span>
                                            {item.rating && (
                                              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                                {item.rating}/5
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-green-800 leading-relaxed">
                                            "{item.comment}"
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Negative Comments Row */}
                                {negativeComments.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      Areas for Improvement
                                    </h6>
                                    <div className="grid gap-2 md:grid-cols-2">
                                      {negativeComments.map((item, commentIndex) => (
                                        <div
                                          key={`negative-${commentIndex}`}
                                          className="bg-red-50 border border-red-200 rounded-lg p-3"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs text-red-600">
                                              {format(new Date(item.date), 'MMM d, yyyy')}
                                            </span>
                                            {item.rating && (
                                              <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                                                {item.rating}/5
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-red-800 leading-relaxed">
                                            "{item.comment}"
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No comments yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {faculty.length === 0 && (
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No faculty members yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'faculty':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Faculty Management"
              subtitle="Manage faculty members and their departments"
              college={college}
            />

            <div className="p-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Faculty Members</h3>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setFacultyFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Faculty
                  </Button>
                </div>

                <div className="space-y-4">
                  {faculty.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {departments.find(d => d.id === member.departmentId)?.name || 'Unknown Department'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Active</Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'sessions':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Feedback Sessions"
              subtitle="Manage feedback collection sessions"
              college={college}
            />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Feedback Sessions</h3>
                  <p className="text-sm text-muted-foreground">Create and manage anonymous feedback sessions</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setSessionFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </div>

              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Sessions ({sessions.length})</TabsTrigger>
                  <TabsTrigger value="active">Active Sessions ({sessions.filter(s => s.isActive).length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive Sessions ({sessions.filter(s => !s.isActive).length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <SessionTable
                    sessions={sessions}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={loadData}
                  />
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  <SessionTable
                    sessions={sessions.filter(s => s.isActive)}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={loadData}
                  />
                </TabsContent>

                <TabsContent value="inactive" className="mt-6">
                  <SessionTable
                    sessions={sessions.filter(s => !s.isActive)}
                    faculty={faculty}
                    departments={departments}
                    onRefresh={loadData}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );
      case 'departments':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Academic Config"
              subtitle="Configure academic structure and manage departments"
              college={college}
            />

            <div className="p-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Academic Structure Configuration</h3>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setAcademicConfigOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Configure Structure
                  </Button>
                </div>

                <div className="text-center py-12">
                  <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-foreground mb-2">Academic Structure Management</h4>
                  <p className="text-muted-foreground mb-4">
                    Configure courses, years, departments, subjects, and batches for your institution.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click "Configure Structure" to build and manage the academic hierarchy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'questions':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Question Bank"
              subtitle="Manage feedback questions"
              college={college}
            />

            <div className="p-6">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">Questions</h3>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setQuestionFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Teaching Effectiveness</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      How would you rate the instructor&apos;s teaching effectiveness?
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Rating Scale</Badge>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Course Content</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      How relevant and useful was the course content?
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Rating Scale</Badge>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Reports & Analytics"
              subtitle="Generate and view detailed reports"
              college={college}
            />

            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Faculty Report</h3>
                      <p className="text-sm text-muted-foreground">Individual faculty performance</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setFacultyReportOpen(true)}>Generate Report</Button>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Department Report</h3>
                      <p className="text-sm text-muted-foreground">Department-wide analytics</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => {
                    // TODO: Generate department report
                    alert('Department report generation coming soon!');
                  }}>Generate Report</Button>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Trend Analysis</h3>
                      <p className="text-sm text-muted-foreground">Historical performance trends</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => {
                    // TODO: Generate trend analysis report
                    alert('Trend analysis report generation coming soon!');
                  }}>Generate Report</Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Settings"
              subtitle="Configure system preferences"
              college={college}
            />

            <div className="p-6">
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">System Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-foreground">Email Notifications</label>
                        <p className="text-sm text-muted-foreground">Receive email updates for new feedback</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-foreground">Auto-save Forms</label>
                        <p className="text-sm text-muted-foreground">Automatically save draft responses</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-medium text-foreground">Anonymous Feedback</label>
                        <p className="text-sm text-muted-foreground">Allow anonymous feedback submissions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" onClick={() => {
                      // TODO: Implement data export
                      alert('Export functionality coming soon!');
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => {
                      // TODO: Implement data import
                      alert('Import functionality coming soon!');
                    }}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" onClick={() => {
                      if (window.confirm('Are you sure you want to reset all demo data? This will clear all feedback submissions and reset to initial demo state.')) {
                        resetDemoData();
                        window.location.reload();
                      }
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset Demo Data
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen">
            <DashboardHeader
              title="Dashboard"
              subtitle={`Welcome back, ${user?.name}. Here's what's happening.`}
              college={college}
            />
          </div>
        );
    }
  };

  return (
    <>
      {renderContent()}
      <SessionForm
        open={sessionFormOpen}
        onOpenChange={setSessionFormOpen}
        onSuccess={loadData}
      />
      <DepartmentForm
        open={departmentFormOpen}
        onOpenChange={setDepartmentFormOpen}
        onSuccess={loadData}
      />
      <FacultyForm
        open={facultyFormOpen}
        onOpenChange={setFacultyFormOpen}
        onSuccess={loadData}
      />
      <QuestionForm
        open={questionFormOpen}
        onOpenChange={setQuestionFormOpen}
        onSuccess={loadData}
      />
      <FacultyReport
        open={facultyReportOpen}
        onOpenChange={setFacultyReportOpen}
      />
      <AcademicConfig
        open={academicConfigOpen}
        onOpenChange={setAcademicConfigOpen}
        onSuccess={() => loadData()}
      />
    </>
  );
};

export default AdminDashboard;