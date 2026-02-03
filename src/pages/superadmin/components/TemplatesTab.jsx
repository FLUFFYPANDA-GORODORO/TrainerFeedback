import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, FileText, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
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

import {
  QUESTION_CATEGORIES,
  DEFAULT_CATEGORY
} from '@/constants/questionCategories';

/* ================= CONSTANTS ================= */

const QUESTION_TYPES = [
  { value: 'rating', label: 'Star Rating (1–5)' },
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'text', label: 'Long Answer' }
];

const generateId = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;

/* ================= COMPONENT ================= */

const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState('simple'); // simple | advanced
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [template, setTemplate] = useState({
    title: '',
    description: '',
    questions: [],
    sections: []
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      await seedDefaultTemplate();
      setTemplates(await getAllTemplates());
    } catch {
      toast.error('Failed to load templates');
    }
  };

  /* ================= CREATE ================= */

  const openCreateModal = (mode) => {
    setTemplateMode(mode);
    setIsEditing(false);
    setEditingId(null);

    if (mode === 'simple') {
      setTemplate({
        title: '',
        description: '',
        questions: []
      });
    } else {
      setTemplate({
        title: '',
        description: '',
        sections: [
          {
            id: generateId(),
            title: 'Section 1',
            questions: []
          }
        ]
      });
    }

    setCreateOpen(true);
  };

  const handleEdit = (tpl) => {
    setTemplate(tpl);
    setTemplateMode(tpl.sections ? 'advanced' : 'simple');
    setIsEditing(true);
    setEditingId(tpl.id);
    setCreateOpen(true);
  };

  /* ================= SIMPLE QUESTIONS ================= */

  const addSimpleQuestion = () => {
    setTemplate(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: generateId(),
          text: '',
          type: 'rating',
          category: DEFAULT_CATEGORY,
          required: true,
          options: []
        }
      ]
    }));
  };

  const updateSimpleQuestion = (idx, data) => {
    const questions = [...template.questions];
    questions[idx] = { ...questions[idx], ...data };
    setTemplate({ ...template, questions });
  };

  const removeSimpleQuestion = (idx) => {
    const questions = [...template.questions];
    questions.splice(idx, 1);
    setTemplate({ ...template, questions });
  };

  /* ================= ADVANCED ================= */

  const addSection = () => {
    setTemplate(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: generateId(),
          title: `Section ${prev.sections.length + 1}`,
          questions: []
        }
      ]
    }));
  };

  const addAdvancedQuestion = (sIdx) => {
    const sections = [...template.sections];
    sections[sIdx].questions.push({
      id: generateId(),
      text: '',
      type: 'rating',
      category: DEFAULT_CATEGORY,
      required: true,
      options: []
    });
    setTemplate({ ...template, sections });
  };

  /* ================= SAVE ================= */

  const saveTemplate = async () => {
    if (!template.title.trim()) {
      toast.error('Template title required');
      return;
    }

    let payload;

    if (templateMode === 'simple') {
      if (template.questions.length === 0) {
        toast.error('Add at least one question');
        return;
      }

      payload = {
        title: template.title,
        description: template.description,
        questions: template.questions
      };
    } else {
      payload = {
        title: template.title,
        description: template.description,
        sections: template.sections
      };
    }

    try {
      if (isEditing) {
        await updateTemplate(editingId, payload);
        toast.success('Template updated');
      } else {
        await createTemplate(payload);
        toast.success('Template created');
      }

      setCreateOpen(false);
      setIsEditing(false);
      setEditingId(null);
      loadTemplates();
    } catch {
      toast.error('Failed to save template');
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this template?')) return;
    await deleteTemplate(id);
    toast.success('Template deleted');
    loadTemplates();
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Feedback Templates</h1>
          <p className="text-muted-foreground">Manage feedback forms</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCreateModal('simple')}>
            <Plus className="h-4 w-4 mr-2" /> Simple Template
          </Button>
          <Button className="gradient-hero" onClick={() => openCreateModal('advanced')}>
            <Plus className="h-4 w-4 mr-2" /> Advanced Template
          </Button>
        </div>
      </div>

      {/* LIST */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="glass-card p-5 rounded-xl group">
            <div className="flex justify-between">
              <FileText />
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive"
                  onClick={(e) => handleDelete(t.id, e)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h3 className="font-semibold mt-2">{t.title}</h3>
            <p className="text-sm text-muted-foreground">{t.description || 'No description'}</p>

            <div className="flex gap-2 text-xs mt-2">
              <span className="bg-primary/10 px-2 py-0.5 rounded">
                {t.questions?.length || t.sections?.reduce((a, s) => a + s.questions.length, 0)} Questions
              </span>
              {t.isDefault && <Badge>Default</Badge>}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {templateMode === 'simple'
                ? 'Single-section feedback'
                : 'Multi-section feedback'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <Label>Template Title *</Label>
            <Input
              value={template.title}
              onChange={e => setTemplate({ ...template, title: e.target.value })}
            />

            <Label>Description</Label>
            <Input
              value={template.description}
              onChange={e => setTemplate({ ...template, description: e.target.value })}
            />

            {templateMode === 'simple' && (
              <>
                {template.questions.map((q, idx) => (
                  <div key={q.id} className="border p-4 rounded space-y-2">
                    <Input
                      placeholder="Question text"
                      value={q.text}
                      onChange={e => updateSimpleQuestion(idx, { text: e.target.value })}
                    />

                    <Select
                      value={q.type}
                      onValueChange={(v) => {
                        const base = { type: v };
                        if (v === 'rating') base.category = DEFAULT_CATEGORY;
                        if (v === 'mcq') base.options = ['Option 1', 'Option 2'];
                        updateSimpleQuestion(idx, base);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {q.type === 'rating' && (
                      <Select
                        value={q.category}
                        onValueChange={v => updateSimpleQuestion(idx, { category: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {QUESTION_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {q.type === 'mcq' &&
                      q.options.map((opt, oIdx) => (
                        <Input
                          key={oIdx}
                          value={opt}
                          onChange={e => {
                            const options = [...q.options];
                            options[oIdx] = e.target.value;
                            updateSimpleQuestion(idx, { options });
                          }}
                        />
                      ))}

                    <div className="flex justify-between">
                      <Switch
                        checked={q.required}
                        onCheckedChange={v => updateSimpleQuestion(idx, { required: v })}
                      />
                      <Trash2 onClick={() => removeSimpleQuestion(idx)} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addSimpleQuestion}>+ Add Question</Button>
              </>
            )}

            {templateMode === 'advanced' && (
              <>
                {template.sections.map((s, sIdx) => (
                  <div key={s.id} className="border p-4 rounded">
                    <h3 className="font-medium">{s.title}</h3>
                    {s.questions.map(q => (
                      <div key={q.id} className="text-sm text-muted-foreground">
                        • {q.text || 'Untitled question'}
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => addAdvancedQuestion(sIdx)}>
                      + Add Question
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addSection}>+ Add Section</Button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button onClick={saveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Template' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesTab;
