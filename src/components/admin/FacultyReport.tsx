import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { facultyApi, submissionsApi, questionsApi, Faculty, FeedbackSubmission, Question } from '@/lib/storage';
import { format } from 'date-fns';
import { Star, Users, MessageSquare, TrendingUp, Download } from 'lucide-react';

interface FacultyReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FacultyStats {
  totalResponses: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  questionAverages: { [questionId: string]: { average: number; count: number; question: Question } };
  recentComments: { comment: string; date: Date; sessionName?: string }[];
}

const FacultyReport: React.FC<FacultyReportProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user?.collegeId) {
      loadFaculty();
    }
  }, [open, user?.collegeId]);

  useEffect(() => {
    if (selectedFacultyId) {
      generateReport();
    }
  }, [selectedFacultyId]);

  const loadFaculty = async () => {
    try {
      const fac = await facultyApi.getByCollege(user!.collegeId!);
      setFaculty(fac);
    } catch (error) {
      console.error('Error loading faculty:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedFacultyId) return;

    setIsLoading(true);
    try {
      // Get submissions for this faculty
      const submissions = await submissionsApi.getByFaculty(selectedFacultyId);

      // Get all questions
      const questions = await questionsApi.getByCollege(user!.collegeId!);
      const questionMap = new Map(questions.map(q => [q.id, q]));

      // Calculate stats
      const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const questionAverages: { [questionId: string]: { average: number; count: number; question: Question } } = {};
      const recentComments: { comment: string; date: Date; sessionName?: string }[] = [];

      let totalRating = 0;
      let totalResponses = 0;

      submissions.forEach(submission => {
        submission.responses.forEach(response => {
          const question = questionMap.get(response.questionId);
          if (!question) return;

          // Handle ratings
          if (response.rating !== undefined) {
            totalRating += response.rating;
            totalResponses++;

            if (ratingDistribution[response.rating] !== undefined) {
              ratingDistribution[response.rating]++;
            }

            // Track question averages
            if (!questionAverages[response.questionId]) {
              questionAverages[response.questionId] = { average: 0, count: 0, question };
            }
            questionAverages[response.questionId].average += response.rating;
            questionAverages[response.questionId].count++;
          }

          // Collect comments
          if (response.comment && response.comment.trim()) {
            recentComments.push({
              comment: response.comment,
              date: submission.submittedAt.toDate(),
            });
          }
        });
      });

      // Calculate averages
      Object.keys(questionAverages).forEach(questionId => {
        const qa = questionAverages[questionId];
        qa.average = qa.count > 0 ? qa.average / qa.count : 0;
      });

      // Sort comments by date (most recent first)
      recentComments.sort((a, b) => b.date.getTime() - a.date.getTime());

      setStats({
        totalResponses,
        averageRating: totalResponses > 0 ? totalRating / totalResponses : 0,
        ratingDistribution,
        questionAverages,
        recentComments: recentComments.slice(0, 10), // Show last 10 comments
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFaculty = faculty.find(f => f.id === selectedFacultyId);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Faculty Performance Report</DialogTitle>
          <DialogDescription>
            Generate detailed performance reports for individual faculty members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Faculty Selection */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty member" />
                </SelectTrigger>
                <SelectContent>
                  {faculty.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {stats && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Generating report...</p>
            </div>
          )}

          {stats && selectedFaculty && (
            <>
              {/* Faculty Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {selectedFaculty.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Designation</p>
                      <p className="font-medium">{selectedFaculty.designation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedFaculty.specialization}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">{selectedFaculty.experience} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Publications</p>
                      <p className="font-medium">{selectedFaculty.publications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Average Rating</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      {renderStars(stats.averageRating)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{stats.totalResponses}</p>
                        <p className="text-xs text-muted-foreground">Total Responses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{stats.recentComments.length}</p>
                        <p className="text-xs text-muted-foreground">Recent Comments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rating Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 min-w-[60px]">
                          {rating}
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        </div>
                        <Progress
                          value={(stats.ratingDistribution[rating] / stats.totalResponses) * 100}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground min-w-[40px]">
                          {stats.ratingDistribution[rating]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Question-wise Analysis */}
              {Object.keys(stats.questionAverages).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Question-wise Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.values(stats.questionAverages)
                        .sort((a, b) => a.question.order - b.question.order)
                        .map(({ question, average, count }) => (
                        <div key={question.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{question.text}</p>
                            <Badge variant="secondary">{question.category}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {renderStars(average)}
                              <span className="text-sm font-medium ml-2">
                                {average.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ({count} responses)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Comments */}
              {stats.recentComments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.recentComments.map((item, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <p className="text-sm italic">"{item.comment}"</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(item.date, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyReport;