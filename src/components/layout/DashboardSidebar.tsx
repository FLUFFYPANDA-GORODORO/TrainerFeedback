import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  RefreshCw,
  Building2,
  Users,
  FileQuestion,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  UserCheck,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarLink {
  to: string;
  icon: React.ElementType;
  label: string;
}

const adminLinks: SidebarLink[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/sessions', icon: RefreshCw, label: 'Feedback Sessions' },
  { to: '/admin/departments', icon: GraduationCap, label: 'Academic Config' },
  { to: '/admin/faculty', icon: Users, label: 'Faculty' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
];

const superAdminLinks: SidebarLink[] = [
  { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/questions', icon: FileQuestion, label: 'Question Bank' },
  { to: '/super-admin/colleges', icon: Building2, label: 'Colleges' },
];

const hodLinks: SidebarLink[] = [
  { to: '/hod/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hod/faculty', icon: Users, label: 'Faculty Performance' },
  { to: '/hod/reports', icon: BarChart3, label: 'Reports' },
];

const facultyLinks: SidebarLink[] = [
  { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/faculty/feedback', icon: ClipboardList, label: 'My Feedback' },
  { to: '/faculty/reports', icon: BarChart3, label: 'Performance Report' },
];

interface DashboardSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isCollapsed: externalIsCollapsed,
  onToggleCollapse
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const setIsCollapsed = onToggleCollapse || setInternalIsCollapsed;

  const handleLogout = async () => {
    logout();
    navigate(-1);
  };

  const getLinks = (): SidebarLink[] => {
    switch (user?.role) {
      case 'superAdmin':
        return superAdminLinks;
      case 'admin':
        return adminLinks;
      case 'hod':
        return hodLinks;
      case 'faculty':
        return facultyLinks;
      default:
        return [];
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'superAdmin':
        return Building2;
      case 'admin':
        return GraduationCap;
      case 'hod':
        return UserCheck;
      case 'faculty':
        return Users;
      default:
        return Users;
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'superAdmin':
        return 'Super Admin';
      case 'admin':
        return 'College Admin';
      case 'hod':
        return 'Head of Department';
      case 'faculty':
        return 'Faculty Member';
      default:
        return 'User';
    }
  };

  const links = getLinks();
  const RoleIcon = getRoleIcon();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen gradient-hero transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-56"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo and Toggle */}
        {isCollapsed ? (
          <div className="flex flex-col items-center px-4 py-5 border-b border-sidebar-border gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
              <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors duration-200"
              title="Expand Sidebar"
            >
              <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
                  Gryphon
                </h1>
                <p className="text-xs text-sidebar-foreground/70">Feedback System</p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors duration-200"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
            </button>
          </div>
        )}

        {/* User Info */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
              <RoleIcon className="h-5 w-5 text-sidebar-accent-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-sidebar-foreground/70">{getRoleLabel()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center px-2" : "",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200",
              isCollapsed ? "justify-center px-2" : "w-full"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
