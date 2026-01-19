// localStorage utility functions with simulated API delays

const STORAGE_KEYS = {
  COLLEGES: 'ffs_colleges',
  USERS: 'ffs_users',
  FACULTY: 'ffs_faculty',
  DEPARTMENTS: 'ffs_departments',
  FEEDBACK_CYCLES: 'ffs_feedback_cycles',
  ACCESS_CODES: 'ffs_access_codes',
  QUESTIONS: 'ffs_questions',
  FEEDBACK_SUBMISSIONS: 'ffs_feedback_submissions',
  CURRENT_USER: 'ffs_current_user',
};

// Simulated delay for realistic UX
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Generic storage helpers
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

// Types
export interface College {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'superAdmin' | 'admin' | 'hod' | 'faculty';
  collegeId?: string;
  departmentId?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  hodId?: string;
  createdAt: string;
}

export interface Faculty {
  id: string;
  userId: string;
  name: string;
  email: string;
  departmentId: string;
  collegeId: string;
  subjects: string[];
  createdAt: string;
}

export interface FeedbackCycle {
  id: string;
  name: string;
  collegeId: string;
  startDate: string;
  endDate: string;
  accessMode: 'anonymous' | 'authenticated' | 'mixed';
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export interface AccessCode {
  id: string;
  code: string;
  cycleId: string;
  facultyId: string;
  collegeId: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface Question {
  id: string;
  collegeId: string;
  category: string;
  text: string;
  responseType: 'rating' | 'text' | 'both';
  required: boolean;
  order: number;
  createdAt: string;
}

export interface FeedbackSubmission {
  id: string;
  cycleId: string;
  facultyId: string;
  collegeId: string;
  accessCodeId?: string;
  responses: {
    questionId: string;
    rating?: number;
    comment?: string;
  }[];
  submittedAt: string;
}

// Data access functions
export const collegesApi = {
  getAll: async (): Promise<College[]> => {
    await delay();
    return storage.get<College[]>(STORAGE_KEYS.COLLEGES) || [];
  },

  create: async (college: Omit<College, 'id' | 'createdAt'>): Promise<College> => {
    await delay();
    const colleges = storage.get<College[]>(STORAGE_KEYS.COLLEGES) || [];
    const newCollege: College = {
      ...college,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.COLLEGES, [...colleges, newCollege]);
    return newCollege;
  },
};

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    await delay();
    return storage.get<User[]>(STORAGE_KEYS.USERS) || [];
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    await delay();
    const users = storage.get<User[]>(STORAGE_KEYS.USERS) || [];
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    await delay();
    const users = storage.get<User[]>(STORAGE_KEYS.USERS) || [];
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },

  authenticate: async (email: string, password: string): Promise<User | null> => {
    await delay(500);
    const users = storage.get<User[]>(STORAGE_KEYS.USERS) || [];
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (user) {
      storage.set(STORAGE_KEYS.CURRENT_USER, user);
    }
    return user || null;
  },

  getCurrentUser: (): User | null => {
    return storage.get<User>(STORAGE_KEYS.CURRENT_USER);
  },

  logout: (): void => {
    storage.remove(STORAGE_KEYS.CURRENT_USER);
  },
};

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    await delay();
    return storage.get<Department[]>(STORAGE_KEYS.DEPARTMENTS) || [];
  },

  getByCollege: async (collegeId: string): Promise<Department[]> => {
    await delay();
    const departments = storage.get<Department[]>(STORAGE_KEYS.DEPARTMENTS) || [];
    return departments.filter(d => d.collegeId === collegeId);
  },

  create: async (department: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    await delay();
    const departments = storage.get<Department[]>(STORAGE_KEYS.DEPARTMENTS) || [];
    const newDept: Department = {
      ...department,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.DEPARTMENTS, [...departments, newDept]);
    return newDept;
  },
};

