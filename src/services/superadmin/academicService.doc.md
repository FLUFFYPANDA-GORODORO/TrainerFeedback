# Academic Service Documentation

## Collection: `academic_configs`

Stores academic structure (courses, departments, years, batches) per college.

---

## Schema

```typescript
interface AcademicConfig {
  id: string;           // Same as collegeId (document ID = college ID)
  collegeId: string;    // Reference to college
  collegeName: string;  // Denormalized college name
  collegeCode: string;  // Denormalized college code
  courses: {
    [courseName: string]: {
      departments: {
        [deptName: string]: {
          years: {
            [yearNumber: string]: {
              batches: string[]
            }
          }
        }
      }
    }
  };
  updatedAt: Timestamp;
}
```

---

## Example Structure

```javascript
{
  collegeId: "abc123",
  collegeName: "IGSB",
  collegeCode: "IGSB",
  courses: {
    "B.Tech": {
      departments: {
        "CSE": {
          years: {
            "1": { batches: ["A", "B", "C"] },
            "2": { batches: ["A", "B"] },
            "3": { batches: ["A", "B"] },
            "4": { batches: ["A", "B"] }
          }
        },
        "ECE": {
          years: {
            "1": { batches: ["A", "B"] }
          }
        }
      }
    },
    "MBA": {
      departments: {
        "General": {
          years: {
            "1": { batches: ["Morning", "Evening"] }
          }
        }
      }
    }
  }
}
```

---

## Functions

### `saveAcademicConfig(collegeId, configData)`
Creates or overwrites entire config for a college.

**Input:**
```javascript
saveAcademicConfig("college123", {
  courses: {
    "B.Tech": { departments: { ... } }
  }
})
```

> ⚠️ Validates that `collegeId` exists before saving.

---

### `updateAcademicConfig(collegeId, updates)`
Partial update using dot notation.

**Input:**
```javascript
updateAcademicConfig("college123", {
  "courses.B.Tech.departments.CSE.years.1.batches": ["A", "B", "C", "D"]
})
```

---

### `getAcademicConfig(collegeId)`
Get config for a college.

**Returns:** `AcademicConfig | null`

---

## Usage in Dashboard Filters

```javascript
const config = await getAcademicConfig(collegeId);

// Get courses
const courses = Object.keys(config.courses);

// Get years for selected course
const years = Object.keys(config.courses[course].departments[dept].years);

// Get batches for year
const batches = config.courses[course].departments[dept].years[year].batches;
```

---

## Important Notes

- Document ID = College ID (1:1 relationship)
- Structure is hierarchical: Course → Department → Year → Batches
- Used by SessionsTab and OverviewTab for filter dropdowns
- Must create config AFTER creating college (validates existence)
