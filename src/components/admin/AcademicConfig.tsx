import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAcademicConfig, saveAcademicConfig } from '@/lib/academicConfig';

interface Batch {
  name: string;
}

interface Subject {
  name: string;
}

interface Department {
  name: string;
  subjects: Subject[];
  batches: Batch[];
}

interface Year {
  name: string;
  departments: Department[];
}

interface Course {
  name: string;
  years: Year[];
}

interface CourseData {
  [courseName: string]: {
    years: string[];
    departments: string[];
  };
}

interface SubjectsData {
  [courseName: string]: {
    [yearName: string]: {
      [deptName: string]: string[];
    };
  };
}

interface AcademicConfigData {
  courseData: CourseData;
  subjectsData: SubjectsData;
}

const buildCoursesFromConfig = (config: AcademicConfigData): Course[] => {
  const courses: Course[] = [];
  const courseData = config.courseData || {};
  const subjectsData = config.subjectsData || {};

  Object.keys(courseData).forEach(courseName => {
    const courseInfo = courseData[courseName];
    const years: Year[] = [];

    (courseInfo.years || []).forEach((yearName: string) => {
      const departments: Department[] = [];

      (courseInfo.departments || []).forEach((deptName: string) => {
        const subjects: Subject[] = [];
        const batches: Batch[] = [];

        // Get subjects for this course-year-dept
        if (subjectsData[courseName] && subjectsData[courseName][yearName] && subjectsData[courseName][yearName][deptName]) {
          subjectsData[courseName][yearName][deptName].forEach((subj: string) => {
            subjects.push({ name: subj });
          });
        }

        // Batches are per department, assume from config or default
        // For now, since batches are not in subjectsData, perhaps add a batches field in config
        // But in the data, batches are hardcoded as ['A','B','C','D']
        ['A', 'B', 'C', 'D'].forEach(b => batches.push({ name: b }));

        departments.push({
          name: deptName,
          subjects,
          batches
        });
      });

      years.push({
        name: yearName,
        departments
      });
    });

    courses.push({
      name: courseName,
      years
    });
  });

  return courses;
};

