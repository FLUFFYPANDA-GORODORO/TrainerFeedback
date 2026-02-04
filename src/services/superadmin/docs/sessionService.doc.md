# Session Service Documentation

## Collection: `sessions`

Stores feedback sessions created by super admin for colleges/trainers.

---

## Schema

```typescript
interface Session {
  id: string;              // Auto-generated Firestore doc ID
  
  // College info
  collegeId: string;       // Reference to colleges collection
  collegeName: string;     // Denormalized name
  
  // Academic info
  academicYear: string;    // e.g., "2025-26"
  course: string;          // e.g., "B.Tech"
  branch: string;          // e.g., "CSE"
  year: string;            // e.g., "1", "2", "3", "4"
  batch: string;           // e.g., "A", "B"
  
  // Session details
  topic: string;           // Training topic
  domain: string;          // "Technical", "Soft Skills", "Tools", etc.
  sessionDate: string;     // YYYY-MM-DD format
  sessionTime: string;     // "Morning" | "Afternoon"
  sessionDuration: number; // Minutes (default: 60)
  
  // Trainer
  assignedTrainer: {
    id: string;            // Trainer Firestore doc ID
    name: string;          // Trainer name (denormalized)
  };
  
  // Questions
  questions: Question[];   // Session-specific questions
  templateId?: string;     // Optional reference to template
  
  // Status & Lifecycle
  status: 'active' | 'inactive';
  expiresAt: string;       // ISO timestamp
  ttl: number;             // Hours until auto-expiry
  projectId?: string;      // Optional project reference (future)
  
  // Compiled stats (populated when closed)
  compiledStats?: CompiledStats;
  closedAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

interface Question {
  id: string;
  text: string;
  type: 'rating' | 'mcq' | 'text';
  required: boolean;
  options?: string[];      // For MCQ only
  category?: string;       // For radar chart grouping
}
```

---

## CompiledStats Schema

```typescript
interface CompiledStats {
  totalResponses: number;
  avgRating: number;
  topRating: number;
  leastRating: number;
  ratingDistribution: { 1: number, 2: number, 3: number, 4: number, 5: number };
  categoryAverages: { [category: string]: number };
  topComments: Comment[];
  leastRatedComments: Comment[];
  avgComments: Comment[];
  questionStats: { [questionId: string]: QuestionStat };
  compiledAt: string;
}
```

---

## Functions

### `createSession(sessionData)`
Creates a new feedback session.

**Input:**
```javascript
{
  collegeId: "abc123",
  collegeName: "IGSB",
  academicYear: "2025-26",
  course: "B.Tech",
  branch: "CSE",
  year: "1",
  batch: "A",
  topic: "Introduction to React",
  domain: "Technical",
  sessionDate: "2026-02-03",
  sessionTime: "Morning",
  sessionDuration: 90,
  assignedTrainer: { id: "trainer123", name: "John Doe" },
  questions: [...],
  templateId: "template123",
  ttl: 24
}
```

---

### `updateSession(id, updates)`
Partial update to session.

---

### `deleteSession(id)`
Deletes a session and optionally its responses.

---

### `getAllSessions(collegeId?)`
Get all sessions, optionally filtered by college.

---

### `getSessionById(id)`
Get single session by ID.

---

### `closeSessionWithStats(id)`
**Critical function:** Closes session and compiles all response stats.

1. Fetches all responses from subcollection
2. Compiles rating stats, comments, category averages
3. Updates session with `status: 'inactive'` and `compiledStats`
4. Updates college and trainer cache documents

**Returns:** `{ id, status: 'inactive', compiledStats }`

---

### `subscribeToSessions(callback)`
Real-time subscription (limited to 50 most recent).

**Returns:** Unsubscribe function

---

## Usage Example

```javascript
import { createSession, closeSessionWithStats } from '@/services/superadmin/sessionService';

// Create session
const session = await createSession({
  collegeId: "college123",
  collegeName: "IGSB",
  course: "B.Tech",
  branch: "CSE",
  year: "1",
  batch: "A",
  topic: "React Basics",
  domain: "Technical",
  sessionDate: "2026-02-03",
  sessionTime: "Morning",
  assignedTrainer: { id: "trainer123", name: "John Doe" },
  questions: [],
  ttl: 24
});

// Close and compile stats
const closed = await closeSessionWithStats(session.id);
```

---

## Important Notes

- `assignedTrainer` must be `{ id, name }` object, not just ID
- `compiledStats` is only populated after calling `closeSessionWithStats`
- Responses stored in subcollection: `sessions/{sessionId}/responses`
- `status` should be 'active' or 'inactive' (not 'closed')
