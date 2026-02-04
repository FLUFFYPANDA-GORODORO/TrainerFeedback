import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, FileText, Pencil } from 'lucide-react';
import { toast } from 'sonner';

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

/* ================= HELPERS ================= */

const normalizeQuestion = (q, type) => {
  const base = {
    id: q.id,
    responseKey: q.responseKey,
    text: q.text,
    type,
    required: q.required ?? true
  };

  if (type === 'rating') {
    return { ...base, category: q.category || DEFAULT_CATEGORY, scale: 5 };
  }

  if (type === 'mcq') {
    return {
      ...base,
      options: q.options?.length >= 2 ? q.options : ['Option 1', 'Option 2']
    };
  }

  return base;
};

/* ================= COMPONENT ================= */

const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [templateMode, setTemplateMode] = useState('simple');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

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

  /* ================= CREATE / EDIT ================= */

  const openCreateModal = (mode) => {
    setTemplateMode(mode);
    setIsEditing(false);
    setEditingId(null);
    setCurrentSectionIndex(0);

    if (mode === 'simple') {
      setTemplate({ title: '', description: '', questions: [], sections: [] });
    } else {
      setTemplate({
        title: '',
        description: '',
        sections: [{ id: generateId(), title: 'Section 1', questions: [] }]
      });
    }

    setCreateOpen(true);
  };

  const handleEdit = (tpl) => {
    setIsEditing(true);
    setEditingId(tpl.id);
    setCurrentSectionIndex(0);

    if (tpl.sections?.length === 1 && tpl.sections[0].title === 'Questions') {
      setTemplateMode('simple');
      setTemplate({
        title: tpl.title,
        description: tpl.description,
        questions: tpl.sections[0].questions,
        sections: tpl.sections
      });
    } else {
      setTemplateMode('advanced');
      setTemplate({
        title: tpl.title,
        description: tpl.description,
        questions: [],
        sections: tpl.sections
      });
    }

    setCreateOpen(true);
  };

  /* ================= SIMPLE ================= */

  const addSimpleQuestion = () => {
    setTemplate(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        normalizeQuestion(
          {
            id: generateId(),
            responseKey: `q-${generateId()}`,
            text: '',
            required: true
          },
          'rating'
        )
      ]
    }));
  };

  const updateSimpleQuestion = (idx, q) => {
    const questions = [...template.questions];
    questions[idx] = q;
    setTemplate({ ...template, questions });
  };

  const removeSimpleQuestion = (idx) => {
    const questions = [...template.questions];
    questions.splice(idx, 1);
    setTemplate({ ...template, questions });
  };
  /* ================= ADVANCED ================= */
  const currentSection = template.sections[currentSectionIndex];
  const addSectionQuestion = () => {
    const sections = [...template.sections];
    sections[currentSectionIndex].questions.push(
      normalizeQuestion(
        {
          id: generateId(),
          responseKey: `q-${generateId()}`,
          text: '',
          required: true
        },
        'rating'
      )
    );
    setTemplate({ ...template, sections });
  };
  const updateSectionQuestion = (qIdx, q) => {
    const sections = [...template.sections];
    sections[currentSectionIndex].questions[qIdx] = q;
    setTemplate({ ...template, sections });
  };
  const addSection = () => {
    const sections = [
      ...template.sections,
      {
        id: generateId(),
        title: `Section ${template.sections.length + 1}`,
        questions: []
      }
    ];
    setTemplate({ ...template, sections });
    setCurrentSectionIndex(sections.length - 1);
  };
  /* ================= SAVE ================= */
  const saveTemplate = async () => {
    if (!template.title.trim()) {
      toast.error('Template title required');
      return;
    }
    const payload =
      templateMode === 'simple'
        ? {
            title: template.title,
            description: template.description,
            sections: [
              { id: generateId(), title: 'Questions', questions: template.questions }
            ]
          }
        : {
            title: template.title,
            description: template.description,
            sections: template.sections
          };
    try {
      isEditing
        ? await updateTemplate(editingId, payload)
        : await createTemplate(payload);

      toast.success(isEditing ? 'Template updated' : 'Template created');
      setCreateOpen(false);
      loadTemplates();
    } catch {
      toast.error('Failed to save template');
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
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
          <Button onClick={() => openCreateModal('advanced')}>
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h3 className="font-semibold mt-2">{t.title}</h3>
            <p className="text-sm text-muted-foreground">{t.description}</p>

            <Badge className="mt-2">
              {t.sections?.reduce((a, s) => a + s.questions.length, 0)} Questions
            </Badge>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {templateMode === 'simple'
                ? 'Single page feedback'
                : 'One section per page'}
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

            {/* SIMPLE MODE */}
            {templateMode === 'simple' && (
              <>
                {template.questions.map((q, idx) => (
                  <div key={q.id} className="border p-3 rounded space-y-3">
                    <Input
                      value={q.text}
                      onChange={e =>
                        updateSimpleQuestion(idx, { ...q, text: e.target.value })
                      }
                    />

                    <Select
                      value={q.type}
                      onValueChange={v =>
                        updateSimpleQuestion(idx, normalizeQuestion(q, v))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {q.type === 'rating' && (
                      <Select
                        value={q.category}
                        onValueChange={v =>
                          updateSimpleQuestion(idx, { ...q, category: v })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {QUESTION_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {q.type === 'mcq' && (
                      <>
                        {q.options.map((opt, oIdx) => (
                          <Input
                            key={oIdx}
                            value={opt}
                            onChange={e => {
                              const options = [...q.options];
                              options[oIdx] = e.target.value;
                              updateSimpleQuestion(idx, { ...q, options });
                            }}
                          />
                        ))}
                        <Button
                          variant="link"
                          onClick={() =>
                            updateSimpleQuestion(idx, {
                              ...q,
                              options: [...q.options, `Option ${q.options.length + 1}`]
                            })
                          }
                        >
                          + Add Option
                        </Button>
                      </>
                    )}

                    <div className="flex justify-between">
                      <Switch
                        checked={q.required}
                        onCheckedChange={v =>
                          updateSimpleQuestion(idx, { ...q, required: v })
                        }
                      />
                      <Trash2
                        className="cursor-pointer text-destructive"
                        onClick={() => removeSimpleQuestion(idx)}
                      />
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addSimpleQuestion}>
                  + Add Question
                </Button>
              </>
            )}

            {/* ADVANCED MODE – SECTION PAGED */}
            {templateMode === 'advanced' && currentSection && (
              <div className="border p-4 rounded space-y-4">
                <Input
                  value={currentSection.title}
                  onChange={e => {
                    const sections = [...template.sections];
                    sections[currentSectionIndex].title = e.target.value;
                    setTemplate({ ...template, sections });
                  }}
                />

                {currentSection.questions.map((q, qIdx) => (
                  <div key={q.id} className="border p-3 rounded space-y-3">
                    <Input
                      value={q.text}
                      onChange={e =>
                        updateSectionQuestion(qIdx, { ...q, text: e.target.value })
                      }
                    />

                    <Select
                      value={q.type}
                      onValueChange={v =>
                        updateSectionQuestion(qIdx, normalizeQuestion(q, v))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {q.type === 'rating' && (
                      <Select
                        value={q.category}
                        onValueChange={v =>
                          updateSectionQuestion(qIdx, { ...q, category: v })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {QUESTION_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {q.type === 'mcq' && (
                      <>
                        {q.options.map((opt, oIdx) => (
                          <Input
                            key={oIdx}
                            value={opt}
                            onChange={e => {
                              const options = [...q.options];
                              options[oIdx] = e.target.value;
                              updateSectionQuestion(qIdx, { ...q, options });
                            }}
                          />
                        ))}
                        <Button
                          variant="link"
                          onClick={() =>
                            updateSectionQuestion(qIdx, {
                              ...q,
                              options: [...q.options, `Option ${q.options.length + 1}`]
                            })
                          }
                        >
                          + Add Option
                        </Button>
                      </>
                    )}

                    <div className="flex justify-between">
                      <Switch
                        checked={q.required}
                        onCheckedChange={v =>
                          updateSectionQuestion(qIdx, { ...q, required: v })
                        }
                      />
                      <Trash2
                        className="cursor-pointer text-destructive"
                        onClick={() => {
                          const sections = [...template.sections];
                          sections[currentSectionIndex].questions.splice(qIdx, 1);
                          setTemplate({ ...template, sections });
                        }}
                      />
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addSectionQuestion}>
                  + Add Question
                </Button>

                <div className="flex justify-between pt-4">
                  <Button
                    disabled={currentSectionIndex === 0}
                    onClick={() => setCurrentSectionIndex(i => i - 1)}
                  >
                    Previous
                  </Button>

                  {currentSectionIndex < template.sections.length - 1 ? (
                    <Button onClick={() => setCurrentSectionIndex(i => i + 1)}>
                      Next
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={addSection}>
                      + Add Section
                    </Button>
                  )}
                </div>
              </div>
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