interface AcademicConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AcademicConfig: React.FC<AcademicConfigProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!user?.collegeId) return;
    
    setLoading(true);
    try {
      const { courseData, subjectsData } = await getAcademicConfig(user.collegeId);
      const loadedCourses = buildCoursesFromConfig({ courseData, subjectsData });
      setCourses(loadedCourses);
    } catch (error) {
      console.error('Error loading config:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.collegeId]);

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open, loadConfig]);

  const saveConfig = async () => {
    if (!user?.collegeId) return;

    setLoading(true);
    const courseData: CourseData = {};
    const subjectsData: SubjectsData = {};

    courses.forEach(course => {
      courseData[course.name] = {
        years: course.years.map(y => y.name),
        departments: course.years.flatMap(y => y.departments.map(d => d.name)).filter((v, i, a) => a.indexOf(v) === i)
      };

      subjectsData[course.name] = {};
      course.years.forEach(year => {
        subjectsData[course.name][year.name] = {};
        year.departments.forEach(dept => {
          subjectsData[course.name][year.name][dept.name] = dept.subjects.map(s => s.name);
        });
      });
    });

    const success = await saveAcademicConfig(user.collegeId, courseData, subjectsData);
    if (success) {
      toast.success('Academic configuration saved successfully!');
      onSuccess?.();
      onOpenChange(false);
    } else {
      toast.error('Failed to save academic configuration');
    }
    setLoading(false);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const addCourse = () => {
    const name = prompt('Enter course name:');
    if (name) {
      setCourses([...courses, { name, years: [] }]);
    }
  };

  const editCourse = (index: number) => {
    const name = prompt('Enter new course name:', courses[index].name);
    if (name) {
      const newCourses = [...courses];
      newCourses[index].name = name;
      setCourses(newCourses);
    }
  };

  const deleteCourse = (index: number) => {
    if (confirm('Delete this course and all its content?')) {
      setCourses(courses.filter((_, i) => i !== index));
    }
  };

  const addYear = (courseIndex: number) => {
    const name = prompt('Enter year name:');
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years.push({ name, departments: [] });
      setCourses(newCourses);
    }
  };

  const editYear = (courseIndex: number, yearIndex: number) => {
    const name = prompt('Enter new year name:', courses[courseIndex].years[yearIndex].name);
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].name = name;
      setCourses(newCourses);
    }
  };

  const deleteYear = (courseIndex: number, yearIndex: number) => {
    if (confirm('Delete this year and all its content?')) {
      const newCourses = [...courses];
      newCourses[courseIndex].years.splice(yearIndex, 1);
      setCourses(newCourses);
    }
  };

  const addDepartment = (courseIndex: number, yearIndex: number) => {
    const name = prompt('Enter department name:');
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].departments.push({ name, subjects: [], batches: [] });
      setCourses(newCourses);
    }
  };

  const editDepartment = (courseIndex: number, yearIndex: number, deptIndex: number) => {
    const name = prompt('Enter new department name:', courses[courseIndex].years[yearIndex].departments[deptIndex].name);
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].departments[deptIndex].name = name;
      setCourses(newCourses);
    }
  };

  const deleteDepartment = (courseIndex: number, yearIndex: number, deptIndex: number) => {
    if (confirm('Delete this department and all its content?')) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].departments.splice(deptIndex, 1);
      setCourses(newCourses);
    }
  };

  const addSubject = (courseIndex: number, yearIndex: number, deptIndex: number) => {
    const name = prompt('Enter subject name:');
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].departments[deptIndex].subjects.push({ name });
      setCourses(newCourses);
    }
  };

  const editSubject = (courseIndex: number, yearIndex: number, deptIndex: number, subjIndex: number) => {
    const name = prompt('Enter new subject name:', courses[courseIndex].years[yearIndex].departments[deptIndex].subjects[subjIndex].name);
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].departments[deptIndex].subjects[subjIndex].name = name;
      setCourses(newCourses);
    }
  };

  const deleteSubject = (courseIndex: number, yearIndex: number, deptIndex: number, subjIndex: number) => {
    const newCourses = [...courses];
    newCourses[courseIndex].years[yearIndex].departments[deptIndex].subjects.splice(subjIndex, 1);
    setCourses(newCourses);
  };

  const addBatch = (courseIndex: number, yearIndex: number, deptIndex: number) => {
    const name = prompt('Enter batch name:');
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].departments[deptIndex].batches.push({ name });
      setCourses(newCourses);
    }
  };

  const editBatch = (courseIndex: number, yearIndex: number, deptIndex: number, batchIndex: number) => {
    const name = prompt('Enter new batch name:', courses[courseIndex].years[yearIndex].departments[deptIndex].batches[batchIndex].name);
    if (name) {
      const newCourses = [...courses];
      newCourses[courseIndex].years[yearIndex].departments[deptIndex].batches[batchIndex].name = name;
      setCourses(newCourses);
    }
  };

  const deleteBatch = (courseIndex: number, yearIndex: number, deptIndex: number, batchIndex: number) => {
    const newCourses = [...courses];
    newCourses[courseIndex].years[yearIndex].departments[deptIndex].batches.splice(batchIndex, 1);
    setCourses(newCourses);
  };

  const renderTree = () => {
    return courses.map((course, courseIndex) => (
      <div key={courseIndex} className="mb-4">
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
          <Button variant="ghost" size="sm" onClick={() => toggleExpanded(`course-${courseIndex}`)}>
            {expanded.has(`course-${courseIndex}`) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <span className="font-medium">{course.name}</span>
          <Button variant="ghost" size="sm" onClick={() => editCourse(courseIndex)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => deleteCourse(courseIndex)}><Trash2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => addYear(courseIndex)}><Plus className="h-4 w-4" /></Button>
        </div>
        {expanded.has(`course-${courseIndex}`) && (
          <div className="ml-6">
            {course.years.map((year, yearIndex) => (
              <div key={yearIndex} className="mb-2">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <Button variant="ghost" size="sm" onClick={() => toggleExpanded(`year-${courseIndex}-${yearIndex}`)}>
                    {expanded.has(`year-${courseIndex}-${yearIndex}`) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <span>{year.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => editYear(courseIndex, yearIndex)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteYear(courseIndex, yearIndex)}><Trash2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => addDepartment(courseIndex, yearIndex)}><Plus className="h-4 w-4" /></Button>
                </div>
                {expanded.has(`year-${courseIndex}-${yearIndex}`) && (
                  <div className="ml-6">
                    {year.departments.map((dept, deptIndex) => (
                      <div key={deptIndex} className="mb-2">
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                          <Button variant="ghost" size="sm" onClick={() => toggleExpanded(`dept-${courseIndex}-${yearIndex}-${deptIndex}`)}>
                            {expanded.has(`dept-${courseIndex}-${yearIndex}-${deptIndex}`) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <span>{dept.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => editDepartment(courseIndex, yearIndex, deptIndex)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteDepartment(courseIndex, yearIndex, deptIndex)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        {expanded.has(`dept-${courseIndex}-${yearIndex}-${deptIndex}`) && (
                          <div className="ml-6 space-y-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">Subjects:</span>
                                <Button variant="ghost" size="sm" onClick={() => addSubject(courseIndex, yearIndex, deptIndex)}><Plus className="h-3 w-3" /></Button>
                              </div>
                              {dept.subjects.map((subj, subjIndex) => (
                                <div key={subjIndex} className="flex items-center gap-2 p-1 bg-purple-50 rounded ml-4">
                                  <span className="text-sm">{subj.name}</span>
                                  <Button variant="ghost" size="sm" onClick={() => editSubject(courseIndex, yearIndex, deptIndex, subjIndex)}><Edit className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteSubject(courseIndex, yearIndex, deptIndex, subjIndex)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">Batches:</span>
                                <Button variant="ghost" size="sm" onClick={() => addBatch(courseIndex, yearIndex, deptIndex)}><Plus className="h-3 w-3" /></Button>
                              </div>
                              {dept.batches.map((batch, batchIndex) => (
                                <div key={batchIndex} className="flex items-center gap-2 p-1 bg-red-50 rounded ml-4">
                                  <span className="text-sm">{batch.name}</span>
                                  <Button variant="ghost" size="sm" onClick={() => editBatch(courseIndex, yearIndex, deptIndex, batchIndex)}><Edit className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteBatch(courseIndex, yearIndex, deptIndex, batchIndex)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Academic Configuration</DialogTitle>
          <DialogDescription>
            Configure the academic structure: Course - Year - Department - Subject - Batch
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Academic Structure Tree</h3>
            <Button onClick={addCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
          <div className="border rounded-lg p-4 min-h-[400px]">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading configuration...</p>
            ) : courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No courses added yet. Click "Add Course" to start building the academic structure.</p>
            ) : (
              renderTree()
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={saveConfig} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { AcademicConfig };
export default AcademicConfig;