// Academic Configuration utilities for Faculty Insights Hub

import { academicConfigApi, AcademicConfig } from './storage';

// Default course data structure
const defaultCourseData: AcademicConfig['courseData'] = {
  'Engineering': {
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    departments: ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering'],
    semesters: ['Odd', 'Even'],
  },
  'MBA': {
    years: ['1st Year', '2nd Year'],
    departments: ['Business Administration', 'Finance & Accounting', 'Marketing & Sales'],
    semesters: ['Odd', 'Even'],
  },
  'MCA': {
    years: ['1st Year', '2nd Year'],
    departments: ['Computer Applications', 'Software Development'],
    semesters: ['Odd', 'Even'],
  },
  'BBA+MBA': {
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    departments: ['Business Administration', 'Finance & Accounting', 'Marketing & Sales'],
    semesters: ['Odd', 'Even'],
  },
  'BCA+MCA': {
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    departments: ['Computer Applications', 'Software Development'],
    semesters: ['Odd', 'Even'],
  },
};

// Default subjects data structure
const defaultSubjectsData: AcademicConfig['subjectsData'] = {
  'Engineering': {
    '1st Year': {
      'Computer Science & Engineering': ['Programming Fundamentals', 'Data Structures', 'Database Systems'],
      'Information Technology': ['Web Development', 'Networking', 'Software Engineering'],
      'Mechanical Engineering': ['Thermodynamics', 'Fluid Mechanics', 'Materials Science'],
    },
    '2nd Year': {
      'Computer Science & Engineering': ['Algorithms', 'Operating Systems', 'Computer Networks'],
      'Information Technology': ['Mobile Development', 'Cloud Computing', 'Cyber Security'],
      'Mechanical Engineering': ['Heat Transfer', 'Dynamics', 'Manufacturing Processes'],
    },
    '3rd Year': {
      'Computer Science & Engineering': ['Machine Learning', 'Distributed Systems', 'Software Architecture'],
      'Information Technology': ['Data Analytics', 'IoT', 'Blockchain'],
      'Mechanical Engineering': ['CAD/CAM', 'Robotics', 'Quality Control'],
    },
    '4th Year': {
      'Computer Science & Engineering': ['AI & Deep Learning', 'Big Data', 'Project Management'],
      'Information Technology': ['DevOps', 'Advanced Security', 'Digital Transformation'],
      'Mechanical Engineering': ['Advanced Manufacturing', 'Sustainable Energy', 'Project Management'],
    },
  },
  'MBA': {
    '1st Year': {
      'Business Administration': ['Management Principles', 'Business Ethics', 'Organizational Behavior'],
      'Finance & Accounting': ['Financial Accounting', 'Cost Accounting', 'Business Finance'],
      'Marketing & Sales': ['Marketing Management', 'Consumer Behavior', 'Sales Management'],
    },
    '2nd Year': {
      'Business Administration': ['Strategic Management', 'Human Resource Management', 'International Business'],
      'Finance & Accounting': ['Investment Analysis', 'Financial Markets', 'Corporate Finance'],
      'Marketing & Sales': ['Brand Management', 'Digital Marketing', 'Market Research'],
    },
  },
  'MCA': {
    '1st Year': {
      'Computer Applications': ['Advanced Programming', 'Data Structures', 'Database Management'],
      'Software Development': ['Software Engineering', 'Web Technologies', 'Mobile Apps'],
    },
    '2nd Year': {
      'Computer Applications': ['System Analysis', 'Network Security', 'Cloud Computing'],
      'Software Development': ['Agile Development', 'DevOps', 'Quality Assurance'],
    },
  },
  'BBA+MBA': {
    '1st Year': {
      'Business Administration': ['Business Communication', 'Principles of Management', 'Business Law'],
      'Finance & Accounting': ['Financial Literacy', 'Basic Accounting', 'Business Mathematics'],
      'Marketing & Sales': ['Marketing Fundamentals', 'Retail Management', 'Customer Service'],
    },
    '2nd Year': {
      'Business Administration': ['Business Strategy', 'Entrepreneurship', 'Operations Management'],
      'Finance & Accounting': ['Financial Planning', 'Taxation', 'Risk Management'],
      'Marketing & Sales': ['Advertising', 'E-commerce', 'International Marketing'],
    },
    '3rd Year': {
      'Business Administration': ['Advanced Management', 'Corporate Governance', 'Business Analytics'],
      'Finance & Accounting': ['Investment Banking', 'Mergers & Acquisitions', 'Financial Modeling'],
      'Marketing & Sales': ['Strategic Marketing', 'Brand Strategy', 'Sales Leadership'],
    },
    '4th Year': {
      'Business Administration': ['Global Business', 'Innovation Management', 'Leadership'],
      'Finance & Accounting': ['Portfolio Management', 'Derivatives', 'Financial Risk'],
      'Marketing & Sales': ['Marketing Analytics', 'Customer Experience', 'Digital Strategy'],
    },
    '5th Year': {
      'Business Administration': ['Executive Leadership', 'Change Management', 'Strategic Planning'],
      'Finance & Accounting': ['Advanced Finance', 'Capital Markets', 'Financial Strategy'],
      'Marketing & Sales': ['Marketing Innovation', 'Global Marketing', 'Business Development'],
    },
  },
  'BCA+MCA': {
    '1st Year': {
      'Computer Applications': ['Computer Fundamentals', 'Programming Logic', 'Database Concepts'],
      'Software Development': ['Object Oriented Programming', 'Web Design', 'System Analysis'],
    },
    '2nd Year': {
      'Computer Applications': ['Data Structures', 'Operating Systems', 'Software Engineering'],
      'Software Development': ['Advanced Programming', 'Database Design', 'Network Programming'],
    },
    '3rd Year': {
      'Computer Applications': ['System Programming', 'Computer Networks', 'Information Security'],
      'Software Development': ['Mobile Applications', 'Cloud Computing', 'Project Management'],
    },
    '4th Year': {
      'Computer Applications': ['Big Data Analytics', 'Machine Learning', 'IoT'],
      'Software Development': ['DevOps', 'Microservices', 'AI Applications'],
    },
    '5th Year': {
      'Computer Applications': ['Advanced Analytics', 'Blockchain', 'Cyber Security'],
      'Software Development': ['Full Stack Development', 'Enterprise Solutions', 'Innovation Lab'],
    },
  },
};

