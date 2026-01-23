// React Query hooks for optimized data fetching with caching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collegesApi,
    usersApi,
    departmentsApi,
    facultyApi,
    feedbackSessionsApi,
    questionsApi,
    submissionsApi,
    feedbackStatsApi,
    academicConfigApi,
    accessCodesApi,
    College,
    User,
    Department,
    Faculty,
    FeedbackSession,
    Question,
    FeedbackSubmission,
    FeedbackStats,
    AcademicConfig,
    AccessCode,
} from '@/lib/storage';

// ============================================================================
// CACHE TIME CONSTANTS
// ============================================================================

const STALE_TIME = {
    STATIC: 10 * 60 * 1000,      // 10 minutes for rarely changing data (colleges, academic config)
    SEMI_STATIC: 5 * 60 * 1000,  // 5 minutes for departments, faculty, questions
    DYNAMIC: 1 * 60 * 1000,      // 1 minute for sessions, submissions
    STATS: 2 * 60 * 1000,        // 2 minutes for aggregated stats
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const queryKeys = {
    // Colleges
    colleges: ['colleges'] as const,
    college: (id: string) => ['colleges', id] as const,

    // Users
    users: ['users'] as const,
    user: (id: string) => ['users', id] as const,
    usersByCollege: (collegeId: string) => ['users', 'college', collegeId] as const,

    // Departments
    departments: ['departments'] as const,
    department: (id: string) => ['departments', id] as const,
    departmentsByCollege: (collegeId: string) => ['departments', 'college', collegeId] as const,

    // Faculty
    faculty: ['faculty'] as const,
    facultyMember: (id: string) => ['faculty', id] as const,
    facultyByCollege: (collegeId: string) => ['faculty', 'college', collegeId] as const,
    facultyByDepartment: (departmentId: string) => ['faculty', 'department', departmentId] as const,
    facultyByUserId: (userId: string) => ['faculty', 'user', userId] as const,

    // Sessions
    sessions: ['sessions'] as const,
    session: (id: string) => ['sessions', id] as const,
    sessionByUrl: (url: string) => ['sessions', 'url', url] as const,
    sessionsByCollege: (collegeId: string) => ['sessions', 'college', collegeId] as const,
    sessionsByFaculty: (facultyId: string) => ['sessions', 'faculty', facultyId] as const,
    activeSessions: (collegeId: string) => ['sessions', 'college', collegeId, 'active'] as const,

    // Questions
    questions: ['questions'] as const,
    questionsByCollege: (collegeId: string) => ['questions', 'college', collegeId] as const,
    activeQuestionsByCollege: (collegeId: string) => ['questions', 'college', collegeId, 'active'] as const,

    // Submissions
    submissions: ['submissions'] as const,
    submissionsBySession: (sessionId: string) => ['submissions', 'session', sessionId] as const,
    submissionsByFaculty: (facultyId: string) => ['submissions', 'faculty', facultyId] as const,
    submissionsByCollege: (collegeId: string) => ['submissions', 'college', collegeId] as const,
    recentSubmissions: (collegeId: string) => ['submissions', 'college', collegeId, 'recent'] as const,

    // Stats
    stats: ['stats'] as const,
    collegeStats: (collegeId: string) => ['stats', 'college', collegeId] as const,
    departmentStats: (departmentId: string) => ['stats', 'department', departmentId] as const,
    facultyStats: (facultyId: string) => ['stats', 'faculty', facultyId] as const,
    sessionStats: (sessionId: string) => ['stats', 'session', sessionId] as const,
    allDepartmentStats: (collegeId: string) => ['stats', 'departments', collegeId] as const,
    allFacultyStats: (collegeId: string) => ['stats', 'facultyAll', collegeId] as const,

    // Academic Config
    academicConfig: (collegeId: string) => ['academicConfig', collegeId] as const,

    // Access Codes
    accessCodes: ['accessCodes'] as const,
    accessCodesBySession: (sessionId: string) => ['accessCodes', 'session', sessionId] as const,
};

// ============================================================================
// COLLEGE HOOKS
// ============================================================================

export function useColleges() {
    return useQuery({
        queryKey: queryKeys.colleges,
        queryFn: () => collegesApi.getAll(),
        staleTime: STALE_TIME.STATIC,
    });
}

export function useCollege(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.college(id || ''),
        queryFn: () => collegesApi.getById(id!),
        enabled: !!id,
        staleTime: STALE_TIME.STATIC,
    });
}

