import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { createSession, deleteSession, updateSession, closeSessionWithStats } from '@/services/superadmin/sessionService';
import { getAcademicConfig } from '@/services/superadmin/academicService';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import SessionAnalytics from './SessionAnalytics';
import { useSuperAdminData } from '@/contexts/SuperAdminDataContext';

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

const SessionsTab = ({ colleges, academicConfig: globalConfig, onRefresh }) => {
  // Get data from context (cached, real-time subscribed)
  const { sessions, trainers, templates, loadSessions } = useSuperAdminData();
  const [loading, setLoading] = useState(false);
  
  // Filters State
  const [filters, setFilters] = useState({
    collegeId: 'all',
    course: 'all',
    domain: 'all',
    topic: '',
    trainerId: 'all'
  });

  // Dialog & Wizard State
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null); // null = create mode, id = edit mode
  
  // Export Confirmation Dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [sessionToExport, setSessionToExport] = useState(null);
  
  // Inline Analytics View
  const [selectedSessionForAnalytics, setSelectedSessionForAnalytics] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    collegeId: '',
    collegeName: '',
    academicYear: '2025-26',
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
    questions: [], 
    templateId: '',
    ttl: '24'
  });

  // Dynamic Options based on selection
  const [academicOptions, setAcademicOptions] = useState(null); 
  const [filteredTrainers, setFilteredTrainers] = useState([]);

  // Removed useEffect - data comes from context with real-time subscription
  // useEffect for domain-based trainer filtering still needed
  useEffect(() => {
    let filtered = trainers;
    if (formData.domain) {
      filtered = filtered.filter(t => 
        t.domain?.toLowerCase().includes(formData.domain.toLowerCase()) ||
        t.specialisation?.toLowerCase().includes(formData.domain.toLowerCase())
      );
    }
    setFilteredTrainers(filtered);
  }, [formData.domain, trainers]);

  // loadInitialData removed - data comes from context

  // Filter Logic
  const filteredSessions = sessions.filter(session => {
    if (filters.collegeId !== 'all' && session.collegeId !== filters.collegeId) return false;
    if (filters.course !== 'all' && session.course !== filters.course) return false;
    if (filters.domain !== 'all' && session.domain !== filters.domain) return false;
    if (filters.trainerId !== 'all' && session.assignedTrainer?.id !== filters.trainerId) return false;
    if (filters.topic && !session.topic.toLowerCase().includes(filters.topic.toLowerCase())) return false;
    return true;
  });

  // Session Creation Logic
  const handleCollegeSelect = async (collegeId) => {
    const college = colleges.find(c => c.id === collegeId);
    setFormData(prev => ({ ...prev, collegeId, collegeName: college?.name || '' }));
    
    try {
        const config = await getAcademicConfig(collegeId);
        setAcademicOptions(config || {});
    } catch (err) {
        console.error(err);
        toast.error("Failed to load academic config for college");
    }
  };

  useEffect(() => {
    if (step === 2) {
      let filtered = trainers;
      if (formData.domain) {
        filtered = filtered.filter(t => 
          t.domain?.toLowerCase().includes(formData.domain.toLowerCase()) ||
          t.specialisation?.toLowerCase().includes(formData.domain.toLowerCase())
        );
      }
      setFilteredTrainers(filtered);
    }
  }, [formData.domain, step, trainers]);

  const handleCreateSession = async () => {
    setIsSubmitting(true);
    try {
      let sessionQuestions = [...(formData.questions || [])];
      if (formData.templateId) {
          const selectedTemplate = templates.find(t => t.id === formData.templateId);
          if (selectedTemplate && selectedTemplate.sections) {
              const templateQuestions = selectedTemplate.sections.flatMap(section => section.questions || []);
              sessionQuestions = [...sessionQuestions, ...templateQuestions];
          }
      }

      const sessionPayload = {
          ...formData,
          questions: sessionQuestions
      };

      if (editingSessionId) {
        // Update existing session
        await updateSession(editingSessionId, sessionPayload);
        toast.success('Session updated successfully');
      } else {
        // Create new session
        await createSession(sessionPayload);
        toast.success('Session created successfully');
      }
      setSessionDialogOpen(false);
      resetForm();
      onRefresh && onRefresh(); // Use the context refresh
    } catch (error) {
      toast.error(editingSessionId ? 'Failed to update session' : 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Row Actions
  const handleToggleStatus = async (session) => {
    try {
        if (session.status === 'active') {
            // Deactivating - compile stats and close
            toast.loading('Compiling feedback statistics...');
            await closeSessionWithStats(session.id);
            toast.dismiss();
            toast.success('Session closed and statistics compiled');
        } else {
            // Reactivating
        await updateSession(session.id, { status: 'active' });
            toast.success('Session activated');
        }
    } catch (error) {
        toast.dismiss();
        toast.error('Failed to update status');
    }
  };

  const handleDelete = async (sessionId) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
        await deleteSession(sessionId);
        toast.success('Session deleted');
    } catch (error) {
        toast.error('Failed to delete session');
    }
  };

  const handleExportResponses = (session) => {
    // Show confirmation dialog
    setSessionToExport(session);
    setExportDialogOpen(true);
  };

  const confirmExport = async () => {
    const session = sessionToExport;
    if (!session) return;
    
    try {
      const stats = session.compiledStats;
      if (!stats) {
        toast.error('No compiled stats available');
        return;
      }

      toast.loading('Generating Excel report...');

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Gryphon Academy';
      workbook.created = new Date();

      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Field', key: 'field', width: 25 },
        { header: 'Value', key: 'value', width: 40 }
      ];
      summarySheet.addRows([
        { field: 'Session Topic', value: session.topic },
        { field: 'College', value: session.collegeName },
        { field: 'Trainer', value: session.assignedTrainer?.name || 'N/A' },
        { field: 'Domain', value: session.domain },
        { field: 'Course', value: session.course },
        { field: 'Batch', value: session.batch },
        { field: 'Session Date', value: session.sessionDate },
        { field: 'Session Time', value: session.sessionTime },
        { field: '', value: '' },
        { field: 'Total Responses', value: stats.totalResponses },
        { field: 'Average Rating', value: stats.avgRating },
        { field: 'Top Rating', value: stats.topRating },
        { field: 'Least Rating', value: stats.leastRating }
      ]);
      // Style header
      summarySheet.getRow(1).font = { bold: true };
      summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Rating Distribution Sheet
      const ratingSheet = workbook.addWorksheet('Rating Distribution');
      ratingSheet.columns = [
        { header: 'Rating', key: 'rating', width: 15 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      const totalRatings = Object.values(stats.ratingDistribution || {}).reduce((a, b) => a + b, 0);
      Object.entries(stats.ratingDistribution || {}).forEach(([rating, count]) => {
        ratingSheet.addRow({
          rating: `${rating} Star`,
          count: count,
          percentage: totalRatings > 0 ? `${((count / totalRatings) * 100).toFixed(1)}%` : '0%'
        });
      });
      ratingSheet.getRow(1).font = { bold: true };
      ratingSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      ratingSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Comments Sheet
      const commentsSheet = workbook.addWorksheet('Comments');
      commentsSheet.columns = [
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Comment', key: 'comment', width: 60 },
        { header: 'Avg Rating', key: 'avgRating', width: 15 }
      ];
      (stats.topComments || []).forEach(c => {
        commentsSheet.addRow({ category: 'Top Rated', comment: c.text, avgRating: c.avgRating });
      });
      (stats.avgComments || []).forEach(c => {
        commentsSheet.addRow({ category: 'Average', comment: c.text, avgRating: c.avgRating });
      });
      (stats.leastRatedComments || []).forEach(c => {
        commentsSheet.addRow({ category: 'Least Rated', comment: c.text, avgRating: c.avgRating });
      });
      commentsSheet.getRow(1).font = { bold: true };
      commentsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      commentsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `feedback_${session.topic.replace(/[^a-z0-9]/gi, '_')}_${session.sessionDate}.xlsx`);

      toast.dismiss();
      toast.success('Excel report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error('Failed to export report');
    } finally {
      setExportDialogOpen(false);
      setSessionToExport(null);
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
        sessionDuration: '60',
        questions: [],
        templateId: '',
        ttl: '24' 
    });
    setAcademicOptions(null);
    setEditingSessionId(null);
  };

  // Render Wizard Steps
  const renderStep = () => {
    switch(step) {
        case 1: 
            const courses = academicOptions?.courses ? Object.keys(academicOptions.courses) : [];
            const currentCourseData = formData.course ? academicOptions?.courses[formData.course] : null;
            const departments = currentCourseData?.departments ? Object.keys(currentCourseData.departments) : [];
            const currentDeptData = formData.branch && currentCourseData?.departments ? currentCourseData.departments[formData.branch] : null;
            const years = currentDeptData?.years ? Object.keys(currentDeptData.years) : [];
            const currentYearData = formData.year && currentDeptData?.years ? currentDeptData.years[formData.year] : null;
            const batches = currentYearData?.batches || [];

            return (
                <div className="space-y-4 py-2">
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

        case 2: 
            return (
                <div className="space-y-6 py-2">
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
                                        {formData.assignedTrainer?.id === t.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </div>
                                ))}
                                {filteredTrainers.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No trainers match filters.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="border-t my-2" />

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

                    <div className="border-t my-2" />

                     {/* Template Selection */}
                     <div className="space-y-3">
                        <Label className="text-base font-semibold">Feedback Template</Label>
                        <div className="space-y-2">
                            <Label>Select Template</Label>
                            <Select 
                                value={formData.templateId} 
                                onValueChange={v => setFormData({...formData, templateId: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a feedback template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Selecting a template will automatically populate the feedback questions for this session.
                            </p>
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

  const uniqueCourses = [...new Set(sessions.map(s => s.course))].filter(Boolean);
  const uniqueDomains = [...new Set(sessions.map(s => s.domain))].filter(Boolean);

  // Show analytics inline when a session is selected
  if (selectedSessionForAnalytics) {
    return (
      <SessionAnalytics 
        session={selectedSessionForAnalytics} 
        onBack={() => setSelectedSessionForAnalytics(null)} 
      />
    );
  }

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
              <DialogTitle>{editingSessionId ? 'Edit' : 'Create'} Feedback Session {editingSessionId ? '' : `(Step ${step}/2)`}</DialogTitle>
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
                        disabled={!isStepValid() || isSubmitting}
                        className="gradient-hero text-primary-foreground"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {editingSessionId ? 'Save Changes' : 'Create Session'}
                    </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-muted/20 p-4 rounded-lg border">
        <Select value={filters.collegeId} onValueChange={v => setFilters({...filters, collegeId: v})}>
           <SelectTrigger><SelectValue placeholder="All Colleges" /></SelectTrigger>
           <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {colleges.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
           </SelectContent>
        </Select>

        <Select value={filters.course} onValueChange={v => setFilters({...filters, course: v})}>
           <SelectTrigger><SelectValue placeholder="All Courses" /></SelectTrigger>
           <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {uniqueCourses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
           </SelectContent>
        </Select>

        <Select value={filters.domain} onValueChange={v => setFilters({...filters, domain: v})}>
           <SelectTrigger><SelectValue placeholder="All Domains" /></SelectTrigger>
           <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {uniqueDomains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
           </SelectContent>
        </Select>

         <Select value={filters.trainerId} onValueChange={v => setFilters({...filters, trainerId: v})}>
           <SelectTrigger><SelectValue placeholder="All Trainers" /></SelectTrigger>
           <SelectContent>
              <SelectItem value="all">All Trainers</SelectItem>
              {trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
           </SelectContent>
        </Select>

        <Input 
            placeholder="Search Topic..." 
            value={filters.topic}
            onChange={e => setFilters({...filters, topic: e.target.value})}
        />
      </div>

      {/* Sessions Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic / Domain</TableHead>
              <TableHead>College / Batch</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                 <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                </TableRow>
            ) : filteredSessions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No sessions found matching filters.
                    </TableCell>
                </TableRow>
            ) : (
                filteredSessions.map((session) => (
                <TableRow key={session.id}>
                    <TableCell>
                        <div className="font-medium">{session.topic}</div>
                        <div className="text-xs text-muted-foreground">{session.domain}</div>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm">{session.collegeName}</div>
                        <div className="text-xs text-muted-foreground">{session.batch} ({session.branch})</div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                {session.assignedTrainer?.name?.[0] || '?'}
                             </div>
                             <span>{session.assignedTrainer?.name || 'Unassigned'}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm">{session.sessionDate}</div>
                        <div className="text-xs text-muted-foreground">{session.sessionTime} ({session.sessionDuration}m)</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {session.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(session.id)}>
                                    Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    const shareUrl = `${window.location.origin}/feedback/anonymous/${session.id}`;
                                    navigator.clipboard.writeText(shareUrl);
                                    toast.success('Feedback link copied to clipboard!');
                                }}>
                                    <Share2 className="mr-2 h-4 w-4" /> Share Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    setEditingSessionId(session.id);
                                    setFormData({
                                        ...session,
                                        sessionDuration: session.sessionDuration?.toString() || '60',
                                        ttl: session.ttl?.toString() || '24'
                                    });
                                    setStep(2); // Jump to details step for editing
                                    setSessionDialogOpen(true);
                                }}>
                                    <Pencil className="mr-2 h-4 w-4" /> Update
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(session)}>
                                    <Power className="mr-2 h-4 w-4" /> 
                                    {session.status === 'active' ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                {session.status === 'inactive' && session.compiledStats && (
                                    <>
                                        <DropdownMenuItem onClick={() => setSelectedSessionForAnalytics(session)}>
                                            <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExportResponses(session)}>
                                            <Download className="mr-2 h-4 w-4" /> Export to Excel
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(session.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Showing {filteredSessions.length} sessions
      </div>

      {/* Export Confirmation Dialog */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Feedback Report
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to export feedback data for:</p>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium text-foreground">{sessionToExport?.topic}</p>
                <p>{sessionToExport?.collegeName} • {sessionToExport?.sessionDate}</p>
              </div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">
                  This report contains <strong>{sessionToExport?.compiledStats?.totalResponses || 0}</strong> responses.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExport} className="gradient-hero text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionsTab;
