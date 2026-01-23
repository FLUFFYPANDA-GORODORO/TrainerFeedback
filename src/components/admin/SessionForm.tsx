import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { departmentsApi, facultyApi, feedbackSessionsApi, Department, Faculty } from '@/lib/storage';
import { getAcademicConfig } from '@/lib/academicConfig';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courseData, setCourseData] = useState({});
  const [subjectsData, setSubjectsData] = useState({});
  const [departmentData, setDepartmentData] = useState<Record<string, { years: string[], subjects: Record<string, string[]>, batches: string[] }>>({});

  // Form state
  const [course, setCourse] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [batch, setBatch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (open && user?.collegeId) {
      loadData();
    }
  }, [open, user?.collegeId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, fac, config] = await Promise.all([
        departmentsApi.getByCollege(user!.collegeId!),
        facultyApi.getByCollege(user!.collegeId!),
        getAcademicConfig(user!.collegeId!)
      ]);

      setDepartments(depts);
      setFaculty(fac);
      setCourseData(config.courseData);
      setSubjectsData(config.subjectsData);

      // Build department data
      const deptData: Record<string, { years: string[], subjects: Record<string, string[]>, batches: string[] }> = {};
      Object.keys(config.courseData).forEach(course => {
        config.courseData[course].departments.forEach(dept => {
          if (!deptData[dept]) {
            deptData[dept] = {
              years: config.courseData[course].years,
              subjects: {},
              batches: ['A', 'B', 'C', 'D']
            };
          }
          config.courseData[course].years.forEach(year => {
            if (config.subjectsData[course] && config.subjectsData[course][year] && config.subjectsData[course][year][dept]) {
              deptData[dept].subjects[year] = config.subjectsData[course][year][dept];
            }
          });
        });
      });
      setDepartmentData(deptData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const availableYears = department ? departmentData[department]?.years || [] : [];
  const availableDepartments = course ? courseData[course as keyof typeof courseData]?.departments || [] : [];
  const availableSubjects = (department && academicYear)
    ? departmentData[department]?.subjects[academicYear] || []
    : [];
  const availableBatches = department ? departmentData[department]?.batches || [] : [];
  const availableFaculty = faculty.filter(f =>
    f.departmentId === departments.find(d => d.name === department)?.id &&
    (!subject || f.subjects.includes(subject))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.collegeId) return;

    setIsLoading(true);
    try {
      const selectedDept = departments.find(d => d.name === department);
      if (!selectedDept) throw new Error('Department not found');

      const uniqueUrl = `session-${crypto.randomUUID().slice(0, 8)}`;

      await feedbackSessionsApi.create({
        collegeId: user.collegeId,
        departmentId: selectedDept.id,
        facultyId: selectedFaculty,
        course,
        academicYear,
        subject,
        batch,
        accessMode: 'anonymous',
        uniqueUrl,
        isActive: true,
        expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      });

      toast.success('Feedback session created successfully!');
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setCourse('');
      setAcademicYear('');
      setDepartment('');
      setSubject('');
      setBatch('');
      setSelectedFaculty('');
      setExpiresAt('');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Feedback Session</DialogTitle>
          <DialogDescription>
            Set up a new feedback session for a specific academic context.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course/Program</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(courseData).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment} disabled={!course}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear} disabled={!course}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject} disabled={!department}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Select value={batch} onValueChange={setBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {availableBatches.map((b) => (
                  <SelectItem key={b} value={b}>Batch {b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty</Label>
            <Select value={selectedFaculty} onValueChange={setSelectedFaculty} disabled={!department}>
              <SelectTrigger>
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {availableFaculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} - {f.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for 30 days default expiry
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};