// ============================================================================
// USER HOOKS
// ============================================================================

export function useUser(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.user(id || ''),
        queryFn: () => usersApi.getById(id!),
        enabled: !!id,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useUsersByCollege(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.usersByCollege(collegeId || ''),
        queryFn: () => usersApi.getByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

// ============================================================================
// DEPARTMENT HOOKS
// ============================================================================

export function useDepartments(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.departmentsByCollege(collegeId || ''),
        queryFn: () => departmentsApi.getByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useActiveDepartments(collegeId: string | undefined) {
    return useQuery({
        queryKey: [...queryKeys.departmentsByCollege(collegeId || ''), 'active'],
        queryFn: () => departmentsApi.getActiveByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useDepartment(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.department(id || ''),
        queryFn: () => departmentsApi.getById(id!),
        enabled: !!id,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

// ============================================================================
// FACULTY HOOKS
// ============================================================================

export function useFaculty(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.facultyByCollege(collegeId || ''),
        queryFn: () => facultyApi.getByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useActiveFaculty(collegeId: string | undefined) {
    return useQuery({
        queryKey: [...queryKeys.facultyByCollege(collegeId || ''), 'active'],
        queryFn: () => facultyApi.getActiveByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useFacultyByDepartment(departmentId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.facultyByDepartment(departmentId || ''),
        queryFn: () => facultyApi.getByDepartment(departmentId!),
        enabled: !!departmentId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useFacultyMember(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.facultyMember(id || ''),
        queryFn: () => facultyApi.getById(id!),
        enabled: !!id,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useFacultyByUserId(userId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.facultyByUserId(userId || ''),
        queryFn: () => facultyApi.getByUserId(userId!),
        enabled: !!userId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

// ============================================================================
// SESSION HOOKS
// ============================================================================

export function useSessions(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.sessionsByCollege(collegeId || ''),
        queryFn: () => feedbackSessionsApi.getByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

export function useActiveSessions(collegeId: string | undefined, maxResults = 50) {
    return useQuery({
        queryKey: queryKeys.activeSessions(collegeId || ''),
        queryFn: () => feedbackSessionsApi.getActiveByCollege(collegeId!, maxResults),
        enabled: !!collegeId,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

export function useSession(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.session(id || ''),
        queryFn: () => feedbackSessionsApi.getById(id!),
        enabled: !!id,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

export function useSessionByUrl(url: string | undefined) {
    return useQuery({
        queryKey: queryKeys.sessionByUrl(url || ''),
        queryFn: () => feedbackSessionsApi.getByUrl(url!),
        enabled: !!url,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

export function useSessionsByFaculty(facultyId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.sessionsByFaculty(facultyId || ''),
        queryFn: () => feedbackSessionsApi.getByFaculty(facultyId!),
        enabled: !!facultyId,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

// ============================================================================
// QUESTION HOOKS
// ============================================================================

export function useQuestions(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.questionsByCollege(collegeId || ''),
        queryFn: () => questionsApi.getByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

export function useActiveQuestions(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.activeQuestionsByCollege(collegeId || ''),
        queryFn: () => questionsApi.getActiveByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.SEMI_STATIC,
    });
}

// ============================================================================
// SUBMISSION HOOKS
// ============================================================================

export function useSubmissionsBySession(sessionId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.submissionsBySession(sessionId || ''),
        queryFn: () => submissionsApi.getBySession(sessionId!),
        enabled: !!sessionId,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

export function useSubmissionsByFaculty(facultyId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.submissionsByFaculty(facultyId || ''),
        queryFn: () => submissionsApi.getByFaculty(facultyId!),
        enabled: !!facultyId,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

export function useRecentSubmissions(collegeId: string | undefined, maxResults = 100) {
    return useQuery({
        queryKey: queryKeys.recentSubmissions(collegeId || ''),
        queryFn: () => submissionsApi.getByCollegeRecent(collegeId!, maxResults),
        enabled: !!collegeId,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

// ============================================================================
// STATS HOOKS (Optimized - Single Read for Aggregated Data)
// ============================================================================

export function useCollegeStats(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.collegeStats(collegeId || ''),
        queryFn: () => feedbackStatsApi.getByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.STATS,
    });
}

export function useDepartmentStats(departmentId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.departmentStats(departmentId || ''),
        queryFn: () => feedbackStatsApi.getByDepartment(departmentId!),
        enabled: !!departmentId,
        staleTime: STALE_TIME.STATS,
    });
}

export function useFacultyMemberStats(facultyId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.facultyStats(facultyId || ''),
        queryFn: () => feedbackStatsApi.getByFaculty(facultyId!),
        enabled: !!facultyId,
        staleTime: STALE_TIME.STATS,
    });
}

export function useSessionStats(sessionId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.sessionStats(sessionId || ''),
        queryFn: () => feedbackStatsApi.getBySession(sessionId!),
        enabled: !!sessionId,
        staleTime: STALE_TIME.STATS,
    });
}

export function useAllDepartmentStats(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.allDepartmentStats(collegeId || ''),
        queryFn: () => feedbackStatsApi.getDepartmentStats(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.STATS,
    });
}

export function useAllFacultyStats(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.allFacultyStats(collegeId || ''),
        queryFn: () => feedbackStatsApi.getFacultyStats(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.STATS,
    });
}

// ============================================================================
// ACADEMIC CONFIG HOOKS
// ============================================================================

export function useAcademicConfig(collegeId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.academicConfig(collegeId || ''),
        queryFn: () => academicConfigApi.getByCollege(collegeId!),
        enabled: !!collegeId,
        staleTime: STALE_TIME.STATIC,
    });
}

// ============================================================================
// ACCESS CODE HOOKS
// ============================================================================

export function useAccessCodesBySession(sessionId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.accessCodesBySession(sessionId || ''),
        queryFn: () => accessCodesApi.getBySession(sessionId!),
        enabled: !!sessionId,
        staleTime: STALE_TIME.DYNAMIC,
    });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateSubmission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (submission: Parameters<typeof submissionsApi.create>[0]) =>
            submissionsApi.create(submission),
        onSuccess: (data) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.submissionsBySession(data.sessionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.submissionsByFaculty(data.facultyId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.recentSubmissions(data.collegeId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.collegeStats(data.collegeId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.facultyStats(data.facultyId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sessionStats(data.sessionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.session(data.sessionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.facultyMember(data.facultyId) });
        },
    });
}

export function useCreateSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (session: Parameters<typeof feedbackSessionsApi.create>[0]) =>
            feedbackSessionsApi.create(session),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessionsByCollege(data.collegeId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.activeSessions(data.collegeId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sessionsByFaculty(data.facultyId) });
        },
    });
}

export function useUpdateSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof feedbackSessionsApi.update>[1] }) =>
            feedbackSessionsApi.update(id, updates),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: queryKeys.session(data.id) });
                queryClient.invalidateQueries({ queryKey: queryKeys.sessionsByCollege(data.collegeId) });
                queryClient.invalidateQueries({ queryKey: queryKeys.activeSessions(data.collegeId) });
            }
        },
    });
}

export function useCreateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (department: Parameters<typeof departmentsApi.create>[0]) =>
            departmentsApi.create(department),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.departmentsByCollege(data.collegeId) });
        },
    });
}

