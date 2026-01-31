import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAllColleges } from '@/services/superadmin/collegeService';
import { 
  usersApi, 
  sessionsApi, 
  academicConfigApi, 
  analyticsApi 
} from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Building2,
  Shield,
  LogOut,
  GraduationCap,
  UserPlus,
  RefreshCw,
  BookOpen,
  Users,
  FileText
} from 'lucide-react';

// Import Tab Components
import OverviewTab from './components/OverviewTab';
import CollegesTab from './components/CollegesTab';
import AdminsTab from './components/AdminsTab';
import SessionsTab from './components/SessionsTab';
import AcademicConfigTab from './components/AcademicConfigTab';
import TrainersTab from './components/TrainersTab';
import TemplatesTab from './components/TemplatesTab';
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

  // Get active tab from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';
  const getActiveTab = (section) => {
    switch (section) {
      case 'dashboard': return 'overview';
      case 'colleges': return 'colleges';
      case 'admins': return 'admins';
      case 'trainers': return 'trainers';
      case 'sessions': return 'sessions';
      case 'templates': return 'templates';
      case 'academic-config': return 'config';
      case 'analytics': return 'analytics';
      default: return 'overview';
    }
  };
  const activeTab = getActiveTab(currentSection);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load Colleges from Firebase
      const allColleges = await getAllColleges();
      setColleges(allColleges);

      // Other data still from mock/local storage for now
      const allUsers = usersApi.getAll();
      const allSessions = sessionsApi.getAll();
      const config = academicConfigApi.getActive();
      const stats = analyticsApi.getGlobalStats();
      
      setAdmins(allUsers.filter(u => u.role === 'collegeAdmin'));
      setTrainers(allUsers.filter(u => u.role === 'trainer'));
      setSessions(allSessions);
      setAcademicConfig(config || {});
      // Recalculate stats based on real college count if needed
      setGlobalStats({ ...stats, totalColleges: allColleges.length });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              variant={activeTab === 'config' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'config' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/super-admin/academic-config')}
            >
              <BookOpen className="h-4 w-4" />
              Academic Config
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
              variant={activeTab === 'trainers' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'trainers' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/super-admin/trainers')}
            >
              <Users className="h-4 w-4" />
              Trainers
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
            <Button
              variant={activeTab === 'templates' ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                activeTab === 'templates' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
              onClick={() => navigate('/super-admin/templates')}
            >
              <FileText className="h-4 w-4" />
              Templates
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
          {activeTab === 'overview' && (
            <OverviewTab 
              colleges={colleges} 
              admins={admins} 
              sessions={sessions} 
            />
          )}

          {activeTab === 'colleges' && (
            <CollegesTab 
              colleges={colleges} 
              admins={admins} 
              onRefresh={loadData} 
            />
          )}

          {activeTab === 'config' && (
            <AcademicConfigTab 
              colleges={colleges}
            />
          )}

          {activeTab === 'admins' && (
            <AdminsTab 
              admins={admins} 
              colleges={colleges} 
              onRefresh={loadData} 
            />
          )}

          {activeTab === 'trainers' && (
            <TrainersTab />
          )}

          {activeTab === 'sessions' && (
            <SessionsTab 
              sessions={sessions} 
              colleges={colleges} 
              trainers={trainers} 
              academicConfig={academicConfig} 
              onRefresh={loadData} 
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesTab />
          )}
        </main>
      </div>
    </div>
  );
};
