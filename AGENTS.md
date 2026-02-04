# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run tests with Vitest
npm run test:watch   # Run tests in watch mode
```

## Architecture Overview

This is a **frontend-only React application** using localStorage as its data store. No backend is required.

### Core Data Flow

```
localStorage ←→ src/lib/dataService.js ←→ React Components
                      ↑
              src/lib/mockAuth.js (auth state in localStorage)
```

### Role-Based Structure

Three user roles with distinct dashboards:
- **SuperAdmin** (`/super-admin/*`) - Manages organizations, admins, trainers across all colleges
- **CollegeAdmin** (`/admin/*`) - Manages their college's trainers, sessions, feedback
- **Trainer** (`/trainer/*`) - Views own feedback and analytics

Each dashboard is a single component that handles routing internally via URL path matching.

### Key Services

| Service | Purpose |
|---------|---------|
| `src/lib/dataService.js` | All CRUD operations (usersApi, collegesApi, sessionsApi, feedbackApi, questionsApi, analyticsApi) |
| `src/lib/mockAuth.js` | Authentication using localStorage (`fih_auth_user` key) |
| `src/lib/academicConfig.js` | Academic year, course, batch configurations |
| `src/services/superadmin/` | Domain services for superadmin operations |

### Data Keys in localStorage

```
fih_users, fih_colleges, fih_sessions, fih_feedback, 
fih_academic_configs, fih_questions, fih_submitted_sessions
```

### Feedback Session Model

The core entity is a **Feedback Session** (not a rigid "Feedback Cycle"). A session ties together:
- College → Department → Trainer
- Course/Program → Batch → Subject
- Generates a unique anonymous feedback URL (`/feedback/anonymous/:sessionId`)

### UI Components

Uses shadcn/ui components (Radix UI primitives) located in `src/components/ui/`. Import via `@/components/ui/`.

Path alias `@/` maps to `src/`.

## Environment Variables

Firebase config via `VITE_FIREBASE_*` environment variables in `.env`. Currently localStorage is the primary data store; Firebase is configured but not actively used for data persistence.

## Testing

Uses Vitest with React Testing Library. Test files should use `.test.jsx` or `.test.js` extension.
