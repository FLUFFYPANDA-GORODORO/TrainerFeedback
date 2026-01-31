import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Shield,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
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
import { createSession, deleteSession, getAllSessions } from '@/services/superadmin/sessionService';
import { getAcademicConfig } from '@/services/superadmin/academicService';
import { getAllTrainers } from '@/services/superadmin/trainerService';

// Define domain options configuration
const DOMAIN_OPTIONS = [
  "Technical",
  "Soft Skills", 
  "Tools",
  "Aptitude",
  "Verbal",
  "Management",
  "Other"
];

const SessionsTab = ({ sessions: initialSessions, colleges, academicConfig: globalConfig, onRefresh }) => {
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  
  // Dialog & Wizard State
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    collegeId: '',
    collegeName: '',
    academicYear: '2025-26', // Default or fetch
    course: '',
    branch: '',
    year: '',
    batch: '',
    topic: '',
    domain: '',
    assignedTrainer: null, // { id, name }
    sessionDate: '',
    sessionTime: 'Morning',
    sessionDuration: '60',
    questions: [], // Placeholder for now
    ttl: '24'
  });

  // Dynamic Options based on selection
  const [academicOptions, setAcademicOptions] = useState(null); // The full config for selected college
  const [filteredTrainers, setFilteredTrainers] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const allSessions = await getAllSessions();
      setSessions(allSessions);
      
      const allTrainers = await getAllTrainers(100); // Get reasonable amount or implement search
      setTrainers(allTrainers.trainers || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Step 1: College Selection Handlers
  const handleCollegeSelect = async (collegeId) => {
    const college = colleges.find(c => c.id === collegeId);
    setFormData(prev => ({ ...prev, collegeId, collegeName: college?.name || '' }));
    
    // Fetch academic config for this college
    try {
        const config = await getAcademicConfig(collegeId);
        setAcademicOptions(config || {});
    } catch (err) {
        console.error(err);
        toast.error("Failed to load academic config for college");
    }
  };

  // Step 2: Trainer Filtering
  useEffect(() => {
    if (step === 2) {
        let filtered = trainers;
        if (formData.domain) {
            filtered = filtered.filter(t => 
                t.domain?.toLowerCase().includes(formData.domain.toLowerCase()) ||
                t.specialisation?.toLowerCase().includes(formData.domain.toLowerCase())
            );
        }
        // Topic filtering removed as per request
        setFilteredTrainers(filtered);
    }
  }, [formData.domain, step, trainers]);

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      await createSession(formData);
      toast.success('Session created successfully');
      setSessionDialogOpen(false);
      resetForm();
      loadInitialData(); // Refresh list
      onRefresh && onRefresh();
    } catch (error) {
      toast.error('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
        collegeId: '',
        collegeName: '',
        academicYear: '2025-26',
        course: '',
        branch: '',
        year: '',
        batch: '',
        topic: '',
        domain: '',
        assignedTrainer: null,
        sessionDate: '',
        sessionTime: 'Morning',
        sessionDuration: '180',
        questions: [],
        ttl: '256' 
    });
    setAcademicOptions(null);
  };

  // Render Steps
  const renderStep = () => {
    switch(step) {
        case 1: // Batch Selection (College + Academic)
            const courses = academicOptions?.courses ? Object.keys(academicOptions.courses) : [];
            const currentCourseData = formData.course ? academicOptions?.courses[formData.course] : null;
            const departments = currentCourseData?.departments ? Object.keys(currentCourseData.departments) : [];
            const currentDeptData = formData.branch && currentCourseData?.departments ? currentCourseData.departments[formData.branch] : null;
            const years = currentDeptData?.years ? Object.keys(currentDeptData.years) : [];
            const currentYearData = formData.year && currentDeptData?.years ? currentDeptData.years[formData.year] : null;
            const batches = currentYearData?.batches || [];

            return (
                <div className="space-y-4 py-2">
                    {/* College Selection */}
                    <div className="space-y-2">
                        <Label>College *</Label>
                        <Select 
                            value={formData.collegeId} 
                            onValueChange={handleCollegeSelect}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select College" />
                            </SelectTrigger>
                            <SelectContent>
                                {colleges.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Academic Details - Rendered but disabled if dependencies missing */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>Academic Year</Label>
                            <Input 
                                value={formData.academicYear}
                                onChange={e => setFormData({...formData, academicYear: e.target.value})}
                                placeholder="2025-26"
                                disabled={!formData.collegeId}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Course *</Label>
                                <Select 
                                    value={formData.course} 
                                    onValueChange={v => setFormData({...formData, course: v, branch: '', year: '', batch: ''})}
                                    disabled={!formData.collegeId || !academicOptions}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Branch/Dept *</Label>
                                <Select 
                                    value={formData.branch} 
                                    onValueChange={v => setFormData({...formData, branch: v, year: '', batch: ''})}
                                    disabled={!formData.course}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Year *</Label>
                                <Select 
                                    value={formData.year} 
                                    onValueChange={v => setFormData({...formData, year: v, batch: ''})}
                                    disabled={!formData.branch}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Batch *</Label>
                                <Select 
                                    value={formData.batch} 
                                    onValueChange={v => setFormData({...formData, batch: v})}
                                    disabled={!formData.year}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 2: // Session Details (Trainer + Logistics)
            return (
                <div className="space-y-6 py-2">
                    {/* Trainer Selection Section */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Trainer Selection</Label>
                        <div className="grid grid-cols-2 gap-4">
                             
                            <div className="space-y-2">
                                <Label>Domain (Filter)</Label>
                                <Select 
                                    value={formData.domain} 
                                    onValueChange={v => setFormData({...formData, domain: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DOMAIN_OPTIONS.map(d => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Topic *</Label>
                                <Input 
                                    value={formData.topic} 
                                    onChange={e => setFormData({...formData, topic: e.target.value})}
                                    placeholder="Topic Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Select Trainer *</Label>
                            <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 space-y-2 bg-muted/20">
                                {filteredTrainers.map(t => (
                                    <div 
                                        key={t.id} 
                                        className={`p-2 rounded cursor-pointer flex justify-between items-center transition-colors ${formData.assignedTrainer?.id === t.id ? 'bg-primary/10 border-primary border' : 'hover:bg-accent bg-card'}`}
                                        onClick={() => setFormData({...formData, assignedTrainer: { id: t.id, name: t.name }})}
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{t.specialisation}</p>
                                        </div>
                                        {formData.assignedTrainer?.id === t.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                    </div>
                                ))}
                                {filteredTrainers.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No trainers match filters.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="border-t my-2" />

                    {/* Logistics Section */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Session Logistics</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input 
                                    type="date"
                                    value={formData.sessionDate}
                                    onChange={e => setFormData({...formData, sessionDate: e.target.value})}
                                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                    className="cursor-pointer block"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Session Time *</Label>
                                <Select 
                                    value={formData.sessionTime} 
                                    onValueChange={v => setFormData({...formData, sessionTime: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Morning">Morning</SelectItem>
                                        <SelectItem value="Afternoon">Afternoon</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duration (mins)</Label>
                                 <Input 
                                    type="number"
                                    value={formData.sessionDuration}
                                    onChange={e => setFormData({...formData, sessionDuration: e.target.value})}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Auto-Close (Hours)</Label>
                                 <Input 
                                    type="number"
                                    value={formData.ttl}
                                    onChange={e => setFormData({...formData, ttl: e.target.value})}
                                    placeholder="24"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        default: return null;
    }
  };

  const isStepValid = () => {
      switch(step) {
          case 1: return formData.collegeId && formData.academicYear && formData.course && formData.branch && formData.year && formData.batch;
          case 2: return formData.topic && formData.assignedTrainer && formData.sessionDate && formData.sessionTime;
          default: return false;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Feedback Sessions</h1>
          <p className="text-muted-foreground">Manage feedback sessions across all colleges</p>
        </div>
        <Dialog open={sessionDialogOpen} onOpenChange={(open) => {
            setSessionDialogOpen(open);
            if(!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Create Feedback Session (Step {step}/2)</DialogTitle>
              <DialogDescription>
                  {step === 1 && "Batch Selection Process"}
                  {step === 2 && "Session Details & Logistics"}
              </DialogDescription>
            </DialogHeader>
            
            {renderStep()}

            <DialogFooter className="mt-6">
                {step > 1 && (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                )}
                {step < 2 ? (
                    <Button 
                        onClick={() => setStep(step + 1)} 
                        disabled={!isStepValid()}
                        className="gradient-hero text-primary-foreground"
                    >
                        Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                     <Button 
                        onClick={handleCreateSession} 
                        disabled={!isStepValid() || loading}
                        className="gradient-hero text-primary-foreground"
                    >
                        {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />}
                        Create Session
                    </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session, index) => (
            <div
              key={session.id}
              className="glass-card rounded-xl p-6 animate-fade-up flex flex-col gap-3"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate" title={session.topic}>{session.topic}</h3>
                  <p className="text-xs text-muted-foreground truncate">{session.collegeName}</p>
                </div>
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {session.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground mt-2">
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{session.assignedTrainer?.name || 'Unknown'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    <span>{session.batch} ({session.branch})</span>
                 </div>
                 <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{session.sessionDate} • {session.sessionTime}</span>
                 </div>
              </div>
            </div>
        ))}

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
