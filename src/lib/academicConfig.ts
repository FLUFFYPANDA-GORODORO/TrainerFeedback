// Academic Configuration utilities for Faculty Insights Hub

import { academicConfigApi, departmentsApi, collegesApi, AcademicConfig, College } from './storage';

// Default course data for ICEM (Engineering focused)
const icemDefaultCourseData: AcademicConfig['courseData'] = {
  'B.E': {
    years: ['1', '2', '3', '4'],
    yearDepartments: {
      '1': ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
      '2': ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
      '3': ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
      '4': ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
    },
    semesters: ['Odd', 'Even'],
  },
  'MBA': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
      '2': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
    },
    semesters: ['Odd', 'Even'],
  },
  'MCA': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['Computer Applications', 'Software Development'],
      '2': ['Computer Applications', 'Software Development'],
    },
    semesters: ['Odd', 'Even'],
  },
  'M.Tech': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
      '2': ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
    },
    semesters: ['Odd', 'Even'],
  },
  'BCA+MCA': {
    years: ['1', '2', '3', '4', '5'],
    yearDepartments: {
      '1': ['Computer Applications', 'Software Development'],
      '2': ['Computer Applications', 'Software Development'],
      '3': ['Computer Applications', 'Software Development'],
      '4': ['Computer Applications', 'Software Development'],
      '5': ['Computer Applications', 'Software Development'],
    },
    semesters: ['Odd', 'Even'],
  },
  'BBA+MBA': {
    years: ['1', '2', '3', '4', '5'],
    yearDepartments: {
      '1': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
      '2': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
      '3': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
      '4': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
      '5': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
    },
    semesters: ['Odd', 'Even'],
  },
};

// Default course data for IGSB (Business focused)
const igsbDefaultCourseData: AcademicConfig['courseData'] = {
  'MBA': {
    years: ['1', '2'],
    yearDepartments: {
      '1': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources', 'Operations Management'],
      '2': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources', 'Operations Management'],
    },
    semesters: ['Odd', 'Even'],
  },
  'BBA': {
    years: ['1', '2', '3'],
    yearDepartments: {
      '1': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
      '2': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
      '3': ['Business Administration', 'Finance & Accounting', 'Marketing & Sales', 'Human Resources'],
    },
    semesters: ['Odd', 'Even'],
  },
};

