import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllColleges } from '@/services/superadmin/collegeService';
import { getAllTrainers } from '@/services/superadmin/trainerService';
import { getAllSessions, subscribeToSessions } from '@/services/superadmin/sessionService';
import { getAllTemplates } from '@/services/superadmin/templateService';
import { toast } from 'sonner';

const SuperAdminDataContext = createContext(null);

export const SuperAdminDataProvider = ({ children }) => {
  // Shared data state
  const [colleges, setColleges] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    colleges: false,
    trainers: false,
    sessions: false,
    templates: false,
    initial: true
  });

  // Track what's been loaded
  const [loaded, setLoaded] = useState({
    colleges: false,
    trainers: false,
    sessions: false,
    templates: false
  });

  // Load colleges (with optional force refresh)
  const loadColleges = useCallback(async (force = false) => {
    if (loaded.colleges && !force) return colleges;
    
    setLoading(prev => ({ ...prev, colleges: true }));
    try {
      const data = await getAllColleges();
      setColleges(data);
      setLoaded(prev => ({ ...prev, colleges: true }));
      return data;
    } catch (error) {
      console.error('Failed to load colleges:', error);
      toast.error('Failed to load colleges');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, colleges: false }));
    }
  }, [loaded.colleges, colleges]);

  // Load trainers (with optional force refresh)
  const loadTrainers = useCallback(async (force = false) => {
    if (loaded.trainers && !force) return trainers;
    
    setLoading(prev => ({ ...prev, trainers: true }));
    try {
      const result = await getAllTrainers(100); // Get all trainers
      const data = result.trainers || [];
      setTrainers(data);
      setLoaded(prev => ({ ...prev, trainers: true }));
      return data;
    } catch (error) {
      console.error('Failed to load trainers:', error);
      toast.error('Failed to load trainers');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, trainers: false }));
    }
  }, [loaded.trainers, trainers]);

  // Load templates (with optional force refresh)
  const loadTemplates = useCallback(async (force = false) => {
    if (loaded.templates && !force) return templates;
    
    setLoading(prev => ({ ...prev, templates: true }));
    try {
      const data = await getAllTemplates();
      setTemplates(data);
      setLoaded(prev => ({ ...prev, templates: true }));
      return data;
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  }, [loaded.templates, templates]);

  // Load sessions (manual load, subscription handles real-time)
  const loadSessions = useCallback(async (force = false) => {
    if (loaded.sessions && !force) return sessions;
    
    setLoading(prev => ({ ...prev, sessions: true }));
    try {
      const data = await getAllSessions();
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
  }, [loaded.sessions, sessions]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(prev => ({ ...prev, initial: true }));
    await Promise.all([
      loadColleges(true),
      loadTrainers(true),
      loadSessions(true),
      loadTemplates(true)
    ]);
    setLoading(prev => ({ ...prev, initial: false }));
  }, [loadColleges, loadTrainers, loadSessions, loadTemplates]);

  // Initial load and session subscription
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadColleges(),
        loadTrainers(),
        loadTemplates()
      ]);
      setLoading(prev => ({ ...prev, initial: false }));
    };

    initializeData();

    // Subscribe to real-time session updates
    const unsubscribe = subscribeToSessions((updatedSessions) => {
      setSessions(updatedSessions);
      setLoaded(prev => ({ ...prev, sessions: true }));
    });

    return () => unsubscribe && unsubscribe();
  }, []); // Only run once on mount

  // Update trainers list (for local state updates after add/edit/delete)
  const updateTrainersList = useCallback((updater) => {
    if (typeof updater === 'function') {
      setTrainers(updater);
    } else {
      setTrainers(updater);
    }
  }, []);

  // Update templates list
  const updateTemplatesList = useCallback((updater) => {
    if (typeof updater === 'function') {
      setTemplates(updater);
    } else {
      setTemplates(updater);
    }
  }, []);

  // Update colleges list
  const updateCollegesList = useCallback((updater) => {
    if (typeof updater === 'function') {
      setColleges(updater);
    } else {
      setColleges(updater);
    }
  }, []);

  const value = {
    // Data
    colleges,
    trainers,
    sessions,
    templates,
    
    // Loading states
    loading,
    isInitialLoading: loading.initial,
    
    // Load functions (with caching)
    loadColleges,
    loadTrainers,
    loadSessions,
    loadTemplates,
    refreshAll,
    
    // Update functions (for local state updates)
    updateTrainersList,
    updateTemplatesList,
    updateCollegesList,
    setSessions
  };

  return (
    <SuperAdminDataContext.Provider value={value}>
      {children}
    </SuperAdminDataContext.Provider>
  );
};

export const useSuperAdminData = () => {
  const context = useContext(SuperAdminDataContext);
  if (!context) {
    throw new Error('useSuperAdminData must be used within a SuperAdminDataProvider');
  }
  return context;
};

export default SuperAdminDataContext;
