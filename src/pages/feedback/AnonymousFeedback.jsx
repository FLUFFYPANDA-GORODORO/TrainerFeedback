import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsApi, feedbackApi, questionsApi, usersApi } from '@/lib/dataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Star, CheckCircle, AlertCircle } from 'lucide-react';

export const AnonymousFeedback = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    checkPreviousSubmission();
  }, [sessionId]);

  const loadData = () => {
    try {
      // Find session by unique URL
      const allSessions = sessionsApi.getAll();
      const foundSession = allSessions.find(s => s.uniqueUrl === sessionId || s.id === sessionId);
      
      if (!foundSession) {
        setError('Session not found');
        setIsLoading(false);
        return;
      }

      if (foundSession.status !== 'active') {
        setError('This feedback session is no longer active');
        setIsLoading(false);
        return;
      }

      setSession(foundSession);

      // Get trainer info
      if (foundSession.trainerId) {
        const trainerData = usersApi.getById(foundSession.trainerId);
        setTrainer(trainerData);
      }

      // Get questions
      const allQuestions = questionsApi.getAll();
      setQuestions(allQuestions.filter(q => q.isActive));
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load feedback form');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPreviousSubmission = () => {
    // Check localStorage for previous submission
    const submittedKey = `feedback_submitted_${sessionId}`;
    if (localStorage.getItem(submittedKey)) {
      setIsSubmitted(true);
    }
  };

  const handleRatingChange = (questionId, rating) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating: parseInt(rating) }
    }));
  };

  const handleCommentChange = (questionId, comment) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], comment }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required questions
      const requiredQuestions = questions.filter(q => q.required);
      for (const q of requiredQuestions) {
        if (!responses[q.id]?.rating) {
          setError(`Please answer all required questions`);
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate overall rating
      const ratings = Object.values(responses).filter(r => r.rating).map(r => r.rating);
      const overallRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0;

      // Format responses
      const formattedResponses = questions.map(q => ({
        questionId: q.id,
        questionCategory: q.category,
        rating: responses[q.id]?.rating || null,
        comment: responses[q.id]?.comment || null
      }));

      // Submit feedback
      feedbackApi.create({
        sessionId: session.id,
        trainerId: session.trainerId,
        responses: formattedResponses,
        overallRating
      });

      // Mark as submitted in localStorage
      localStorage.setItem(`feedback_submitted_${sessionId}`, 'true');
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to Load Form</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-4">
                Your feedback has been submitted successfully.
              </p>
              <p className="text-sm text-muted-foreground">
                Your response helps improve the quality of training.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-hero">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Trainer Feedback Form</h1>
          <p className="text-muted-foreground">
            Your feedback is anonymous and helps improve training quality
          </p>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{session?.topic}</CardTitle>
            <CardDescription>
              {session?.course} • {session?.specialization} • {session?.batch}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="text-muted-foreground">Trainer: </span>
              <span className="font-medium">{trainer?.name || 'Not specified'}</span>
            </p>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Label className="text-base font-medium">
                        {index + 1}. {question.text}
                        {question.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>

                    {/* Rating */}
                    {(question.responseType === 'rating' || question.responseType === 'both') && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Rate from 1 (Poor) to 5 (Excellent)</p>
                        <RadioGroup
                          value={responses[question.id]?.rating?.toString() || ''}
                          onValueChange={(value) => handleRatingChange(question.id, value)}
                          className="flex gap-2"
                        >
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <label
                              key={rating}
                              className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 cursor-pointer transition-all ${
                                responses[question.id]?.rating === rating
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <RadioGroupItem value={rating.toString()} className="sr-only" />
                              <Star
                                className={`h-5 w-5 ${
                                  responses[question.id]?.rating >= rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                              <span className="text-xs mt-1">{rating}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Comment */}
                    {(question.responseType === 'text' || question.responseType === 'both') && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Share your thoughts..."
                          value={responses[question.id]?.comment || ''}
                          onChange={(e) => handleCommentChange(question.id, e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="w-full max-w-md gradient-hero text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Submitting...
                </div>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Your response is completely anonymous
          </p>
        </form>
      </div>
    </div>
  );
};
