import React, { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { useAuth } from "@/contexts/AuthContext";
import {
  SuperAdminDataProvider,
  useSuperAdminData,
} from "@/contexts/SuperAdminDataContext";
import { usersApi, academicConfigApi, analyticsApi } from "@/lib/dataService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Building2,
  Shield,
  LogOut,
  GraduationCap,
  UserPlus,
  RefreshCw,
  BookOpen,
  Users,
  FileText,
  LayoutDashboard,
  Barcode,
  Ticket,
  User,
  Plus,
  Download,
} from "lucide-react";

// Import Tab Components
import OverviewTab from "./components/OverviewTab";
import CollegesTab from "./components/CollegesTab";
import AdminsTab from "./components/AdminsTab";
import SessionsTab from "./components/SessionsTab";
import AcademicConfigTab from "./components/AcademicConfigTab";
import TrainersTab from "./components/TrainersTab";
import TemplatesTab from "./components/TemplatesTab";
import ProjectCodesTab from "./components/ProjectCodesTab";
import TicketsTab from "./components/TicketsTab";
import SessionResponses from "../admin/SessionResponses";
import ProfilePage from "@/components/shared/ProfilePage";

// Inner dashboard component that consumes context
const SuperAdminDashboardInner = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Dialog and action states for navbar buttons
  const [isCollegeDialogOpen, setIsCollegeDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isProjectCodeImportOpen, setIsProjectCodeImportOpen] = useState(false);

  const dashboardRef = useRef(null);

  // Get data from context
  const {
    colleges,
    admins,
    trainers,
    sessions,
    templates,
    projectCodes, // [NEW] Get project codes
    isInitialLoading,
    refreshAll,
  } = useSuperAdminData();

  // Export screenshot handler
  const handleExport = useCallback(async () => {
    const toastId = toast.loading("Generating snapshot...");
    try {
      const el = dashboardRef.current;
      if (!el) {
        toast.error("Dashboard content not found", { id: toastId });
        return;
      }

      // Small delay for chart rendering
      await new Promise((resolve) => setTimeout(resolve, 400));

      const dataUrl = await toPng(el, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2, // 2x is usually enough and faster
        cacheBust: true,
        style: {
          fontFamily: "Inter, sans-serif",
        },
        filter: (node) => {
          if (
            node.classList &&
            (node.classList.contains("print:hidden") ||
              node.classList.contains("snapshot-ignore"))
          ) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = `FacultyInsight-Snapshot-${new Date().toLocaleDateString().replace(/\//g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Snapshot saved", { id: toastId });
    } catch (err) {
      console.error("Export failed:", err);
      toast.error(
        "Export failed. Check internet connection or CORS settings.",
        { id: toastId },
      );
    }
  }, []);

  // Legacy data from mock/local storage (academicConfig, globalStats)
  const academicConfig = academicConfigApi.getActive() || {};
  const stats = analyticsApi.getGlobalStats();
  const globalStats = { ...stats, totalColleges: colleges.length };

  // Get active tab from URL
  const currentSection = location.pathname.split("/").pop() || "dashboard";
  const getActiveTab = (section) => {
    switch (section) {
      case "dashboard":
        return "overview";
      case "colleges":
        return "colleges";
      case "admins":
        return "admins";
      case "trainers":
        return "trainers";
      case "sessions":
        return "sessions";
      case "templates":
        return "templates";
      case "project-codes":
        return "project-codes";
      case "tickets":
        return "tickets";
      case "academic-config":
        return "config";
      case "analytics":
        return "analytics";
      case "profile":
        return "profile";
      default:
        // Check if we are in a sub-view (analytics) within colleges/trainers
        // We handle this by making the snapshot button always visible for these base tabs
        return section;
    }
  };
  const activeTab = getActiveTab(currentSection);

  // Determine if snapshot is allowed (including sub-views)
  const isSnapshotAllowed =
    activeTab === "overview" ||
    activeTab === "colleges" ||
    activeTab === "trainers" ||
    activeTab === "analytics";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMouseEnter = () => {
    setIsSidebarCollapsed(false);
  };

  const handleMouseLeave = () => {
    setIsSidebarCollapsed(true);
  };

  // If viewing session responses
  if (sessionId) {
    return <SessionResponses />;
  }

  if (!user || user.role !== "superAdmin") {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // NavItem component for consistent navigation
  const NavItem = ({ id, label, icon: Icon, path }) => {
    const isActive = activeTab === id;
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 mb-1 ${
                isSidebarCollapsed ? "px-2 justify-center" : "px-3 gap-3"
              } ${
                isActive
                  ? "bg-primary-foreground text-primary hover:bg-primary-foreground hover:text-primary"
                  : "text-primary-foreground hover:bg-primary/80"
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

  // Get page title based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case "overview":
        return "Dashboard Overview";
      case "colleges":
        return "Colleges Management";
      case "config":
        return "Academic Configuration";
      case "admins":
        return "Admins Management";
      case "trainers":
        return "Trainers Management";
      case "sessions":
        return "Sessions Management";
      case "templates":
        return "Templates Management";
      case "project-codes":
        return "Project Codes";
      case "tickets":
        return "Support Tickets";
      case "profile":
        return "My Profile";
      default:
        return "Super Admin Dashboard";
    }
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Full-Height Sidebar */}
      <aside
        className={`bg-primary text-primary-foreground border-r border-primary/80 flex flex-col transition-all duration-300 ease-in-out h-screen ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo Section at Top - Full Width */}
        <div
          className={`h-28 border-b border-primary-foreground/20 flex items-center justify-center ${isSidebarCollapsed ? "px-2" : "px-3"}`}
        >
          {!isSidebarCollapsed ? (
            <img
              src="/logo.png"
              alt="Logo"
              className="h-20 w-full object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white p-1 shadow-md overflow-hidden flex items-center justify-center">
              <img
                src="/shortlogo.png"
                alt="Logo"
                className="h-full w-full object-contain"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          )}
        </div>

        {/* Admin Profile Section */}
        <div
          className={`py-4 border-b border-primary-foreground/20 ${isSidebarCollapsed ? "px-2 flex flex-col items-center gap-2" : "px-4"}`}
        >
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-start">
              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-primary-foreground/10 p-2 -ml-2 rounded-md transition-colors"
                onClick={() => navigate("/super-admin/profile")}
                title="Go to Profile"
              >
                <div className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-semibold text-sm shadow-md flex-shrink-0 overflow-hidden">
                  {user?.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-semibold text-primary-foreground truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-primary-foreground/70">
                    Super Admin
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-primary font-semibold text-sm shadow-md cursor-pointer hover:scale-110 transition-transform overflow-hidden"
              onClick={() => navigate("/super-admin/profile")}
              title="Go to Profile"
            >
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          <NavItem
            id="overview"
            label="Overview"
            icon={LayoutDashboard}
            path="/super-admin/dashboard"
          />
          <NavItem
            id="colleges"
            label="Colleges"
            icon={GraduationCap}
            path="/super-admin/colleges"
          />
          <NavItem
            id="config"
            label="Academic Config"
            icon={BookOpen}
            path="/super-admin/academic-config"
          />
          <NavItem
            id="admins"
            label="Admins"
            icon={UserPlus}
            path="/super-admin/admins"
          />
          <NavItem
            id="trainers"
            label="Trainers"
            icon={Users}
            path="/super-admin/trainers"
          />
          <NavItem
            id="sessions"
            label="Sessions"
            icon={Shield}
            path="/super-admin/sessions"
          />
          <NavItem
            id="templates"
            label="Templates"
            icon={FileText}
            path="/super-admin/templates"
          />
          <NavItem
            id="project-codes"
            label="Project Codes"
            icon={Barcode}
            path="/super-admin/project-codes"
          />
          <NavItem
            id="tickets"
            label="Tickets"
            icon={Ticket}
            path="/super-admin/tickets"
          />
        </nav>

        {/* Sign Out at Bottom */}
        <div
          className={`p-3 border-t border-primary-foreground/20 ${isSidebarCollapsed ? "flex justify-center" : ""}`}
        >
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground ${
                    isSidebarCollapsed
                      ? "h-10 w-10 p-0"
                      : "w-full justify-start gap-3"
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
              {getPageTitle()}
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your feedback system
            </p>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Context-specific action buttons */}
            {activeTab === "admins" && (
              <Button
                variant="default"
                className="gap-2 gradient-hero text-primary-foreground"
                onClick={() => setIsAdminDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Admin
              </Button>
            )}
            {activeTab === "sessions" && (
              <Button
                variant="default"
                className="gap-2 gradient-hero text-primary-foreground"
                onClick={() => setIsSessionDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            )}

            {/* Snapshot Button */}
            {isSnapshotAllowed && (
              <Button
                variant="outline"
                onClick={handleExport}
                className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm print:hidden"
              >
                <Download className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Snapshot</span>
              </Button>
            )}

            {/* Refresh Button */}
            <Button variant="outline" onClick={refreshAll} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/5 p-6 scroll-smooth">
          <div
            ref={dashboardRef}
            className={`max-w-8xl mx-auto transition-all duration-300 ${isSidebarCollapsed ? "px-6" : "px-0"}`}
          >
            {activeTab === "overview" && (
              <OverviewTab
                colleges={colleges}
                admins={admins}
                sessions={sessions}
                projectCodes={projectCodes} // [NEW] Pass project codes
              />
            )}

            {activeTab === "colleges" && (
              <CollegesTab
                colleges={colleges}
                admins={admins}
                onRefresh={refreshAll}
                isDialogOpen={isCollegeDialogOpen}
                setDialogOpen={setIsCollegeDialogOpen}
              />
            )}

            {activeTab === "config" && (
              <AcademicConfigTab colleges={colleges} />
            )}

            {activeTab === "admins" && (
              <AdminsTab
                colleges={colleges}
                onRefresh={refreshAll}
                isDialogOpen={isAdminDialogOpen}
                setDialogOpen={setIsAdminDialogOpen}
              />
            )}

            {activeTab === "trainers" && <TrainersTab />}

            {activeTab === "sessions" && (
              <SessionsTab
                sessions={sessions}
                colleges={colleges}
                trainers={trainers}
                academicConfig={academicConfig}
                onRefresh={refreshAll}
                isDialogOpen={isSessionDialogOpen}
                setDialogOpen={setIsSessionDialogOpen}
              />
            )}

            {activeTab === "templates" && <TemplatesTab />}

            {activeTab === "project-codes" && <ProjectCodesTab />}

            {activeTab === "tickets" && <TicketsTab />}

            {activeTab === "profile" && <ProfilePage />}
          </div>
        </main>
      </div>
    </div>
  );
};

// Wrapper component that provides the context
export const SuperAdminDashboard = () => {
  return (
    <SuperAdminDataProvider>
      <SuperAdminDashboardInner />
    </SuperAdminDataProvider>
  );
};