// Default subjects data for ICEM
const icemDefaultSubjectsData: AcademicConfig['subjectsData'] = {
  'B.E': {
    '1': {
      'Computer Science & Engineering': {
        'Programming Fundamentals': ['A', 'B', 'C', 'D'],
        'Data Structures': ['A', 'B', 'C', 'D'],
        'Database Systems': ['A', 'B', 'C', 'D'],
        'Mathematics': ['A', 'B', 'C', 'D']
      },
      'Information Technology': {
        'Web Development': ['A', 'B', 'C', 'D'],
        'Networking': ['A', 'B', 'C', 'D'],
        'Software Engineering': ['A', 'B', 'C', 'D'],
        'Mathematics': ['A', 'B', 'C', 'D']
      },
      'Mechanical Engineering': {
        'Thermodynamics': ['A', 'B', 'C', 'D'],
        'Fluid Mechanics': ['A', 'B', 'C', 'D'],
        'Materials Science': ['A', 'B', 'C', 'D'],
        'Mathematics': ['A', 'B', 'C', 'D']
      },
      'Civil Engineering': {
        'Structural Analysis': ['A', 'B', 'C', 'D'],
        'Surveying': ['A', 'B', 'C', 'D'],
        'Construction Materials': ['A', 'B', 'C', 'D'],
        'Mathematics': ['A', 'B', 'C', 'D']
      },
      'Electrical Engineering': {
        'Circuit Theory': ['A', 'B', 'C', 'D'],
        'Power Systems': ['A', 'B', 'C', 'D'],
        'Control Systems': ['A', 'B', 'C', 'D'],
        'Mathematics': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Computer Science & Engineering': {
        'Algorithms': ['A', 'B', 'C', 'D'],
        'Operating Systems': ['A', 'B', 'C', 'D'],
        'Computer Networks': ['A', 'B', 'C', 'D'],
        'Discrete Mathematics': ['A', 'B', 'C', 'D']
      },
      'Information Technology': {
        'Mobile Development': ['A', 'B', 'C', 'D'],
        'Cloud Computing': ['A', 'B', 'C', 'D'],
        'Cyber Security': ['A', 'B', 'C', 'D'],
        'Data Structures': ['A', 'B', 'C', 'D']
      },
      'Mechanical Engineering': {
        'Heat Transfer': ['A', 'B', 'C', 'D'],
        'Dynamics': ['A', 'B', 'C', 'D'],
        'Manufacturing Processes': ['A', 'B', 'C', 'D'],
        'Mechanics': ['A', 'B', 'C', 'D']
      },
      'Civil Engineering': {
        'Geotechnical Engineering': ['A', 'B', 'C', 'D'],
        'Transportation Engineering': ['A', 'B', 'C', 'D'],
        'Environmental Engineering': ['A', 'B', 'C', 'D'],
        'Mechanics': ['A', 'B', 'C', 'D']
      },
      'Electrical Engineering': {
        'Electrical Machines': ['A', 'B', 'C', 'D'],
        'Power Electronics': ['A', 'B', 'C', 'D'],
        'Signal Processing': ['A', 'B', 'C', 'D'],
        'Electronics': ['A', 'B', 'C', 'D']
      }
    },
    '3': {
      'Computer Science & Engineering': {
        'Machine Learning': ['A', 'B', 'C', 'D'],
        'Distributed Systems': ['A', 'B', 'C', 'D'],
        'Software Architecture': ['A', 'B', 'C', 'D'],
        'Compiler Design': ['A', 'B', 'C', 'D']
      },
      'Information Technology': {
        'Data Analytics': ['A', 'B', 'C', 'D'],
        'IoT': ['A', 'B', 'C', 'D'],
        'Blockchain': ['A', 'B', 'C', 'D'],
        'System Programming': ['A', 'B', 'C', 'D']
      },
      'Mechanical Engineering': {
        'CAD/CAM': ['A', 'B', 'C', 'D'],
        'Robotics': ['A', 'B', 'C', 'D'],
        'Quality Control': ['A', 'B', 'C', 'D'],
        'Design Engineering': ['A', 'B', 'C', 'D']
      },
      'Civil Engineering': {
        'Concrete Technology': ['A', 'B', 'C', 'D'],
        'Steel Structures': ['A', 'B', 'C', 'D'],
        'Water Resources': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D']
      },
      'Electrical Engineering': {
        'High Voltage Engineering': ['A', 'B', 'C', 'D'],
        'Renewable Energy': ['A', 'B', 'C', 'D'],
        'Industrial Automation': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D']
      }
    },
    '4': {
      'Computer Science & Engineering': {
        'AI & Deep Learning': ['A', 'B', 'C', 'D'],
        'Big Data': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Ethics in Computing': ['A', 'B', 'C', 'D']
      },
      'Information Technology': {
        'DevOps': ['A', 'B', 'C', 'D'],
        'Advanced Security': ['A', 'B', 'C', 'D'],
        'Digital Transformation': ['A', 'B', 'C', 'D'],
        'Entrepreneurship': ['A', 'B', 'C', 'D']
      },
      'Mechanical Engineering': {
        'Advanced Manufacturing': ['A', 'B', 'C', 'D'],
        'Sustainable Energy': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Industrial Management': ['A', 'B', 'C', 'D']
      },
      'Civil Engineering': {
        'Advanced Structural Design': ['A', 'B', 'C', 'D'],
        'Urban Planning': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      },
      'Electrical Engineering': {
        'Smart Grids': ['A', 'B', 'C', 'D'],
        'Electric Vehicles': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      }
    }
  },
  'MBA': {
    '1': {
      'Business Administration': {
        'Management Principles': ['A', 'B', 'C', 'D'],
        'Business Ethics': ['A', 'B', 'C', 'D'],
        'Organizational Behavior': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Financial Accounting': ['A', 'B', 'C', 'D'],
        'Cost Accounting': ['A', 'B', 'C', 'D'],
        'Business Finance': ['A', 'B', 'C', 'D'],
        'Managerial Economics': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Marketing Management': ['A', 'B', 'C', 'D'],
        'Consumer Behavior': ['A', 'B', 'C', 'D'],
        'Sales Management': ['A', 'B', 'C', 'D'],
        'Market Research': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Human Resource Management': ['A', 'B', 'C', 'D'],
        'Industrial Relations': ['A', 'B', 'C', 'D'],
        'Training & Development': ['A', 'B', 'C', 'D'],
        'Organizational Development': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Business Administration': {
        'Strategic Management': ['A', 'B', 'C', 'D'],
        'International Business': ['A', 'B', 'C', 'D'],
        'Entrepreneurship': ['A', 'B', 'C', 'D'],
        'Business Law': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Investment Analysis': ['A', 'B', 'C', 'D'],
        'Financial Markets': ['A', 'B', 'C', 'D'],
        'Corporate Finance': ['A', 'B', 'C', 'D'],
        'Taxation': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Brand Management': ['A', 'B', 'C', 'D'],
        'Digital Marketing': ['A', 'B', 'C', 'D'],
        'Services Marketing': ['A', 'B', 'C', 'D'],
        'Retail Management': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Performance Management': ['A', 'B', 'C', 'D'],
        'Compensation Management': ['A', 'B', 'C', 'D'],
        'Labor Laws': ['A', 'B', 'C', 'D'],
        'Strategic HRM': ['A', 'B', 'C', 'D']
      }
    }
  },
  'MCA': {
    '1': {
      'Computer Applications': {
        'Advanced Programming': ['A', 'B', 'C', 'D'],
        'Data Structures': ['A', 'B', 'C', 'D'],
        'Database Management': ['A', 'B', 'C', 'D'],
        'Software Engineering': ['A', 'B', 'C', 'D']
      },
      'Software Development': {
        'Web Technologies': ['A', 'B', 'C', 'D'],
        'Mobile Apps': ['A', 'B', 'C', 'D'],
        'System Analysis': ['A', 'B', 'C', 'D'],
        'Design Patterns': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Computer Applications': {
        'Network Security': ['A', 'B', 'C', 'D'],
        'Cloud Computing': ['A', 'B', 'C', 'D'],
        'Data Mining': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D']
      },
      'Software Development': {
        'Agile Development': ['A', 'B', 'C', 'D'],
        'DevOps': ['A', 'B', 'C', 'D'],
        'Quality Assurance': ['A', 'B', 'C', 'D'],
        'Enterprise Applications': ['A', 'B', 'C', 'D']
      }
    }
  },
  'M.Tech': {
    '1': {
      'Computer Science & Engineering': {
        'Machine Learning': ['A', 'B', 'C', 'D'],
        'Distributed Systems': ['A', 'B', 'C', 'D'],
        'Software Architecture': ['A', 'B', 'C', 'D'],
        'Compiler Design': ['A', 'B', 'C', 'D']
      },
      'Information Technology': {
        'Data Analytics': ['A', 'B', 'C', 'D'],
        'IoT': ['A', 'B', 'C', 'D'],
        'Blockchain': ['A', 'B', 'C', 'D'],
        'System Programming': ['A', 'B', 'C', 'D']
      },
      'Mechanical Engineering': {
        'CAD/CAM': ['A', 'B', 'C', 'D'],
        'Robotics': ['A', 'B', 'C', 'D'],
        'Quality Control': ['A', 'B', 'C', 'D'],
        'Design Engineering': ['A', 'B', 'C', 'D']
      },
      'Civil Engineering': {
        'Concrete Technology': ['A', 'B', 'C', 'D'],
        'Steel Structures': ['A', 'B', 'C', 'D'],
        'Water Resources': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D']
      },
      'Electrical Engineering': {
        'High Voltage Engineering': ['A', 'B', 'C', 'D'],
        'Renewable Energy': ['A', 'B', 'C', 'D'],
        'Industrial Automation': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Computer Science & Engineering': {
        'AI & Deep Learning': ['A', 'B', 'C', 'D'],
        'Big Data': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Ethics in Computing': ['A', 'B', 'C', 'D']
      },
      'Information Technology': {
        'DevOps': ['A', 'B', 'C', 'D'],
        'Advanced Security': ['A', 'B', 'C', 'D'],
        'Digital Transformation': ['A', 'B', 'C', 'D'],
        'Entrepreneurship': ['A', 'B', 'C', 'D']
      },
      'Mechanical Engineering': {
        'Advanced Manufacturing': ['A', 'B', 'C', 'D'],
        'Sustainable Energy': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Industrial Management': ['A', 'B', 'C', 'D']
      },
      'Civil Engineering': {
        'Advanced Structural Design': ['A', 'B', 'C', 'D'],
        'Urban Planning': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      },
      'Electrical Engineering': {
        'Smart Grids': ['A', 'B', 'C', 'D'],
        'Electric Vehicles': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      }
    }
  },
  'BCA+MCA': {
    '1': {
      'Computer Applications': {
        'Programming Fundamentals': ['A', 'B', 'C', 'D'],
        'Data Structures': ['A', 'B', 'C', 'D'],
        'Database Systems': ['A', 'B', 'C', 'D'],
        'Mathematics': ['A', 'B', 'C', 'D']
      },
      'Software Development': {
        'Web Development': ['A', 'B', 'C', 'D'],
        'Software Engineering': ['A', 'B', 'C', 'D'],
        'System Analysis': ['A', 'B', 'C', 'D'],
        'Mathematics': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Computer Applications': {
        'Advanced Programming': ['A', 'B', 'C', 'D'],
        'Operating Systems': ['A', 'B', 'C', 'D'],
        'Computer Networks': ['A', 'B', 'C', 'D'],
        'Discrete Mathematics': ['A', 'B', 'C', 'D']
      },
      'Software Development': {
        'Mobile Development': ['A', 'B', 'C', 'D'],
        'Cloud Computing': ['A', 'B', 'C', 'D'],
        'Cyber Security': ['A', 'B', 'C', 'D'],
        'Data Structures': ['A', 'B', 'C', 'D']
      }
    },
    '3': {
      'Computer Applications': {
        'Machine Learning': ['A', 'B', 'C', 'D'],
        'Distributed Systems': ['A', 'B', 'C', 'D'],
        'Software Architecture': ['A', 'B', 'C', 'D'],
        'Compiler Design': ['A', 'B', 'C', 'D']
      },
      'Software Development': {
        'Data Analytics': ['A', 'B', 'C', 'D'],
        'IoT': ['A', 'B', 'C', 'D'],
        'Blockchain': ['A', 'B', 'C', 'D'],
        'System Programming': ['A', 'B', 'C', 'D']
      }
    },
    '4': {
      'Computer Applications': {
        'AI & Deep Learning': ['A', 'B', 'C', 'D'],
        'Big Data': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Ethics in Computing': ['A', 'B', 'C', 'D']
      },
      'Software Development': {
        'DevOps': ['A', 'B', 'C', 'D'],
        'Advanced Security': ['A', 'B', 'C', 'D'],
        'Digital Transformation': ['A', 'B', 'C', 'D'],
        'Entrepreneurship': ['A', 'B', 'C', 'D']
      }
    },
    '5': {
      'Computer Applications': {
        'Advanced AI': ['A', 'B', 'C', 'D'],
        'Research Methodology': ['A', 'B', 'C', 'D'],
        'Thesis/Project': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      },
      'Software Development': {
        'Innovation Management': ['A', 'B', 'C', 'D'],
        'Startup Development': ['A', 'B', 'C', 'D'],
        'Thesis/Project': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      }
    }
  },
  'BBA+MBA': {
    '1': {
      'Business Administration': {
        'Principles of Management': ['A', 'B', 'C', 'D'],
        'Business Mathematics': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D'],
        'Micro Economics': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Financial Accounting': ['A', 'B', 'C', 'D'],
        'Business Mathematics': ['A', 'B', 'C', 'D'],
        'Principles of Finance': ['A', 'B', 'C', 'D'],
        'Business Statistics': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Principles of Marketing': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D'],
        'Consumer Behavior': ['A', 'B', 'C', 'D'],
        'Business Mathematics': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Principles of Management': ['A', 'B', 'C', 'D'],
        'Organizational Behavior': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D'],
        'Business Ethics': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Business Administration': {
        'Macro Economics': ['A', 'B', 'C', 'D'],
        'Business Law': ['A', 'B', 'C', 'D'],
        'Business Statistics': ['A', 'B', 'C', 'D'],
        'Entrepreneurship': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Cost Accounting': ['A', 'B', 'C', 'D'],
        'Corporate Finance': ['A', 'B', 'C', 'D'],
        'Business Law': ['A', 'B', 'C', 'D'],
        'Financial Markets': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Marketing Research': ['A', 'B', 'C', 'D'],
        'Sales Management': ['A', 'B', 'C', 'D'],
        'Digital Marketing': ['A', 'B', 'C', 'D'],
        'Brand Management': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Human Resource Management': ['A', 'B', 'C', 'D'],
        'Industrial Relations': ['A', 'B', 'C', 'D'],
        'Training & Development': ['A', 'B', 'C', 'D'],
        'Labor Laws': ['A', 'B', 'C', 'D']
      }
    },
    '3': {
      'Business Administration': {
        'Strategic Management': ['A', 'B', 'C', 'D'],
        'International Business': ['A', 'B', 'C', 'D'],
        'Operations Management': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Investment Analysis': ['A', 'B', 'C', 'D'],
        'Taxation': ['A', 'B', 'C', 'D'],
        'Financial Risk Management': ['A', 'B', 'C', 'D'],
        'Auditing': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Services Marketing': ['A', 'B', 'C', 'D'],
        'Retail Management': ['A', 'B', 'C', 'D'],
        'Advertising': ['A', 'B', 'C', 'D'],
        'E-commerce': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Performance Management': ['A', 'B', 'C', 'D'],
        'Compensation Management': ['A', 'B', 'C', 'D'],
        'Organizational Development': ['A', 'B', 'C', 'D'],
        'Change Management': ['A', 'B', 'C', 'D']
      }
    },
    '4': {
      'Business Administration': {
        'Advanced Strategic Management': ['A', 'B', 'C', 'D'],
        'Business Ethics': ['A', 'B', 'C', 'D'],
        'Corporate Governance': ['A', 'B', 'C', 'D'],
        'Business Analytics': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Advanced Corporate Finance': ['A', 'B', 'C', 'D'],
        'Financial Derivatives': ['A', 'B', 'C', 'D'],
        'Mergers & Acquisitions': ['A', 'B', 'C', 'D'],
        'Financial Modeling': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'International Marketing': ['A', 'B', 'C', 'D'],
        'Marketing Analytics': ['A', 'B', 'C', 'D'],
        'Customer Relationship Management': ['A', 'B', 'C', 'D'],
        'Innovation in Marketing': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Strategic HRM': ['A', 'B', 'C', 'D'],
        'Talent Management': ['A', 'B', 'C', 'D'],
        'Leadership Development': ['A', 'B', 'C', 'D'],
        'Cross-cultural Management': ['A', 'B', 'C', 'D']
      }
    },
    '5': {
      'Business Administration': {
        'Global Business': ['A', 'B', 'C', 'D'],
        'Entrepreneurship Development': ['A', 'B', 'C', 'D'],
        'Thesis/Project': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Portfolio Management': ['A', 'B', 'C', 'D'],
        'Banking & Insurance': ['A', 'B', 'C', 'D'],
        'Thesis/Project': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Digital Transformation': ['A', 'B', 'C', 'D'],
        'Sustainable Marketing': ['A', 'B', 'C', 'D'],
        'Thesis/Project': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'HR Analytics': ['A', 'B', 'C', 'D'],
        'Workforce Planning': ['A', 'B', 'C', 'D'],
        'Thesis/Project': ['A', 'B', 'C', 'D'],
        'Professional Ethics': ['A', 'B', 'C', 'D']
      }
    }
  }
};

