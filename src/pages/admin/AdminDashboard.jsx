import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sessionsApi, feedbackApi, usersApi, collegesApi } from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  RefreshCw,
  Users,
  Star,
  LogOut,
  GraduationCap,
  BarChart3,
  MessageSquare,
  Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [college, setCollege] = useState(null);
  
  // Filtering
  const [filterTrainer, setFilterTrainer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';
  const activeTab = currentSection === 'feedback' ? 'feedback' : 'sessions';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    setIsLoading(true);
    try {
      if (user && user.collegeId) {
        // Get college info
        const collegeInfo = collegesApi.getById(user.collegeId);
        setCollege(collegeInfo);

        // Get sessions for this college
        const allSessions = sessionsApi.getAll();
        const collegeSessions = allSessions.filter(s => s.collegeId === user.collegeId);
        setSessions(collegeSessions);

        // Get trainers for this college
        const allUsers = usersApi.getAll();
        const collegeTrainers = allUsers.filter(u => u.role === 'trainer' && u.collegeId === user.collegeId);
        setTrainers(collegeTrainers);

        // Get feedback for sessions in this college
        const sessionIds = collegeSessions.map(s => s.id);
        const allFeedback = feedbackApi.getAll();
        const collegeFeedback = allFeedback.filter(f => sessionIds.includes(f.sessionId));
        setFeedback(collegeFeedback);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filterTrainer !== 'all' && session.trainerId !== filterTrainer) return false;
    if (filterStatus !== 'all' && session.status !== filterStatus) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
    totalFeedback: feedback.length,
    averageRating: feedback.length > 0 
      ? (feedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / feedback.length).toFixed(1)
      : '0.0'
  };

  // Check access - show login prompt if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Please Login</h1>
          <p className="text-muted-foreground mb-4">You need to login to access this page.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  // Access denied for non-admins
  if (user.role !== 'collegeAdmin' && user.role !== 'superAdmin') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg gradient-hero flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground">Gryphon</h1>
              <p className="text-xs text-muted-foreground">Feedback System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">College Admin</p>
            </div>
          </div>
        </div>

        {/* College Info */}
        {college && (
          <div className="p-4 border-b border-border bg-secondary/30">
            <p className="text-xs text-muted-foreground mb-1">Managing</p>
            <p className="text-sm font-medium text-foreground">{college.name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Button
              variant={activeTab === 'sessions' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'sessions' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/admin/dashboard')}
            >
              <BarChart3 className="h-4 w-4" />
              Session Analytics
            </Button>
            <Button
              variant={activeTab === 'feedback' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'feedback' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/admin/feedback')}
            >
              <MessageSquare className="h-4 w-4" />
              Trainer Feedback
            </Button>
          </div>
        </nav>
      </aside>

      {/* Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="border-b border-border bg-card p-4 flex justify-between items-center">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {college?.name || 'College Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Total Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSessions}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Active Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Total Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalFeedback}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Avg Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{stats.averageRating}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    <div className="w-48">
                      <Select value={filterTrainer} onValueChange={setFilterTrainer}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Trainers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Trainers</SelectItem>
                          {trainers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-48">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFilterTrainer('all');
                        setFilterStatus('all');
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Session List */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredSessions.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No sessions found</p>
                    ) : (
                      filteredSessions.map((session) => {
                        const trainer = trainers.find(t => t.id === session.trainerId);
                        const sessionFeedback = feedback.filter(f => f.sessionId === session.id);
                        const avgRating = sessionFeedback.length > 0 
                          ? (sessionFeedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / sessionFeedback.length).toFixed(1)
                          : '0.0';
                        
                        return (
                          <div key={session.id} className="p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">{session.topic}</h3>
                                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                                    {session.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {session.course} • {session.batch}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Trainer: {trainer?.name || 'Not assigned'}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 justify-end mb-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-bold">{avgRating}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {sessionFeedback.length} responses
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trainer Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Trainer Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trainers.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No trainers in this college</p>
                    ) : (
                      trainers.map((trainer) => {
                        const trainerSessions = sessions.filter(s => s.trainerId === trainer.id);
                        const trainerFeedback = feedback.filter(f => 
                          trainerSessions.some(s => s.id === f.sessionId)
                        );
                        const avgRating = trainerFeedback.length > 0 
                          ? (trainerFeedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / trainerFeedback.length).toFixed(1)
                          : '0.0';
                        
                        return (
                          <div key={trainer.id} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">{trainer.name}</h3>
                                  <p className="text-sm text-muted-foreground">{trainer.specialization || 'General'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 justify-end mb-1">
                                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xl font-bold">{avgRating}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {trainerSessions.length} sessions • {trainerFeedback.length} feedback
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
