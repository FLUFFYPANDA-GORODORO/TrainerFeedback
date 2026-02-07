import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  MoreVertical,
  FileText,
  Copy,
  GripVertical,
  Upload  // Import JSON button icon
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
import { QUESTION_CATEGORIES, DEFAULT_CATEGORY } from '@/constants/questionCategories';

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

  // =====================================
  // IMPORT JSON FEATURE - State & Ref
  // =====================================
  // Reference to the hidden file input element for JSON import
  const fileInputRef = useRef(null);
  // Controls visibility of the import dialog with format instructions
  const [importDialogOpen, setImportDialogOpen] = useState(false);

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

  // =====================================
  // IMPORT JSON FEATURE - Handler Function
  // =====================================
  /**
   * Handles the JSON file import process
   * 
   * Expected JSON format:
   * {
   *   "title": "Template Name",
   *   "description": "Optional description",
   *   "sections": [
   *     {
   *       "title": "Section Name",
   *       "questions": [
   *         {
   *           "text": "Question text",
   *           "type": "rating" | "mcq" | "text" | "boolean",
   *           "category": "content" | "delivery" | "engagement" | "overall",
   *           "required": true,
   *           "options": ["Option 1", "Option 2"] // Only for MCQ type
   *         }
   *       ]
   *     }
   *   ]
   * }
   */
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type - only accept JSON files
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please select a valid JSON file');
      event.target.value = ''; // Reset file input
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // Parse the JSON content from the uploaded file
        const importedData = JSON.parse(e.target.result);

        // Validate and transform the imported data structure
        const newTemplate = {
          // Use imported title or generate a default one with timestamp
          title: importedData.title || `Imported Template - ${new Date().toLocaleDateString()}`,
          description: importedData.description || '',
          sections: []
        };

        // Process sections from the imported data
        if (importedData.sections && Array.isArray(importedData.sections)) {
          newTemplate.sections = importedData.sections.map((section, sIdx) => ({
            // Generate unique ID for each section
            id: Date.now().toString() + sIdx,
            title: section.title || `Section ${sIdx + 1}`,
            // Process questions within each section
            questions: (section.questions || []).map((q, qIdx) => ({
              // Generate unique ID for each question
              id: Date.now().toString() + sIdx + qIdx,
              text: q.text || '',
              // Default to 'rating' if type is invalid or not provided
              type: ['rating', 'mcq', 'text', 'boolean'].includes(q.type) ? q.type : 'rating',
              // Set category for rating questions, use default for others
              category: q.category || DEFAULT_CATEGORY,
              // Default to required unless explicitly set to false
              required: q.required !== false,
              // Include options for MCQ type questions
              options: Array.isArray(q.options) ? q.options : []
            }))
          }));
        } else if (importedData.questions && Array.isArray(importedData.questions)) {
          // Handle flat question array format (without sections)
          // Creates a single section containing all imported questions
          newTemplate.sections = [{
            id: Date.now().toString(),
            title: 'Imported Questions',
            questions: importedData.questions.map((q, qIdx) => ({
              id: Date.now().toString() + qIdx,
              text: q.text || '',
              type: ['rating', 'mcq', 'text', 'boolean'].includes(q.type) ? q.type : 'rating',
              category: q.category || DEFAULT_CATEGORY,
              required: q.required !== false,
              options: Array.isArray(q.options) ? q.options : []
            }))
          }];
        } else {
          // No valid sections or questions found in the file
          toast.error('Invalid JSON format. Please check the expected format.');
          event.target.value = '';
          return;
        }

        // Set the imported template as current and open the builder
        setCurrentTemplate(newTemplate);
        setBuilderOpen(true);
        setImportDialogOpen(false);
        toast.success(`Imported ${newTemplate.sections.length} section(s) successfully!`);

      } catch (error) {
        console.error('JSON Parse Error:', error);
        toast.error('Failed to parse JSON file. Please ensure it is valid JSON.');
      }

      // Reset file input to allow re-importing the same file
      event.target.value = '';
    };

    reader.onerror = () => {
      toast.error('Failed to read the file');
      event.target.value = '';
    };

    // Start reading the file as text
    reader.readAsText(file);
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
      category: DEFAULT_CATEGORY,
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
        {/* =====================================
            IMPORT JSON FEATURE - Button Group
            Added Import JSON button beside Create Template
        ===================================== */}
        <div className="flex gap-2">
          {/* Import JSON Dialog with format instructions */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Questions from JSON</DialogTitle>
                <DialogDescription>
                  Upload a JSON file with your questions. The file should follow the format below.
                </DialogDescription>
              </DialogHeader>

              {/* JSON Format Example - Helps users understand expected structure */}
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Expected JSON Format:</p>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {`{
  "title": "Template Name",
  "description": "Optional description",
  "sections": [
    {
      "title": "Section Name",
      "questions": [
        {
          "text": "Question text here",
          "type": "rating",
          "category": "content",
          "required": true
        },
        {
          "text": "Multiple choice question",
          "type": "mcq",
          "required": true,
          "options": ["Option 1", "Option 2", "Option 3"]
        }
      ]
    }
  ]
}`}
                  </pre>
                </div>

                {/* Supported Question Types - Reference for users */}
                <div className="text-sm space-y-2">
                  <p className="font-medium">Supported Question Types:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><code className="bg-muted px-1 rounded">rating</code> - Star Rating (1-5)</li>
                    <li><code className="bg-muted px-1 rounded">mcq</code> - Multiple Choice (requires "options" array)</li>
                    <li><code className="bg-muted px-1 rounded">text</code> - Long Answer</li>
                    <li><code className="bg-muted px-1 rounded">boolean</code> - Yes/No</li>
                  </ul>
                </div>

                {/* Category Types - For rating questions */}
                <div className="text-sm space-y-2">
                  <p className="font-medium">Categories (for rating type):</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><code className="bg-muted px-1 rounded">content</code></li>
                    <li><code className="bg-muted px-1 rounded">delivery</code></li>
                    <li><code className="bg-muted px-1 rounded">engagement</code></li>
                    <li><code className="bg-muted px-1 rounded">overall</code></li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {/* Hidden file input triggered by the Select File button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJSON}
                  accept=".json,application/json"
                  className="hidden"
                />
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} className="gradient-hero text-primary-foreground">
                  <Upload className="h-4 w-4 mr-2" />
                  Select JSON File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Original Create Template button */}
          <Button onClick={handleCreateNew} className="gap-2 gradient-hero text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
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
                    onChange={e => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
                    className="text-lg font-semibold"
                  />
                  <Label>Description</Label>
                  <Input
                    value={currentTemplate.description}
                    onChange={e => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
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
                          {q.type === 'rating' && (
                            <Select
                              value={q.category || DEFAULT_CATEGORY}
                              onValueChange={v => updateQuestion(sIdx, qIdx, 'category', v)}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                {QUESTION_CATEGORIES.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
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