// Default subjects data for IGSB
const igsbDefaultSubjectsData: AcademicConfig['subjectsData'] = {
  'MBA': {
    '1': {
      'Business Administration': {
        'Management Principles': ['A', 'B', 'C', 'D'],
        'Business Ethics': ['A', 'B', 'C', 'D'],
        'Organizational Behavior': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D'],
        'Business Statistics': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Financial Accounting': ['A', 'B', 'C', 'D'],
        'Cost Accounting': ['A', 'B', 'C', 'D'],
        'Business Finance': ['A', 'B', 'C', 'D'],
        'Managerial Economics': ['A', 'B', 'C', 'D'],
        'Financial Management': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Marketing Management': ['A', 'B', 'C', 'D'],
        'Consumer Behavior': ['A', 'B', 'C', 'D'],
        'Sales Management': ['A', 'B', 'C', 'D'],
        'Market Research': ['A', 'B', 'C', 'D'],
        'Advertising': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Human Resource Management': ['A', 'B', 'C', 'D'],
        'Industrial Relations': ['A', 'B', 'C', 'D'],
        'Training & Development': ['A', 'B', 'C', 'D'],
        'Organizational Development': ['A', 'B', 'C', 'D'],
        'Talent Management': ['A', 'B', 'C', 'D']
      },
      'Operations Management': {
        'Operations Management': ['A', 'B', 'C', 'D'],
        'Supply Chain Management': ['A', 'B', 'C', 'D'],
        'Quality Management': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D'],
        'Business Analytics': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Business Administration': {
        'Strategic Management': ['A', 'B', 'C', 'D'],
        'International Business': ['A', 'B', 'C', 'D'],
        'Entrepreneurship': ['A', 'B', 'C', 'D'],
        'Business Law': ['A', 'B', 'C', 'D'],
        'Corporate Governance': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Investment Analysis': ['A', 'B', 'C', 'D'],
        'Financial Markets': ['A', 'B', 'C', 'D'],
        'Corporate Finance': ['A', 'B', 'C', 'D'],
        'Taxation': ['A', 'B', 'C', 'D'],
        'Risk Management': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Brand Management': ['A', 'B', 'C', 'D'],
        'Digital Marketing': ['A', 'B', 'C', 'D'],
        'Services Marketing': ['A', 'B', 'C', 'D'],
        'Retail Management': ['A', 'B', 'C', 'D'],
        'International Marketing': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Performance Management': ['A', 'B', 'C', 'D'],
        'Compensation Management': ['A', 'B', 'C', 'D'],
        'Labor Laws': ['A', 'B', 'C', 'D'],
        'Strategic HRM': ['A', 'B', 'C', 'D'],
        'Change Management': ['A', 'B', 'C', 'D']
      },
      'Operations Management': {
        'Advanced Operations': ['A', 'B', 'C', 'D'],
        'Logistics Management': ['A', 'B', 'C', 'D'],
        'Six Sigma': ['A', 'B', 'C', 'D'],
        'Technology Management': ['A', 'B', 'C', 'D'],
        'Innovation Management': ['A', 'B', 'C', 'D']
      }
    }
  },
  'BBA': {
    '1': {
      'Business Administration': {
        'Principles of Management': ['A', 'B', 'C', 'D'],
        'Business Mathematics': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D'],
        'Micro Economics': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Financial Accounting': ['A', 'B', 'C', 'D'],
        'Business Mathematics': ['A', 'B', 'C', 'D'],
        'Principles of Finance': ['A', 'B', 'C', 'D'],
        'Business Statistics': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Principles of Marketing': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D'],
        'Consumer Behavior': ['A', 'B', 'C', 'D'],
        'Business Mathematics': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Principles of Management': ['A', 'B', 'C', 'D'],
        'Organizational Behavior': ['A', 'B', 'C', 'D'],
        'Business Communication': ['A', 'B', 'C', 'D'],
        'Business Ethics': ['A', 'B', 'C', 'D']
      }
    },
    '2': {
      'Business Administration': {
        'Macro Economics': ['A', 'B', 'C', 'D'],
        'Business Law': ['A', 'B', 'C', 'D'],
        'Business Statistics': ['A', 'B', 'C', 'D'],
        'Entrepreneurship': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Cost Accounting': ['A', 'B', 'C', 'D'],
        'Corporate Finance': ['A', 'B', 'C', 'D'],
        'Business Law': ['A', 'B', 'C', 'D'],
        'Financial Markets': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Marketing Research': ['A', 'B', 'C', 'D'],
        'Sales Management': ['A', 'B', 'C', 'D'],
        'Digital Marketing': ['A', 'B', 'C', 'D'],
        'Brand Management': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Human Resource Management': ['A', 'B', 'C', 'D'],
        'Industrial Relations': ['A', 'B', 'C', 'D'],
        'Training & Development': ['A', 'B', 'C', 'D'],
        'Labor Laws': ['A', 'B', 'C', 'D']
      }
    },
    '3': {
      'Business Administration': {
        'Strategic Management': ['A', 'B', 'C', 'D'],
        'International Business': ['A', 'B', 'C', 'D'],
        'Operations Management': ['A', 'B', 'C', 'D'],
        'Project Management': ['A', 'B', 'C', 'D']
      },
      'Finance & Accounting': {
        'Investment Analysis': ['A', 'B', 'C', 'D'],
        'Taxation': ['A', 'B', 'C', 'D'],
        'Financial Risk Management': ['A', 'B', 'C', 'D'],
        'Auditing': ['A', 'B', 'C', 'D']
      },
      'Marketing & Sales': {
        'Services Marketing': ['A', 'B', 'C', 'D'],
        'Retail Management': ['A', 'B', 'C', 'D'],
        'Advertising': ['A', 'B', 'C', 'D'],
        'E-commerce': ['A', 'B', 'C', 'D']
      },
      'Human Resources': {
        'Performance Management': ['A', 'B', 'C', 'D'],
        'Compensation Management': ['A', 'B', 'C', 'D'],
        'Organizational Development': ['A', 'B', 'C', 'D'],
        'Change Management': ['A', 'B', 'C', 'D']
      }
    }
  }
};

