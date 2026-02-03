/**
 * Data Service - Replace Firebase with localStorage-based mock data
 * This service handles all CRUD operations for the application
 */

import initialData from '../data/storage.json';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'fih_users',
  COLLEGES: 'fih_colleges',
  SESSIONS: 'fih_sessions',
  FEEDBACK: 'fih_feedback',
  ACADEMIC_CONFIGS: 'fih_academic_configs',
  QUESTIONS: 'fih_questions',
  SUBMITTED_SESSIONS: 'fih_submitted_sessions' // Track which sessions user has submitted feedback for
};

// Initialize localStorage with mock data if empty
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialData.users));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COLLEGES)) {
    localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(initialData.colleges));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(initialData.sessions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FEEDBACK)) {
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(initialData.feedbackSubmissions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACADEMIC_CONFIGS)) {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_CONFIGS, JSON.stringify(initialData.academicConfigs));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(initialData.questions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBMITTED_SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUBMITTED_SESSIONS, JSON.stringify([]));
  }
};

// Initialize on import
initializeData();

// Helper to generate unique IDs
const generateId = (prefix = '') => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// USERS API
// ============================================================================
export const usersApi = {
  getAll: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users;
  },

  getById: (id) => {
    const users = usersApi.getAll();
    return users.find(u => u.id === id) || null;
  },

  getByEmail: (email) => {
    const users = usersApi.getAll();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getByRole: (role) => {
    const users = usersApi.getAll();
    return users.filter(u => u.role === role);
  },

  getByCollege: (collegeId) => {
    const users = usersApi.getAll();
    return users.filter(u => u.collegeId === collegeId);
  },

  getTrainersByCollege: (collegeId) => {
    const users = usersApi.getAll();
    return users.filter(u => u.role === 'trainer' && u.collegeId === collegeId);
  },

  create: (userData) => {
    const users = usersApi.getAll();
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: generateId('user-'),
      ...userData,
      password: 'password123', // Default password
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update college admin/trainer count
    if (userData.collegeId) {
      collegesApi.updateCounts(userData.collegeId);
    }

    return newUser;
  },

  update: (id, updates) => {
    const users = usersApi.getAll();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
      throw new Error('User not found');
    }

    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return users[index];
  },

  delete: (id) => {
    const users = usersApi.getAll();
    const user = users.find(u => u.id === id);
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    
    // Update college counts
    if (user?.collegeId) {
      collegesApi.updateCounts(user.collegeId);
    }
  }
};

// ============================================================================
// COLLEGES API
// ============================================================================
export const collegesApi = {
  getAll: () => {
    const colleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLEGES) || '[]');
    return colleges;
  },

  getById: (id) => {
    const colleges = collegesApi.getAll();
    return colleges.find(c => c.id === id) || null;
  },

  getByCode: (code) => {
    const colleges = collegesApi.getAll();
    return colleges.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
  },

  create: (collegeData) => {
    const colleges = collegesApi.getAll();
    
    // Check if code already exists
    if (colleges.some(c => c.code.toUpperCase() === collegeData.code.toUpperCase())) {
      throw new Error('College code already exists');
    }

    const newCollege = {
      id: generateId('college-'),
      ...collegeData,
      isActive: true,
      adminCount: 0,
      trainerCount: 0,
      sessionCount: 0,
      createdAt: new Date().toISOString()
    };

    colleges.push(newCollege);
    localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(colleges));
    return newCollege;
  },

  update: (id, updates) => {
    const colleges = collegesApi.getAll();
    const index = colleges.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('College not found');
    }

    colleges[index] = { ...colleges[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(colleges));
    return colleges[index];
  },

  delete: (id) => {
    const colleges = collegesApi.getAll();
    const filtered = colleges.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(filtered));
  },

  updateCounts: (collegeId) => {
    const users = usersApi.getAll();
    const sessions = sessionsApi.getAll();
    
    const adminCount = users.filter(u => u.collegeId === collegeId && u.role === 'collegeAdmin').length;
    const trainerCount = users.filter(u => u.collegeId === collegeId && u.role === 'trainer').length;
    const sessionCount = sessions.filter(s => s.collegeId === collegeId).length;

    collegesApi.update(collegeId, { adminCount, trainerCount, sessionCount });
  }
};

