
// Mock academicService
let mockStore = {}; // collegeId -> config

const getAcademicConfig = async (collegeId) => {
    return mockStore[collegeId] ? JSON.parse(JSON.stringify(mockStore[collegeId])) : null;
};

const saveAcademicConfig = async (collegeId, config) => {
    mockStore[collegeId] = JSON.parse(JSON.stringify(config));
    console.log(`[SAVE] Saved config for ${collegeId}`);
    return config;
};

// Auto-Update Logic (Copied from projectCodeService.js for testing)
const autoUpdateAcademicConfig = async (collegeId, newCourses) => {
    try {
        const currentConfig = await getAcademicConfig(collegeId) || { courses: {} };
        let updated = false;

        // Ensure courses object exists
        if (!currentConfig.courses) currentConfig.courses = {};

        for (const [courseName, yearsSet] of Object.entries(newCourses)) {
            // 1. Create Course if missing
            if (!currentConfig.courses[courseName]) {
                currentConfig.courses[courseName] = { years: {} };
                updated = true;
            }

            // Ensure years object exists for the course
            if (!currentConfig.courses[courseName].years) {
                 currentConfig.courses[courseName].years = {};
                 updated = true;
            }

            // 2. Create Years if missing
            for (const year of yearsSet) {
                if (!currentConfig.courses[courseName].years[year]) {
                    // Initialize with empty departments to be valid
                    currentConfig.courses[courseName].years[year] = { departments: {} };
                    updated = true;
                }
            }
        }

        if (updated) {
            console.log(`Auto-updating academic config for college ${collegeId}`);
            await saveAcademicConfig(collegeId, currentConfig);
        } else {
            console.log(`No changes needed for college ${collegeId}`);
        }
    } catch (err) {
        console.error(`Failed to auto-update academic config for ${collegeId}:`, err);
    }
};

import fs from 'fs';

// ... (mock definitions)

// ... (autoUpdateAcademicConfig)

const runTests = async () => {
    console.log("Running Auto-Config Logic Tests...\n");
    let output = "";

    // Test 1: Empty Config -> Create New
    console.log("--- Test 1: Empty Config ---");
    mockStore = {};
    const newData1 = { 'B.Tech': new Set(['1', '4']) };
    await autoUpdateAcademicConfig('college1', newData1);
    
    const config1 = await getAcademicConfig('college1');
    if (config1 && config1.courses['B.Tech'] && config1.courses['B.Tech'].years['1'] && config1.courses['B.Tech'].years['4']) {
        output += "PASS: Created new config correctly.\n";
    } else {
        output += "FAIL: Failed to create new config.\n";
    }

    // Test 2: Existing Config -> Merge New
    console.log("\n--- Test 2: Merge New ---");
    // Setup existing: B.Tech with Year 1 (and dept CSE)
    mockStore['college1'] = {
        courses: {
            'B.Tech': {
                years: {
                    '1': { departments: { 'CSE': { batches: ['A'] } } }
                }
            }
        }
    };
    
    // Add Year 2 and new Course M.Tech
    const newData2 = { 
        'B.Tech': new Set(['2']),
        'M.Tech': new Set(['1'])
    };
    await autoUpdateAcademicConfig('college1', newData2);

    const config2 = await getAcademicConfig('college1');
    const btech = config2.courses['B.Tech'];
    const mtech = config2.courses['M.Tech'];

    let t2Passed = true;
    if (!btech.years['1'].departments['CSE']) { t2Passed = false; output += "FAIL: Overwrote existing department data!\n"; }
    if (!btech.years['2']) { t2Passed = false; output += "FAIL: Failed to add new Year 2 to B.Tech.\n"; }
    if (!mtech || !mtech.years['1']) { t2Passed = false; output += "FAIL: Failed to add new Course M.Tech.\n"; }

    if (t2Passed) output += "PASS: Merged new data without overwriting existing.\n";


    // Test 3: No Changes
    console.log("\n--- Test 3: No Changes ---");
    const newData3 = { 'B.Tech': new Set(['1']) }; // Already exists
    const beforeStr = JSON.stringify(mockStore['college1']);
    await autoUpdateAcademicConfig('college1', newData3);
    const afterStr = JSON.stringify(mockStore['college1']);

    if (beforeStr === afterStr) {
        output += "PASS: No unnecessary updates performed.\n";
    } else {
        output += "FAIL: Config was modified when no changes were needed.\n";
    }

    console.log("\nFinal Results:");
    console.log(output);
    fs.writeFileSync('verify_auto_config_result.txt', output);
};

runTests();
