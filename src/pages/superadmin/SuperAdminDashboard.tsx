import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  collegesApi,
  usersApi,
  feedbackSessionsApi,
  questionGroupsApi,
  questionsApi,
  College,
  User,
  FeedbackSession,
  QuestionGroup,
  Question,
  Timestamp,
} from '@/lib/storage';
import {
  Building2,
  UserPlus,
  LogOut,
  Plus,
  Trash2,
  Shield,
  GraduationCap,
  ExternalLink,
  BookOpen,
  Edit,
  ChevronRight,
  X,
  Eye,
  Share,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import SessionResponses from '../admin/SessionResponses';

export const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [colleges, setColleges] = useState<College[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>([]);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expanded/collapsed state for question groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const currentSection = location.pathname.split('/').pop() || 'dashboard';
  const getActiveTab = (section: string) => {
    switch (section) {
      case 'dashboard': return 'overview';
      case 'question-bank': return 'questionBank';
      default: return section;
    }
  };
  const activeTab = getActiveTab(currentSection);

  // College form state
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');

  // Admin form state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCollegeId, setAdminCollegeId] = useState('');

  // Question Group form state
  const [questionGroupDialogOpen, setQuestionGroupDialogOpen] = useState(false);
  const [questionGroupName, setQuestionGroupName] = useState('');
  const [questionGroupDescription, setQuestionGroupDescription] = useState('');
  const [questionGroupCollegeId, setQuestionGroupCollegeId] = useState('');

  // Clone Question Group state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneGroupId, setCloneGroupId] = useState('');
  const [cloneTargetCollegeId, setCloneTargetCollegeId] = useState('');

  // Edit Question Group state
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState('');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');

  // Question form state
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState('');
  const [questionResponseType, setQuestionResponseType] = useState<'rating' | 'text' | 'both' | 'select' | 'boolean'>('rating');
  const [questionRequired, setQuestionRequired] = useState(true);
  const [questionOptions, setQuestionOptions] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Sequence editing state
  const [sequenceDialogOpen, setSequenceDialogOpen] = useState(false);
  const [sequenceGroupId, setSequenceGroupId] = useState('');
  const [questionSequences, setQuestionSequences] = useState<{[key: string]: number}>({});

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareSession, setShareSession] = useState<FeedbackSession | null>(null);

  // Predefined question templates
  const questionTemplates = [
    {
      id: 'explain-topics',
      category: 'Teaching Quality',
      text: 'How well does the teacher explain complex topics?',
      responseType: 'rating' as const,
      required: true,
    },
    {
      id: 'class-engagement',
      category: 'Engagement',
      text: 'How engaged did you feel during the class sessions?',
      responseType: 'rating' as const,
      required: true,
    },
    {
      id: 'open-environment',
      category: 'Class Environment',
      text: 'Does the teacher create an open environment for students to share their opinions?',
      responseType: 'boolean' as const,
      required: true,
    },
    {
      id: 'visual-aids',
      category: 'Teaching Methods',
      text: 'How effectively does the teacher use visual aids (PPT, videos, charts, etc.) during the session?',
      responseType: 'rating' as const,
      required: true,
    },
    {
      id: 'real-world-application',
      category: 'Relevance',
      text: 'How well does the teacher relate the topics to real-world applications?',
      responseType: 'rating' as const,
      required: true,
    },
    {
      id: 'handle-queries',
      category: 'Interaction',
      text: 'How well did the teacher handle student queries?',
      responseType: 'rating' as const,
      required: true,
    },
    {
      id: 'project-learning',
      category: 'Learning Activities',
      text: 'How valuable do you find the project-based learning activities in terms of skill development and practical knowledge?',
      responseType: 'rating' as const,
      required: true,
    },
    {
      id: 'assignments-effective',
      category: 'Assessment',
      text: 'How effective were the assignments in helping you understand the subject better?',
      responseType: 'rating' as const,
      required: true,
    },
    {
      id: 'additional-feedback',
      category: 'General Feedback',
      text: 'Any additional feedback or comments you would like to share about the teacher?',
      responseType: 'text' as const,
      required: false,
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === '') {
      // Clear all fields for custom question
      setSelectedTemplate('');
      setQuestionCategory('');
      setQuestionText('');
      setQuestionResponseType('rating');
      setQuestionRequired(true);
      setQuestionOptions('');
    } else {
      const template = questionTemplates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(templateId);
        setQuestionCategory(template.category);
        setQuestionText(template.text);
        setQuestionResponseType(template.responseType);
        setQuestionRequired(template.required);
        setQuestionOptions('');
      }
    }
  };

  useEffect(() => {
    // Redirect non-superAdmin users
    if (user && user.role !== 'superAdmin') {
      navigate('/');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [collegeList, userList, sessionList, groupList, questionList] = await Promise.all([
        collegesApi.getAll(),
        usersApi.getAll(),
        feedbackSessionsApi.getAll(),
        questionGroupsApi.getAll(),
        questionsApi.getAll(),
      ]);

      // Update expired sessions to inactive
      const updatedSessions = await Promise.all(
        sessionList.map(async (session) => {
          if (session.isActive && session.expiresAt.toDate() < new Date()) {
            await feedbackSessionsApi.update(session.id, { isActive: false });
            return { ...session, isActive: false };
          }
          return session;
        })
      );

      // For demo: activate the specific session and set future expiration
      const demoSession = updatedSessions.find(s => s.uniqueUrl === 'ds-ml-ai-1styear-A-10-2026');
      if (demoSession && !demoSession.isActive) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10); // 10 days from now
        await feedbackSessionsApi.update(demoSession.id, { 
          isActive: true, 
          expiresAt: Timestamp.fromDate(futureDate)
        });
        demoSession.isActive = true;
        demoSession.expiresAt = Timestamp.fromDate(futureDate);
      }

      setColleges(collegeList);
      setAdmins(userList.filter(u => u.role === 'admin'));
      setFeedbackSessions(updatedSessions);
      setQuestionGroups(groupList);
      setQuestions(questionList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollege = async () => {
    if (!collegeName.trim() || !collegeCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await collegesApi.create({
        name: collegeName.trim(),
        code: collegeCode.trim().toUpperCase(),
        settings: {
          allowAnonymousFeedback: true,
          feedbackReminderDays: 7,
          defaultSessionDuration: 30,
        },
        isActive: true,
      });

      toast.success('College created successfully');
      setCollegeDialogOpen(false);
      setCollegeName('');
      setCollegeCode('');
      loadData();
    } catch (error) {
      toast.error('Failed to create college');
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim() || !adminCollegeId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await usersApi.create({
        name: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
        role: 'admin',
        collegeId: adminCollegeId,
        isActive: true,
      });

      toast.success('College Admin created successfully');
      setAdminDialogOpen(false);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setAdminCollegeId('');
      loadData();
    } catch (error) {
      toast.error('Failed to create admin');
    }
  };

  const handleCreateQuestionGroup = async () => {
    if (!questionGroupName.trim() || !questionGroupCollegeId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await questionGroupsApi.create({
        collegeId: questionGroupCollegeId,
        name: questionGroupName.trim(),
        description: questionGroupDescription.trim(),
        isActive: true,
      });

      toast.success('Question group created successfully');
      setQuestionGroupDialogOpen(false);
      setQuestionGroupName('');
      setQuestionGroupDescription('');
      setQuestionGroupCollegeId('');
      loadData();
    } catch (error) {
      toast.error('Failed to create question group');
    }
  };

  const handleCloneQuestionGroup = async () => {
    if (!cloneGroupId || !cloneTargetCollegeId) {
      toast.error('Please select a target college');
      return;
    }

    try {
      await questionGroupsApi.cloneToCollege(cloneGroupId, cloneTargetCollegeId);
      toast.success('Question group cloned successfully');
      setCloneDialogOpen(false);
      setCloneGroupId('');
      setCloneTargetCollegeId('');
      loadData();
    } catch (error) {
      console.error('Error cloning question group:', error);
      toast.error('Failed to clone question group');
    }
  };

  const handleEditQuestionGroup = async () => {
    if (!editingGroupId || !editGroupName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    try {
      await questionGroupsApi.update(editingGroupId, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim() || undefined,
      });
      toast.success('Question group updated successfully');
      setEditGroupDialogOpen(false);
      setEditingGroupId('');
      setEditGroupName('');
      setEditGroupDescription('');
      loadData();
    } catch (error) {
      console.error('Error updating question group:', error);
      toast.error('Failed to update question group');
    }
  };

  const openEditDialog = (group: QuestionGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || '');
    setEditGroupDialogOpen(true);
  };

  const handleDeleteQuestionGroup = async (groupId: string) => {
    try {
      // First delete all questions in the group
      const groupQuestions = questions.filter(q => q.groupId === groupId);
      await Promise.all(groupQuestions.map(q => questionsApi.delete(q.id)));
      
      // Then delete the group itself
      await questionGroupsApi.delete(groupId);
      
      toast.success('Question group deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting question group:', error);
      toast.error('Failed to delete question group');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await questionsApi.delete(questionId);
      toast.success('Question deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const openCloneDialog = (groupId: string) => {
    setCloneGroupId(groupId);
    setCloneTargetCollegeId('');
    setCloneDialogOpen(true);
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const openSequenceDialog = (groupId: string) => {
    const groupQuestions = questions
      .filter(q => q.groupId === groupId)
      .sort((a, b) => a.order - b.order);

    // Initialize sequence numbers based on current order
    const sequences: {[key: string]: number} = {};
    groupQuestions.forEach((question, index) => {
      sequences[question.id] = index + 1;
    });

    setSequenceGroupId(groupId);
    setQuestionSequences(sequences);
    setSequenceDialogOpen(true);
  };

  const handleSaveSequences = async () => {
    try {
      const updates = Object.entries(questionSequences).map(([questionId, newOrder]) => 
        questionsApi.update(questionId, { order: newOrder })
      );

      await Promise.all(updates);
      toast.success('Question sequences updated successfully');
      setSequenceDialogOpen(false);
      setQuestionSequences({});
      loadData();
    } catch (error) {
      console.error('Error updating sequences:', error);
      toast.error('Failed to update question sequences');
    }
  };

  const handleCreateQuestion = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    if (user.role !== 'superAdmin') {
      toast.error('Insufficient permissions');
      return;
    }

    if (!selectedGroupId || !questionText.trim() || !questionCategory.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (questionResponseType === 'select' && !questionOptions.trim()) {
      toast.error('Please provide options for select type questions');
      return;
    }

    try {
      const group = questionGroups.find(g => g.id === selectedGroupId);
      if (!group) {
        toast.error('Question group not found');
        return;
      }

      const questionData = {
        collegeId: group.collegeId,
        groupId: selectedGroupId,
        category: questionCategory.trim(),
        text: questionText.trim(),
        responseType: questionResponseType,
        required: questionRequired,
        order: questions.filter(q => q.groupId === selectedGroupId).length + 1,
        categoryOrder: questions.filter(q => q.category === questionCategory.trim() && q.groupId === selectedGroupId).length + 1,
        isActive: true,
        ...(questionResponseType === 'select' && questionOptions.trim() && {
          options: questionOptions.split(',').map(opt => opt.trim())
        }),
      };

      await questionsApi.create(questionData);

      toast.success('Question added successfully');
      setQuestionDialogOpen(false);
      setSelectedGroupId('');
      setQuestionText('');
      setQuestionCategory('');
      setQuestionResponseType('rating');
      setQuestionRequired(true);
      setQuestionOptions('');
      setSelectedTemplate('');
      loadData();
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error('Failed to create question');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.role !== 'superAdmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (sessionId) {
    return <SessionResponses />;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - Full height */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Sidebar Header with Title */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl font-semibold text-foreground">Super Admin</span> <br />
              <span className="text-sm text-muted-foreground">Platform Management</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            <div className="grid w-full grid-rows-5 h-auto gap-1">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'overview' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => navigate('/super-admin/dashboard')}
              >
                <Building2 className="h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'colleges' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'colleges' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => navigate('/super-admin/colleges')}
              >
                <GraduationCap className="h-4 w-4" />
                Colleges ({colleges.length})
              </Button>
              <Button
                variant={activeTab === 'admins' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'admins' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => navigate('/super-admin/admins')}
              >
                <UserPlus className="h-4 w-4" />
                Admins ({admins.length})
              </Button>
              <Button
                variant={activeTab === 'sessions' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'sessions' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => navigate('/super-admin/sessions')}
              >
                <Shield className="h-4 w-4" />
                Sessions ({feedbackSessions.length})
              </Button>
              <Button
                variant={activeTab === 'questionBank' ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-10 px-3 text-sm ${
                  activeTab === 'questionBank' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => navigate('/super-admin/question-bank')}
              >
                <BookOpen className="h-4 w-4" />
                Question Bank ({questionGroups.length})
              </Button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Top Header with Buttons */}
        <header className="border-b border-border bg-card p-4 flex justify-end gap-4">
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
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
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.length}</p>
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
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.filter(s => s.isActive).length}</p>
                      <p className="text-sm text-muted-foreground">Active Sessions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {colleges.slice(0, 3).map((college, index) => (
                    <div key={college.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">College created: {college.name}</p>
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
          )}

          {/* Colleges Tab */}
          {activeTab === 'colleges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Colleges</h1>
                  <p className="text-muted-foreground">Manage educational institutions</p>
                </div>
                <Dialog open={collegeDialogOpen} onOpenChange={setCollegeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      Add College
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New College</DialogTitle>
                      <DialogDescription>
                        Add a new college to the platform. You'll be able to create admin users for this college.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="collegeName">College Name</Label>
                        <Input
                          id="collegeName"
                          placeholder="e.g., Gryphon Institute of Technology"
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collegeCode">College Code</Label>
                        <Input
                          id="collegeCode"
                          placeholder="e.g., GIT"
                          value={collegeCode}
                          onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCollegeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCollege} className="gradient-hero text-primary-foreground hover:opacity-90">
                        Create College
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {colleges.map((college, index) => (
                  <div
                    key={college.id}
                    className="glass-card rounded-xl p-6 animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{college.name}</h3>
                        <p className="text-sm text-muted-foreground">Code: {college.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {admins.filter(a => a.collegeId === college.id).length} admin(s)
                      </span>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
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
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">College Administrators</h1>
                  <p className="text-muted-foreground">Manage admin users for each college</p>
                </div>
                <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
                      disabled={colleges.length === 0}
                    >
                      <Plus className="h-4 w-4" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create College Admin</DialogTitle>
                      <DialogDescription>
                        Create a new admin user for a college. They will have full control within their college scope.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Full Name</Label>
                        <Input
                          id="adminName"
                          placeholder="e.g., Dr. Sarah Mitchell"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email Address</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="e.g., dean@college.edu"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword">Password</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          placeholder="Secure password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminCollege">Assign to College</Label>
                        <select
                          id="adminCollege"
                          value={adminCollegeId}
                          onChange={(e) => setAdminCollegeId(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="">Select a college...</option>
                          {colleges.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAdmin} className="gradient-hero text-primary-foreground hover:opacity-90">
                        Create Admin
                      </Button>
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
                        <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-sm font-medium text-accent-foreground">
                            {admin.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{admin.name}</h3>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {college?.code || 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground">Admin</span>
                      </div>
                    </div>
                  );
                })}

                {admins.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No admin users yet</h3>
                    <p className="text-muted-foreground">Create a college first, then add admins</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Feedback Sessions</h1>
                  <p className="text-muted-foreground">Monitor and manage all feedback sessions across colleges</p>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.length}</p>
                      <p className="text-sm text-muted-foreground">Total Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.filter(s => s.isActive).length}</p>
                      <p className="text-sm text-muted-foreground">Active Sessions</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-100">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{feedbackSessions.filter(s => !s.isActive).length}</p>
                      <p className="text-sm text-muted-foreground">Inactive Sessions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Filters */}
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Sessions</TabsTrigger>
                  <TabsTrigger value="active">Active Sessions</TabsTrigger>
                  <TabsTrigger value="past">Past Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    {colleges.map((college) => {
                      const collegeSessions = feedbackSessions.filter(s => s.collegeId === college.id);
                      if (collegeSessions.length === 0) return null;

                      return (
                        <div key={college.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{college.name}</h3>
                              <p className="text-xs text-muted-foreground">Code: {college.code} • {collegeSessions.length} sessions</p>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {collegeSessions.map((session) => (
                              <div key={session.id} className="p-2 rounded-lg bg-secondary/50">
                                <div className="mb-2">
                                  <p className="font-medium text-xs text-foreground">{session.course} - {session.subject}</p>
                                  <p className="text-xs text-muted-foreground">{session.batch} • {session.academicYear}</p>
                                </div>
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">Session URL:</p>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-background px-2 py-1 rounded text-xs font-mono break-all flex-1">
                                      /feedback/anonymous/{session.uniqueUrl}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                                      className="h-6 w-6 p-0"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShareSession(session);
                                      setShareDialogOpen(true);
                                    }}
                                    className="flex-1 text-xs"
                                  >
                                    <Share className="h-3 w-3 mr-1" />
                                    Share
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/super-admin/sessions/${session.id}/responses`)}
                                    className="flex-1 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Responses
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`px-1 py-0.5 rounded-full text-xs ${
                                    session.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {session.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Expires: {session.expiresAt.toDate().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {feedbackSessions.length === 0 && (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No feedback sessions yet</h3>
                        <p className="text-muted-foreground">Sessions will appear here once colleges create them</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="active" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    {colleges.map((college) => {
                      const collegeSessions = feedbackSessions.filter(s => s.collegeId === college.id && s.isActive);
                      if (collegeSessions.length === 0) return null;

                      return (
                        <div key={college.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{college.name}</h3>
                              <p className="text-xs text-muted-foreground">Code: {college.code} • {collegeSessions.length} active sessions</p>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {collegeSessions.map((session) => (
                              <div key={session.id} className="p-2 rounded-lg bg-green-50 border border-green-200">
                                <div className="mb-2">
                                  <p className="font-medium text-xs text-foreground">{session.course} - {session.subject}</p>
                                  <p className="text-xs text-muted-foreground">{session.batch} • {session.academicYear}</p>
                                </div>
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">Session URL:</p>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-background px-2 py-1 rounded text-xs font-mono break-all flex-1">
                                      /feedback/anonymous/{session.uniqueUrl}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                                      className="h-6 w-6 p-0"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShareSession(session);
                                      setShareDialogOpen(true);
                                    }}
                                    className="flex-1 text-xs"
                                  >
                                    <Share className="h-3 w-3 mr-1" />
                                    Share
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/super-admin/sessions/${session.id}/responses`)}
                                    className="flex-1 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Responses
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="px-1 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                    Active
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Expires: {session.expiresAt.toDate().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {feedbackSessions.filter(s => s.isActive).length === 0 && (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No active sessions</h3>
                        <p className="text-muted-foreground">Active feedback sessions will appear here</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="past" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    {colleges.map((college) => {
                      const collegeSessions = feedbackSessions.filter(s => s.collegeId === college.id && !s.isActive);
                      if (collegeSessions.length === 0) return null;

                      return (
                        <div key={college.id} className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{college.name}</h3>
                              <p className="text-xs text-muted-foreground">Code: {college.code} • {collegeSessions.length} past sessions</p>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {collegeSessions.map((session) => (
                              <div key={session.id} className="p-2 rounded-lg bg-red-50 border border-red-200">
                                <div className="mb-2">
                                  <p className="font-medium text-xs text-foreground">{session.course} - {session.subject}</p>
                                  <p className="text-xs text-muted-foreground">{session.batch} • {session.academicYear}</p>
                                </div>
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">Session URL:</p>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-background px-2 py-1 rounded text-xs font-mono break-all flex-1">
                                      /feedback/anonymous/{session.uniqueUrl}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                                      className="h-6 w-6 p-0"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShareSession(session);
                                      setShareDialogOpen(true);
                                    }}
                                    className="flex-1 text-xs"
                                  >
                                    <Share className="h-3 w-3 mr-1" />
                                    Share
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/super-admin/sessions/${session.id}/responses`)}
                                    className="flex-1 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Responses
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="px-1 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                    Inactive
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Expired: {session.expiresAt.toDate().toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {feedbackSessions.filter(s => !s.isActive).length === 0 && (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No past sessions</h3>
                        <p className="text-muted-foreground">Past feedback sessions will appear here</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Question Bank Tab */}
          {activeTab === 'questionBank' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Question Bank</h1>
                  <p className="text-muted-foreground">Manage question groups and questions across all colleges</p>
                </div>
                <Button onClick={() => setQuestionGroupDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Question Group
                </Button>
              </div>

              {/* Question Bank Stats */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{questionGroups.length}</p>
                      <p className="text-sm text-muted-foreground">Question Groups</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-100">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{questions.length}</p>
                      <p className="text-sm text-muted-foreground">Total Questions</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{colleges.length}</p>
                      <p className="text-sm text-muted-foreground">Colleges</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Groups by College */}
              <div className="space-y-4">
                {colleges.map((college) => {
                  const collegeGroups = questionGroups.filter(g => g.collegeId === college.id);
                  const collegeQuestions = questions.filter(q => q.collegeId === college.id);
                  
                  if (collegeGroups.length === 0) return null;

                  return (
                    <div key={college.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{college.name}</h3>
                          <p className="text-xs text-muted-foreground">Code: {college.code} • {collegeGroups.length} groups • {collegeQuestions.length} questions</p>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                        {collegeGroups.map((group) => {
                          const groupQuestions = questions
                            .filter(q => q.groupId === group.id)
                            .sort((a, b) => a.order - b.order);
                          
                          // Group questions by category for display (matching student feedback form)
                          const groupedQuestions = groupQuestions.reduce((acc, q) => {
                            if (!acc[q.category]) {
                              acc[q.category] = [];
                            }
                            acc[q.category].push(q);
                            return acc;
                          }, {} as Record<string, Question[]>);
                          
                          const categories = Object.keys(groupedQuestions);
                          const isExpanded = expandedGroups.has(group.id);
                          
                          return (
                            <div key={group.id} className="p-6 rounded-lg bg-secondary/50 border">
                              <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleGroupExpansion(group.id)}
                                  >
                                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  </Button>
                                  <div>
                                    <p className="font-medium text-sm text-foreground">{group.name}</p>
                                    <p className="text-xs text-muted-foreground">{groupQuestions.length} questions</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {isExpanded && groupQuestions.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => openSequenceDialog(group.id)}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit Sequence
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => openEditDialog(group)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => openCloneDialog(group.id)}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Clone
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Question Group</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{group.name}"? This will permanently delete the group and all {groupQuestions.length} questions in it. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteQuestionGroup(group.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete Group
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setSelectedGroupId(group.id);
                                      setQuestionDialogOpen(true);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                              
                              {group.description && (
                                <p className="text-xs text-muted-foreground mb-3">{group.description}</p>
                              )}

                              {/* Questions List - Only show if expanded */}
                              {isExpanded && (
                                <div className="space-y-3">
                                  {categories.map((category) => (
                                    <div key={category} className="space-y-2">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {category}
                                      </p>
                                      <div className="space-y-1">
                                        {groupedQuestions[category].map((question, index) => {
                                          const globalIndex = categories.slice(0, categories.indexOf(category)).reduce((acc, cat) => acc + groupedQuestions[cat].length, 0) + index + 1;
                                          
                                          return (
                                            <div key={question.id} className="flex items-start gap-3 p-2 rounded bg-background/50 border group">
                                              <span className="text-xs font-medium text-muted-foreground min-w-[20px]">
                                                {globalIndex}.
                                              </span>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                    {question.responseType}
                                                  </span>
                                                  {question.required && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                                      Required
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-xs font-medium text-foreground pr-6">
                                                  {question.text}
                                                </p>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteQuestion(question.id)}
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {groupQuestions.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                      No questions yet
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {questionGroups.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No question groups yet</h3>
                    <p className="text-muted-foreground">Question groups will appear here once created</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question Group Create Dialog */}
          <Dialog open={questionGroupDialogOpen} onOpenChange={setQuestionGroupDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Question Group</DialogTitle>
                <DialogDescription>
                  Create a new question group for a college. Questions can be added to groups later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="questionGroupName">Group Name</Label>
                  <Input
                    id="questionGroupName"
                    placeholder="e.g., Teaching Quality Assessment"
                    value={questionGroupName}
                    onChange={(e) => setQuestionGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionGroupDescription">Description (Optional)</Label>
                  <Textarea
                    id="questionGroupDescription"
                    placeholder="Brief description of this question group..."
                    value={questionGroupDescription}
                    onChange={(e) => setQuestionGroupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionGroupCollege">Assign to College</Label>
                  <select
                    id="questionGroupCollege"
                    value={questionGroupCollegeId}
                    onChange={(e) => setQuestionGroupCollegeId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select a college...</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuestionGroupDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuestionGroup} className="gradient-hero text-primary-foreground hover:opacity-90">
                  Create Question Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Question Create Dialog */}
          <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Question</DialogTitle>
                <DialogDescription>
                  Add a new question to the selected question group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="questionTemplate">Question Template (Optional)</Label>
                  <select
                    id="questionTemplate"
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select a template or create custom...</option>
                    {questionTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.category}: {template.text.substring(0, 60)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionCategory">Category</Label>
                  <Input
                    id="questionCategory"
                    placeholder="e.g., Teaching Quality, Course Content"
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionText">Question Text</Label>
                  <Textarea
                    id="questionText"
                    placeholder="Enter your question..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionResponseType">Response Type</Label>
                    <select
                      id="questionResponseType"
                      value={questionResponseType}
                      onChange={(e) => setQuestionResponseType(e.target.value as 'rating' | 'text' | 'both' | 'select' | 'boolean')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="rating">Rating (1-5)</option>
                      <option value="text">Text Response</option>
                      <option value="both">Rating + Text</option>
                      <option value="select">Multiple Choice</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                  </div>
                  <div className="space-y-2 flex items-center">
                    <input
                      type="checkbox"
                      id="questionRequired"
                      checked={questionRequired}
                      onChange={(e) => setQuestionRequired(e.target.checked)}
                      className="mr-2"
                    />
                    <Label htmlFor="questionRequired">Required Question</Label>
                  </div>
                </div>
                {questionResponseType === 'select' && (
                  <div className="space-y-2">
                    <Label htmlFor="questionOptions">Options (comma-separated)</Label>
                    <Input
                      id="questionOptions"
                      placeholder="Option 1, Option 2, Option 3"
                      value={questionOptions}
                      onChange={(e) => setQuestionOptions(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setQuestionDialogOpen(false);
                  setSelectedTemplate('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuestion} className="gradient-hero text-primary-foreground hover:opacity-90">
                  Add Question
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Sequence Editing Dialog */}
          <Dialog open={sequenceDialogOpen} onOpenChange={setSequenceDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Question Sequence</DialogTitle>
                <DialogDescription>
                  Set sequence numbers for questions (1, 2, 3, etc.). Questions will be ordered by these numbers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                {sequenceGroupId && (() => {
                  const groupQuestions = questions
                    .filter(q => q.groupId === sequenceGroupId)
                    .sort((a, b) => a.order - b.order);

                  // Group questions by category for display
                  const groupedQuestions = groupQuestions.reduce((acc, q) => {
                    if (!acc[q.category]) {
                      acc[q.category] = [];
                    }
                    acc[q.category].push(q);
                    return acc;
                  }, {} as Record<string, Question[]>);

                  const categories = Object.keys(groupedQuestions);

                  return categories.map((category) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-sm text-foreground uppercase tracking-wide">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {groupedQuestions[category].map((question) => (
                          <div key={question.id} className="flex items-center gap-3 p-3 rounded bg-secondary/50">
                            <div className="w-16">
                              <Input
                                type="number"
                                min="1"
                                value={questionSequences[question.id] || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  setQuestionSequences(prev => ({
                                    ...prev,
                                    [question.id]: value
                                  }));
                                }}
                                className="h-8 text-center"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {question.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  {question.responseType}
                                </span>
                                {question.required && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSequenceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSequences} className="gradient-hero text-primary-foreground hover:opacity-90">
                  Save Sequences
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Clone Question Group Dialog */}
          <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clone Question Group</DialogTitle>
                <DialogDescription>
                  Select a college to clone this question group and all its questions to.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cloneTargetCollege">Target College</Label>
                  <select
                    id="cloneTargetCollege"
                    value={cloneTargetCollegeId}
                    onChange={(e) => setCloneTargetCollegeId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="">Select a college...</option>
                    {colleges
                      .filter(college => college.id !== (questionGroups.find(g => g.id === cloneGroupId)?.collegeId))
                      .map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name} ({college.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCloneQuestionGroup}
                  className="gradient-hero text-primary-foreground hover:opacity-90"
                  disabled={!cloneTargetCollegeId}
                >
                  Clone Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Question Group Dialog */}
          <Dialog open={editGroupDialogOpen} onOpenChange={setEditGroupDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Question Group</DialogTitle>
                <DialogDescription>
                  Update the name and description of this question group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editGroupName">Name *</Label>
                  <Input
                    id="editGroupName"
                    placeholder="Enter group name"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editGroupDescription">Description</Label>
                  <Textarea
                    id="editGroupDescription"
                    placeholder="Enter group description (optional)"
                    value={editGroupDescription}
                    onChange={(e) => setEditGroupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditGroupDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEditQuestionGroup}
                  className="gradient-hero text-primary-foreground hover:opacity-90"
                  disabled={!editGroupName.trim()}
                >
                  Update Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share className="h-5 w-5" />
                Share Feedback Session
              </DialogTitle>
              <DialogDescription>
                Share this feedback session with students using QR code, direct link, or WhatsApp.
              </DialogDescription>
            </DialogHeader>
            {shareSession && (
              <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh] pr-2">
                {/* Session Info */}
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <p className="font-medium text-sm text-foreground">
                    {shareSession.course} - {shareSession.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shareSession.batch} • {shareSession.academicYear}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center space-y-3">
                  <p className="text-sm font-medium text-foreground">QR Code</p>
                  <div className="p-3 bg-white rounded-lg border">
                    <QRCode
                      value={`${window.location.origin}/feedback/anonymous/${shareSession.uniqueUrl}`}
                      size={150}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan this QR code to access the feedback form
                  </p>
                </div>

                {/* Copy Link Button */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Direct Link</p>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/feedback/anonymous/${shareSession.uniqueUrl}`}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/feedback/anonymous/${shareSession.uniqueUrl}`);
                        toast.success('Link copied to clipboard!');
                      }}
                      className="px-3"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* WhatsApp Share */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Share via WhatsApp</p>
                  <Button
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      const message = `📝 *Faculty Feedback Session*\n\n📚 Course: ${shareSession.course}\n📖 Subject: ${shareSession.subject}\n👥 Batch: ${shareSession.batch}\n📅 Year: ${shareSession.academicYear}\n\n🔗 Link: ${window.location.origin}/feedback/anonymous/${shareSession.uniqueUrl}\n\nPlease provide your valuable feedback!`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Share on WhatsApp
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
