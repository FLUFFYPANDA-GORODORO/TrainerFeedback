import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Upload,
  User,
  Loader2
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

const TrainersTab = () => {
  // Get trainers from context (cached, no re-fetch on tab switch)
  const { trainers, loadTrainers, updateTrainersList, loading: contextLoading } = useSuperAdminData();
  const loading = contextLoading.trainers;

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

  // Force refresh trainers from context
  const refreshTrainers = () => loadTrainers(true);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Trainers</h1>
          <p className="text-muted-foreground">Manage trainers and faculty</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Batch Import
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
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                    Upload
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>

            <Dialog open={trainerDialogOpen} onOpenChange={setTrainerDialogOpen}>
            <DialogTrigger asChild>
                <Button 
                className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
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
                        disabled={isEditing} // ID usually immutable
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
                        placeholder="Auto-generated if empty"
                        />
                        <p className="text-xs text-muted-foreground">Note: Auth logic currently deferred.</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trainers.map((trainer, index) => (
          <div
            key={trainer.id}
            className="glass-card rounded-xl p-5 animate-fade-up relative group flex flex-col gap-4"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="h-6 w-6 text-primary" />
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-transparent transition-colors"
                  onClick={() => openEditDialog(trainer)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-transparent transition-colors"
                  onClick={() => handleDeleteTrainer(trainer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-1" title={trainer.name}>
                {trainer.name}
              </h3>
              <p className="text-sm font-medium text-muted-foreground truncate" title={trainer.email}>
                {trainer.email}
              </p>
               <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="bg-secondary/50 px-2 py-0.5 rounded text-secondary-foreground">
                    {trainer.trainer_id}
                </span>
                {trainer.domain && (
                     <span className="bg-primary/5 px-2 py-0.5 rounded text-primary">
                        {trainer.domain}
                     </span>
                )}
              </div>
            </div>
            
            <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]" title={trainer.topics ? trainer.topics.join(', ') : ''}>
                    {trainer.topics && trainer.topics.length > 0 
                        ? trainer.topics.join(', ') 
                        : <span className="italic opacity-50">No topics listed</span>}
                </p>
            </div>
          </div>
        ))}
        
        {loading && trainers.length === 0 && (
             <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        )}

        {!loading && trainers.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No trainers yet</h3>
            <p className="text-muted-foreground">Add trainers manually or batch import them.</p>
          </div>
        )}
      </div>
      
      {/* Load more button removed - all trainers loaded via context */}
    </div>
  );
};

export default TrainersTab;
