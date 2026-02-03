import React from 'react';
import { 
  Building2, 
  UserPlus, 
  Shield, 
  GraduationCap 
} from 'lucide-react';

const OverviewTab = ({ colleges, admins, sessions }) => {
  return (
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
  );
};

export default OverviewTab;
