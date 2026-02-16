import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  GraduationCap,
  BarChart3,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  addCollege, 
  updateCollege, 
  deleteCollege 
} from '@/services/superadmin/collegeService';
import CollegeAnalytics from './CollegeAnalytics';

const CollegesTab = ({ colleges, admins, onRefresh }) => {
  // Dialog states
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  
  // Form states
  const [newCollege, setNewCollege] = useState({ name: '', code: '', logoUrl: '' });
  const [isEditingCollege, setIsEditingCollege] = useState(false);
  const [editingCollegeId, setEditingCollegeId] = useState(null);
  
  // Analytics view state
  const [selectedCollegeForAnalytics, setSelectedCollegeForAnalytics] = useState(null);

  // Handlers
  const openCreateCollegeDialog = () => {
    setNewCollege({ name: '', code: '', logoUrl: '' });
    setIsEditingCollege(false);
    setEditingCollegeId(null);
    setCollegeDialogOpen(true);
  };

  const openEditCollegeDialog = (college) => {
    setNewCollege({ name: college.name, code: college.code, logoUrl: college.logoUrl || '' });
    setIsEditingCollege(true);
    setEditingCollegeId(college.id);
    setCollegeDialogOpen(true);
  };

  const handleCreateOrUpdateCollege = async () => {
    if (!newCollege.name.trim() || !newCollege.code.trim()) {
      toast.error('Please fill in required fields');
      return;
    }
    
    try {
      if (isEditingCollege) {
        await updateCollege(editingCollegeId, {
          name: newCollege.name.trim(),
          code: newCollege.code.trim().toUpperCase(),
          logoUrl: newCollege.logoUrl.trim()
        });
        toast.success('College updated successfully');
      } else {
        await addCollege({
          name: newCollege.name.trim(),
          code: newCollege.code.trim().toUpperCase(),
          logoUrl: newCollege.logoUrl.trim()
        });
        toast.success('College created successfully');
      }
      setCollegeDialogOpen(false);
      setNewCollege({ name: '', code: '', logoUrl: '' });
      onRefresh(); // Trigger reload in parent
    } catch (error) {
      toast.error(error.message || 'Failed to save college');
    }
  };

  const handleDeleteCollege = async (id) => {
    if (confirm('Are you sure you want to delete this college?')) {
      try {
        await deleteCollege(id);
        toast.success('College deleted');
        onRefresh();
      } catch (error) {
        toast.error('Failed to delete college');
      }
    }
  };

  // If a college is selected for analytics, show analytics view
  if (selectedCollegeForAnalytics) {
    return (
      <CollegeAnalytics
        collegeId={selectedCollegeForAnalytics.id}
        collegeName={selectedCollegeForAnalytics.name}
        filters={{}} // No course/batch filters in this view
        onBack={() => setSelectedCollegeForAnalytics(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        </div>
        <Dialog open={collegeDialogOpen} onOpenChange={setCollegeDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
              onClick={openCreateCollegeDialog}
            >
              <Plus className="h-4 w-4" />
              Add College
            </Button>
          </DialogTrigger>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{isEditingCollege ? 'Edit College' : 'Create New College'}</DialogTitle>
              <DialogDescription>
                {isEditingCollege ? 'Update college details' : 'Add a new college to the platform'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>College Name</Label>
                <Input
                  value={newCollege.name}
                  onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                  placeholder="e.g., Gryphon Institute of Technology"
                />
              </div>
              <div className="space-y-2">
                <Label>College Code</Label>
                <Input
                  value={newCollege.code}
                  onChange={(e) => setNewCollege({ ...newCollege, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., GIT"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={newCollege.logoUrl}
                  onChange={(e) => setNewCollege({ ...newCollege, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCollegeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateOrUpdateCollege} className="gradient-hero text-primary-foreground">
                {isEditingCollege ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {colleges.map((college, index) => (
          <div
            key={college.id}
            className="glass-card rounded-xl p-5 animate-fade-up relative group flex flex-col gap-4"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between">
              {/* Logo Section - Wider container for better visibility, removed grey bg */}
              <div className="h-24 w-[292px] rounded-xl flex items-center justify-center p-1 border border-border/50">
                {college.logoUrl ? (
                  <img 
                    src={college.logoUrl} 
                    alt={college.name} 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <GraduationCap className="h-10 w-10 text-primary/50" />
                )}
              </div>

              {/* Action Menu - Replaces individual buttons */}
              <div className="-mr-2 -mt-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedCollegeForAnalytics(college)}>
                            <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditCollegeDialog(college)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit College
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeleteCollege(college.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete College
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-2" title={college.name}>
                {college.name}
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                Code: <span className="text-foreground/80">{college.code}</span>
              </p>
            </div>

            <div className="pt-2 mt-auto border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>{admins.filter(a => a.collegeId === college.id).length} admin(s)</span>
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Active
              </span>
            </div>
          </div>
        ))}

        {colleges.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No colleges yet</h3>
            <p className="text-muted-foreground">Create your first college to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegesTab;
