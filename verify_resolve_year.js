import fs from 'fs';

// Mock config data with NEW structure (Course -> Year -> Dept -> Batch)
const mockConfig = {
  courses: {
    'B.Tech': {
      years: {
        '1': { departments: {} },
        '2': { departments: {} },
        '3': { departments: {} },
        '4': { departments: {} }
      }
    },
    'M.Tech': {
        years: {
            '1': {},
            '2': {}
        }
    }
  }
};

// Mock getAcademicConfig
const getAcademicConfig = async (collegeId) => {
  return mockConfig;
};

// copied resolveYear logic
const resolveYear = async (collegeId, courseName, rawYear) => {
  if (!collegeId || !courseName || !rawYear) return rawYear;
  
  try {
    const config = await getAcademicConfig(collegeId);
    
    // Safety check for path existence
    if (!config || !config.courses || !config.courses[courseName]) {
        return rawYear.replace(/\D/g, ''); // Fallback
    }

    const courseData = config.courses[courseName];
    
    // [NEW] Structure check: Years are direct children of course
    if (!courseData.years) {
         // Fallback logic if structure is unexpected or empty
         return rawYear.replace(/\D/g, '');
    }

    // Collect all valid year keys from the years object
    const validYears = new Set(Object.keys(courseData.years));

    // 1. Try exact match
    if (validYears.has(rawYear)) return rawYear;

    // 2. Try numeric extraction
    const numeric = rawYear.match(/\d+/)?.[0];
    if (numeric && validYears.has(numeric)) return numeric;

    // 3. Try word mappings
    const lower = rawYear.toLowerCase();
    const map = {
      'first': '1', '1st': '1', 'i': '1',
      'second': '2', '2nd': '2', 'ii': '2',
      'third': '3', '3rd': '3', 'iii': '3',
      'fourth': '4', '4th': '4', 'iv': '4', 'final': '4'
    };
    
    // Check known mappings against valid years
    // Sort keys by length descending to match 'iii' before 'i'
    const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
       // Use word boundary check
       const regex = new RegExp(`\\b${key}\\b`, 'i');
       if (regex.test(rawYear) && validYears.has(map[key])) {
         return map[key];
       }
    }

    // Default: return numeric extraction if available, else raw
    return numeric || rawYear;

  } catch (err) {
    console.error(`Error resolving year:`, err);
    return rawYear.replace(/\D/g, '');
  }
};

const runTests = async () => {
    console.log("Running resolveYear tests...");
    
    const tests = [
        { course: 'B.Tech', input: '1', expected: '1' },
        { course: 'B.Tech', input: '4th', expected: '4' },
        { course: 'B.Tech', input: 'Final Year', expected: '4' },
        { course: 'B.Tech', input: 'Third', expected: '3' },
        { course: 'B.Tech', input: 'II', expected: '2' },
        { course: 'B.Tech', input: 'Year 2', expected: '2' },
        { course: 'B.Tech', input: 'random string 123', expected: '123' },
        { course: 'M.Tech', input: '1st', expected: '1' },
        { course: 'M.Tech', input: '3rd', expected: '3' } 
    ];
    try {
        let output = "Running resolveYear tests...\n";
        let passed = 0;
        for (const t of tests) {
            const result = await resolveYear('mockId', t.course, t.input);
            if (result === t.expected) {
                output += `PASS: ${t.course} '${t.input}' -> '${result}'\n`;
                passed++;
            } else {
                output += `FAIL: ${t.course} '${t.input}' -> '${result}' (expected '${t.expected}')\n`;
            }
        }
        
        output += `\n${passed}/${tests.length} tests passed.\n`;
        fs.writeFileSync('verify_result.txt', output);
        console.log(output);
    } catch (err) {
        console.error("Error writing output:", err);
    }
};

runTests();
