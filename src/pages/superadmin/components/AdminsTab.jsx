import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Shield, 
  ShieldCheck,
  Building,
  Loader2,
  MoreVertical 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { 
  createSystemUser, 
  updateSystemUser, 
  deleteSystemUser,
  getAllSystemUsers
} from '@/services/superadmin/userService';

const AdminsTab = ({ colleges, onRefresh }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form State
  const defaultFormState = {
    name: '',
    email: '',
    role: 'collegeAdmin', // Default
    collegeId: '',
    password: '' // Only for creation
  };
  const [formData, setFormData] = useState(defaultFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on mount
  const fetchUsers = async () => {
    setLoading(true);
    try {
        const users = await getAllSystemUsers();
        // Filter out those who might be just pure superAdmins or strictly college admins if needed, 
        // but generally we show all 'system users' here.
        setAdmins(users);
    } catch (error) {
        toast.error("Failed to load admins");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateDialog = () => {
    setFormData(defaultFormState);
    setIsEditing(false);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'collegeAdmin',
      collegeId: user.collegeId || '',
      password: '' // Don't show password
    });
    setIsEditing(true);
    setEditingId(user.id); // user.uid is typically the ID
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill in required fields");
      return;
    }

    if (formData.role === 'collegeAdmin' && !formData.collegeId) {
      toast.error("Please select a college for College Admin");
      return;
    }

    if (!isEditing && !formData.password) {
        toast.error("Password is required for new users");
        return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        // Update
        const updates = {
            name: formData.name,
            role: formData.role,
            collegeId: formData.role === 'collegeAdmin' ? formData.collegeId : null
        };
        await updateSystemUser(editingId, updates);
        toast.success("User updated successfully");
      } else {
        // Create
        await createSystemUser(formData, formData.password);
        toast.success("User created successfully");
      }
      setDialogOpen(false);
      fetchUsers(); // Refresh list
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this user? Their access will be revoked immediately.")) {
        try {
            await deleteSystemUser(id);
            toast.success("User deleted");
            setAdmins(prev => prev.filter(u => u.id !== id));
        } catch (error) {
            toast.error("Failed to delete user");
        }
    }
  };

  // Helper to get college name
  const getCollegeName = (id) => {
    const college = colleges.find(c => c.id === id);
    return college ? college.name : 'Unknown College';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">System Admins</h1>
          <p className="text-muted-foreground">Manage Super Admins and College Admins</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button 
                className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
                onClick={openCreateDialog}
                >
                <Plus className="h-4 w-4" />
                Add Admin
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit User' : 'Add New Admin'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update user details' : 'Create a new system administrator or college admin'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Full Name"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="email@example.com"
                            disabled={isEditing} // Email usually immutable in this context
                        />
                    </div>

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input 
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                placeholder="******"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select 
                            value={formData.role} 
                            onValueChange={(val) => setFormData({...formData, role: val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="superAdmin">Super Admin</SelectItem>
                                <SelectItem value="collegeAdmin">College Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.role === 'collegeAdmin' && (
                        <div className="space-y-2 animate-fade-in">
                            <Label>College</Label>
                            <Select 
                                value={formData.collegeId} 
                                onValueChange={(val) => setFormData({...formData, collegeId: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select College" />
                                </SelectTrigger>
                                <SelectContent>
                                    {colleges.map(college => (
                                        <SelectItem key={college.id} value={college.id}>
                                            {college.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSubmitting}
                        className="gradient-hero text-primary-foreground"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {admins.map((user, index) => (
             <div
                key={user.id}
                className="group relative flex flex-col bg-card border rounded-xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 animate-fade-up overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
             >
                <div className="p-5 flex items-center gap-5">
                     {/* Avatar */}
                     <div className={`h-16 w-16 rounded-full flex-shrink-0 flex items-center justify-center border shadow-inner ${
                         user.role === 'superAdmin' 
                            ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-100 text-purple-600' 
                            : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100 text-blue-600'
                     }`}>
                         {user.role === 'superAdmin' ? <ShieldCheck className="h-8 w-8"/> : <Building className="h-8 w-8"/>}
                     </div>

                     {/* Details Column */}
                     <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-foreground leading-none">{user.name}</h3>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                user.role === 'superAdmin'
                                ? 'bg-primary/5 text-primary border-primary/10'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}>
                                {user.role === 'superAdmin' ? 'Super Admin' : 'College Admin'}
                            </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-none">{user.email}</p>

                        {/* Organization Tag */}
                        <div className="pt-1">
                            {user.role === 'superAdmin' ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                    Gryphon Academy Pvt Ltd
                                </span>
                            ) : (
                                user.collegeId && (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                        {getCollegeName(user.collegeId)}
                                    </span>
                                )
                            )}
                        </div>
                     </div>

                     {/* Action Menu */}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent -mr-2 -mt-2 self-start">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                </div>
             </div>
        ))}
         
         {loading && (
             <div className="col-span-full flex justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
         )}

        {!loading && admins.length === 0 && (
             <div className="col-span-full text-center py-12">
                 <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                 <h3 className="text-lg font-medium text-muted-foreground mb-2">No admins found</h3>
                 <p className="text-muted-foreground">Create your first system administrator.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default AdminsTab;
