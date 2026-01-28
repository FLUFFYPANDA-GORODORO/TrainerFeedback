import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { feedbackSessionsApi, facultyApi, departmentsApi, FeedbackSession, Faculty, Department } from '@/lib/storage';
import { Edit, ExternalLink, Copy, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SessionTableProps {
  sessions: FeedbackSession[];
  faculty: Faculty[];
  departments: Department[];
  onEdit?: (session: FeedbackSession) => void;
  onRefresh?: () => void;
}

export const SessionTable: React.FC<SessionTableProps> = ({
  sessions,
  faculty,
  departments,
  onEdit,
  onRefresh
}) => {
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const handleToggleActive = async (session: FeedbackSession) => {
    setUpdatingIds(prev => new Set(prev).add(session.id));
    try {
      await feedbackSessionsApi.update(session.id, { isActive: !session.isActive });
      toast.success(`Session ${!session.isActive ? 'activated' : 'deactivated'}`);
      onRefresh?.();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(session.id);
        return newSet;
      });
    }
  };

  const handleCopyUrl = (session: FeedbackSession) => {
    const url = `${window.location.origin}/feedback/anonymous/${session.uniqueUrl}`;
    navigator.clipboard.writeText(url);
    toast.success('Feedback URL copied to clipboard');
  };

  const handleDelete = async (session: FeedbackSession) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await feedbackSessionsApi.delete(session.id);
      toast.success('Session deleted successfully');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const getFacultyName = (facultyId: string) => {
    const fac = faculty.find(f => f.id === facultyId);
    return fac ? `${fac.name} (${fac.designation})` : 'Unknown Faculty';
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Sessions Found</h3>
            <p className="text-sm text-muted-foreground">
              Create your first feedback session to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {session.course} - {session.subject}
                  <Badge variant={session.isActive ? 'default' : 'secondary'}>
                    {session.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  <p><strong>Academic Year:</strong> {session.academicYear}</p>
                  <p><strong>Department:</strong> {getDepartmentName(session.departmentId)}</p>
                  <p><strong>Batch:</strong> {session.batch}</p>
                  <p><strong>Faculty:</strong> {getFacultyName(session.facultyId)}</p>
                  <p><strong>Expires:</strong> {format(session.expiresAt.toDate(), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant={session.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(session)}
                  disabled={updatingIds.has(session.id)}
                >
                  {updatingIds.has(session.id) ? 'Updating...' : session.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(session)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/feedback/anonymous/${session.uniqueUrl}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/admin/sessions/${session.id}/responses`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Responses
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(session)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(session)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};