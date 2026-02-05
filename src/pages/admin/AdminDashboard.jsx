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
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminDataProvider, useAdminData } from '@/contexts/AdminDataContext';
import CollegeOverviewTab from './components/CollegeOverviewTab';
import TrainerFeedbackTab from './components/TrainerFeedbackTab';
import CollegeSessionsTab from './components/CollegeSessionsTab';

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      
      {/* Top Navbar (Full Width) */}
      <header className="h-24 flex-shrink-0 border-b bg-white flex items-center z-20 shadow-sm">
        {/* Left: Gryphon Logo - Same width as sidebar */}
        <div className="w-56 h-full flex items-center justify-center px-4 border-r border-border bg-card">
          <img 
            src="/gryphon_logo.png" 
            alt="Gryphon" 
            className="h-full w-auto object-contain py-2" 
            onError={(e) => e.target.style.display = 'none'} 
          />
        </div>
        
        {/* Center: College Logo */}
        <div className="flex items-center h-full pl-8 flex-1">
          {/* College Logo - Full Height */}
          {college && college.logoUrl && (
            <img 
              src={college.logoUrl} 
              alt={college.name} 
              className="h-full w-auto object-contain py-2" 
            />
          )}
          {college && !college.logoUrl && (
            <span className="text-lg font-semibold text-foreground">{college.name}</span>
          )}
        </div>

        {/* Right: Sign Out Button */}
        <div className="flex items-center gap-3 px-6">
          <Button 
            onClick={handleLogout}
            className="gap-2"
          >
            <span>Sign Out</span>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Collapsible Sidebar */}
        <aside 
          className={`bg-primary text-primary-foreground border-r border-primary/80 flex flex-col transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-16' : 'w-56'
          }`}
        >
           {/* Profile at top of sidebar - with collapse toggle beside name */}
           <div className={`px-4 py-5 flex items-center border-b border-primary-foreground/20 ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between'}`}>
              {!isSidebarCollapsed ? (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
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
                    className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80 flex-shrink-0"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 text-primary-foreground hover:bg-primary/80"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
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
           </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/5 p-6 scroll-smooth">
          <div className={`max-w-8xl mx-auto transition-all duration-300 ${isSidebarCollapsed ? 'px-6' : 'px-0'}`}>
             {/* Dynamic Page Title with Refresh Button */}
             <div className="mb-6 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                   <h2 className="text-2xl font-bold tracking-tight">
                     {activeTab === 'overview' && 'Dashboard Overview'}
                     {activeTab === 'sessions' && 'Session Management'}
                     {activeTab === 'feedback' && 'Trainer Feedback'}
                   </h2>
                   <p className="text-muted-foreground">
                     {activeTab === 'overview' && `${college?.name || ''} • Welcome back, ${user.name.split(' ')[0]}`}
                     {activeTab === 'sessions' && 'Manage feedback sessions and view responses'}
                     {activeTab === 'feedback' && 'Detailed performance analytics for trainers'}
                   </p>
                </div>
                {activeTab === 'overview' && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={refreshAll}
                          className="gap-2"
                        >
                          <span>Refresh Data</span>
                          <RefreshCw className={`h-4 w-4 ${loading.college ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sync latest data from server</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
             </div>

             {activeTab === 'overview' && <CollegeOverviewTab />}
             {activeTab === 'feedback' && <TrainerFeedbackTab />}
             {activeTab === 'sessions' && <CollegeSessionsTab />}
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
