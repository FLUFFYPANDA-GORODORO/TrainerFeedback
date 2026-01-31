import React, { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { sessionsApi } from '@/lib/dataService';

const SessionsTab = ({ sessions, colleges, trainers, academicConfig, onRefresh }) => {
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    collegeId: '',
    trainerId: '',
    topic: '',
    course: '',
    specialization: '',
    batch: '',
    shift: 'Morning',
    day: '',
    expiresAt: ''
  });

  const handleCreateSession = () => {
    if (!newSession.collegeId || !newSession.topic.trim()) {
      toast.error('Please fill in required fields');
      return;
    }
    
    try {
      sessionsApi.create({
        ...newSession,
        expiresAt: newSession.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      toast.success('Session created successfully');
      setSessionDialogOpen(false);
      setNewSession({
        collegeId: '',
        trainerId: '',
        topic: '',
        course: '',
        specialization: '',
        batch: '',
        shift: 'Morning',
        day: '',
        expiresAt: ''
      });
      onRefresh();
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Feedback Sessions</h1>
          <p className="text-muted-foreground">Manage feedback sessions across all colleges</p>
        </div>
        <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Feedback Session</DialogTitle>
              <DialogDescription>Create a new feedback session for a trainer</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>College</Label>
                <Select 
                  value={newSession.collegeId} 
                  onValueChange={(v) => setNewSession({ ...newSession, collegeId: v })}
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
              <div className="space-y-2">
                <Label>Trainer</Label>
                <Select 
                  value={newSession.trainerId} 
                  onValueChange={(v) => setNewSession({ ...newSession, trainerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers
                      .filter(t => !newSession.collegeId || t.collegeId === newSession.collegeId)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Topic</Label>
                <Input
                  value={newSession.topic}
                  onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                  placeholder="e.g., Machine Learning Introduction"
                />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select 
                  value={newSession.course} 
                  onValueChange={(v) => setNewSession({ ...newSession, course: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(academicConfig?.courses || []).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select 
                  value={newSession.batch} 
                  onValueChange={(v) => setNewSession({ ...newSession, batch: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {(academicConfig?.batches || []).map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateSession} className="gradient-hero text-primary-foreground">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session, index) => {
          const college = colleges.find(c => c.id === session.collegeId);
          const trainer = trainers.find(t => t.id === session.trainerId);
          return (
            <div
              key={session.id}
              className="glass-card rounded-xl p-6 animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{session.topic}</h3>
                  <p className="text-sm text-muted-foreground">
                    {trainer?.name || 'Unknown Trainer'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {college?.name || 'No College'}
                </span>
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No sessions yet</h3>
            <p className="text-muted-foreground">Create your first session to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsTab;