export const facultyApi = {
  getAll: async (): Promise<Faculty[]> => {
    await delay();
    return storage.get<Faculty[]>(STORAGE_KEYS.FACULTY) || [];
  },

  getByCollege: async (collegeId: string): Promise<Faculty[]> => {
    await delay();
    const faculty = storage.get<Faculty[]>(STORAGE_KEYS.FACULTY) || [];
    return faculty.filter(f => f.collegeId === collegeId);
  },

  getByDepartment: async (departmentId: string): Promise<Faculty[]> => {
    await delay();
    const faculty = storage.get<Faculty[]>(STORAGE_KEYS.FACULTY) || [];
    return faculty.filter(f => f.departmentId === departmentId);
  },

  create: async (member: Omit<Faculty, 'id' | 'createdAt'>): Promise<Faculty> => {
    await delay();
    const faculty = storage.get<Faculty[]>(STORAGE_KEYS.FACULTY) || [];
    const newFaculty: Faculty = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.FACULTY, [...faculty, newFaculty]);
    return newFaculty;
  },
};

export const feedbackCyclesApi = {
  getAll: async (): Promise<FeedbackCycle[]> => {
    await delay();
    return storage.get<FeedbackCycle[]>(STORAGE_KEYS.FEEDBACK_CYCLES) || [];
  },

  getByCollege: async (collegeId: string): Promise<FeedbackCycle[]> => {
    await delay();
    const cycles = storage.get<FeedbackCycle[]>(STORAGE_KEYS.FEEDBACK_CYCLES) || [];
    return cycles.filter(c => c.collegeId === collegeId);
  },

  create: async (cycle: Omit<FeedbackCycle, 'id' | 'createdAt'>): Promise<FeedbackCycle> => {
    await delay();
    const cycles = storage.get<FeedbackCycle[]>(STORAGE_KEYS.FEEDBACK_CYCLES) || [];
    const newCycle: FeedbackCycle = {
      ...cycle,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.FEEDBACK_CYCLES, [...cycles, newCycle]);
    return newCycle;
  },

  update: async (id: string, updates: Partial<FeedbackCycle>): Promise<FeedbackCycle | null> => {
    await delay();
    const cycles = storage.get<FeedbackCycle[]>(STORAGE_KEYS.FEEDBACK_CYCLES) || [];
    const index = cycles.findIndex(c => c.id === id);
    if (index === -1) return null;
    cycles[index] = { ...cycles[index], ...updates };
    storage.set(STORAGE_KEYS.FEEDBACK_CYCLES, cycles);
    return cycles[index];
  },
};

export const accessCodesApi = {
  getAll: async (): Promise<AccessCode[]> => {
    await delay();
    return storage.get<AccessCode[]>(STORAGE_KEYS.ACCESS_CODES) || [];
  },

  getByCode: async (code: string): Promise<AccessCode | undefined> => {
    await delay(500);
    const codes = storage.get<AccessCode[]>(STORAGE_KEYS.ACCESS_CODES) || [];
    return codes.find(c => c.code === code);
  },

  create: async (accessCode: Omit<AccessCode, 'id' | 'createdAt'>): Promise<AccessCode> => {
    await delay();
    const codes = storage.get<AccessCode[]>(STORAGE_KEYS.ACCESS_CODES) || [];
    const newCode: AccessCode = {
      ...accessCode,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.ACCESS_CODES, [...codes, newCode]);
    return newCode;
  },

  markUsed: async (id: string): Promise<void> => {
    await delay();
    const codes = storage.get<AccessCode[]>(STORAGE_KEYS.ACCESS_CODES) || [];
    const index = codes.findIndex(c => c.id === id);
    if (index !== -1) {
      codes[index].used = true;
      storage.set(STORAGE_KEYS.ACCESS_CODES, codes);
    }
  },
};

