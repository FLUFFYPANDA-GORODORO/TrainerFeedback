import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Users,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  saveAcademicConfig, 
  getAcademicConfig 
} from '@/services/superadmin/academicService';

const AcademicConfigTab = ({ colleges }) => {
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [config, setConfig] = useState({ courses: {} });
  const [loading, setLoading] = useState(false);

  // Load Config
  useEffect(() => {
    if (selectedCollegeId) {
      loadConfig(selectedCollegeId);
    } else {
      setConfig({ courses: {} });
    }
  }, [selectedCollegeId]);

  const loadConfig = async (collegeId) => {
    setLoading(true);
    try {
      const data = await getAcademicConfig(collegeId);
      setConfig(data || { courses: {} });
    } catch (error) {
      toast.error('Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCollegeId) return;
    try {
      await saveAcademicConfig(selectedCollegeId, config);
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  // --- Recursive/Nested Update Handlers ---

  const addCourse = (name) => {
    if (!name.trim()) return;
    setConfig(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [name]: { departments: {} }
      }
    }));
  };

  const removeCourse = (courseName) => {
    const newCourses = { ...config.courses };
    delete newCourses[courseName];
    setConfig({ ...config, courses: newCourses });
  };

  const addDept = (courseName, deptName) => {
    if (!deptName.trim()) return;
    setConfig(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [courseName]: {
          ...prev.courses[courseName],
          departments: {
            ...prev.courses[courseName].departments,
            [deptName]: { years: {} }
          }
        }
      }
    }));
  };

  const removeDept = (courseName, deptName) => {
    const newDepts = { ...config.courses[courseName].departments };
    delete newDepts[deptName];
    setConfig(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [courseName]: {
          ...prev.courses[courseName],
          departments: newDepts
        }
      }
    }));
  };

  const addYear = (courseName, deptName, year) => {
    if (!year.trim()) return;
    setConfig(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [courseName]: {
          ...prev.courses[courseName],
          departments: {
            ...prev.courses[courseName].departments,
            [deptName]: {
              ...prev.courses[courseName].departments[deptName],
              years: {
                ...prev.courses[courseName].departments[deptName].years,
                [year]: { batches: [] }
              }
            }
          }
        }
      }
    }));
  };

  const removeYear = (courseName, deptName, year) => {
    const newYears = { ...config.courses[courseName].departments[deptName].years };
    delete newYears[year];
    setConfig(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [courseName]: {
          ...prev.courses[courseName],
          departments: {
            ...prev.courses[courseName].departments,
            [deptName]: {
              ...prev.courses[courseName].departments[deptName],
              years: newYears
            }
          }
        }
      }
    }));
  };

  const addBatch = (courseName, deptName, year, batch) => {
    if (!batch.trim()) return;
    const currentBatches = config.courses[courseName].departments[deptName].years[year].batches || [];
    if (currentBatches.includes(batch)) return;

    setConfig(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [courseName]: {
          ...prev.courses[courseName],
          departments: {
            ...prev.courses[courseName].departments,
            [deptName]: {
              ...prev.courses[courseName].departments[deptName],
              years: {
                ...prev.courses[courseName].departments[deptName].years,
                [year]: {
                  ...prev.courses[courseName].departments[deptName].years[year],
                  batches: [...currentBatches, batch]
                }
              }
            }
          }
        }
      }
    }));
  };

  const removeBatch = (courseName, deptName, year, batch) => {
    const currentBatches = config.courses[courseName].departments[deptName].years[year].batches || [];
    setConfig(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [courseName]: {
          ...prev.courses[courseName],
          departments: {
            ...prev.courses[courseName].departments,
            [deptName]: {
              ...prev.courses[courseName].departments[deptName],
              years: {
                ...prev.courses[courseName].departments[deptName].years,
                [year]: {
                  ...prev.courses[courseName].departments[deptName].years[year],
                  batches: currentBatches.filter(b => b !== batch)
                }
              }
            }
          }
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Academic Structure</h1>
          <p className="text-muted-foreground">Define courses, departments, years, and batches</p>
        </div>
        <div>
          <Button 
            onClick={handleSave} 
            disabled={!selectedCollegeId || loading}
            className="gap-2 gradient-hero text-primary-foreground"
          >
            <Save className="h-4 w-4" />
            Save Structure
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select College</CardTitle>
          <CardDescription>Choose the college to configure</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a college..." />
            </SelectTrigger>
            <SelectContent>
              {colleges.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCollegeId && (
        <div className="space-y-4 animate-fade-up">
          {/* Root Level: Courses */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Courses
            </h2>
            <Adder placeholder="New Course (e.g. B.Tech)" onAdd={addCourse} />
          </div>

          <div className="space-y-4 ml-2 border-l-2 border-primary/20 pl-4 py-2">
            {Object.entries(config.courses || {}).map(([courseName, courseData]) => (
              <div key={courseName} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground">{courseName}</h3>
                  <Button variant="ghost" size="icon" onClick={() => removeCourse(courseName)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Departments */}
                <div className="ml-4 pl-4 border-l-2 border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> Departments
                     </span>
                     <Adder placeholder="Add Dept (e.g. CSE)" onAdd={(val) => addDept(courseName, val)} size="sm" />
                  </div>

                  {Object.entries(courseData.departments || {}).map(([deptName, deptData]) => (
                    <div key={deptName} className="bg-secondary/10 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-lg text-primary">{deptName}</h4>
                        <Button variant="ghost" size="icon" onClick={() => removeDept(courseName, deptName)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Years */}
                      <div className="ml-4 space-y-3">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Years
                           </span>
                           <Adder placeholder="Add Year (e.g. 1)" onAdd={(val) => addYear(courseName, deptName, val)} size="xs" />
                        </div>

                        {Object.entries(deptData.years || {}).map(([year, yearData]) => (
                          <div key={year} className="flex items-start gap-4 p-2 rounded-md bg-background/50 border border-border/50">
                             <div className="flex items-center gap-2 min-w-[100px]">
                                <span className="font-medium text-sm">Year {year}</span>
                                <Button variant="ghost" size="icon" onClick={() => removeYear(courseName, deptName, year)} className="h-5 w-5 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                             </div>

                             {/* Batches */}
                             <div className="flex-1 flex flex-wrap gap-2 items-center">
                                <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Batches:</span>
                                </div>
                                {(yearData.batches || []).map((batch) => (
                                  <Badge key={batch} variant="secondary" className="hover:bg-destructive/10 cursor-default group">
                                    {batch}
                                    <button onClick={() => removeBatch(courseName, deptName, year, batch)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                  </Badge>
                                ))}
                                <Adder 
                                  placeholder="+ Batch" 
                                  onAdd={(val) => addBatch(courseName, deptName, year, val)} 
                                  size="xs" 
                                  minimal 
                                />
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(config.courses || {}).length === 0 && (
              <div className="text-muted-foreground italic text-sm">No courses defined. Add a course to start.</div>
            )}
          </div>
        </div>
      )}

      {!selectedCollegeId && (
         <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
           <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
           <h3 className="text-lg font-medium">No College Selected</h3>
           <p>Please select a college above to view and edit its academic configuration.</p>
         </div>
       )}
    </div>
  );
};

// Helper Component for adding items
const Adder = ({ placeholder, onAdd, size = 'default', minimal = false }) => {
  const [val, setVal] = useState('');
  
  const handleAdd = () => {
    if (val.trim()) {
      onAdd(val);
      setVal('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const height = size === 'xs' ? 'h-6 text-xs' : size === 'sm' ? 'h-8 text-sm' : 'h-10';
  const width = minimal ? 'w-20' : 'w-48';

  return (
    <div className="flex items-center gap-1">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${height} ${width} bg-background/50`}
      />
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={handleAdd} 
        className={`${height} w-${size === 'xs' ? '6' : '8'}`}
        disabled={!val.trim()}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AcademicConfigTab;