// Function to get default config based on college code
const getDefaultConfig = (collegeCode: string): { courseData: AcademicConfig['courseData'], subjectsData: AcademicConfig['subjectsData'] } => {
  if (collegeCode === 'ICEM') {
    return { courseData: icemDefaultCourseData, subjectsData: icemDefaultSubjectsData };
  } else if (collegeCode === 'IGSB') {
    return { courseData: igsbDefaultCourseData, subjectsData: igsbDefaultSubjectsData };
  } else {
    // Fallback to ICEM defaults
    return { courseData: icemDefaultCourseData, subjectsData: icemDefaultSubjectsData };
  }
};
// Default batches
const defaultBatches = ['A', 'B', 'C', 'D'];

export interface AcademicConfigData {
  courseData: Record<string, {
    years: string[];
    yearDepartments: Record<string, string[]>;
    semesters?: string[];
  }>;
  subjectsData: Record<string, Record<string, Record<string, Record<string, string[]>>>>;
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

  // Get college to determine default config
  try {
    const college = await collegesApi.getById(collegeId);
    const { courseData, subjectsData } = getDefaultConfig(college?.code || 'ICEM');
    return {
      courseData,
      subjectsData,
      batches: defaultBatches,
    };
  } catch (error) {
    console.error('Error loading college for default config:', error);
    // Fallback to ICEM defaults
    const { courseData, subjectsData } = getDefaultConfig('ICEM');
    return {
      courseData,
      subjectsData,
      batches: defaultBatches,
    };
  }
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
    // Save the academic configuration
    await academicConfigApi.upsert(collegeId, { courseData, subjectsData, batches });