export function useCreateFaculty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (faculty: Parameters<typeof facultyApi.create>[0]) =>
            facultyApi.create(faculty),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.facultyByCollege(data.collegeId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.facultyByDepartment(data.departmentId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.department(data.departmentId) });
        },
    });
}

export function useCreateQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (question: Parameters<typeof questionsApi.create>[0]) =>
            questionsApi.create(question),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.questionsByCollege(data.collegeId) });
        },
    });
}

// ============================================================================
// COMBINED DATA HOOKS (for dashboard views)
// ============================================================================

export interface DashboardData {
    departments: Department[];
    faculty: Faculty[];
    sessions: FeedbackSession[];
    collegeStats: FeedbackStats | null;
    departmentStats: FeedbackStats[];
    isLoading: boolean;
    error: Error | null;
}

export function useAdminDashboardData(collegeId: string | undefined): DashboardData {
    const departmentsQuery = useDepartments(collegeId);
    const facultyQuery = useFaculty(collegeId);
    const sessionsQuery = useActiveSessions(collegeId);
    const collegeStatsQuery = useCollegeStats(collegeId);
    const deptStatsQuery = useAllDepartmentStats(collegeId);

    return {
        departments: departmentsQuery.data || [],
        faculty: facultyQuery.data || [],
        sessions: sessionsQuery.data || [],
        collegeStats: collegeStatsQuery.data || null,
        departmentStats: deptStatsQuery.data || [],
        isLoading: departmentsQuery.isLoading || facultyQuery.isLoading ||
            sessionsQuery.isLoading || collegeStatsQuery.isLoading || deptStatsQuery.isLoading,
        error: departmentsQuery.error || facultyQuery.error ||
            sessionsQuery.error || collegeStatsQuery.error || deptStatsQuery.error,
    };
}