// Default batches
const defaultBatches = ['A', 'B', 'C', 'D'];

export interface AcademicConfigData {
  courseData: AcademicConfig['courseData'];
  subjectsData: AcademicConfig['subjectsData'];
  batches: string[];
}

/**
 * Get academic configuration for a college
 * Returns default config if none exists
 */
export const getAcademicConfig = async (collegeId: string): Promise<AcademicConfigData> => {
  try {
    const config = await academicConfigApi.getByCollege(collegeId);
    if (config) {
      return {
        courseData: config.courseData,
        subjectsData: config.subjectsData,
        batches: config.batches || defaultBatches,
      };
    }
  } catch (error) {
    console.error('Error loading academic config:', error);
  }
  return {
    courseData: defaultCourseData,
    subjectsData: defaultSubjectsData,
    batches: defaultBatches,
  };
};

/**
 * Save academic configuration for a college
 */
export const saveAcademicConfig = async (
  collegeId: string,
  courseData: AcademicConfig['courseData'],
  subjectsData: AcademicConfig['subjectsData'],
  batches: string[] = defaultBatches
): Promise<boolean> => {
  try {
    await academicConfigApi.upsert(collegeId, { courseData, subjectsData, batches });
    return true;
  } catch (error) {
    console.error('Error saving academic config:', error);
    return false;
  }
};

/**
 * Get available years for a course
 */
export const getYearsForCourse = (
  courseData: AcademicConfig['courseData'],
  course: string
): string[] => {
  return courseData[course]?.years || [];
};

/**
 * Get available departments for a course
 */
export const getDepartmentsForCourse = (
  courseData: AcademicConfig['courseData'],
  course: string
): string[] => {
  return courseData[course]?.departments || [];
};

/**
 * Get available subjects for a specific course/year/department combination
 */
export const getSubjectsForContext = (
  subjectsData: AcademicConfig['subjectsData'],
  course: string,
  year: string,
  department: string
): string[] => {
  return subjectsData[course]?.[year]?.[department] || [];
};

/**
 * Get all available courses
 */
export const getAllCourses = (courseData: AcademicConfig['courseData']): string[] => {
  return Object.keys(courseData);
};

/**
 * Get semesters for a course (if defined)
 */
export const getSemestersForCourse = (
  courseData: AcademicConfig['courseData'],
  course: string
): string[] => {
  return courseData[course]?.semesters || ['Odd', 'Even'];
};

// Export defaults for use in seed data
export { defaultCourseData, defaultSubjectsData, defaultBatches };