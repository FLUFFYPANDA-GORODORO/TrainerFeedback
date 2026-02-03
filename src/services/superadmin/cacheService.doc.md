# Cache Service Documentation

## Collections

- `collegeCache` - Aggregated analytics per college
- `trainerCache` - Aggregated analytics per trainer
- `collegeCache/{id}/trends` - Daily trends subcollection
- `trainerCache/{id}/trends` - Daily trends subcollection

---

## College Cache Schema

```typescript
interface CollegeCache {
  id: string;                 // Same as collegeId
  totalSessions: number;
  totalResponses: number;
  totalRatingsCount: number;  // Count of individual rating answers (for avg calculation)
  ratingSum: number;          // Sum of all rating values (for avg calculation)
  ratingDistribution: { 
    "1": number, 
    "2": number, 
    "3": number, 
    "4": number, 
    "5": number 
  };
  categoryData: {
    [category: string]: {
      sum: number;
      count: number;
    }
  };
  courses: {                  // Nested hierarchy for drill-down
    [courseName: string]: {
      totalResponses: number;
      ratingSum: number;
      years: {
        [year: string]: {
          totalResponses: number;
          ratingSum: number;
          batches: {
            [batch: string]: {
              totalResponses: number;
              ratingSum: number;
            }
          }
        }
      }
    }
  };
  updatedAt: string;          // ISO timestamp
}
```

---

## Trainer Cache Schema

```typescript
interface TrainerCache {
  id: string;                 // Same as trainerId
  totalSessions: number;
  totalResponses: number;
  totalRatingsCount: number;
  ratingSum: number;
  ratingDistribution: { 
    "1": number, 
    "2": number, 
    "3": number, 
    "4": number, 
    "5": number 
  };
  categoryData: {
    [category: string]: {
      sum: number;
      count: number;
    }
  };
  updatedAt: string;
}
```

> **Note:** TrainerCache does NOT have the `courses` hierarchy (only CollegeCache has it).

---

## Trend Schema (Subcollection)

```typescript
// Document ID: "2026-02" (year-month)
interface Trend {
  days: {
    [dayOfMonth: string]: {   // e.g., "03", "15"
      responses: number;
    }
  };
}
```

Example:
```javascript
// collegeCache/{collegeId}/trends/2026-02
{
  days: {
    "01": { responses: 45 },
    "02": { responses: 32 },
    "03": { responses: 28 }
  }
}
```

---

## Functions

### `updateCollegeCache(session, stats)`
Updates college cache after session close. Called automatically by `closeSessionWithStats`.

**Increments:**
- `totalSessions` (+1)
- `totalResponses` (+stats.totalResponses)
- `totalRatingsCount` (+count from ratingDistribution)
- `ratingSum` (+calculated from ratingDistribution)
- `ratingDistribution` (each key incremented)
- `categoryData` (each category's sum/count)
- `courses.{course}.totalResponses/ratingSum`
- `courses.{course}.years.{year}.totalResponses/ratingSum`
- `courses.{course}.years.{year}.batches.{batch}.totalResponses/ratingSum`

---

### `updateTrainerCache(session, stats)`
Updates trainer cache after session close. Called automatically by `closeSessionWithStats`.

**Increments:** Same as college (except no `courses` hierarchy).

---

### `updateCollegeTrend(collegeId, sessionDate, responseCount)`
Updates daily trend data for college.

---

### `updateTrainerTrend(trainerId, sessionDate, responseCount)`
Updates daily trend data for trainer.

---

### `getCollegeCache(collegeId)`
Get cached analytics for a college.

**Returns:** `CollegeCache | null`

---

### `getCollegeTrends(collegeId, yearMonth?)`
Get trend data for a specific month (defaults to current month).

**Returns:** `Trend | null`

---

### `getTrainerCache(trainerId)`
Get cached analytics for a trainer.

**Returns:** `TrainerCache | null`

---

### `getTrainerTrends(trainerId, yearMonth?)`
Get trend data for a trainer.

**Returns:** `Trend | null`

---

### `getSessionsByTrainerAndCollege(trainerId, collegeId)`
Get sessions filtered by both trainer and college (for cross-filtered analytics).

---

## Calculating Average Rating

⚠️ **Important:** Use `totalRatingsCount` for correct average, NOT `totalResponses`:

```javascript
// CORRECT - uses count of individual ratings
const avgRating = cache.totalRatingsCount > 0 
  ? cache.ratingSum / cache.totalRatingsCount 
  : 0;

// WRONG - totalResponses is count of form submissions
// Each response may have multiple rating questions
const avgRating = cache.totalResponses > 0 
  ? cache.ratingSum / cache.totalResponses 
  : 0;
```

---

## Cache Update Flow

```
closeSessionWithStats(sessionId)
    ├── compileSessionStats()
    │       → { totalResponses, ratingDistribution, categoryAverages, ... }
    │
    ├── updateCollegeCache(session, compiledStats)
    │       → Increment college totals
    │       → Increment courses.{course}.years.{year}.batches.{batch}
    │       → updateCollegeTrend()
    │
    └── updateTrainerCache(session, compiledStats)
            → Increment trainer totals
            → updateTrainerTrend()
```

---

## Important Notes

1. **Never call cache update functions directly** - they're called by `closeSessionWithStats`
2. **Caches use Firestore `increment()`** - atomic increments, no read-modify-write
3. **`ratingSum` / `totalRatingsCount`** - enables accurate weighted averages
4. **`courses` hierarchy only in CollegeCache** - for drill-down by course/year/batch
5. **Trends organized by year-month** - document ID is `YYYY-MM`
6. **Days are zero-padded strings** - `"01"`, `"02"`, ..., `"31"`
