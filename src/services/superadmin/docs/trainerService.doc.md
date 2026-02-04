# Trainer Service Documentation

## Collection: `trainers`

Stores trainer/faculty information.

---

## Schema

```typescript
interface Trainer {
  id: string;              // Auto-generated Firestore doc ID
  trainer_id: string;      // Unique human-readable ID (required, unique)
  name: string;            // Full name (required)
  email: string;           // Email address (required)
  domain: string;          // Primary domain (e.g., "Technical", "Soft Skills")
  specialisation: string;  // Specialization area
  topics: string[];        // List of topics they can teach
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

---

## Functions

### `addTrainer({ trainer_id, name, domain, specialisation, topics, email, password })`
Creates a new trainer. Enforces unique `trainer_id`.

**Input:**
```javascript
{
  trainer_id: "TR001",
  name: "John Doe",
  domain: "Technical",
  specialisation: "Web Development",
  topics: ["React", "Node.js", "JavaScript"],
  email: "john@example.com",
  password: "auto123"  // Not stored in DB (auth not implemented yet)
}
```

**Returns:** `{ id, trainer_id, name, email }`

---

### `updateTrainer(id, updates)`
Partial update to existing trainer.

---

### `deleteTrainer(id)`
Deletes a trainer by Firestore document ID.

---

### `getAllTrainers(limitCount?, lastDoc?)`
Paginated fetch of all trainers.

**Returns:**
```javascript
{
  trainers: Trainer[],
  lastDoc: DocumentSnapshot | null,
  hasMore: boolean
}
```

---

### `getTrainerById(id)`
Get single trainer by Firestore document ID.

---

### `addTrainersBatch(trainers[])`
Bulk add trainers. Returns success/error counts.

**Returns:**
```javascript
{
  success: Trainer[],
  errors: [{ trainer_id, name, error }]
}
```

---

## Usage Example

```javascript
import { addTrainer, getAllTrainers } from '@/services/superadmin/trainerService';

// Create
const trainer = await addTrainer({
  trainer_id: "TR001",
  name: "John Doe",
  domain: "Technical",
  specialisation: "React",
  topics: ["React", "JavaScript"],
  email: "john@example.com",
  password: "temp123"
});

// Read (paginated)
const { trainers, hasMore } = await getAllTrainers(50);
```

---

## Important Notes

- **`trainer_id` must be unique** - human-readable ID
- **`id` is the Firestore document ID** - used internally
- Referenced in `sessions.assignedTrainer` as `{ id, name }`
- `password` parameter exists but is NOT stored (future auth integration)
