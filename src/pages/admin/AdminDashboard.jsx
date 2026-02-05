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
              variant={isActive ? 'default' : 'ghost'}
              className={`w-full justify-start h-10 mb-1 ${
                isSidebarCollapsed ? 'px-2 justify-center' : 'px-3 gap-3'
              } ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/80'}`}
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
      <header className="h-24 flex-shrink-0 border-b bg-card px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/gryphon_logo.png" alt="Gryphon" className="h-20 w-auto" onError={(e) => e.target.style.display = 'none'} />
          </div>
        </div>

        <div className="flex items-center gap-4">
           {college && (
            <div className="flex items-center gap-3 px-3 py-1.5">
               {college.logoUrl ? (
                  <img src={college.logoUrl} alt={college.name} className="h-20 w-auto object-contain max-w-[300px]" />
               ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {college.name.substring(0, 2).toUpperCase()}
                  </div>
               )}
            </div>
           )}

           {/* User Profile */}
           <div className="flex items-center gap-3 pl-3 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
           </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Collapsible Sidebar */}
        <aside 
          className={`bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-16' : 'w-48'
          }`}
        >
           {/* Toggle Button */}
           <div className="p-3 flex justify-end">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                 {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
           </div>
           
           {/* Navigation */}
           <nav className="flex-1 p-3 space-y-1">
              <NavItem 
                id="overview" 
                label="Overview" 
                icon={LayoutDashboard} 
                path="/admin/dashboard" 
              />
              <NavItem 
                id="sessions" 
                label="Sessions" 
                icon={Calendar} 
                path="/admin/sessions" 
              />
              {/* <NavItem 
                id="feedback" 
                label="Trainer Feedback" 
                icon={BarChart3} 
                path="/admin/feedback" 
              /> */}
           </nav>

           {/* Bottom Actions */}
           <div className="p-3 border-t mt-auto space-y-1">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                   <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`w-full justify-start ${isSidebarCollapsed ? 'px-2 justify-center' : 'px-3 gap-3'}`}
                        onClick={refreshAll}
                      >
                         <RefreshCw className={`h-4 w-4 ${loading.college ? 'animate-spin' : ''}`} />
                         {!isSidebarCollapsed && <span>Refresh Data</span>}
                      </Button>
                   </TooltipTrigger>
                   {isSidebarCollapsed && <TooltipContent side="right">Refresh Data</TooltipContent>}
                </Tooltip>

                <Tooltip>
                   <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleLogout} 
                        className={`w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 ${
                          isSidebarCollapsed ? 'px-2 justify-center' : 'px-3 gap-3'
                        }`}
                      >
                         <LogOut className="h-4 w-4" />
                         {!isSidebarCollapsed && <span>Sign Out</span>}
                      </Button>
                   </TooltipTrigger>
                   {isSidebarCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
                </Tooltip>

                {/* Developer / Admin Utils - Hidden in collapsed usually, but useful here */}
                {user.role === 'superAdmin' && (
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                             import('@/services/superadmin/rebuildCache').then(m => {
                                toast.promise(m.rebuildCache(), {
                                   loading: 'Rebuilding analytics cache...',
                                   success: 'Cache synchronized successfully!',
                                   error: 'Failed to rebuild cache'
                                });
                             });
                          }} 
                          className={`w-full justify-start text-muted-foreground hover:text-primary ${
                            isSidebarCollapsed ? 'px-2 justify-center' : 'px-3 gap-3'
                          }`}
                        >
                           <Database className="h-4 w-4" />
                           {!isSidebarCollapsed && <span>Sync Data</span>}
                        </Button>
                     </TooltipTrigger>
                     {isSidebarCollapsed && <TooltipContent side="right">Sync Data</TooltipContent>}
                  </Tooltip>
                )}
              </TooltipProvider>
           </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted/5 p-6 scroll-smooth">
          <div className={`max-w-8xl mx-auto transition-all duration-300 ${isSidebarCollapsed ? 'px-6' : 'px-0'}`}>
             {/* Dynamic Page Title (Optional as breadcrumb) */}
             <div className="mb-6 flex flex-col gap-1">
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
