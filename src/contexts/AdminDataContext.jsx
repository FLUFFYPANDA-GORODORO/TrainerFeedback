import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { collegesApi, sessionsApi, usersApi, feedbackApi } from '@/lib/dataService';
import { getAllSessions } from '@/services/superadmin/sessionService';
import { getCollegeById } from '@/services/superadmin/collegeService';
import { getAllTrainers } from '@/services/superadmin/trainerService';
import { getCollegeCache, getCollegeTrends } from '@/services/superadmin/cacheService';
import { toast } from 'sonner';

const AdminDataContext = createContext(null);

export const AdminDataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Data state
  const [college, setCollege] = useState(null);
  const [cache, setCache] = useState(null);
  const [trends, setTrends] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    college: false,
    sessions: false,
    trainers: false,
    feedback: false,
    initial: true
  });

  // Track what's been loaded
  const [loaded, setLoaded] = useState({
    college: false,
    sessions: false,
    trainers: false,
    feedback: false
  });

  // Load college details
  const loadCollege = useCallback(async (force = false) => {
    if (!user?.collegeId) return null;
    if (loaded.college && !force) return college;
    
    setLoading(prev => ({ ...prev, college: true }));
    try {
      // Use firestore service if available, fallback to mock/legacy for now if needed
      // But we are moving to Firestore services.
      // Assuming getCollegeById is available and imported
      try {
          const data = await getCollegeById(user.collegeId);
          setCollege(data);
      } catch (err) {
          // Fallback to legacy dataService if firestore fails or not ready
          console.warn("Firestore college fetch failed, using legacy:", err);
          const data = collegesApi.getById(user.collegeId);
          setCollege(data);
      }
      setLoaded(prev => ({ ...prev, college: true }));

      // Load Cache & Trends concurrently with College info (lightweight)
      try {
        const [cacheData, trendsData] = await Promise.all([
             getCollegeCache(user.collegeId),
             getCollegeTrends(user.collegeId)
        ]);
        setCache(cacheData);
        setTrends(trendsData);
      } catch (e) {
        console.error("Failed to load college analytics cache", e);
      }

    } catch (error) {
      console.error('Failed to load college:', error);
      toast.error('Failed to load college info');
    } finally {
      setLoading(prev => ({ ...prev, college: false }));
    }
  }, [user, loaded.college, college]);

  // Load sessions
  const loadSessions = useCallback(async (force = false) => {
    if (!user?.collegeId) return [];
    if (loaded.sessions && !force) return sessions;
    
    setLoading(prev => ({ ...prev, sessions: true }));
    try {
      // Using the getAllSessions which supports filtering by collegeId
      const data = await getAllSessions(user.collegeId);
      setSessions(data);
      setLoaded(prev => ({ ...prev, sessions: true }));
      return data;
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  }, [user, loaded.sessions, sessions]);

  // Load trainers
  const loadTrainers = useCallback(async (force = false) => {
    if (loaded.trainers && !force) return trainers;
    
    setLoading(prev => ({ ...prev, trainers: true }));
    try {
      // We need trainers who are associated with this college OR have sessions here.
      // For now, let's fetch all trainers and filter client side or if we have a better query.
      // Currently, trainers might be assigned to a collegeId in their profile (if resident)
      // OR they just visit.
      // Let's get all trainers first (cacheable) and filter.
      
      const { trainers: allTrainers } = await getAllTrainers(100); 
      // Filter logic: 
      // 1. Trainer has collegeId matching current college
      // 2. OR Trainer exists in the sessions list (if sessions loaded)
      
      // Since sessions might not be loaded yet, we can't depend on them strict for the first load perfectly 
      // without chaining. But let's basic filter by collegeId first if that property exists on trainer.
      // If trainers are "freelance" they might not have a collegeId.
      
      // Let's just return all for now and let the UI filter, or filter by 'assigned' if key exists.
      // Actually, if we want to show stats for trainers who visited, we rely on session data.
      
      setTrainers(allTrainers);
      setLoaded(prev => ({ ...prev, trainers: true }));
      return allTrainers;
    } catch (error) {
      console.error('Failed to load trainers:', error);
      toast.error('Failed to load trainers');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, trainers: false }));
    }
  }, [loaded.trainers, trainers]);

  // Load feedback (Using legacy for now as feedback service migration might be partial)
  const loadFeedback = useCallback(async (force = false) => {
    if (loaded.feedback && !force) return feedback;
    
    setLoading(prev => ({ ...prev, feedback: true }));
    try {
      // TODO: Replace with Firestore feedback service when ready.
      // For now using mock/legacy
      const allFeedback = feedbackApi.getAll();
      // Filter for this college's sessions
      // We need session Ids first. 
      // If sessions are already loaded, use them. If not, fetch them?
      // Simpler: Fetch all feedback and filter client side if dataset small, 
      // or wait for proper FeedbackService with compound queries.
      
      // Assuming we can get relevant feedback or just ALL for now (demo scale)
      setFeedback(allFeedback); 
      
      setLoaded(prev => ({ ...prev, feedback: true }));
      return allFeedback;
    } catch (error) {
      console.error('Failed to load feedback:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, feedback: false }));
    }
  }, [loaded.feedback, feedback]);

  const refreshAll = useCallback(async () => {
    setLoading(prev => ({ ...prev, initial: true }));
    // Only refresh core data. separate refresh for sessions if needed.
    await loadCollege(true);
    // If sessions were already loaded, refresh them too
    if (loaded.sessions) await loadSessions(true);
    if (loaded.trainers) await loadTrainers(true);
    setLoading(prev => ({ ...prev, initial: false }));
  }, [loadCollege, loadSessions, loadTrainers, loaded.sessions, loaded.trainers]);

  // Initial load - ONLY College Info + Cache
  useEffect(() => {
    if (user?.collegeId) {
      const init = async () => {
        await loadCollege();
        setLoading(prev => ({ ...prev, initial: false }));
      };
      init();
    }
  }, [user, loadCollege]);

  const value = {
    college,
    cache,
    trends,
    sessions,
    trainers,
    feedback,
    loading,
    isInitialLoading: loading.initial,
    refreshAll,
    loadSessions,
    loadTrainers
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};

export default AdminDataContext;
