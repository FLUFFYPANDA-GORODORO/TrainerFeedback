import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  MoreVertical, 
  FileText,
  Copy,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  getAllTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  seedDefaultTemplate 
} from '@/services/superadmin/templateService';

const QUESTION_TYPES = [
  { value: 'rating', label: 'Star Rating (1-5)' },
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'text', label: 'Long Answer' },
  { value: 'boolean', label: 'Yes/No' }
];

const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  
  // Builder State
  const [currentTemplate, setCurrentTemplate] = useState({
    title: '',
    description: '',
    sections: []
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Try to seed if empty
      await seedDefaultTemplate(); 
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setCurrentTemplate({
      title: 'New Feedback Template',
      description: '',
      sections: [
        {
          id: Date.now().toString(),
          title: 'Section 1',
          questions: []
        }
      ]
    });
    setBuilderOpen(true);
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setBuilderOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this template?')) {
        try {
            await deleteTemplate(id);
            toast.success('Template deleted');
            loadTemplates();
        } catch (err) {
            toast.error('Failed to delete template');
        }
    }
  };

  const handleSave = async () => {
    if (!currentTemplate.title.trim()) return toast.error('Template title is required');
    
    try {
        if (currentTemplate.id) {
            await updateTemplate(currentTemplate.id, currentTemplate);
            toast.success('Template updated');
        } else {
            await createTemplate(currentTemplate);
            toast.success('Template created');
        }
        setBuilderOpen(false);
        loadTemplates();
    } catch (err) {
        toast.error('Failed to save template');
    }
  };

  // Builder Logic
  const addSection = () => {
    setCurrentTemplate({
      ...currentTemplate,
      sections: [
        ...currentTemplate.sections,
        {
          id: Date.now().toString(),
          title: `Section ${currentTemplate.sections.length + 1}`,
          questions: []
        }
      ]
    });
  };

  const removeSection = (sectionIndex) => {
    const newSections = [...currentTemplate.sections];
    newSections.splice(sectionIndex, 1);
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const updateSection = (index, field, value) => {
    const newSections = [...currentTemplate.sections];
    newSections[index][field] = value;
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const addQuestion = (sectionIndex) => {
    const newSections = [...currentTemplate.sections];
    newSections[sectionIndex].questions.push({
      id: Date.now().toString(),
      text: '',
      type: 'rating',
      required: true,
      options: []
    });
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    const newSections = [...currentTemplate.sections];
    newSections[sectionIndex].questions.splice(questionIndex, 1);
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const updateQuestion = (sectionIndex, questionIndex, field, value) => {
    const newSections = [...currentTemplate.sections];
    newSections[sectionIndex].questions[questionIndex][field] = value;
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const updateQuestionOption = (sectionIndex, questionIndex, optionIndex, value) => {
    const newSections = [...currentTemplate.sections];
    const options = [...newSections[sectionIndex].questions[questionIndex].options];
    options[optionIndex] = value;
    newSections[sectionIndex].questions[questionIndex].options = options;
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };
  
  const addQuestionOption = (sectionIndex, questionIndex) => {
    const newSections = [...currentTemplate.sections];
    if (!newSections[sectionIndex].questions[questionIndex].options) {
        newSections[sectionIndex].questions[questionIndex].options = [];
    }
    newSections[sectionIndex].questions[questionIndex].options.push(`Option ${newSections[sectionIndex].questions[questionIndex].options.length + 1}`);
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const removeQuestionOption = (sectionIndex, questionIndex, optionIndex) => {
      const newSections = [...currentTemplate.sections];
      newSections[sectionIndex].questions[questionIndex].options.splice(optionIndex, 1);
      setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Feedback Templates</h1>
          <p className="text-muted-foreground">Manage and customize feedback forms</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
             <Plus className="h-4 w-4" />
             Create Template
        </Button>
      </div>

      {builderOpen ? (
        // Builder View
        <div className="space-y-6 animate-fade-in">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 w-full max-w-2xl">
                            <Label>Template Title</Label>
                            <Input 
                                value={currentTemplate.title} 
                                onChange={e => setCurrentTemplate({...currentTemplate, title: e.target.value})}
                                className="text-lg font-semibold"
                            />
                            <Label>Description</Label>
                            <Input 
                                value={currentTemplate.description} 
                                onChange={e => setCurrentTemplate({...currentTemplate, description: e.target.value})}
                                placeholder="Description"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setBuilderOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} className="gradient-hero text-primary-foreground">
                                <Save className="h-4 w-4 mr-2" /> Save Template
                            </Button>
                        </div>
                    </div>
                </CardHeader>
             </Card>

             {/* Sections Render */}
             {currentTemplate.sections.map((section, sIdx) => (
                 <Card key={section.id} className="border-l-4 border-l-primary/50">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <Input 
                                value={section.title} 
                                onChange={e => updateSection(sIdx, 'title', e.target.value)}
                                className="font-medium text-lg border-transparent hover:border-input focus:border-input max-w-md p-0 h-auto"
                            />
                            <Button variant="ghost" size="sm" onClick={() => removeSection(sIdx)} className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {section.questions.map((q, qIdx) => (
                            <div key={q.id} className="p-4 bg-muted/30 rounded-lg space-y-3 group border border-transparent hover:border-border">
                                <div className="flex gap-4 items-start">
                                    <div className="mt-2 text-muted-foreground">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <Input 
                                                    value={q.text} 
                                                    onChange={e => updateQuestion(sIdx, qIdx, 'text', e.target.value)}
                                                    placeholder="Question Text"
                                                />
                                            </div>
                                            <Select 
                                                value={q.type} 
                                                onValueChange={v => updateQuestion(sIdx, qIdx, 'type', v)}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {QUESTION_TYPES.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* MCQ Options */}
                                        {q.type === 'mcq' && (
                                            <div className="space-y-2 pl-4 border-l-2">
                                                {q.options?.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex gap-2 items-center">
                                                        <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                                                        <Input 
                                                            value={opt} 
                                                            onChange={e => updateQuestionOption(sIdx, qIdx, oIdx, e.target.value)}
                                                            className="h-8"
                                                        />
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeQuestionOption(sIdx, qIdx, oIdx)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => addQuestionOption(sIdx, qIdx)}>
                                                    + Add Option
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex justify-end items-center gap-4 pt-2">
                                            <div className="flex items-center gap-2">
                                                <Switch 
                                                    checked={q.required} 
                                                    onCheckedChange={c => updateQuestion(sIdx, qIdx, 'required', c)}
                                                    id={`req-${q.id}`}
                                                />
                                                <Label htmlFor={`req-${q.id}`} className="text-xs">Required</Label>
                                            </div>
                                            <div className="h-4 border-l mx-2" />
                                            <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => removeQuestion(sIdx, qIdx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                         <Button variant="outline" size="sm" onClick={() => addQuestion(sIdx)} className="w-full border-dashed">
                            <Plus className="h-4 w-4 mr-2" /> Add Question
                        </Button>
                    </CardContent>
                 </Card>
             ))}
             
            <Button variant="outline" onClick={addSection} className="w-full py-6 border-dashed text-muted-foreground">
                <Plus className="h-5 w-5 mr-2" /> Add New Section
            </Button>
        </div>
      ) : (
        // List View
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {templates.map(t => (
                 <Card key={t.id} className="group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleEdit(t)}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span className="truncate pr-2">{t.title}</span>
                            {t.isDefault && <Badge variant="secondary">Default</Badge>}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 min-h-[2.5em]">{t.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {t.sections?.length || 0} Sections • {t.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0} Questions
                        </p>
                    </CardContent>
                     <CardFooter className="justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(t); }}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => handleDelete(t.id, e)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                 </Card>
             ))}
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;