    // Extract unique departments and create department documents
    const uniqueDepartments = new Set<string>();
    Object.values(courseData).forEach(course => {
      Object.values(course.yearDepartments).forEach(departments => {
        departments.forEach(dept => uniqueDepartments.add(dept));
      });
    });

    // Create department documents for each unique department
    const departmentPromises = Array.from(uniqueDepartments).map(async (deptName) => {
      // Check if department already exists for this college
      const existingDepts = await departmentsApi.getByCollege(collegeId);
      const existingDept = existingDepts.find(dept => dept.name === deptName);
      
      if (!existingDept) {
        // Generate a department code from the name (lowercase, replace spaces with hyphens)
        const code = deptName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Create new department document
        await departmentsApi.create({
          collegeId,
          name: deptName,
          code,
          isActive: true,
        });
      }
    });

    await Promise.all(departmentPromises);

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
  const courseInfo = courseData[course];
  if (!courseInfo) return [];
  const depts = new Set<string>();
  Object.values(courseInfo.yearDepartments).forEach(deptsArray => {
    deptsArray.forEach(dept => depts.add(dept));
  });
  return Array.from(depts);
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
  return Object.keys(subjectsData[course]?.[year]?.[department] || {});
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
export { icemDefaultCourseData as defaultCourseData, icemDefaultSubjectsData as defaultSubjectsData, defaultBatches };