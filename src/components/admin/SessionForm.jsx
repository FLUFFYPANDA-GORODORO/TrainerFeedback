import React, { useState, useEffect } from 'react';
import { sessionsApi, usersApi, academicConfigApi } from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const SessionForm = ({ collegeId, defaultTrainerId, onSuccess, onCancel }) => {
  const [trainers, setTrainers] = useState([]);
  const [academicConfig, setAcademicConfig] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    trainerId: defaultTrainerId || '',
    topic: '',
    course: '',
    specialization: '',
    batch: '',
    shift: 'Morning',
    day: ''
  });

  // Default fallback data in case config is missing
  const fallbackCourses = ['B.Tech', 'M.Tech', 'MBA', 'MCA', 'BBA', 'BCA'];
  const fallbackSpecializations = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'AI&ML', 'Data Science'];
  const fallbackBatches = ['2022-2026', '2023-2027', '2024-2028', '2025-2029'];
  const fallbackShifts = ['Morning', 'Afternoon', 'Evening'];

  const courses = academicConfig?.courses?.length > 0 ? academicConfig.courses : fallbackCourses;
  const specializations = academicConfig?.specializations?.length > 0 ? academicConfig.specializations : fallbackSpecializations;
  const batches = academicConfig?.batches?.length > 0 ? academicConfig.batches : fallbackBatches;
  const shifts = academicConfig?.shifts?.length > 0 ? academicConfig.shifts : fallbackShifts;

  useEffect(() => {
    loadData();
  }, [collegeId]);

  // Update trainerId if defaultTrainerId prop changes
  useEffect(() => {
    if (defaultTrainerId) {
        setFormData(prev => ({ ...prev, trainerId: defaultTrainerId }));
    }
  }, [defaultTrainerId]);

  const loadData = () => {
    try {
      // Get trainers for this college (only if we need to select one)
      if (!defaultTrainerId && collegeId) {
          const allUsers = usersApi.getAll();
          const collegeTrainers = allUsers.filter(u => 
            u.role === 'trainer' && u.collegeId === collegeId
          );
          setTrainers(collegeTrainers);
      }

      // Get academic config
      const config = academicConfigApi.getActive();
      setAcademicConfig(config || {});
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting session form:', formData);
    
    // Validation
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    if (!collegeId) {
        toast.error('College ID is missing. Cannot create session.');
        console.error('Missing collegeId');
        return;
    }
    
    // Use default trainer ID if provided, otherwise check selection
    const finalTrainerId = defaultTrainerId || formData.trainerId;
    if (!finalTrainerId) {
      toast.error('Please select a trainer');
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionData = {
        ...formData,
        trainerId: finalTrainerId,
        collegeId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      console.log('Creating session with data:', sessionData);
      sessionsApi.create(sessionData);
      
      toast.success('Session created successfully');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="topic">Topic *</Label>
          <Input
            id="topic"
            value={formData.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder="e.g., Introduction to Machine Learning"
            required
          />
        </div>

        {/* Only show trainer select if no default trainer provided */}
        {!defaultTrainerId && (
            <div className="space-y-2">
            <Label htmlFor="trainer">Trainer *</Label>
            <Select 
                value={formData.trainerId} 
                onValueChange={(v) => handleChange('trainerId', v)}
            >
                <SelectTrigger>
                <SelectValue placeholder="Select trainer" />
                </SelectTrigger>
                <SelectContent>
                {trainers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <Select 
            value={formData.course} 
            onValueChange={(v) => handleChange('course', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Select 
            value={formData.specialization} 
            onValueChange={(v) => handleChange('specialization', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              {specializations.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch">Batch</Label>
          <Select 
            value={formData.batch} 
            onValueChange={(v) => handleChange('batch', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shift">Shift</Label>
          <Select 
            value={formData.shift} 
            onValueChange={(v) => handleChange('shift', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="day">Day (Optional)</Label>
          <Input
            id="day"
            type="date"
            value={formData.day}
            onChange={(e) => handleChange('day', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="gradient-hero text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
};
