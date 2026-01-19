import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  accessCodesApi,
  facultyApi,
  questionsApi,
  submissionsApi,
  AccessCode,
  Faculty,
  Question,
} from '@/lib/storage';

type Step = 'access' | 'feedback' | 'success';

interface FeedbackResponse {
  questionId: string;
  rating?: number;
  comment?: string;
}

export const AnonymousFeedback: React.FC = () => {
  const [step, setStep] = useState<Step>('access');
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const [validatedCode, setValidatedCode] = useState<AccessCode | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group questions by category
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  const categories = Object.keys(groupedQuestions);
  const currentCategory = categories[currentQuestionIndex] || '';
  const currentCategoryQuestions = groupedQuestions[currentCategory] || [];

  // Auto-save every 30 seconds
  useEffect(() => {
    if (step !== 'feedback' || responses.length === 0) return;

    const saveInterval = setInterval(() => {
      localStorage.setItem('ffs_draft_feedback', JSON.stringify({
        codeId: validatedCode?.id,
        responses,
        timestamp: Date.now(),
      }));
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [step, responses, validatedCode?.id]);

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

  const validateAccessCode = async () => {
    if (!accessCode.trim()) {
      setCodeError('Please enter an access code');
      return;
    }

    setIsValidating(true);
    setCodeError('');

    try {
      const code = await accessCodesApi.getByCode(accessCode.trim().toUpperCase());

      if (!code) {
        setCodeError('Invalid access code. Please check and try again.');
        return;
      }

      if (code.used) {
        setCodeError('This access code has already been used.');
        return;
      }

      if (new Date(code.expiresAt) < new Date()) {
        setCodeError('This access code has expired.');
        return;
      }

      // Get faculty and questions
      const [allFaculty, qs] = await Promise.all([
        facultyApi.getByCollege(code.collegeId),
        questionsApi.getByCollege(code.collegeId),
      ]);

      const facultyMember = allFaculty.find(f => f.id === code.facultyId);

      if (!facultyMember) {
        setCodeError('Unable to find faculty information.');
        return;
      }

      setValidatedCode(code);
      setFaculty(facultyMember);
      setQuestions(qs);
      setResponses(qs.map(q => ({ questionId: q.id })));
      setStep('feedback');
    } catch (error) {
      setCodeError('An error occurred. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const updateResponse = useCallback((questionId: string, rating?: number, comment?: string) => {
    setResponses(prev =>
      prev.map(r =>
        r.questionId === questionId
          ? { ...r, rating: rating ?? r.rating, comment: comment ?? r.comment }
          : r
      )
    );
  }, []);

  const canProceed = () => {
    const requiredQuestions = currentCategoryQuestions.filter(q => q.required);
    return requiredQuestions.every(q => {
      const response = responses.find(r => r.questionId === q.id);
      return response?.rating !== undefined;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < categories.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validatedCode || !faculty) return;

    setIsSubmitting(true);

    try {
      await submissionsApi.create({
        cycleId: validatedCode.cycleId,
        facultyId: faculty.id,
        collegeId: validatedCode.collegeId,
        accessCodeId: validatedCode.id,
        responses: responses.filter(r => r.rating !== undefined),
      });

      await accessCodesApi.markUsed(validatedCode.id);
      localStorage.removeItem('ffs_draft_feedback');
      setStep('success');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestionIndex + 1) / categories.length) * 100;

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
        {/* Access Code Step */}
        {step === 'access' && (
          <div className="glass-card rounded-xl p-8 animate-fade-up">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Enter Your Access Code
              </h1>
              <p className="text-muted-foreground">
                Enter the unique code provided to submit anonymous feedback
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">Access Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="e.g., ABC123"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="h-14 text-center text-2xl tracking-widest font-mono"
                  maxLength={10}
                />
              </div>

              {codeError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-scale-in">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {codeError}
                </div>
              )}

              <Button
                onClick={validateAccessCode}
                className="w-full h-12 gradient-hero text-primary-foreground hover:opacity-90"
                disabled={isValidating}
              >
                {isValidating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating...
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">
                ← Back to Home
              </Link>
            </p>
          </div>
        )}

        {/* Feedback Step */}
        {step === 'feedback' && faculty && (
          <div className="space-y-6 animate-fade-up">
            {/* Progress */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  Step {currentQuestionIndex + 1} of {categories.length}
                </span>
                <span className="text-sm text-muted-foreground">{currentCategory}</span>
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

            {/* Questions */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                {currentCategory}
              </h3>

              <div className="space-y-8">
                {currentCategoryQuestions.map((question, index) => {
                  const response = responses.find(r => r.questionId === question.id);

                  return (
                    <div
                      key={question.id}
                      className="space-y-4 animate-fade-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}.
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

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {currentQuestionIndex < categories.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="gap-2 gradient-hero text-primary-foreground hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Feedback
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
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
            <p className="text-muted-foreground mb-8">
              Your feedback has been submitted successfully. Your input helps improve teaching quality.
            </p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};
