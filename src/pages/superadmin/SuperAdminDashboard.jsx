import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collegesApi, 
  usersApi, 
  sessionsApi, 
  academicConfigApi, 
  analyticsApi,
  questionsApi 
} from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  Calendar,
  Plus,
  Star,
  Trash2,
  RefreshCw,
  BookOpen,
  ExternalLink,
  Shield,
  LogOut,
  GraduationCap,
  UserPlus
} from 'lucide-react';
import SessionResponses from '../admin/SessionResponses';

export const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  
  // Data states
  const [colleges, setColleges] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [globalStats, setGlobalStats] = useState({});
  const [academicConfig, setAcademicConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Form states
  const [newCollege, setNewCollege] = useState({ name: '', code: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', collegeId: '' });
  const [newSession, setNewSession] = useState({
    collegeId: '',
    trainerId: '',
    topic: '',
    course: '',
    specialization: '',
    batch: '',
    shift: 'Morning',
    day: '',
    expiresAt: ''
  });

  // Get active tab from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';
  const getActiveTab = (section) => {
    switch (section) {
      case 'dashboard': return 'overview';
      case 'colleges': return 'colleges';
      case 'admins': return 'admins';
      case 'sessions': return 'sessions';
      case 'academic-config': return 'config';
      case 'analytics': return 'analytics';
      default: return 'overview';
    }
  };
  const activeTab = getActiveTab(currentSection);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    try {
      const allColleges = collegesApi.getAll();
      const allUsers = usersApi.getAll();
      const allSessions = sessionsApi.getAll();
      const config = academicConfigApi.getActive();
      const stats = analyticsApi.getGlobalStats();
      
      setColleges(allColleges);
      setAdmins(allUsers.filter(u => u.role === 'collegeAdmin'));
      setTrainers(allUsers.filter(u => u.role === 'trainer'));
      setSessions(allSessions);
      setAcademicConfig(config || {});
      setGlobalStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handler functions
  const handleCreateCollege = () => {
    if (!newCollege.name.trim() || !newCollege.code.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      collegesApi.create({
        name: newCollege.name.trim(),
        code: newCollege.code.trim().toUpperCase()
      });
      toast.success('College created successfully');
      setCollegeDialogOpen(false);
      setNewCollege({ name: '', code: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to create college');
    }
  };

  const handleDeleteCollege = (id) => {
    if (confirm('Are you sure you want to delete this college?')) {
      try {
        collegesApi.delete(id);
        toast.success('College deleted');
        loadData();
      } catch (error) {
        toast.error('Failed to delete college');
      }
    }
  };

  const handleCreateAdmin = () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim() || !newAdmin.password || !newAdmin.collegeId) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      usersApi.create({
        ...newAdmin,
        role: 'collegeAdmin'
      });
      toast.success('Admin created successfully');
      setAdminDialogOpen(false);
      setNewAdmin({ name: '', email: '', password: '', collegeId: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to create admin');
    }
  };

  const handleCreateSession = () => {
    if (!newSession.collegeId || !newSession.topic.trim()) {
      toast.error('Please fill in required fields');
      return;
    }
    
    try {
      sessionsApi.create({
        ...newSession,
        expiresAt: newSession.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      toast.success('Session created successfully');
      setSessionDialogOpen(false);
      setNewSession({
        collegeId: '',
        trainerId: '',
        topic: '',
        course: '',
        specialization: '',
        batch: '',
        shift: 'Morning',
        day: '',
        expiresAt: ''
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  // If viewing session responses
  if (sessionId) {
    return <SessionResponses />;
  }

  if (!user || user.role !== 'superAdmin') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
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

  // Helper to get specializations as array
  const getSpecializations = () => {
    if (Array.isArray(academicConfig?.specializations)) {
      return academicConfig.specializations;
    }
    return Object.values(academicConfig?.specializations || {}).flat();
  };

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
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
        </div>

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
              onClick={() => navigate('/super-admin/dashboard')}
            >
              <Building2 className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'colleges' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'colleges' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/super-admin/colleges')}
            >
              <GraduationCap className="h-4 w-4" />
              Colleges ({colleges.length})
            </Button>
            <Button
              variant={activeTab === 'admins' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'admins' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/super-admin/admins')}
            >
              <UserPlus className="h-4 w-4" />
              Admins ({admins.length})
            </Button>
            <Button
              variant={activeTab === 'sessions' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'sessions' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/super-admin/sessions')}
            >
              <Shield className="h-4 w-4" />
              Sessions ({sessions.length})
            </Button>
          </div>
        </nav>
      </aside>

      {/* Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Top Header with Sign Out */}
        <header className="border-b border-border bg-card p-4 flex justify-end gap-4">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Platform Overview</h1>
                  <p className="text-muted-foreground">Monitor and manage your educational platform</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{colleges.length}</p>
                      <p className="text-sm text-muted-foreground">Colleges</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{admins.length}</p>
                      <p className="text-sm text-muted-foreground">Admins</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{sessions.filter(s => s.status === 'active').length}</p>
                      <p className="text-sm text-muted-foreground">Active Sessions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {colleges.slice(0, 3).map((college) => (
                    <div key={college.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">College: {college.name}</p>
                        <p className="text-xs text-muted-foreground">Code: {college.code}</p>
                      </div>
                    </div>
                  ))}
                  {colleges.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Colleges Tab */}
          {activeTab === 'colleges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Colleges</h1>
                  <p className="text-muted-foreground">Manage educational institutions</p>
                </div>
                <Dialog open={collegeDialogOpen} onOpenChange={setCollegeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      Add College
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New College</DialogTitle>
                      <DialogDescription>Add a new college to the platform</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>College Name</Label>
                        <Input
                          value={newCollege.name}
                          onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                          placeholder="e.g., Gryphon Institute of Technology"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>College Code</Label>
                        <Input
                          value={newCollege.code}
                          onChange={(e) => setNewCollege({ ...newCollege, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., GIT"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCollegeDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateCollege} className="gradient-hero text-primary-foreground">Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {colleges.map((college, index) => (
                  <div
                    key={college.id}
                    className="glass-card rounded-xl p-6 animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{college.name}</h3>
                        <p className="text-sm text-muted-foreground">Code: {college.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {admins.filter(a => a.collegeId === college.id).length} admin(s)
                      </span>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        Active
                      </span>
                    </div>
                  </div>
                ))}

                {colleges.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No colleges yet</h3>
                    <p className="text-muted-foreground">Create your first college to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">College Admins</h1>
                  <p className="text-muted-foreground">Manage college administrators</p>
                </div>
                <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create College Admin</DialogTitle>
                      <DialogDescription>Add a new admin for a college</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                          placeholder="Admin Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                          placeholder="admin@college.edu"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>College</Label>
                        <Select 
                          value={newAdmin.collegeId} 
                          onValueChange={(v) => setNewAdmin({ ...newAdmin, collegeId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select college" />
                          </SelectTrigger>
                          <SelectContent>
                            {colleges.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateAdmin} className="gradient-hero text-primary-foreground">Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {admins.map((admin, index) => {
                  const college = colleges.find(c => c.id === admin.collegeId);
                  return (
                    <div
                      key={admin.id}
                      className="glass-card rounded-xl p-6 animate-fade-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{admin.name}</h3>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {college?.name || 'No College'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {admin.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {admins.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No admins yet</h3>
                    <p className="text-muted-foreground">Create your first admin to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Feedback Sessions</h1>
                  <p className="text-muted-foreground">Manage feedback sessions across all colleges</p>
                </div>
                <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      Create Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Feedback Session</DialogTitle>
                      <DialogDescription>Create a new feedback session for a trainer</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label>College</Label>
                        <Select 
                          value={newSession.collegeId} 
                          onValueChange={(v) => setNewSession({ ...newSession, collegeId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select college" />
                          </SelectTrigger>
                          <SelectContent>
                            {colleges.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Trainer</Label>
                        <Select 
                          value={newSession.trainerId} 
                          onValueChange={(v) => setNewSession({ ...newSession, trainerId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select trainer" />
                          </SelectTrigger>
                          <SelectContent>
                            {trainers
                              .filter(t => !newSession.collegeId || t.collegeId === newSession.collegeId)
                              .map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Topic</Label>
                        <Input
                          value={newSession.topic}
                          onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                          placeholder="e.g., Machine Learning Introduction"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Select 
                          value={newSession.course} 
                          onValueChange={(v) => setNewSession({ ...newSession, course: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {(academicConfig?.courses || []).map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Batch</Label>
                        <Select 
                          value={newSession.batch} 
                          onValueChange={(v) => setNewSession({ ...newSession, batch: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {(academicConfig?.batches || []).map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateSession} className="gradient-hero text-primary-foreground">Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {sessions.map((session, index) => {
                  const college = colleges.find(c => c.id === session.collegeId);
                  const trainer = trainers.find(t => t.id === session.trainerId);
                  return (
                    <div
                      key={session.id}
                      className="glass-card rounded-xl p-6 animate-fade-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{session.topic}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              session.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {college?.name} • {session.course} • {session.batch}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Trainer: {trainer?.name || 'Not assigned'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{session.submissionCount || 0} responses</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {(session.averageRating || 0).toFixed(1)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/super-admin/sessions/${session.id}/responses`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {sessions.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No sessions yet</h3>
                    <p className="text-muted-foreground">Create your first feedback session to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
