import React from 'react';
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
} from 'lucide-react';

interface SidebarLink {
  to: string;
  icon: React.ElementType;
  label: string;
}

const adminLinks: SidebarLink[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/cycles', icon: RefreshCw, label: 'Feedback Cycles' },
  { to: '/admin/departments', icon: Building2, label: 'Departments' },
  { to: '/admin/faculty', icon: Users, label: 'Faculty' },
  { to: '/admin/questions', icon: FileQuestion, label: 'Question Bank' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
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

export const DashboardSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getLinks = (): SidebarLink[] => {
    switch (user?.role) {
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-hero">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
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

        {/* User Info */}
        <div className="px-6 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
              <RoleIcon className="h-5 w-5 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-sidebar-foreground/70">{getRoleLabel()}</p>
            </div>
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
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};