// ============================================================================
// SESSIONS API
// ============================================================================
export const sessionsApi = {
  getAll: () => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    return sessions;
  },

  getById: (id) => {
    const sessions = sessionsApi.getAll();
    return sessions.find(s => s.id === id) || null;
  },

  getByUniqueUrl: (uniqueUrl) => {
    const sessions = sessionsApi.getAll();
    return sessions.find(s => s.uniqueUrl === uniqueUrl) || null;
  },

  getByCollege: (collegeId) => {
    const sessions = sessionsApi.getAll();
    return sessions.filter(s => s.collegeId === collegeId);
  },

  getByTrainer: (trainerId) => {
    const sessions = sessionsApi.getAll();
    return sessions.filter(s => s.trainerId === trainerId);
  },

  create: (sessionData) => {
    const sessions = sessionsApi.getAll();
    
    const newSession = {
      id: generateId('session-'),
      ...sessionData,
      uniqueUrl: `feedback-${generateId('')}`,
      status: 'active',
      submissionCount: 0,
      averageRating: 0,
      createdAt: new Date().toISOString()
    };

    sessions.push(newSession);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    
    // Update college session count
    if (sessionData.collegeId) {
      collegesApi.updateCounts(sessionData.collegeId);
    }

    return newSession;
  },

  update: (id, updates) => {
    const sessions = sessionsApi.getAll();
    const index = sessions.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error('Session not found');
    }

    sessions[index] = { ...sessions[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    return sessions[index];
  },

  delete: (id) => {
    const sessions = sessionsApi.getAll();
    const session = sessions.find(s => s.id === id);
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
    
    // Update college counts
    if (session?.collegeId) {
      collegesApi.updateCounts(session.collegeId);
    }
  },

  updateStats: (sessionId) => {
    const feedback = feedbackApi.getBySession(sessionId);
    const submissionCount = feedback.length;
    const averageRating = submissionCount > 0 
      ? feedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / submissionCount 
      : 0;
    
    sessionsApi.update(sessionId, { submissionCount, averageRating });
  }
};

// ============================================================================
// FEEDBACK API
// ============================================================================
export const feedbackApi = {
  getAll: () => {
    const feedback = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACK) || '[]');
    return feedback;
  },

  getById: (id) => {
    const feedback = feedbackApi.getAll();
    return feedback.find(f => f.id === id) || null;
  },

  getBySession: (sessionId) => {
    const feedback = feedbackApi.getAll();
    return feedback.filter(f => f.sessionId === sessionId);
  },

  getByTrainer: (trainerId) => {
    const feedback = feedbackApi.getAll();
    return feedback.filter(f => f.trainerId === trainerId);
  },

  getByCollege: (collegeId) => {
    const feedback = feedbackApi.getAll();
    return feedback.filter(f => f.collegeId === collegeId);
  },

  create: (feedbackData) => {
    const feedback = feedbackApi.getAll();
    
    // Calculate overall rating from responses
    const ratingResponses = feedbackData.responses.filter(r => r.rating);
    const overallRating = ratingResponses.length > 0
      ? ratingResponses.reduce((sum, r) => sum + r.rating, 0) / ratingResponses.length
      : 0;

    const newFeedback = {
      id: generateId('feedback-'),
      ...feedbackData,
      overallRating,
      submittedAt: new Date().toISOString()
    };

    feedback.push(newFeedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));
    
    // Update session stats
    if (feedbackData.sessionId) {
      sessionsApi.updateStats(feedbackData.sessionId);
    }

    // Mark session as submitted for this browser
    const submittedSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMITTED_SESSIONS) || '[]');
    if (!submittedSessions.includes(feedbackData.sessionId)) {
      submittedSessions.push(feedbackData.sessionId);
      localStorage.setItem(STORAGE_KEYS.SUBMITTED_SESSIONS, JSON.stringify(submittedSessions));
    }

    return newFeedback;
  },

  hasSubmitted: (sessionId) => {
    const submittedSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMITTED_SESSIONS) || '[]');
    return submittedSessions.includes(sessionId);
  }
};

// ============================================================================
// ACADEMIC CONFIGS API
// ============================================================================
export const academicConfigsApi = {
  getAll: () => {
    const configs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACADEMIC_CONFIGS) || '[]');
    return configs;
  },

  getByCollege: (collegeId) => {
    const configs = academicConfigsApi.getAll();
    return configs.find(c => c.collegeId === collegeId) || null;
  },

  create: (configData) => {
    const configs = academicConfigsApi.getAll();
    
    const newConfig = {
      id: generateId('config-'),
      ...configData,
      createdAt: new Date().toISOString()
    };

    configs.push(newConfig);
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_CONFIGS, JSON.stringify(configs));
    return newConfig;
  },

  update: (id, updates) => {
    const configs = academicConfigsApi.getAll();
    const index = configs.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('Academic config not found');
    }

    configs[index] = { ...configs[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_CONFIGS, JSON.stringify(configs));
    return configs[index];
  },

  upsertByCollege: (collegeId, configData) => {
    const existing = academicConfigsApi.getByCollege(collegeId);
    if (existing) {
      return academicConfigsApi.update(existing.id, configData);
    } else {
      return academicConfigsApi.create({ ...configData, collegeId });
    }
  }
};

