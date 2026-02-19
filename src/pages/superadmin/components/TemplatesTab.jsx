import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  MoreVertical,
  FileText,
  Copy,
  GripVertical,
  Upload,
  ArrowLeft,
  Eye,
  Star,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  seedDefaultTemplate,
} from "@/services/superadmin/templateService";
import { useSuperAdminData } from "@/contexts/SuperAdminDataContext";
import {
  QUESTION_CATEGORIES,
  DEFAULT_CATEGORY,
} from "@/constants/questionCategories";

const QUESTION_TYPES = [
  { value: "rating", label: "Star Rating (1-5)" },
  { value: "mcq", label: "Multiple Choice" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "text", label: "Long Answer" },
  { value: "futureSession", label: "Future Expectations" },
  { value: "yesno", label: "Yes/No" },
  { value: "topicslearned", label: "Topics Learned" },
];

const TemplatesTab = () => {
  const { templates, loadTemplates, loading: contextLoading } = useSuperAdminData();
  const loading = contextLoading.templates;
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
    title: "",
    description: "",
    sections: [],
  });

  // Preview State
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewResponses, setPreviewResponses] = useState({});

  // Create Template Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplateInfo, setNewTemplateInfo] = useState({
    title: "",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const init = async () => {
        // If empty, try seeding then load
        // But loadTemplates from context is cached.
        // If we want to guarantee seeding, we should check length after load.
        await loadTemplates();
        // Determine if we need to seed inside the effect is tricky if loadTemplates is async state update.
        // Actually, the context handles the data. 
        // Let's just trust loadTemplates to return data. 
        // If we really want to seed defaults if empty, we can check result.
        // const data = await loadTemplates();
        // if (data.length === 0) { await seedDefaultTemplate(); await loadTemplates(true); }
        // For now, let's stick to standard loading.
    };
    init();
  }, [loadTemplates]);



  const handleCreateNew = () => {
    setNewTemplateInfo({ title: "", description: "" });
    setCreateDialogOpen(true);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateInfo.title.trim()) {
      toast.error("Template title is required");
      return;
    }

    try {
      const templateToCreate = {
        title: newTemplateInfo.title,
        description: newTemplateInfo.description,
        sections: [
          {
            id: Date.now().toString(),
            title: newTemplateInfo.title,
            questions: [],
          },
        ],
      };
      await createTemplate(templateToCreate);
      toast.success("Template created! Click to edit and add questions.");
      setCreateDialogOpen(false);
      setCreateDialogOpen(false);
      loadTemplates(true); // Force refresh context
    } catch (err) {
      toast.error("Failed to create template");
    }
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
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("Please select a valid JSON file");
      event.target.value = ""; // Reset file input
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
          title:
            importedData.title ||
            `Imported Template - ${new Date().toLocaleDateString()}`,
          description: importedData.description || "",
          sections: [],
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
              text: q.text || "",
              // Default to 'rating' if type is invalid or not provided
              type: ["rating", "mcq", "multiselect", "futureSession", "text", "boolean", "topicslearned"].includes(q.type)
                ? q.type
                : "rating",
              // Set category for rating questions, use default for others
              category: q.category || DEFAULT_CATEGORY,
              // Default to required unless explicitly set to false
              required: q.required !== false,
              // Include options for MCQ type questions
              options: Array.isArray(q.options) ? q.options : [],
            })),
          }));
        } else if (
          importedData.questions &&
          Array.isArray(importedData.questions)
        ) {
          // Handle flat question array format (without sections)
          // Creates a single section containing all imported questions
          newTemplate.sections = [
            {
              id: Date.now().toString(),
              title: "Imported Questions",
              questions: importedData.questions.map((q, qIdx) => ({
                id: Date.now().toString() + qIdx,
                text: q.text || "",
                type: ["rating", "mcq", "multiselect", "text", "boolean", "topicslearned"].includes(q.type)
                  ? q.type
                  : "rating",
                category: q.category || DEFAULT_CATEGORY,
                required: q.required !== false,
                options: Array.isArray(q.options) ? q.options : [],
              })),
            },
          ];
        } else {
          // No valid sections or questions found in the file
          toast.error("Invalid JSON format. Please check the expected format.");
          event.target.value = "";
          return;
        }

        // Set the imported template as current and open the builder
        setCurrentTemplate(newTemplate);
        setBuilderOpen(true);
        setImportDialogOpen(false);
        toast.success(
          `Imported ${newTemplate.sections.length} section(s) successfully!`,
        );
      } catch (error) {
        console.error("JSON Parse Error:", error);
        toast.error(
          "Failed to parse JSON file. Please ensure it is valid JSON.",
        );
      }

      // Reset file input to allow re-importing the same file
      event.target.value = "";
    };

    reader.onerror = () => {
      toast.error("Failed to read the file");
      event.target.value = "";
    };

    // Start reading the file as text
    reader.readAsText(file);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(id);
        toast.success("Template deleted");
        loadTemplates(true); // Force refresh context
      } catch (err) {
        toast.error("Failed to delete template");
      }
    }
  };

  const handleSave = async () => {
    if (!currentTemplate.title.trim())
      return toast.error("Template title is required");

    // Auto-set section titles to template title
    const templateToSave = {
      ...currentTemplate,
      sections: currentTemplate.sections.map((section, idx) => ({
        ...section,
        title: currentTemplate.title, // Use template title as section title
      })),
    };

    try {
      if (currentTemplate.id) {
        await updateTemplate(currentTemplate.id, templateToSave);
        toast.success("Template updated");
      } else {
        await createTemplate(templateToSave);
        toast.success("Template created");
      }
      setBuilderOpen(false);
      loadTemplates(true); // Force refresh context
    } catch (err) {
      toast.error("Failed to save template");
    }
  };

  // Builder Logic
  const addSection = () => {
    const newSectionId = Date.now().toString();
    setCurrentTemplate({
      ...currentTemplate,
      sections: [
        ...currentTemplate.sections,
        {
          id: newSectionId,
          title: `Section ${currentTemplate.sections.length + 1}`,
          questions: [],
        },
      ],
    });
    // Scroll to new section after DOM update
    setTimeout(() => {
      const newSection = document.getElementById(`section-${newSectionId}`);
      if (newSection) {
        newSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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
      text: "",
      type: "rating",
      category: DEFAULT_CATEGORY,
      required: true,
      options: [],
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

  const updateQuestionOption = (
    sectionIndex,
    questionIndex,
    optionIndex,
    value,
  ) => {
    const newSections = [...currentTemplate.sections];
    const options = [
      ...newSections[sectionIndex].questions[questionIndex].options,
    ];
    options[optionIndex] = value;
    newSections[sectionIndex].questions[questionIndex].options = options;
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const addQuestionOption = (sectionIndex, questionIndex) => {
    const newSections = [...currentTemplate.sections];
    if (!newSections[sectionIndex].questions[questionIndex].options) {
      newSections[sectionIndex].questions[questionIndex].options = [];
    }
    newSections[sectionIndex].questions[questionIndex].options.push(
      `Option ${newSections[sectionIndex].questions[questionIndex].options.length + 1}`,
    );
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  const removeQuestionOption = (sectionIndex, questionIndex, optionIndex) => {
    const newSections = [...currentTemplate.sections];
    newSections[sectionIndex].questions[questionIndex].options.splice(
      optionIndex,
      1,
    );
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
  };

  // Drag-and-drop state for question reordering
  const [dragState, setDragState] = useState({ sIdx: null, qIdx: null });
  const [dragOverState, setDragOverState] = useState({ sIdx: null, qIdx: null });

  const handleDragStart = (sIdx, qIdx) => {
    setDragState({ sIdx, qIdx });
  };

  const handleDragOver = (e, sIdx, qIdx) => {
    e.preventDefault();
    if (dragState.sIdx === sIdx) {
      setDragOverState({ sIdx, qIdx });
    }
  };

  const handleDrop = (e, sIdx, qIdx) => {
    e.preventDefault();
    if (dragState.sIdx !== sIdx || dragState.qIdx === qIdx) {
      setDragState({ sIdx: null, qIdx: null });
      setDragOverState({ sIdx: null, qIdx: null });
      return;
    }
    const newSections = [...currentTemplate.sections];
    const questions = [...newSections[sIdx].questions];
    const [moved] = questions.splice(dragState.qIdx, 1);
    questions.splice(qIdx, 0, moved);
    newSections[sIdx].questions = questions;
    setCurrentTemplate({ ...currentTemplate, sections: newSections });
    setDragState({ sIdx: null, qIdx: null });
    setDragOverState({ sIdx: null, qIdx: null });
  };

  const handleDragEnd = () => {
    setDragState({ sIdx: null, qIdx: null });
    setDragOverState({ sIdx: null, qIdx: null });
  };

  return (
    <div className="space-y-6">
      {builderOpen ? (
        // Builder View
        <div className="space-y-6 animate-fade-in">
          {/* Builder Header - Simple style like Templates Management */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBuilderOpen(false)}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <Input
                  value={currentTemplate.title}
                  onChange={(e) =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      title: e.target.value,
                    })
                  }
                  className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                  placeholder="Template Title"
                />
                <Input
                  value={currentTemplate.description}
                  onChange={(e) =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      description: e.target.value,
                    })
                  }
                  placeholder="Template description..."
                  className="text-muted-foreground border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => addQuestion(0)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
              <Button
                onClick={handleSave}
                className="gradient-hero text-primary-foreground gap-2"
              >
                <Save className="h-4 w-4" />
                Save Template
              </Button>
            </div>
          </div>

          {/* Sections Render */}
          {currentTemplate.sections.map((section, sIdx) => (
            <Card key={section.id} id={`section-${section.id}`}>
              <CardContent className="space-y-4 pt-6">
                {section.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={() => handleDragStart(sIdx, qIdx)}
                    onDragOver={(e) => handleDragOver(e, sIdx, qIdx)}
                    onDrop={(e) => handleDrop(e, sIdx, qIdx)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 bg-muted/30 rounded-lg space-y-3 group border transition-all ${
                      dragOverState.sIdx === sIdx && dragOverState.qIdx === qIdx
                        ? 'border-primary border-dashed bg-primary/5'
                        : dragState.sIdx === sIdx && dragState.qIdx === qIdx
                          ? 'opacity-50 border-transparent'
                          : 'border-transparent hover:border-border'
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="text-muted-foreground cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={q.text}
                          onChange={(e) =>
                            updateQuestion(sIdx, qIdx, "text", e.target.value)
                          }
                          placeholder="Enter question text..."
                        />
                      </div>
                      <Select
                        value={q.type}
                        onValueChange={(v) => {
                          const newSections = [...currentTemplate.sections];
                          if (v === "yesno") {
                            // Yes/No converts to MCQ with Yes/No options
                            newSections[sIdx].questions[qIdx].type = "mcq";
                            newSections[sIdx].questions[qIdx].options = [
                              "Yes",
                              "No",
                            ];
                          } else if (v === "mcq") {
                            // Regular MCQ starts with empty options
                            newSections[sIdx].questions[qIdx].type = "mcq";
                            newSections[sIdx].questions[qIdx].options = [];
                          } else if (v === "multiselect") {
                            newSections[sIdx].questions[qIdx].type = "multiselect";
                            newSections[sIdx].questions[qIdx].options = [];
                          } else {
                            newSections[sIdx].questions[qIdx].type = v;
                          }
                          setCurrentTemplate({
                            ...currentTemplate,
                            sections: newSections,
                          });
                        }}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Yes/No Button - Only show for MCQ type */}
                      {q.type === "mcq" && (
                        <Button
                          variant={
                            q.options?.length === 2 &&
                            q.options[0] === "Yes" &&
                            q.options[1] === "No"
                              ? "secondary"
                              : "outline"
                          }
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => {
                            const newSections = [...currentTemplate.sections];
                            newSections[sIdx].questions[qIdx].options = [
                              "Yes",
                              "No",
                            ];
                            setCurrentTemplate({
                              ...currentTemplate,
                              sections: newSections,
                            });
                          }}
                        >
                          Yes/No
                        </Button>
                      )}
                      {q.type === "rating" && (
                        <Select
                          value={q.category || DEFAULT_CATEGORY}
                          onValueChange={(v) =>
                            updateQuestion(sIdx, qIdx, "category", v)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex items-center gap-2 border-l pl-3 ml-1">
                        <Switch
                          checked={q.required}
                          onCheckedChange={(c) =>
                            updateQuestion(sIdx, qIdx, "required", c)
                          }
                          id={`req-${q.id}`}
                        />
                        <Label
                          htmlFor={`req-${q.id}`}
                          className="text-xs whitespace-nowrap"
                        >
                          Required
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => removeQuestion(sIdx, qIdx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* MCQ Options */}
                    {q.type === "mcq" && (
                      <div className="space-y-2 pl-8 border-l-2 ml-2">
                        {q.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-2 items-center">
                            <div className="h-4 w-4 rounded-full border border-muted-foreground flex-shrink-0" />
                            <Input
                              value={opt}
                              onChange={(e) =>
                                updateQuestionOption(
                                  sIdx,
                                  qIdx,
                                  oIdx,
                                  e.target.value,
                                )
                              }
                              className="h-8"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() =>
                                removeQuestionOption(sIdx, qIdx, oIdx)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => addQuestionOption(sIdx, qIdx)}
                        >
                          + Add Option
                        </Button>
                      </div>
                    )}

                    {/* Multi-Select Options */}
                    {q.type === "multiselect" && (
                      <div className="space-y-2 pl-8 border-l-2 ml-2">
                        <p className="text-xs text-muted-foreground">Students can select multiple options</p>
                        {q.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-2 items-center">
                            <div className="h-4 w-4 rounded-sm border border-muted-foreground flex-shrink-0" />
                            <Input
                              value={opt}
                              onChange={(e) =>
                                updateQuestionOption(
                                  sIdx,
                                  qIdx,
                                  oIdx,
                                  e.target.value,
                                )
                              }
                              className="h-8"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              onClick={() =>
                                removeQuestionOption(sIdx, qIdx, oIdx)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => addQuestionOption(sIdx, qIdx)}
                        >
                          + Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion(sIdx)}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Question
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View - Compact Template Cards */
        <>
          {/* Top Header - Only shown when NOT in builder */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Import JSON Dialog */}
              <Dialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
              >
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
                      Upload a JSON file with your questions. The file should
                      follow the format below.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        Expected JSON Format:
                      </p>
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

                    <div className="text-sm space-y-2">
                      <p className="font-medium">Supported Question Types:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>
                          <code className="bg-muted px-1 rounded">rating</code>{" "}
                          - Star Rating (1-5)
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">mcq</code> -
                          Multiple Choice (requires "options" array)
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">futureSession</code> -
                          Future Expectations
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">topicslearned</code> -
                          Topics Learned (comma-separated)
                        </li>
                      </ul>
                    </div>

                    <div className="text-sm space-y-2">
                      <p className="font-medium">
                        Categories (for rating type):
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>
                          <code className="bg-muted px-1 rounded">content</code>
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">
                            delivery
                          </code>
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">
                            engagement
                          </code>
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">overall</code>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportJSON}
                      accept=".json,application/json"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setImportDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="gradient-hero text-primary-foreground"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select JSON File
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Create Template Dialog */}
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                      Enter basic information for your template. You can add
                      questions after creating it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-title">Template Title *</Label>
                      <Input
                        id="template-title"
                        value={newTemplateInfo.title}
                        onChange={(e) =>
                          setNewTemplateInfo((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="e.g., Trainer Feedback Form"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-desc">
                        Description (optional)
                      </Label>
                      <Input
                        id="template-desc"
                        value={newTemplateInfo.description}
                        onChange={(e) =>
                          setNewTemplateInfo((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Brief description of the template"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTemplate}
                      className="gradient-hero text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleCreateNew}
                className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>

          {/* Template Cards Grid - Professional Design */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates
              .filter(
                (t) =>
                  t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
              )
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleEdit(t)}
                  className="relative group cursor-pointer h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col items-center justify-center p-6"
                >
                  {/* Triangle Corner - Top Left */}
                  <svg
                    className="absolute top-0 left-0 w-28 h-28"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon points="0,0 120,0 0,120" fill="#01224E" />
                    <line
                      x1="120"
                      y1="0"
                      x2="0"
                      y2="120"
                      stroke="#d4a843"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Triangle Corner - Bottom Right */}
                  <svg
                    className="absolute bottom-0 right-0 w-28 h-28"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon points="120,120 0,120 120,0" fill="#01224E" />
                    <line
                      x1="0"
                      y1="120"
                      x2="120"
                      y2="0"
                      stroke="#d4a843"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Content - Centered */}
                  <div className="relative z-10 text-center space-y-3 flex flex-col items-center justify-center h-full">
                    {/* Template Title - Highlighted */}
                    <div className="space-y-2">
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight line-clamp-2">
                        {t.title}
                      </h3>
                      {t.isDefault && (
                        <Badge variant="secondary" className="text-xs mx-auto">
                          Default
                        </Badge>
                      )}
                    </div>

                    {/* Template Description */}
                    <p className="text-sm text-slate-500 line-clamp-3 italic max-w-[85%]">
                      "{t.description || "No description provided"}"
                    </p>

                    {/* Question Count */}
                    <p className="text-xs text-slate-400 pt-2">
                      {t.sections?.reduce(
                        (acc, s) => acc + (s.questions?.length || 0),
                        0,
                      ) || 0}{" "}
                      Questions
                    </p>
                  </div>

                  {/* Action Menu - Top Right (always visible) */}
                  <div className="absolute top-3 right-3 z-20">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-white/80 hover:bg-white shadow-sm"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-700" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(t);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTemplate(t);
                            setPreviewResponses({});
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(t.id, e)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>

          {/* Preview Modal - Custom (not Radix) */}
          {previewTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setPreviewTemplate(null)}
              />

              {/* Modal Content */}
              <div className="relative bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-10">
                {/* Header */}
                <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-start">
                  <div>
                    <h2 className="font-display text-xl font-bold">
                      {previewTemplate?.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {previewTemplate?.description || "No description"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewTemplate(null)}
                  >
                    <span className="text-lg">×</span>
                  </Button>
                </div>

                {/* Preview Questions */}
                <div className="p-6 space-y-6">
                  {previewTemplate?.sections?.flatMap((section, sIdx) =>
                    section.questions?.map((q, qIdx) => {
                      const key = `${sIdx}-${qIdx}`;
                      return (
                        <Card key={key}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <Label className="text-base font-medium">
                                {sIdx * 10 + qIdx + 1}. {q.text}
                                {q.required && (
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                )}
                              </Label>

                              {/* Rating Type */}
                              {q.type === "rating" && (
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    Rate from 1 (Poor) to 5 (Excellent)
                                  </p>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() =>
                                          setPreviewResponses((prev) => ({
                                            ...prev,
                                            [key]: rating,
                                          }))
                                        }
                                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2 cursor-pointer transition-all ${
                                          previewResponses[key] === rating
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                      >
                                        <Star
                                          className={`h-5 w-5 ${
                                            previewResponses[key] >= rating
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "text-muted-foreground"
                                          }`}
                                        />
                                        <span className="text-xs mt-1">
                                          {rating}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* MCQ Type */}
                              {q.type === "mcq" && q.options && (
                                <div className="space-y-2">
                                  {q.options.map((option, optIndex) => (
                                    <button
                                      key={optIndex}
                                      type="button"
                                      onClick={() =>
                                        setPreviewResponses((prev) => ({
                                          ...prev,
                                          [key]: option,
                                        }))
                                      }
                                      className={`w-full flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-left ${
                                        previewResponses[key] === option
                                          ? "border-primary bg-primary/5"
                                          : "border-border hover:border-primary/50"
                                      }`}
                                    >
                                      <div
                                        className={`h-4 w-4 rounded-full border-2 ${
                                          previewResponses[key] === option
                                            ? "border-primary bg-primary"
                                            : "border-muted-foreground"
                                        }`}
                                      />
                                      <span>{option}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Multi-Select Type */}
                              {q.type === "multiselect" && q.options && (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">Select all that apply</p>
                                  {q.options.map((option, optIndex) => {
                                    const selected = Array.isArray(previewResponses[key]) && previewResponses[key].includes(option);
                                    return (
                                      <button
                                        key={optIndex}
                                        type="button"
                                        onClick={() =>
                                          setPreviewResponses((prev) => {
                                            const current = Array.isArray(prev[key]) ? [...prev[key]] : [];
                                            if (current.includes(option)) {
                                              return { ...prev, [key]: current.filter(o => o !== option) };
                                            } else {
                                              return { ...prev, [key]: [...current, option] };
                                            }
                                          })
                                        }
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-left ${
                                          selected
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                      >
                                        <div
                                          className={`h-4 w-4 rounded-sm border-2 flex items-center justify-center ${
                                            selected
                                              ? "border-primary bg-primary text-white"
                                              : "border-muted-foreground"
                                          }`}
                                        >
                                          {selected && <span className="text-[10px] leading-none">✓</span>}
                                        </div>
                                        <span>{option}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Text Type */}
                              {q.type === "text" && (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Share your thoughts..."
                                    value={previewResponses[key] || ""}
                                    onChange={(e) =>
                                      setPreviewResponses((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    rows={3}
                                  />
                                </div>
                              )}

                              {/* Future Session Type */}
                              {q.type === "futureSession" && (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="What topics or skills would you like covered in future sessions?"
                                    value={previewResponses[key] || ""}
                                    onChange={(e) =>
                                      setPreviewResponses((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    rows={3}
                                  />
                                </div>
                              )}

                              {/* Topics Learned Type */}
                              {q.type === "topicslearned" && (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground mb-2">Please list the topics covered today, separated by commas (e.g. React Hooks, State, Effects)</p>
                                  <Textarea
                                    placeholder="e.g. Topic 1, Topic 2, Topic 3"
                                    value={previewResponses[key] || ""}
                                    onChange={(e) =>
                                      setPreviewResponses((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }),
                  )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Preview mode - responses are not saved
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewTemplate(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TemplatesTab;
