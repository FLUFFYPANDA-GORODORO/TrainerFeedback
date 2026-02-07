import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionsByTrainer } from '@/services/superadmin/sessionService';
import { getCollegeById, getAllColleges } from '@/services/superadmin/collegeService';
import { Button } from '@/components/ui/button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalClose } from '@/components/ui/modal';
import SessionWizard from '@/components/shared/SessionWizard';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  RefreshCw,
  LogOut,
  GraduationCap,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import TrainerOverview from './components/TrainerOverview';
import TrainerSessions from './components/TrainerSessions';

const TrainerDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null); // Track session being edited
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Get current section from URL
  const currentSection = location.pathname.split('/').pop() || 'dashboard';
  const getActiveTab = (section) => {
    switch (section) {
      case 'dashboard': return 'overview';
      case 'sessions': return 'sessions';
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // 1. Load College(s)
        if (user.collegeId) {
             // Trainer has assigned college - load just that one
             try {
                const colData = await getCollegeById(user.collegeId);
                if (colData) setColleges([colData]);
             } catch (e) {
                console.error("College load failed", e);
             }
        } else {
             // No assigned college - load all colleges for selection
             try {
                const allColleges = await getAllColleges();
                setColleges(allColleges || []);
             } catch (e) {
                console.error("Failed to load colleges", e);
             }
        }

        // 2. Load Sessions (Firestore)
        // Use uid (Firebase Auth ID) primarily, fallback to id if needed
        const trainerId = user.uid || user.id; 
        const sessionData = await getSessionsByTrainer(trainerId);
        setSessions(sessionData);
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

  const handleSessionSaved = () => {
    setIsSessionFormOpen(false);
    setEditingSession(null);
    loadData(); // Refresh list to show changes
  };

  const handleCreateClick = () => {
    setEditingSession(null);
    setIsSessionFormOpen(true);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setIsSessionFormOpen(true);
  };

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

  if (isLoading && !sessions.length && !colleges.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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

        {/* Trainer Profile Section */}
        <div className={`py-4 border-b border-primary-foreground/20 ${isSidebarCollapsed ? 'px-2 flex flex-col items-center gap-2' : 'px-4'}`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-semibold text-sm shadow-md flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-primary-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-primary-foreground/70">Trainer</p>
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
              <div className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-semibold text-sm shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
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
          <NavItem id="overview" label="Dashboard" icon={LayoutDashboard} path="/trainer/dashboard" />
          <NavItem id="sessions" label="Sessions" icon={RefreshCw} path="/trainer/sessions" />
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
              {activeTab === 'overview' && 'Trainer Dashboard'}
              {activeTab === 'sessions' && 'My Sessions'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'overview' && 'Manage your sessions and view feedback'}
              {activeTab === 'sessions' && 'View and manage your training sessions'}
            </p>
          </div>
          
          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'sessions' && (
              <Button onClick={handleCreateClick} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Create Session
              </Button>
            )}
            <Button variant="outline" onClick={loadData} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/5 p-6 scroll-smooth">
          <div className={`max-w-8xl mx-auto transition-all duration-300 ${isSidebarCollapsed ? 'px-6' : 'px-0'}`}>

            {/* Session Form Modal (Shared for Create/Edit) */}
            <Modal open={isSessionFormOpen} onOpenChange={setIsSessionFormOpen} className="sm:max-w-[600px]">
                <ModalClose onClose={() => {
                    setIsSessionFormOpen(false);
                    setEditingSession(null);
                }} />
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <ModalHeader className="mb-4">
                        <ModalTitle>{editingSession ? 'Edit Session' : 'Create New Session'}</ModalTitle>
                        <ModalDescription>
                            {editingSession ? 'Update the details of your session below.' : 'Fill in the details below to create a new session.'}
                        </ModalDescription>
                    </ModalHeader>
                    <SessionWizard
                        session={editingSession}
                        colleges={colleges}
                        defaultCollegeId={user.collegeId || null}
                        trainers={[{
                          id: user.uid,
                          name: user.displayName || user.name || 'Me',
                          specialisation: user.specialisation || 'Trainer',
                          domain: user.domain || ''
                        }]}
                        defaultDomain={user.domain || ''}
                        defaultTrainerId={user.uid}
                        currentUserId={user.uid}
                        currentUserName={user.name}
                        onSuccess={handleSessionSaved}
                        onCancel={() => {
                            setIsSessionFormOpen(false);
                            setEditingSession(null);
                        }}
                    />
                </div>
            </Modal>

            {/* Content Tabs */}
            {activeTab === 'overview' && (
                <TrainerOverview />
            )}

            {activeTab === 'sessions' && (
                <div className="space-y-6 animate-in fade-in-50 duration-500">
                <TrainerSessions 
                    sessions={sessions} 
                    loading={isLoading} 
                    onEdit={handleEditSession}
                    onRefresh={loadData}
                />
                </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
};

export default TrainerDashboard;
