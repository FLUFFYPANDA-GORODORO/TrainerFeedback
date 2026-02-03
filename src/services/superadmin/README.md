# SuperAdmin Services Documentation Index

## Overview

This directory contains all services for the SuperAdmin dashboard, managing:
- Colleges & Academic Structure
- Trainers
- Feedback Sessions & Responses  
- Analytics Caching

---

## Services

| Service | Collection(s) | Purpose |
|---------|---------------|---------|
| [collegeService](./collegeService.doc.md) | `colleges` | CRUD for colleges |
| [trainerService](./trainerService.doc.md) | `trainers` | CRUD for trainers |
| [academicService](./academicService.doc.md) | `academic_configs` | Course/Dept/Year/Batch structure |
| [templateService](./templateService.doc.md) | `feedback_templates` | Question templates |
| [sessionService](./sessionService.doc.md) | `sessions` | Feedback sessions |
| [responseService](./responseService.doc.md) | `sessions/{id}/responses` | Student responses |
| [cacheService](./cacheService.doc.md) | `collegeCache`, `trainerCache` | Analytics aggregation |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SETUP PHASE                                  │
├─────────────────────────────────────────────────────────────────────┤
│  1. Create College (collegeService)                                 │
│  2. Create Academic Config (academicService)                        │
│  3. Create Trainers (trainerService)                                │
│  4. Create Templates (templateService)                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     SESSION LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────┤
│  5. Create Session (sessionService.createSession)                   │
│     → Links college, trainer, academic config, template             │
│                                                                     │
│  6. Students Submit Responses (responseService.addResponse)         │
│     → Stored in sessions/{id}/responses subcollection               │
│                                                                     │
│  7. Close Session (sessionService.closeSessionWithStats)            │
│     → Compiles all response statistics                              │
│     → Updates session.compiledStats                                 │
│     → Triggers cache updates                                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      ANALYTICS PHASE                                │
├─────────────────────────────────────────────────────────────────────┤
│  8. Cache Updated (cacheService)                                    │
│     → collegeCache: Aggregated per college                          │
│     → trainerCache: Aggregated per trainer                          │
│     → trends: Daily response counts                                 │
│                                                                     │
│  9. Dashboard Reads                                                 │
│     → OverviewTab: Reads from sessions.compiledStats                │
│     → CollegeAnalytics: Reads from collegeCache                     │
│     → TrainerAnalytics: Reads from trainerCache                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Relationships

```
colleges (1) ──────────── (1) academic_configs
    │
    └── (1:N) ─── sessions
                      │
                      ├── assignedTrainer ──→ trainers (N:1)
                      │
                      └── responses (subcollection)
                              │
                              └── (compiled into) ──→ session.compiledStats
                                                          │
                                                          ├──→ collegeCache
                                                          └──→ trainerCache
```

---

## Common Patterns

### Getting data for filters
```javascript
// College dropdown
const colleges = await getAllColleges();

// Academic options for selected college
const config = await getAcademicConfig(collegeId);
const courses = Object.keys(config.courses);

// Trainers
const { trainers } = await getAllTrainers(100);
```

### Creating a session correctly
```javascript
await createSession({
  collegeId: "id",           // Not code!
  collegeName: "Full Name",  // Denormalized
  assignedTrainer: {         // Object, not just ID!
    id: "trainerId",
    name: "TrainerName"
  },
  // ... other fields
});
```

### Closing session and updating analytics
```javascript
// This single call does everything
await closeSessionWithStats(sessionId);
// - Compiles response stats
// - Updates session document
// - Updates collegeCache
// - Updates trainerCache
```

---

## Important Rules

1. **Always use Firestore doc ID** for references, not human-readable codes
2. **Denormalize names** when storing (collegeName, trainerName) for faster reads
3. **assignedTrainer must be an object** `{ id, name }`, not just the ID
4. **Never call cache update functions directly** - they're called by `closeSessionWithStats`
5. **Status values:** `'active'` or `'inactive'` (not 'closed')
6. **Rating values:** Integer 1-5
7. **Use `totalRatingsCount` for averages**, not `totalResponses`
