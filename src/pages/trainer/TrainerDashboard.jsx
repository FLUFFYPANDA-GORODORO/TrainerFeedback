import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sessionsApi, feedbackApi, analyticsApi, collegesApi } from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SessionForm } from '@/components/admin/SessionForm';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  RefreshCw,
  Users,
  Star,
  LogOut,
  GraduationCap,
  Plus,
  MessageSquare,
  TrendingUp,
  Calendar,
  ExternalLink
} from 'lucide-react';

const TrainerDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalFeedback: 0,
    averageRating: 0,
    activeSessions: 0
  });
  const [college, setCollege] = useState(null);
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';
  const getActiveTab = (section) => {
    switch (section) {
      case 'dashboard': return 'overview';
      case 'sessions': return 'sessions';
      case 'feedback': return 'feedback';
      default: return 'overview';
    }
  };
  const activeTab = getActiveTab(currentSection);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
        setIsLoading(false);
    }
  }, [user]);

  const loadData = () => {
    setIsLoading(true);
    try {
      if (user) {
        // Get college info if applicable
        if (user.collegeId) {
            const collegeInfo = collegesApi.getById(user.collegeId);
            setCollege(collegeInfo);
        }

        // Get trainer sessions
        const trainerSessions = sessionsApi.getByTrainer(user.id);
        setSessions(trainerSessions);

        // Get trainer feedback
        const trainerFeedback = feedbackApi.getByTrainer(user.id);
        setFeedback(trainerFeedback);

        // Get stats
        const trainerStats = analyticsApi.getTrainerStats(user.id);
        const activeSessions = trainerSessions.filter(s => s.status === 'active').length;
        
        setStats({
            ...trainerStats,
            activeSessions
        });
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

  const handleSessionCreated = () => {
    setIsSessionFormOpen(false);
    loadData(); // Refresh data
  };

  const handleCopyLink = (uniqueUrl) => {
    const url = `${window.location.origin}/feedback/anonymous/${uniqueUrl}`;
    navigator.clipboard.writeText(url);
    toast.success('Feedback link copied to clipboard!');
  };

  // Helper for recent feedback
  const recentFeedback = [...feedback]
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);
  
  // Helper for active sessions
  const activeSessionsList = sessions.filter(s => s.status === 'active');

  // Check access
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Please Login</h1>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'trainer' && user.role !== 'superAdmin') { // Allow superAdmin for testing
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
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Trainer</p>
            </div>
          </div>
        </div>

        {/* College Info */}
        {college && (
          <div className="p-4 border-b border-border bg-secondary/30">
            <p className="text-xs text-muted-foreground mb-1">Teaching at</p>
            <p className="text-sm font-medium text-foreground">{college.name}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'overview' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/trainer/dashboard')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'sessions' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'sessions' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/trainer/sessions')}
            >
              <RefreshCw className="h-4 w-4" />
              My Sessions
            </Button>
            <Button
              variant={activeTab === 'feedback' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'feedback' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/trainer/feedback')}
            >
              <MessageSquare className="h-4 w-4" />
              Feedback
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
              Trainer Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Manage your sessions and view feedback</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsSessionFormOpen(true)} className="gap-2 gradient-hero text-primary-foreground">
                <Plus className="h-4 w-4" />
                Create Session
            </Button>
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
            {/* Session Creation Dialog */}
            <Dialog open={isSessionFormOpen} onOpenChange={setIsSessionFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Session</DialogTitle>
                    </DialogHeader>
                    <SessionForm
                        collegeId={user?.collegeId}
                        defaultTrainerId={user?.id}
                        onSuccess={handleSessionCreated}
                        onCancel={() => setIsSessionFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
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
                      <TrendingUp className="h-4 w-4" />
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
                      <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

               <div className="grid gap-6 md:grid-cols-2">
                {/* Active Sessions List */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Sessions currently collecting feedback</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeSessionsList.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No active sessions</p>
                      ) : (
                        activeSessionsList.slice(0, 5).map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">{session.topic}</p>
                              <p className="text-sm text-muted-foreground">
                                {session.course} • {session.batch}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                {session.submissionCount} responses
                              </Badge>
                               <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopyLink(session.uniqueUrl)}
                                title="Copy Feedback Link"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                 {/* Recent Feedback List */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                    <CardDescription>Latest student responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentFeedback.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No feedback yet</p>
                      ) : (
                        recentFeedback.map((fb) => (
                          <div key={fb.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-foreground">{fb.overallRating.toFixed(1)}</span>
                            </div>
                            <div className="flex-1">
                               {fb.responses
                                .filter(r => r.comment)
                                .slice(0, 1) // Show only first comment to save space
                                .map((r, idx) => (
                                  <p key={idx} className="text-sm text-foreground italic">
                                    "{r.comment}"
                                  </p>
                                ))}
                              <p className="text-xs text-muted-foreground mt-1">
                                {sessions.find(s => s.id === fb.sessionId)?.topic} • {new Date(fb.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
               </div>
            </div>
          )}

          {/* My Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">My Sessions</h2>
                </div>
              <Card className="glass-card">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {sessions.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No sessions found</p>
                        <Button onClick={() => setIsSessionFormOpen(true)} className="gradient-hero text-primary-foreground">
                            Create Your First Session
                        </Button>
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <div key={session.id} className="p-6 hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg text-foreground">{session.topic}</h3>
                                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                                  {session.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {session.course} • {session.specialization} • {session.batch} • {session.shift}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(session.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-lg">{session.averageRating.toFixed(1)}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {session.submissionCount} responses
                                  </p>
                                </div>
                              </div>
                               {session.status === 'active' && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCopyLink(session.uniqueUrl)}
                                    className="gap-2"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Copy Link
                                </Button>
                               )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">All Feedback</h2>
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {feedback.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No feedback received</p>
                    ) : (
                      feedback.map((fb) => {
                         const session = sessions.find(s => s.id === fb.sessionId);
                         return (
                            <div key={fb.id} className="p-4 border border-border rounded-lg bg-card/50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-foreground">{session?.topic}</h4>
                                        <p className="text-sm text-muted-foreground">{session?.course} • {session?.batch}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold">{fb.overallRating.toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     {fb.responses.map((r, idx) => (
                                        <div key={idx} className="text-sm">
                                            <span className="text-muted-foreground font-medium">{r.questionId}: </span>
                                            <span className="text-foreground">{r.rating ? `${r.rating}/5` : r.comment}</span>
                                        </div>
                                     ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground text-right">
                                    Submitted: {new Date(fb.submittedAt).toLocaleString()}
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

export default TrainerDashboard;
