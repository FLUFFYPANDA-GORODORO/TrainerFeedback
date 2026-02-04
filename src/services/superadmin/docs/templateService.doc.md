# Template Service Documentation

## Collection: `feedback_templates`

Stores reusable feedback question templates.

---

## Schema

```typescript
interface FeedbackTemplate {
  id: string;              // Auto-generated Firestore doc ID
  title: string;           // Template name
  description: string;     // Description of when to use
  isDefault?: boolean;     // Is this the default template?
  sections: Section[];     // Grouped questions
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  type: 'rating' | 'mcq' | 'text';
  required: boolean;
  options?: string[];      // For MCQ only
  category?: string;       // For radar chart: knowledge, communication, etc.
}
```

---

## Example Template

```javascript
{
  title: "Standard Session Feedback",
  description: "Complete feedback for the training session.",
  isDefault: true,
  sections: [
    {
      id: "s1",
      title: "Session Feedback",
      questions: [
        { 
          id: "q1", 
          text: "Rate the trainer's knowledge", 
          type: "rating", 
          required: true,
          category: "knowledge"
        },
        { 
          id: "q2", 
          text: "How clear was the explanation?", 
          type: "rating", 
          required: true,
          category: "communication"
        },
        { 
          id: "q3", 
          text: "Was the session pace appropriate?", 
          type: "mcq", 
          options: ["Too Fast", "Just Right", "Too Slow"],
          required: true
        },
        { 
          id: "q4", 
          text: "Any additional comments?", 
          type: "text", 
          required: false
        }
      ]
    }
  ]
}
```

---

## Functions

### `createTemplate(templateData)`
Creates a new template.

---

### `updateTemplate(id, data)`
Updates an existing template.

---

### `deleteTemplate(id)`
Deletes a template.

---

### `getAllTemplates()`
Get all templates, ordered by `createdAt` desc.

---

### `getTemplateById(id)`
Get single template.

---

### `seedDefaultTemplate()`
Creates default template if none exist.

---

## Usage in Session Creation

```javascript
// When creating session with template
const template = await getTemplateById(templateId);
const questions = template.sections.flatMap(s => s.questions);

// Questions are merged into session
await createSession({
  ...sessionData,
  questions: [...customQuestions, ...questions],
  templateId: template.id
});
```

---

## Important Notes

- Question `id` should be unique within template
- `category` field on rating questions enables radar chart analytics
- Templates can have multiple sections for organization
- `isDefault` flag marks the default template
