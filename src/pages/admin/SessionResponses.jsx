import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsApi, feedbackApi, usersApi, questionsApi } from '@/lib/dataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, MessageSquare, Calendar, User, ExternalLink } from 'lucide-react';

const SessionResponses = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [trainer, setTrainer] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  const loadData = () => {
    try {
      // Get session
      const sessionData = sessionsApi.getById(sessionId);
      setSession(sessionData);

      if (sessionData) {
        // Get feedback for this session
        const sessionFeedback = feedbackApi.getBySession(sessionId);
        setFeedback(sessionFeedback);

        // Get trainer
        if (sessionData.trainerId) {
          const trainerData = usersApi.getById(sessionData.trainerId);
          setTrainer(trainerData);
        }

        // Get questions
        const allQuestions = questionsApi.getAll();
        setQuestions(allQuestions);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const copyFeedbackLink = () => {
    const url = `${window.location.origin}/feedback/anonymous/${session?.uniqueUrl}`;
    navigator.clipboard.writeText(url);
    alert('Feedback link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Session not found</h2>
        <Button onClick={handleGoBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Calculate average rating
  const avgRating = feedback.length > 0
    ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedback.length
    : 0;

  // Group responses by question
  const questionStats = {};
  questions.forEach(q => {
    questionStats[q.id] = { question: q.text, ratings: [], comments: [] };
  });
  feedback.forEach(f => {
    f.responses.forEach(r => {
      if (questionStats[r.questionId]) {
        if (r.rating) questionStats[r.questionId].ratings.push(r.rating);
        if (r.comment) questionStats[r.questionId].comments.push(r.comment);
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{session.topic}</CardTitle>
              <CardDescription>
                {session.course} • {session.specialization} • {session.batch} • {session.shift}
              </CardDescription>
            </div>
            <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="text-sm">
              {session.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{trainer?.name || 'Not assigned'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{feedback.length} responses</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{avgRating.toFixed(1)} avg rating</span>
            </div>
          </div>
          {session.status === 'active' && (
            <Button variant="outline" size="sm" className="mt-4" onClick={copyFeedbackLink}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy Feedback Link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedback.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 5.0</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">100%</div>
            <p className="text-sm text-muted-foreground">All responses complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Responses */}
      <Card>
        <CardHeader>
          <CardTitle>All Responses</CardTitle>
          <CardDescription>Individual feedback submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No responses yet</p>
            ) : (
              feedback.map((f, index) => (
                <div key={f.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Response #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{f.overallRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {f.responses.map((r, rIndex) => {
                      const question = questions.find(q => q.id === r.questionId);
                      return (
                        <div key={rIndex} className="text-sm">
                          <p className="text-muted-foreground">{question?.text || r.questionId}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {r.rating && (
                              <Badge variant="outline">Rating: {r.rating}/5</Badge>
                            )}
                            {r.comment && (
                              <span className="italic">"{r.comment}"</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Submitted: {new Date(f.submittedAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionResponses;