// ============================================================================
// QUESTIONS API
// ============================================================================
export const questionsApi = {
  getAll: () => {
    const questions = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]');
    return questions.sort((a, b) => a.order - b.order);
  },

  getById: (id) => {
    const questions = questionsApi.getAll();
    return questions.find(q => q.id === id) || null;
  },

  create: (questionData) => {
    const questions = questionsApi.getAll();
    
    const newQuestion = {
      id: generateId('q-'),
      ...questionData,
      order: questions.length + 1,
      createdAt: new Date().toISOString()
    };

    questions.push(newQuestion);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    return newQuestion;
  },

  update: (id, updates) => {
    const questions = questionsApi.getAll();
    const index = questions.findIndex(q => q.id === id);
    
    if (index === -1) {
      throw new Error('Question not found');
    }

    questions[index] = { ...questions[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    return questions[index];
  },

  delete: (id) => {
    const questions = questionsApi.getAll();
    const filtered = questions.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(filtered));
  }
};

// ============================================================================
// ANALYTICS API
// ============================================================================
export const analyticsApi = {
  // Get overall stats for SuperAdmin
  getOverallStats: () => {
    const colleges = collegesApi.getAll();
    const sessions = sessionsApi.getAll();
    const feedback = feedbackApi.getAll();
    const trainers = usersApi.getByRole('trainer');

    return {
      totalColleges: colleges.length,
      totalTrainers: trainers.length,
      totalSessions: sessions.length,
      totalFeedback: feedback.length,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / feedback.length 
        : 0
    };
  },

  // Get stats for a specific college
  getCollegeStats: (collegeId) => {
    const sessions = sessionsApi.getByCollege(collegeId);
    const feedback = feedbackApi.getByCollege(collegeId);
    const trainers = usersApi.getTrainersByCollege(collegeId);

    return {
      totalTrainers: trainers.length,
      totalSessions: sessions.length,
      totalFeedback: feedback.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / feedback.length 
        : 0
    };
  },

  // Get stats for a specific trainer
  getTrainerStats: (trainerId) => {
    const sessions = sessionsApi.getByTrainer(trainerId);
    const feedback = feedbackApi.getByTrainer(trainerId);

    return {
      totalSessions: sessions.length,
      totalFeedback: feedback.length,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / feedback.length 
        : 0
    };
  },

  // Get feedback by date range
  getFeedbackByDateRange: (startDate, endDate, collegeId = null) => {
    let feedback = feedbackApi.getAll();
    
    if (collegeId) {
      feedback = feedback.filter(f => f.collegeId === collegeId);
    }

    return feedback.filter(f => {
      const submittedDate = new Date(f.submittedAt);
      return submittedDate >= new Date(startDate) && submittedDate <= new Date(endDate);
    });
  }
};

// ============================================================================
// RESET DATA (for development/testing)
// ============================================================================
// Helper to get active academic config (first one or global)
export const academicConfigApi = {
  getActive: () => {
    const configs = academicConfigsApi.getAll();
    return configs[0] || null;
  },
  ...academicConfigsApi
};

// Add alias for getGlobalStats
analyticsApi.getGlobalStats = analyticsApi.getOverallStats;

// Add getCollegeStats for college-specific analytics
analyticsApi.getCollegeStats = (collegeId) => {
  const sessions = sessionsApi.getAll().filter(s => s.collegeId === collegeId);
  const users = usersApi.getAll().filter(u => u.collegeId === collegeId);
  const trainers = users.filter(u => u.role === 'trainer');
  const feedback = feedbackApi.getAll().filter(f => {
    const session = sessions.find(s => s.id === f.sessionId);
    return session !== undefined;
  });

  return {
    totalTrainers: trainers.length,
    totalSessions: sessions.length,
    totalFeedback: feedback.length,
    activeSessions: sessions.filter(s => s.status === 'active').length,
    averageRating: feedback.length > 0 
      ? feedback.reduce((sum, f) => sum + (f.overallRating || 0), 0) / feedback.length 
      : 0
  };
};

export const resetAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  initializeData();
};

export default {
  usersApi,
  collegesApi,
  sessionsApi,
  feedbackApi,
  academicConfigsApi,
  questionsApi,
  analyticsApi,
  resetAllData
};
