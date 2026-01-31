import React, { useState } from 'react';
import { UserPlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { usersApi } from '@/lib/dataService';

const AdminsTab = ({ admins, colleges, onRefresh }) => {
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', collegeId: '' });

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
      onRefresh();
    } catch (error) {
      toast.error('Failed to create admin');
    }
  };

  return (
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
  );
};

export default AdminsTab;