export interface FacultyDashboardData {
    profile: Faculty | null;
    stats: FeedbackStats | null;
    sessions: FeedbackSession[];
    questions: Question[];
    isLoading: boolean;
    error: Error | null;
}

export function useFacultyDashboardData(userId: string | undefined, collegeId: string | undefined): FacultyDashboardData {
    const profileQuery = useFacultyByUserId(userId);
    const facultyId = profileQuery.data?.id;
    const statsQuery = useFacultyMemberStats(facultyId);
    const sessionsQuery = useSessionsByFaculty(facultyId);
    const questionsQuery = useQuestions(collegeId);

    return {
        profile: profileQuery.data || null,
        stats: statsQuery.data || null,
        sessions: sessionsQuery.data || [],
        questions: questionsQuery.data || [],
        isLoading: profileQuery.isLoading || statsQuery.isLoading ||
            sessionsQuery.isLoading || questionsQuery.isLoading,
        error: profileQuery.error || statsQuery.error ||
            sessionsQuery.error || questionsQuery.error,
    };
}

export interface FeedbackFormData {
    session: FeedbackSession | null;
    faculty: Faculty | null;
    questions: Question[];
    isLoading: boolean;
    isValidating: boolean;
    error: string | null;
}

export function useFeedbackFormData(sessionUrl: string | undefined): FeedbackFormData {
    const sessionQuery = useSessionByUrl(sessionUrl);
    const session = sessionQuery.data;
    const facultyQuery = useFacultyMember(session?.facultyId);
    const questionsQuery = useActiveQuestions(session?.collegeId);

    // Validation logic
    let error: string | null = null;
    if (sessionQuery.error) {
        error = 'An error occurred while loading the session.';
    } else if (sessionQuery.data === null && !sessionQuery.isLoading) {
        error = 'Invalid session. This feedback link may have expired or been removed.';
    } else if (session && !session.isActive) {
        error = 'This feedback session is no longer active.';
    } else if (session && session.expiresAt.toDate() < new Date()) {
        error = 'This feedback session has expired.';
    } else if (facultyQuery.data === null && !facultyQuery.isLoading && session) {
        error = 'Unable to find faculty information for this session.';
    }

    return {
        session: session || null,
        faculty: facultyQuery.data || null,
        questions: questionsQuery.data || [],
        isLoading: questionsQuery.isLoading || facultyQuery.isLoading,
        isValidating: sessionQuery.isLoading,
        error,
    };
}
