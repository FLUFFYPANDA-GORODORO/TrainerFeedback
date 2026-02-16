import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  LogOut,
  GraduationCap,
  BarChart3,
  Calendar,
  LayoutDashboard,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Menu,
  Database,
  HelpCircle,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminDataProvider, useAdminData } from '@/contexts/AdminDataContext';
import CollegeOverviewTab from './components/CollegeOverviewTab';
import TrainerFeedbackTab from './components/TrainerFeedbackTab';
import CollegeSessionsTab from './components/CollegeSessionsTab';
import HelpTab from '@/components/shared/HelpTab';
import ProfilePage from '@/components/shared/ProfilePage';

// Inner component to consume context
const AdminDashboardContent = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { college, loading, refreshAll } = useAdminData();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';
  // Map routes to tab names
  const getActiveTab = (path) => {
    if (path === 'dashboard') return 'overview';
    if (path === 'sessions') return 'sessions';
    if (path === 'feedback') return 'feedback';
    if (path === 'help') return 'help';
    if (path === 'profile') return 'profile';
    return 'overview';
  };
  const activeTab = getActiveTab(currentSection);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ id, label, icon: Icon, path }) => {
    const isActive = activeTab === id;
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 mb-1 ${
                isSidebarCollapsed ? 'px-2 justify-center' : 'px-3 gap-3'
              } ${isActive 
                  ? 'bg-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary' 
                  : 'text-primary-foreground hover:bg-primary/80'
              }`}
              onClick={() => navigate(path)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span>{label}</span>}
            </Button>
          </TooltipTrigger>
          {isSidebarCollapsed && (
            <TooltipContent side="right" className="font-medium">
              {label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Loading state
  if (loading.initial) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Check access
  if (!user || (user.role !== 'collegeAdmin' && user.role !== 'superAdmin')) {
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

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      
      {/* Full-Height Sidebar */}
      <aside 
        className={`bg-primary text-primary-foreground border-r border-primary/80 flex flex-col transition-all duration-300 ease-in-out h-screen ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo Section at Top - Full Width */}
        <div className={`h-28 border-b border-primary-foreground/20 flex items-center justify-center ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {!isSidebarCollapsed ? (
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-20 w-full object-contain" 
              onError={(e) => e.target.style.display = 'none'} 
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white p-1 shadow-md overflow-hidden flex items-center justify-center">
              <img 
                src="/shortlogo.png" 
                alt="Logo" 
                className="h-full w-full object-contain" 
                onError={(e) => e.target.style.display = 'none'} 
              />
            </div>
          )}
        </div>

        {/* Admin Profile Section */}
        <div className={`py-4 border-b border-primary-foreground/20 ${isSidebarCollapsed ? 'px-2 flex flex-col items-center gap-2' : 'px-4'}`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-primary-foreground/10 p-2 -ml-2 rounded-md transition-colors"
                onClick={() => navigate('/admin/profile')}
                title="Go to Profile"
              >
                <div className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-semibold text-sm shadow-md flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-primary-foreground truncate">{user.name}</p>
                  <p className="text-xs text-primary-foreground/70">{user.role === 'superAdmin' ? 'Super Admin' : 'College Admin'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 bg-white text-black hover:bg-gray-200 hover:scale-105 rounded-full shadow-sm transition-all"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div 
                className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-semibold text-sm shadow-md cursor-pointer hover:scale-110 transition-transform"
                onClick={() => navigate('/admin/profile')}
                title="Go to Profile"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 bg-white text-black hover:bg-gray-200 hover:scale-105 rounded-full shadow-sm transition-all"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
         
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          <NavItem 
            id="overview" 
            label="Dashboard" 
            icon={LayoutDashboard} 
            path="/admin/dashboard" 
          />
          <NavItem 
            id="sessions" 
            label="Feedback Sessions" 
            icon={Calendar} 
            path="/admin/sessions" 
          />
          <NavItem 
            id="help" 
            label="Help & Support" 
            icon={HelpCircle} 
            path="/admin/help" 
          />
        </nav>

        {/* Sign Out at Bottom */}
        <div className={`p-3 border-t border-primary-foreground/20 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost"
                  className={`text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground ${
                    isSidebarCollapsed ? 'h-10 w-10 p-0' : 'w-full justify-start gap-3'
                  }`}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Sign Out
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* Main Content Area with Navbar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-28 flex-shrink-0 border-b bg-white flex items-center justify-between z-20 shadow-sm px-6">
          {/* Left: Page Title */}
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'sessions' && 'Session Management'}
              {activeTab === 'feedback' && 'Trainer Feedback'}
              {activeTab === 'help' && 'Help & Support'}
              {activeTab === 'profile' && 'My Profile'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {college?.name || ''}
            </p>
          </div>
          
          {/* Right: College Logo */}
          <div className="h-full flex items-center">
            {college && college.logoUrl && (
              <img 
                src={college.logoUrl} 
                alt={college.name} 
                className="h-full w-auto object-contain py-3" 
              />
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/5 p-6 scroll-smooth">
          <div className={`max-w-8xl mx-auto transition-all duration-300 ${isSidebarCollapsed ? 'px-6' : 'px-0'}`}>

             {activeTab === 'overview' && <CollegeOverviewTab />}
             {activeTab === 'feedback' && <TrainerFeedbackTab />}
             {activeTab === 'sessions' && <CollegeSessionsTab />}
             {activeTab === 'help' && <HelpTab />}
             {activeTab === 'profile' && <ProfilePage />}
          </div>
        </main>

      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <AdminDataProvider>
        <AdminDashboardContent />
    </AdminDataProvider>
  );
};

export default AdminDashboard;