export const questionsApi = {
  getAll: async (): Promise<Question[]> => {
    await delay();
    return storage.get<Question[]>(STORAGE_KEYS.QUESTIONS) || [];
  },

  getByCollege: async (collegeId: string): Promise<Question[]> => {
    await delay();
    const questions = storage.get<Question[]>(STORAGE_KEYS.QUESTIONS) || [];
    return questions.filter(q => q.collegeId === collegeId).sort((a, b) => a.order - b.order);
  },

  create: async (question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> => {
    await delay();
    const questions = storage.get<Question[]>(STORAGE_KEYS.QUESTIONS) || [];
    const newQuestion: Question = {
      ...question,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.QUESTIONS, [...questions, newQuestion]);
    return newQuestion;
  },
};

export const submissionsApi = {
  getAll: async (): Promise<FeedbackSubmission[]> => {
    await delay();
    return storage.get<FeedbackSubmission[]>(STORAGE_KEYS.FEEDBACK_SUBMISSIONS) || [];
  },

  getByCollege: async (collegeId: string): Promise<FeedbackSubmission[]> => {
    await delay();
    const submissions = storage.get<FeedbackSubmission[]>(STORAGE_KEYS.FEEDBACK_SUBMISSIONS) || [];
    return submissions.filter(s => s.collegeId === collegeId);
  },

  getByFaculty: async (facultyId: string): Promise<FeedbackSubmission[]> => {
    await delay();
    const submissions = storage.get<FeedbackSubmission[]>(STORAGE_KEYS.FEEDBACK_SUBMISSIONS) || [];
    return submissions.filter(s => s.facultyId === facultyId);
  },

  create: async (submission: Omit<FeedbackSubmission, 'id' | 'submittedAt'>): Promise<FeedbackSubmission> => {
    await delay();
    const submissions = storage.get<FeedbackSubmission[]>(STORAGE_KEYS.FEEDBACK_SUBMISSIONS) || [];
    const newSubmission: FeedbackSubmission = {
      ...submission,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.FEEDBACK_SUBMISSIONS, [...submissions, newSubmission]);
    return newSubmission;
  },
};

// Initialize demo data
export const initializeDemoData = (): void => {
  // Check if data already exists
  if (storage.get<User[]>(STORAGE_KEYS.USERS)?.length) return;

  // Create demo college
  const collegeId = crypto.randomUUID();
  const college: College = {
    id: collegeId,
    name: 'Gryphon Institute of Technology',
    code: 'GIT',
    createdAt: new Date().toISOString(),
  };
  storage.set(STORAGE_KEYS.COLLEGES, [college]);

  // Create departments
  const deptIcem: Department = {
    id: crypto.randomUUID(),
    name: 'Information & Computer Engineering',
    code: 'ICEM',
    collegeId,
    createdAt: new Date().toISOString(),
  };
  const deptEng: Department = {
    id: crypto.randomUUID(),
    name: 'English & Communications',
    code: 'ENG',
    collegeId,
    createdAt: new Date().toISOString(),
  };
  storage.set(STORAGE_KEYS.DEPARTMENTS, [deptIcem, deptEng]);

  // Create users
  const users: User[] = [
    {
      id: crypto.randomUUID(),
      email: 'superadmin@gryphon.edu',
      password: 'admin123',
      name: 'System Administrator',
      role: 'superAdmin',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      email: 'dean@gryphon.edu',
      password: 'dean123',
      name: 'Dr. Sarah Mitchell',
      role: 'admin',
      collegeId,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      email: 'hod.icem@gryphon.edu',
      password: 'hod123',
      name: 'Prof. James Wilson',
      role: 'hod',
      collegeId,
      departmentId: deptIcem.id,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      email: 'faculty1@gryphon.edu',
      password: 'faculty123',
      name: 'Dr. Emily Chen',
      role: 'faculty',
      collegeId,
      departmentId: deptIcem.id,
      createdAt: new Date().toISOString(),
    },
  ];
  storage.set(STORAGE_KEYS.USERS, users);

  // Update HOD assignment
  deptIcem.hodId = users[2].id;
  storage.set(STORAGE_KEYS.DEPARTMENTS, [deptIcem, deptEng]);

  // Create faculty profiles
  const facultyProfiles: Faculty[] = [
    {
      id: crypto.randomUUID(),
      userId: users[3].id,
      name: 'Dr. Emily Chen',
      email: 'faculty1@gryphon.edu',
      departmentId: deptIcem.id,
      collegeId,
      subjects: ['Database Management Systems', 'Data Structures'],
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      name: 'Prof. Michael Brown',
      email: 'faculty2@gryphon.edu',
      departmentId: deptIcem.id,
      collegeId,
      subjects: ['Operating Systems', 'Computer Networks'],
      createdAt: new Date().toISOString(),
    },
  ];
  storage.set(STORAGE_KEYS.FACULTY, facultyProfiles);

  // Create default questions
  const defaultQuestions: Question[] = [
    { id: crypto.randomUUID(), collegeId, category: 'Teaching Effectiveness', text: 'The instructor explains concepts clearly and effectively.', responseType: 'both', required: true, order: 1, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), collegeId, category: 'Teaching Effectiveness', text: 'The instructor uses appropriate examples to illustrate concepts.', responseType: 'rating', required: true, order: 2, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), collegeId, category: 'Communication Skills', text: 'The instructor communicates in a clear and understandable manner.', responseType: 'both', required: true, order: 3, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), collegeId, category: 'Subject Knowledge', text: 'The instructor demonstrates thorough knowledge of the subject.', responseType: 'rating', required: true, order: 4, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), collegeId, category: 'Course Materials', text: 'The course materials are helpful and well-organized.', responseType: 'both', required: true, order: 5, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), collegeId, category: 'Overall Feedback', text: 'Overall, I am satisfied with this instructor.', responseType: 'both', required: true, order: 6, createdAt: new Date().toISOString() },
  ];
  storage.set(STORAGE_KEYS.QUESTIONS, defaultQuestions);

  // Create an active feedback cycle
  const cycle: FeedbackCycle = {
    id: crypto.randomUUID(),
    name: 'Spring 2024 Mid-Semester Review',
    collegeId,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    accessMode: 'anonymous',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  storage.set(STORAGE_KEYS.FEEDBACK_CYCLES, [cycle]);

  // Create access codes
  const accessCodes: AccessCode[] = facultyProfiles.map(f => ({
    id: crypto.randomUUID(),
    code: `${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    cycleId: cycle.id,
    facultyId: f.id,
    collegeId,
    used: false,
    expiresAt: cycle.endDate,
    createdAt: new Date().toISOString(),
  }));
  storage.set(STORAGE_KEYS.ACCESS_CODES, accessCodes);

  // Create sample submissions
  const sampleSubmissions: FeedbackSubmission[] = [
    {
      id: crypto.randomUUID(),
      cycleId: cycle.id,
      facultyId: facultyProfiles[0].id,
      collegeId,
      responses: defaultQuestions.map(q => ({
        questionId: q.id,
        rating: Math.floor(Math.random() * 2) + 4,
        comment: q.responseType !== 'rating' ? 'Great instructor!' : undefined,
      })),
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      cycleId: cycle.id,
      facultyId: facultyProfiles[0].id,
      collegeId,
      responses: defaultQuestions.map(q => ({
        questionId: q.id,
        rating: Math.floor(Math.random() * 2) + 3,
      })),
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      cycleId: cycle.id,
      facultyId: facultyProfiles[1].id,
      collegeId,
      responses: defaultQuestions.map(q => ({
        questionId: q.id,
        rating: Math.floor(Math.random() * 2) + 4,
      })),
      submittedAt: new Date().toISOString(),
    },
  ];
  storage.set(STORAGE_KEYS.FEEDBACK_SUBMISSIONS, sampleSubmissions);
};

export const resetDemoData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => storage.remove(key));
  initializeDemoData();
};
