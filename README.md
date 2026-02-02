# Trainer Feedback System

## Overview

**Trainer Feedback System** is a **multi-organization, role-based Trainer Feedback System** built entirely as a **frontend-only React application** using **localStorage** as its data store.

The system is designed for **training institutions** to collect **anonymous and authenticated student/trainee feedback**, analyze trainer performance, and generate rich analytics — **without any backend dependency**.

This updated architecture replaces the concept of rigid **Feedback Cycles** with a more **open, flexible, and learner-friendly concept called `Feedback Sessions`**.

## Key Architectural Shift (IMPORTANT)

### ❌ Old Concept

* Feedback Cycles (Semester-based, rigid)

### ✅ New Concept (Final)

* **Feedback Sessions** (Open, simple, real-world aligned)

### A Feedback Session is created by selecting:

* **Course / Program**
* **Batch / Cohort**
* **Subject / Module**
* **Trainer**

Once created:

* A **unique anonymous feedback URL** is generated
* Session can be **activated / deactivated** anytime
* Submissions are tied **only to that session**

This makes the system:

* More intuitive for organizations
* Easier to scale
* Easier to analyze at micro & macro levels

---

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| UI              | React (Functional Components + Hooks) |
| Styling         | Tailwind CSS                          |
| Routing         | React Router DOM                      |
| State & Caching | React Query                           |
| Charts          | Recharts                              |
| Icons           | lucide-react                          |
| Dates           | date-fns                              |
| Notifications   | sonner                                |
| Persistence     | localStorage                          |

---

## Core Design Principles

* **Frontend-only (No Backend)**
* **Trainer-first data model**
* **Role-based access control**
* **Multi-org isolation**
* **Accessible & keyboard-friendly UI**
* **Professional look**

---

## Color Palette

* **Primary:** `#01224E` (Deep Navy Blue)
* **Secondary:** `#f5f5f5 / #f8f9fa`
* **Success:** `#10b981`
* **Warning:** `#f59e0b`
* **Error:** `#ef4444`
* **White:** `#ffffff`

---

## Application Routes

### Public

* `/` – Landing Page
* `/feedback/anonymous/:sessionId` – Anonymous Feedback Form

### Authenticated

* `/login` – Admin / Staff Login

### Role-Based Dashboards

* `/super-admin` – System Owner
* `/admin/dashboard` – Org Admin
* `/admin/sessions` – Feedback Session Management
* `/admin/trainers` – Trainer Management
* `/admin/departments` – Department/Track Management
* `/admin/questions` – Question Bank
* `/admin/reports` – Reports & Analytics
* `/admin/settings` – Settings
* `/trainer/dashboard` – Trainer Personal Dashboard

---

## Feedback Session Lifecycle

1. **Admin creates a Session**
2. Selects context:
   * Course / Program
   * Batch
   * Subject / Module
   * Trainer
3. System generates:
   * `uniqueSessionId`
   * `anonymousFeedbackURL`
4. Session is activated
5. Trainees submit feedback anonymously
6. Trainer & Admin view analytics

---

## Roles & Permissions

### Super Admin

* Manage organizations
* Create admins
* Reset demo data
* View system-wide analytics

### Admin

* Manage departments & trainers
* Create feedback sessions
* Manage question bank
* View full reports

### Trainer

* View own feedback only
* Trend analysis
* Anonymous comments
* Download reports

---

## Feedback Form Structure

### Question Categories

* Teaching Effectiveness
* Communication Skills
* Subject Knowledge
* Course Materials
* Overall Feedback

### Response Types

* Rating (1–5)
* Text
* Rating + Comment
* Select Dropdown
* Boolean (Yes/No)

### Features

* Multi-step form
* Auto-save every 30 seconds
* Progress indicator
* Accessibility compliant

---

## Updated localStorage Data Model

### Organizations
```js
ffs_colleges
```

### Users
```js
ffs_users
```

### Departments
```js
ffs_departments
```

### Trainers
```js
ffs_faculty
```

### Feedback Sessions (NEW CORE ENTITY)
```js
ffs_feedback_sessions: [
  {
    id: 'session-1',
    collegeId: '1',
    departmentId: '1',
    facultyId: '1', // Refers to trainerId

    course: 'Engineering',
    academicYear: '2nd Year',
    subject: 'Data Structures',
    batch: 'A',

    accessMode: 'anonymous',
    uniqueUrl: 'feedback-session-abc123',
    isActive: true,

    createdAt: '2024-02-01T10:00:00',
    expiresAt: '2024-02-15T23:59:59'
  }
]
```

### Questions
```js
ffs_questions
```

### Feedback Submissions
```js
ffs_feedback_submissions: [
  {
    id: 'sub-1',
    sessionId: 'session-1',
    facultyId: '1',
    collegeId: '1',
    responses: [
      { questionId: 'q1', rating: 4 },
      { questionId: 'q2', comment: 'Very clear teaching' }
    ],
    submittedAt: '2024-02-05T14:30:00'
  }
]
```

---

## Reports & Analytics

### Admin

* Department-wise averages
* Trainer comparisons
* Subject-wise performance
* Batch-wise trends
* Response rates

### Trainer

* Personal score trends
* Category radar chart
* Anonymous trainee comments
* Percentile comparison

---

## Branding

**Trainer Feedback System**

---

> This README represents the **production-grade architecture** for the Trainer Feedback System using a **Session-first model**.
