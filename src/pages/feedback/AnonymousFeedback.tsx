import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GraduationCap, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  feedbackSessionsApi,
  facultyApi,
  questionsApi,
  submissionsApi,
  FeedbackSession,
  Faculty,
  Question,
  FeedbackResponse,
} from '@/lib/storage';

type Step = 'feedback' | 'success';

interface CleanResponse {
  questionId: string;
  questionCategory: string;
  rating?: number;
  comment?: string;
  selectValue?: string;
  booleanValue?: boolean;
}

export const AnonymousFeedback: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [step, setStep] = useState<Step>('feedback'); // Start directly with feedback
  const [sessionError, setSessionError] = useState('');
  const [isValidating, setIsValidating] = useState(true); // Start validating immediately

  const [validatedSession, setValidatedSession] = useState<FeedbackSession | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group questions by category and sort within categories
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  // Sort questions within each category by order
  Object.keys(groupedQuestions).forEach(category => {
    groupedQuestions[category].sort((a, b) => a.order - b.order);
  });

  // Sort categories by the minimum order of questions in each category
  const categories = Object.keys(groupedQuestions).sort((a, b) => {
    const minOrderA = Math.min(...groupedQuestions[a].map(q => q.order));
    const minOrderB = Math.min(...groupedQuestions[b].map(q => q.order));
    return minOrderA - minOrderB;
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (step !== 'feedback' || responses.length === 0) return;

    const saveInterval = setInterval(() => {
      localStorage.setItem('ffs_draft_feedback', JSON.stringify({
        sessionId: validatedSession?.id,
        responses,
        timestamp: Date.now(),
      }));
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [step, responses, validatedSession?.id]);

  // Restore draft on load
  useEffect(() => {
    const draft = localStorage.getItem('ffs_draft_feedback');
    if (draft) {
      const parsed = JSON.parse(draft);
      // Only restore if less than 1 hour old
      if (Date.now() - parsed.timestamp < 3600000) {
        setResponses(parsed.responses);
      } else {
        localStorage.removeItem('ffs_draft_feedback');
      }
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId) {
        setSessionError('Invalid session URL. Please check the link and try again.');
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      setSessionError('');

      try {
        const session = await feedbackSessionsApi.getByUrl(sessionId);

        if (!session) {
          setSessionError('Invalid session. This feedback link may have expired or been removed.');
          setIsValidating(false);
          return;
        }

        if (!session.isActive) {
          setSessionError('This feedback session is no longer active.');
          setIsValidating(false);
          return;
        }

        if (session.expiresAt.toDate() < new Date()) {
          setSessionError('This feedback session has expired.');
          setIsValidating(false);
          return;
        }

        // Get faculty and questions
        const [allFaculty, qs] = await Promise.all([
          facultyApi.getByCollege(session.collegeId),
          questionsApi.getByCollege(session.collegeId),
        ]);

        // Sort questions by order field
        const sortedQuestions = qs.sort((a, b) => a.order - b.order);

        const facultyMember = allFaculty.find(f => f.id === session.facultyId);

        if (!facultyMember) {
          setSessionError('Unable to find faculty information for this session.');
          setIsValidating(false);
          return;
        }

        setValidatedSession(session);
        setFaculty(facultyMember);
        setQuestions(sortedQuestions);
        setResponses(sortedQuestions.map(q => ({ questionId: q.id, questionCategory: q.category })));

        // Check if already submitted
        if (localStorage.getItem(`ffs_submitted_${session.id}`) === 'true') {
          setStep('success');
          setIsValidating(false);
          return;
        }

        setStep('feedback');
      } catch (error) {
        setSessionError('An error occurred while loading the session. Please try again later.');
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [sessionId]);



  const updateResponse = useCallback((questionId: string, rating?: number, comment?: string, selectValue?: string, booleanValue?: boolean) => {
    setResponses(prev =>
      prev.map(r =>
        r.questionId === questionId
          ? { 
              ...r, 
              rating: rating ?? r.rating, 
              comment: comment ?? r.comment,
              selectValue: selectValue ?? r.selectValue,
              booleanValue: booleanValue ?? r.booleanValue
            }
          : r
      )
    );
  }, []);

  const canProceed = () => {
    const requiredQuestions = questions.filter(q => q.required);
    return requiredQuestions.every(q => {
      const response = responses.find(r => r.questionId === q.id);
      if (!response) return false;
      
      switch (q.responseType) {
        case 'rating':
        case 'both':
          return response.rating !== undefined;
        case 'text':
          return response.comment && response.comment.trim() !== '';
        case 'select':
          return response.selectValue && response.selectValue.trim() !== '';
        case 'boolean':
          return response.booleanValue !== undefined;
        default:
          return false;
      }
    });
  };

  const handleSubmit = async () => {
    if (!validatedSession || !faculty) return;

    // Prevent resubmission
    if (localStorage.getItem(`ffs_submitted_${validatedSession.id}`) === 'true') {
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean responses by removing undefined values
      const cleanResponses = responses
        .filter(r => r.rating !== undefined || r.selectValue || r.booleanValue !== undefined || (r.comment && r.comment.trim()))
        .map(r => {
          const cleanResponse: CleanResponse = { questionId: r.questionId, questionCategory: r.questionCategory! };
          if (r.rating !== undefined) cleanResponse.rating = r.rating;
          if (r.comment && r.comment.trim()) cleanResponse.comment = r.comment.trim();
          if (r.selectValue && r.selectValue.trim()) cleanResponse.selectValue = r.selectValue.trim();
          if (r.booleanValue !== undefined) cleanResponse.booleanValue = r.booleanValue;
          return cleanResponse;
        });

      await submissionsApi.create({
        sessionId: validatedSession.id,
        facultyId: faculty.id,
        collegeId: validatedSession.collegeId,
        departmentId: validatedSession.departmentId,
        responses: cleanResponses,
      });

      localStorage.removeItem('ffs_draft_feedback');
      localStorage.setItem(`ffs_submitted_${validatedSession.id}`, 'true');
      setStep('success');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (responses.filter(r => r.rating !== undefined || r.selectValue || r.booleanValue !== undefined).length / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl font-semibold text-foreground">Gryphon</span>
              <span className="ml-2 text-sm text-muted-foreground">Faculty Feedback</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Loading State */}
        {isValidating && (
          <div className="glass-card rounded-xl p-8 animate-fade-up text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium text-foreground">Validating session...</span>
            </div>
            <p className="text-muted-foreground">
              Please wait while we verify your feedback link.
            </p>
          </div>
        )}

        {/* Error State */}
        {sessionError && !isValidating && (
          <div className="glass-card rounded-xl p-8 animate-fade-up">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Session Error
              </h1>
              <p className="text-muted-foreground">
                {sessionError}
              </p>
            </div>
          </div>
        )}

        {/* Feedback Step */}
        {step === 'feedback' && faculty && !isValidating && (
          <div className="space-y-6 animate-fade-up">
            {/* Progress */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Overall Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {responses.filter(r => r.rating !== undefined || r.selectValue || r.booleanValue !== undefined).length} of {questions.length} questions completed
                </span>
              </div>
              <ProgressBar value={progress} size="md" />
            </div>

            {/* Faculty Card */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {faculty.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">{faculty.name}</h2>
                  <p className="text-sm text-muted-foreground">{faculty.subjects.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* All Questions */}
            <div className="space-y-8">
              {categories.map((category, categoryIndex) => (
                <div key={category} className="glass-card rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                    {category}
                  </h3>

                  <div className="space-y-8">
                    {groupedQuestions[category].map((question, questionIndex) => {
                      const response = responses.find(r => r.questionId === question.id);
                      const globalIndex = categories.slice(0, categoryIndex).reduce((acc, cat) => acc + groupedQuestions[cat].length, 0) + questionIndex + 1;

                      return (
                        <div
                          key={question.id}
                          className="space-y-4 animate-fade-up"
                          style={{ animationDelay: `${questionIndex * 0.05}s` }}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {globalIndex}.
                            </span>
                            <div className="flex-1">
                              <p className="text-foreground">
                                {question.text}
                                {question.required && (
                                  <span className="text-destructive ml-1">*</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {(question.responseType === 'rating' || question.responseType === 'both') && (
                            <div className="flex items-center gap-4 pl-6">
                              <span className="text-sm text-muted-foreground">Rating:</span>
                              <RatingStars
                                value={response?.rating || 0}
                                onChange={(rating) => updateResponse(question.id, rating)}
                                size="lg"
                              />
                            </div>
                          )}

                          {question.responseType === 'select' && (
                            <div className="pl-6">
                              <Select
                                value={response?.selectValue || ''}
                                onValueChange={(value) => updateResponse(question.id, undefined, undefined, value)}
                              >
                                <SelectTrigger className="w-full max-w-xs">
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {question.responseType === 'boolean' && (
                            <div className="flex items-center gap-6 pl-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`boolean-${question.id}`}
                                  value="true"
                                  checked={response?.booleanValue === true}
                                  onChange={() => updateResponse(question.id, undefined, undefined, undefined, true)}
                                  className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`boolean-${question.id}`}
                                  value="false"
                                  checked={response?.booleanValue === false}
                                  onChange={() => updateResponse(question.id, undefined, undefined, undefined, false)}
                                  className="w-4 h-4 text-primary"
                                />
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                          )}

                          {(question.responseType === 'text' || question.responseType === 'both') && (
                            <div className="pl-6">
                              <Textarea
                                placeholder="Add a comment (optional)"
                                value={response?.comment || ''}
                                onChange={(e) => updateResponse(question.id, undefined, e.target.value)}
                                className="resize-none"
                                rows={3}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="glass-card rounded-xl p-6">
              <div className="text-center">
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  size="lg"
                  className="gap-2 gradient-hero text-primary-foreground hover:opacity-90 px-8 py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      Submit Feedback
                      <Check className="h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Please complete all required questions before submitting
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="glass-card rounded-xl p-12 text-center animate-scale-in">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Thank You!
            </h1>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully. Your input helps improve teaching quality.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
