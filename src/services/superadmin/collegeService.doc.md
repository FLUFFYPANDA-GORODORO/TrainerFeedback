# College Service Documentation

## Collection: `colleges`

Stores college/institution information.

---

## Schema

```typescript
interface College {
  id: string;          // Auto-generated Firestore doc ID
  name: string;        // Full college name (required)
  code: string;        // Unique short code (required, unique)
  logoUrl: string;     // Optional logo URL (default: '')
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

---

## Functions

### `addCollege({ name, code, logoUrl? })`
Creates a new college. Enforces unique `code`.

**Input:**
```javascript
{
  name: "Indian Graduate School of Business",
  code: "IGSB",
  logoUrl: "https://example.com/logo.png" // optional
}
```

**Returns:** `{ id, name, code, logoUrl }`

---

### `updateCollege(id, updates)`
Partial update to existing college.

**Input:**
```javascript
updateCollege("abc123", { name: "Updated Name" })
```

---

### `deleteCollege(id)`
Deletes a college by Firestore document ID.

---

### `getAllColleges()`
Returns all colleges.

**Returns:** `College[]`

---

### `getCollegeById(id)`
Get single college by Firestore document ID.

**Returns:** `College | null`

---

## Usage Example

```javascript
import { addCollege, getAllColleges } from '@/services/superadmin/collegeService';

// Create
const college = await addCollege({
  name: "Indian Graduate School of Business",
  code: "IGSB"
});

// Read all
const colleges = await getAllColleges();
```

---

## Important Notes

- **`code` must be unique** - used for display in filters and charts
- **`id` is the Firestore document ID** - different from `code`
- Used as foreign key in `sessions.collegeId` and `academic_configs`
