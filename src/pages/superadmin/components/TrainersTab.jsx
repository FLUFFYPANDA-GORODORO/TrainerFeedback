import React, { useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Upload,
  User,
  Loader2,
  BarChart3,
  Search,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  addTrainer,
  updateTrainer,
  deleteTrainer,
  addTrainersBatch
} from '@/services/superadmin/trainerService';
import { useSuperAdminData } from '@/contexts/SuperAdminDataContext';
import TrainerAnalytics from './TrainerAnalytics';


// Add these ShadCN UI imports if you haven't imported them in this file yet
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const TrainersTab = () => {
  // Get trainers from context (cached, no re-fetch on tab switch)
  const { trainers, loadTrainers, updateTrainersList, loading: contextLoading } = useSuperAdminData();
  const loading = contextLoading.trainers;
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [trainerDialogOpen, setTrainerDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  // Form states
  const defaultTrainerState = {
    trainer_id: '',
    name: '',
    email: '',
    domain: '',
    specialisation: '',
    topics: '', // comma separated string for input
    password: '' // Only for creation not stored
  };
  const [currentTrainer, setCurrentTrainer] = useState(defaultTrainerState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [batchFile, setBatchFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Analytics view state
  const [selectedTrainerForAnalytics, setSelectedTrainerForAnalytics] = useState(null);

  // Force refresh trainers from context
  const refreshTrainers = () => loadTrainers(true);
  // Filter Logic
  const filteredTrainers = trainers.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(searchLower) ||
      t.email?.toLowerCase().includes(searchLower) ||
      t.domain?.toLowerCase().includes(searchLower) ||
      t.trainer_id?.toLowerCase().includes(searchLower)
    );
  });


  // Handlers
  const openCreateDialog = () => {
    setCurrentTrainer(defaultTrainerState);
    setIsEditing(false);
    setEditingId(null);
    setTrainerDialogOpen(true);
  };

  const openEditDialog = (trainer) => {
    setCurrentTrainer({
      trainer_id: trainer.trainer_id,
      name: trainer.name,
      email: trainer.email,
      domain: trainer.domain || '',
      specialisation: trainer.specialisation || '',
      topics: trainer.topics ? trainer.topics.join(', ') : '',
      password: '' // Don't preload password (it's not stored anyway)
    });
    setIsEditing(true);
    setEditingId(trainer.id);
    setTrainerDialogOpen(true);
  };

  const handleSaveTrainer = async () => {
    if (!currentTrainer.name.trim() || !currentTrainer.trainer_id.trim() || !currentTrainer.email.trim()) {
      toast.error('Please fill in required fields (ID, Name, Email)');
      return;
    }

    if (!isEditing && !currentTrainer.password) {
      toast.error('Password is required for new trainers');
      return;
    }

    // Process topics
    const topicsArray = currentTrainer.topics.split(',').map(t => t.trim()).filter(t => t);

    const trainerData = {
      trainer_id: currentTrainer.trainer_id.trim(),
      name: currentTrainer.name.trim(),
      email: currentTrainer.email.trim(),
      domain: currentTrainer.domain.trim(),
      specialisation: currentTrainer.specialisation.trim(),
      topics: topicsArray,
      password: currentTrainer.password // Passed but service handles it (ignores/logs but not stored in doc)
    };

    try {
      if (isEditing) {
        // Remove trainer_id and password from update if you don't want them changeable or minimal update
        // Usually ID shouldn't change. Password isn't stored so valid to send?
        // Service updateTrainer takes "updates" object.
        const { trainer_id, password, ...updates } = trainerData;
        await updateTrainer(editingId, updates);
        toast.success('Trainer updated successfully');

        // Update context state to reflect change without full reload
        updateTrainersList(prev => prev.map(t => t.id === editingId ? { ...t, ...updates } : t));
      } else {
        await addTrainer(trainerData);
        toast.success('Trainer created successfully');
        refreshTrainers(); // Reload to get fresh list
      }
      setTrainerDialogOpen(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save trainer');
    }
  };

  const handleDeleteTrainer = async (id) => {
    if (confirm('Are you sure you want to delete this trainer?')) {
      try {
        await deleteTrainer(id);
        toast.success('Trainer deleted');
        updateTrainersList(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        toast.error('Failed to delete trainer');
      }
    }
  };

  const handleBatchFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      setBatchFile(file);
    } else {
      toast.error("Please upload a valid JSON file");
      e.target.value = null;
    }
  };

  const handleBatchUpload = async () => {
    if (!batchFile) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!Array.isArray(json)) {
          throw new Error("JSON must be an array of trainer objects");
        }

        const results = await addTrainersBatch(json);

        if (results.success.length > 0) {
          toast.success(`Successfully added ${results.success.length} trainers`);
        }

        if (results.errors.length > 0) {
          toast.warning(`Failed to add ${results.errors.length} trainers (duplicates or errors)`);
          console.warn("Batch errors:", results.errors);
        }

        setBatchDialogOpen(false);
        setBatchFile(null);
        refreshTrainers();
      } catch (error) {
        toast.error("Error parsing or uploading JSON: " + error.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(batchFile);
  };

  // If a trainer is selected for analytics, show analytics view
  if (selectedTrainerForAnalytics) {
    return (
      <TrainerAnalytics
        trainerId={selectedTrainerForAnalytics.id}
        trainerName={selectedTrainerForAnalytics.name}
        onBack={() => setSelectedTrainerForAnalytics(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Trainers</h1>
          <p className="text-muted-foreground mt-1">Manage faculty, track performance, and organize expertise.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Batch Import Dialog */}
          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 shadow-sm border-dashed">
                <Upload className="h-4 w-4" />
                <span className="hidden md:inline">Batch Import</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Batch Import Trainers</DialogTitle>
                <DialogDescription>
                  Upload a JSON file containing an array of trainer objects.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Select File</p>
                  <a
                    href="/sample-trainers.json"
                    download="sample-trainers.json"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Download Sample JSON
                  </a>
                </div>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleBatchFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Format: JSON array of objects with trainer_id, name, etc.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleBatchUpload}
                  disabled={!batchFile || isUploading}
                  className="gradient-hero text-primary-foreground"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Trainer Dialog */}
          <Dialog open={trainerDialogOpen} onOpenChange={setTrainerDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2 gradient-hero text-primary-foreground shadow-md hover:shadow-lg transition-all"
                onClick={openCreateDialog}
              >
                <Plus className="h-4 w-4" />
                Add Trainer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Trainer' : 'Add New Trainer'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update trainer details' : 'Add a new trainer to the platform'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trainer ID *</Label>
                    <Input
                      value={currentTrainer.trainer_id}
                      onChange={(e) => setCurrentTrainer({ ...currentTrainer, trainer_id: e.target.value })}
                      disabled={isEditing}
                      placeholder="TR-1001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={currentTrainer.name}
                      onChange={(e) => setCurrentTrainer({ ...currentTrainer, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={currentTrainer.email}
                    onChange={(e) => setCurrentTrainer({ ...currentTrainer, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Input
                      value={currentTrainer.domain}
                      onChange={(e) => setCurrentTrainer({ ...currentTrainer, domain: e.target.value })}
                      placeholder="Please specify domain"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialisation</Label>
                    <Input
                      value={currentTrainer.specialisation}
                      onChange={(e) => setCurrentTrainer({ ...currentTrainer, specialisation: e.target.value })}
                      placeholder="Core expertise"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Topics (comma separated)</Label>
                  <Textarea
                    value={currentTrainer.topics}
                    onChange={(e) => setCurrentTrainer({ ...currentTrainer, topics: e.target.value })}
                    placeholder="Java, Python, React, System Design"
                    rows={3}
                  />
                </div>

                {!isEditing && (
                  <div className="space-y-2">
                    <Label>Password (Initial)</Label>
                    <Input
                      type="password"
                      value={currentTrainer.password}
                      onChange={(e) => setCurrentTrainer({ ...currentTrainer, password: e.target.value })}
                      placeholder="******"
                    />
                    <p className="text-xs text-muted-foreground">Account will be created with this password.</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTrainerDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTrainer} className="gradient-hero text-primary-foreground">
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Search Filter */}
      <div className="relative max-w-md">
        <Input
          placeholder="Search by name, email, or domain..."
          className="pl-10 bg-card/50 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Redesigned Trainers Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTrainers.map((trainer, index) => (
          <div
            key={trainer.id}
            className="group relative flex flex-col bg-card border rounded-xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 animate-fade-up overflow-hidden"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Top Row: Avatar & Dropdown Menu */}
            <div className="p-5 pb-0 flex items-start justify-between">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center border border-primary/10 text-primary shadow-inner">
                <User className="h-7 w-7" />
              </div>

              {/* Secure Action Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => openEditDialog(trainer)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => handleDeleteTrainer(trainer.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Trainer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Info Section */}
            <div className="p-5 flex-grow space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-foreground leading-tight">{trainer.name}</h3>
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                    {trainer.trainer_id}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{trainer.email}</p>
              </div>

              {/* Domain & Specs Palls */}
              {(trainer.domain || trainer.specialisation) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {trainer.domain && (
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
                      {trainer.domain}
                    </span>
                  )}
                  {trainer.specialisation && (
                    <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground border">
                      {trainer.specialisation}
                    </span>
                  )}
                </div>
              )}

              {/* Expertise Tags */}
              <div className="pt-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/70 mb-1.5">Top Skills</p>
                <div className="flex flex-wrap gap-1">
                  {trainer.topics && trainer.topics.length > 0 ? (
                    trainer.topics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="text-[11px] px-1.5 py-0.5 bg-muted rounded text-foreground/80">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-muted-foreground">No skills listed</span>
                  )}
                  {trainer.topics && trainer.topics.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">+{trainer.topics.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action: Explicit Analytics Button */}
            <div className="p-3 bg-muted/20 border-t mt-auto">
              <Button
                variant="secondary"
                className="w-full gap-2 bg-background hover:bg-primary hover:text-primary-foreground border shadow-sm transition-all group-hover:border-primary/30"
                onClick={() => setSelectedTrainerForAnalytics(trainer)}
              >
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {loading && trainers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground animate-pulse">Syncing trainer database...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTrainers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-muted/10 border-2 border-dashed border-muted rounded-2xl">
            <div className="bg-background p-4 rounded-full shadow-sm mb-4">
              <Users className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {searchQuery ? 'No trainers match your search' : 'No trainers found'}
            </h3>
            <p className="text-muted-foreground max-w-sm text-center mt-2">
              {searchQuery
                ? 'Try checking for typos or searching by a different field (ID, Domain, etc).'
                : 'Get started by adding your first faculty member or importing a batch file.'}
            </p>
            {searchQuery ? (
              <Button variant="link" onClick={() => setSearchQuery('')} className="mt-4">
                Clear Filters
              </Button>
            ) : (
              <Button variant="default" onClick={openCreateDialog} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Add First Trainer
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainersTab;
