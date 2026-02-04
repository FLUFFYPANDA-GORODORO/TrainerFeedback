# Response Service Documentation

## Collection: `sessions/{sessionId}/responses`

Stores individual feedback responses as subcollection under sessions.

---

## Schema

```typescript
interface Response {
  id: string;              // Auto-generated Firestore doc ID
  deviceId: string;        // Unique device/browser identifier
  answers: Answer[];       // Array of answers
  submittedAt: Timestamp;
}

interface Answer {
  questionId: string;      // Reference to question in session
  type: 'rating' | 'mcq' | 'text';
  value: string | number;  // Rating: 1-5, MCQ: option string, Text: free text
}
```

---

## Example Response

```javascript
{
  deviceId: "device-uuid-12345",
  answers: [
    { questionId: "q1", type: "rating", value: 4 },
    { questionId: "q2", type: "rating", value: 5 },
    { questionId: "q3", type: "rating", value: 3 },
    { questionId: "q4", type: "mcq", value: "Just Right" },
    { questionId: "q5", type: "text", value: "Great session, very informative!" }
  ]
}
```

---

## Functions

### `addResponse(sessionId, responseData)`
Adds a response to a session's responses subcollection.

**Input:**
```javascript
addResponse("session123", {
  deviceId: "device-uuid",
  answers: [
    { questionId: "q1", type: "rating", value: 4 },
    { questionId: "q2", type: "text", value: "Good session" }
  ]
})
```

**Returns:** `{ id, ...responseData }`

---

### `getResponses(sessionId)`
Get all responses for a session, ordered by `submittedAt` desc.

**Returns:** `Response[]`

---

### `getResponseCount(sessionId)`
Efficient count query (doesn't fetch all documents).

**Returns:** `number`

---

### `compileSessionStats(sessionId)`
Compiles comprehensive statistics from all responses.

**Returns:**
```javascript
{
  totalResponses: 25,
  avgRating: 4.2,
  topRating: 5.0,
  leastRating: 2.8,
  ratingDistribution: { 1: 0, 2: 2, 3: 5, 4: 10, 5: 8 },
  categoryAverages: {
    "knowledge": 4.5,
    "communication": 4.3,
    "engagement": 4.1,
    "overall": 4.2
  },
  topComments: [
    { text: "Excellent trainer!", avgRating: 5.0, responseId: "r1" }
  ],
  leastRatedComments: [...],
  avgComments: [...],
  questionStats: { ... },
  compiledAt: "2026-02-03T12:00:00Z"
}
```

---

## Category Averages

The `categoryAverages` field is calculated from questions that have a `category` property:

```javascript
// Question definition
{
  id: "q1",
  text: "Rate the trainer's knowledge",
  type: "rating",
  category: "knowledge"  // Used for radar chart
}
```

Supported categories (for radar chart):
- `knowledge`
- `communication`
- `engagement`
- `content`
- `delivery`
- `overall` (default if no category specified)

---

## Usage Example

```javascript
import { addResponse, compileSessionStats } from '@/services/superadmin/responseService';

// Add response (from student form)
await addResponse("session123", {
  deviceId: navigator.userAgent + Date.now(),
  answers: [
    { questionId: "q1", type: "rating", value: 5 },
    { questionId: "q2", type: "text", value: "Very helpful!" }
  ]
});

// Compile stats (called by closeSessionWithStats)
const stats = await compileSessionStats("session123");
```

---

## Important Notes

- Responses are in a **subcollection** under sessions
- `deviceId` should be unique per device (prevents duplicate submissions)
- `compileSessionStats` is called automatically by `closeSessionWithStats`
- Rating values must be integers 1-5
- Text values should be trimmed before storage
