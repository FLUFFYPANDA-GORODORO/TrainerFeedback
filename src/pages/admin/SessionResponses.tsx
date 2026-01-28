import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Star } from 'lucide-react';
import { feedbackSessionsApi, submissionsApi, questionsApi, FeedbackSubmission, Question, FeedbackSession } from '@/lib/storage';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SessionResponses: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.pathname.includes('super-admin') ? '/super-admin/sessions' : '/admin/sessions';
  const [session, setSession] = useState<FeedbackSession | null>(null);
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!sessionId) return;

    const loadData = async () => {
      try {
        const [sessionData, submissionsData, questionsData] = await Promise.all([
          feedbackSessionsApi.getById(sessionId),
          submissionsApi.getBySession(sessionId),
          questionsApi.getAll()
        ]);

        setSession(sessionData);
        setSubmissions(submissionsData);
        setQuestions(questionsData.filter(q => q.collegeId === sessionData?.collegeId));
      } catch (error) {
        console.error('Error loading session responses:', error);
        toast.error('Failed to load session responses');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sessionId]);

  const getQuestionText = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    return question?.text || 'Unknown Question';
  };

  const getResponseValue = (response: FeedbackSubmission['responses'][0]) => {
    if (response.rating !== undefined) return `${response.rating}/5`;
    if (response.comment) return response.comment;
    if (response.selectValue) return response.selectValue;
    if (response.booleanValue !== undefined) return response.booleanValue ? 'Yes' : 'No';
    return 'No response';
  };

  const calculateAverageRating = () => {
    const ratings = submissions.flatMap(sub =>
      sub.responses.filter(r => r.rating !== undefined).map(r => r.rating!)
    );
    if (ratings.length === 0) return 0;
    return (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1);
  };

  const exportToCSV = () => {
    if (!session || submissions.length === 0) return;

    const headers = ['Submission ID', 'Submitted At', ...questions.map(q => q.text)];
    const rows = submissions.map(sub => [
      sub.id,
      format(sub.submittedAt.toDate(), 'yyyy-MM-dd HH:mm:ss'),
      ...questions.map(q => {
        const response = sub.responses.find(r => r.questionId === q.id);
        return response ? getResponseValue(response) : '';
      })
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `session-responses-${session.subject}-${session.batch}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paginatedSubmissions = submissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(submissions.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session responses...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center  min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Session Not Found</h3>
          <Button onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Combined Header Container */}
      <div className="relative py-4">
        {/* Back Button - Left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <Button variant="ghost" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
        
        {/* Export Button - Right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <Button onClick={exportToCSV} disabled={submissions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        {/* Centered Session Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {session.course} - {session.subject}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-muted-foreground">
            <span>{session.academicYear}</span>
            <span>•</span>
            <span>Batch {session.batch}</span>
            <span>•</span>
            <Badge variant={session.isActive ? "default" : "secondary"}>
              {session.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs for Super Admin View */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 mt-6">
          {/* Session Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{submissions.length}</div>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 fill-current" />
                    {calculateAverageRating()}
                  </div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{questions.length}</div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Session Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Course:</span>
                  <span>{session.course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Subject:</span>
                  <span>{session.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Batch:</span>
                  <span>{session.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Academic Year:</span>
                  <span>{session.academicYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={session.isActive ? "default" : "secondary"}>
                    {session.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6 mt-6">
          {/* Responses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Responses</CardTitle>
            </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No responses received for this session yet.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission ID</TableHead>
                    <TableHead>Submitted At</TableHead>
                    {questions.map(q => (
                      <TableHead key={q.id}>{q.text}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubmissions.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-sm">{sub.id.slice(-8)}</TableCell>
                      <TableCell>{format(sub.submittedAt.toDate(), 'MMM d, yyyy HH:mm')}</TableCell>
                      {questions.map(q => {
                        const response = sub.responses.find(r => r.questionId === q.id);
                        return (
                          <TableCell key={q.id}>
                            {response ? (
                              <div className="max-w-xs">
                                {response.rating !== undefined && (
                                  <Badge variant="secondary" className="mr-2">
                                    {response.rating}/5
                                  </Badge>
                                )}
                                {response.comment && (
                                  <span className="text-sm">{response.comment}</span>
                                )}
                                {response.selectValue && (
                                  <span className="text-sm">{response.selectValue}</span>
                                )}
                                {response.booleanValue !== undefined && (
                                  <Badge variant={response.booleanValue ? 'default' : 'destructive'}>
                                    {response.booleanValue ? 'Yes' : 'No'}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, submissions.length)} of {submissions.length} responses
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionResponses;