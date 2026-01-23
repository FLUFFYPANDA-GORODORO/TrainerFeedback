import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { facultyApi, departmentsApi, Department } from '@/lib/storage';
import { toast } from 'sonner';

interface FacultyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const FacultyForm: React.FC<FacultyFormProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    designation: '',
    specialization: '',
    experience: '',
    qualifications: '',
    researchInterests: '',
    publications: '',
    teachingSubjects: '',
    achievements: '',
    departmentId: '',
    subjects: '',
  });

  React.useEffect(() => {
    if (open && user?.collegeId) {
      loadDepartments();
    }
  }, [open, user?.collegeId]);

  const loadDepartments = async () => {
    try {
      const depts = await departmentsApi.getByCollege(user!.collegeId!);
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.employeeId.trim() || !formData.departmentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.collegeId) {
      toast.error('College information not found');
      return;
    }

    setIsLoading(true);
    try {
      await facultyApi.create({
        userId: '', // Will be set when user account is created
        employeeId: formData.employeeId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        designation: formData.designation.trim(),
        specialization: formData.specialization.trim(),
        experience: parseInt(formData.experience) || 0,
        qualifications: formData.qualifications.trim(),
        researchInterests: formData.researchInterests.split(',').map(s => s.trim()).filter(s => s),
        publications: parseInt(formData.publications) || 0,
        teachingSubjects: formData.teachingSubjects.split(',').map(s => s.trim()).filter(s => s),
        achievements: formData.achievements.split(',').map(s => s.trim()).filter(s => s),
        departmentId: formData.departmentId,
        collegeId: user.collegeId,
        subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
      });

      toast.success('Faculty member added successfully');
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        designation: '',
        specialization: '',
        experience: '',
        qualifications: '',
        researchInterests: '',
        publications: '',
        teachingSubjects: '',
        achievements: '',
        departmentId: '',
        subjects: '',
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating faculty:', error);
      toast.error('Failed to add faculty member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      designation: '',
      specialization: '',
      experience: '',
      qualifications: '',
      researchInterests: '',
      publications: '',
      teachingSubjects: '',
      achievements: '',
      departmentId: '',
      subjects: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Faculty Member</DialogTitle>
          <DialogDescription>
            Add a new faculty member to your college. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeId" className="text-right">
                Employee ID *
              </Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., FAC001"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Dr. John Smith"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., john.smith@college.edu"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department *
              </Label>
              <Select value={formData.departmentId} onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="designation" className="text-right">
                Designation
              </Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Assistant Professor"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialization" className="text-right">
                Specialization
              </Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Machine Learning, Data Structures"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience" className="text-right">
                Experience (years)
              </Label>
              <Input
                id="experience"
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., 5"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="qualifications" className="text-right">
                Qualifications
              </Label>
              <Input
                id="qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., PhD in Computer Science"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="publications" className="text-right">
                Publications
              </Label>
              <Input
                id="publications"
                type="number"
                value={formData.publications}
                onChange={(e) => setFormData(prev => ({ ...prev, publications: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., 15"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teachingSubjects" className="text-right">
                Teaching Subjects
              </Label>
              <Input
                id="teachingSubjects"
                value={formData.teachingSubjects}
                onChange={(e) => setFormData(prev => ({ ...prev, teachingSubjects: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Data Structures, Algorithms, AI (comma-separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subjects" className="text-right">
                Current Subjects
              </Label>
              <Input
                id="subjects"
                value={formData.subjects}
                onChange={(e) => setFormData(prev => ({ ...prev, subjects: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., CS101, CS201 (comma-separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="researchInterests" className="text-right">
                Research Interests
              </Label>
              <Input
                id="researchInterests"
                value={formData.researchInterests}
                onChange={(e) => setFormData(prev => ({ ...prev, researchInterests: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Machine Learning, IoT, Cybersecurity (comma-separated)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="achievements" className="text-right">
                Achievements
              </Label>
              <Input
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Best Teacher Award, Research Excellence (comma-separated)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Faculty Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyForm;