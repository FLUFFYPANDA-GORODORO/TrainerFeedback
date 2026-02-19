/**
 * Seed Sessions and Responses
 * 
 * This script populates the database with realistic test sessions and responses
 * using actual academic configuration data from the database.
 * 
 * Usage: 
 *   1. Open browser console on the app
 *   2. Import and run:
 *      import { runSeed } from './services/superadmin/seedSessions';
 *      runSeed();
 * 
 *   Or call from any component:
 *      await runSeed({ sessionsPerCollege: 3, minResponses: 10, maxResponses: 30 });
 */

import { createSession, closeSessionWithStats } from './sessionService';
import { addResponse } from './responseService';
import { getAllColleges } from './collegeService';
import { getAllTrainers } from './trainerService';
import { getAcademicConfig } from './academicService';

// Sample data for generating realistic sessions
const TOPICS = {
  Technical: [
    'Introduction to React',
    'Advanced JavaScript',
    'Node.js Fundamentals',
    'Database Design',
    'REST API Development',
    'TypeScript Basics',
    'Git Version Control',
    'Docker Containers',
    'Cloud Deployment (AWS)',
    'System Design Patterns'
  ],
  'Soft Skills': [
    'Communication Skills',
    'Time Management',
    'Leadership Essentials',
    'Team Collaboration',
    'Presentation Skills',
    'Problem Solving',
    'Critical Thinking',
    'Conflict Resolution',
    'Email Etiquette',
    'Interview Preparation'
  ],
  Tools: [
    'VS Code Mastery',
    'Jira for Project Management',
    'Figma for Developers',
    'Postman API Testing',
    'Chrome DevTools',
    'GitHub Actions CI/CD',
    'Slack Productivity',
    'Notion for Teams',
    'Trello Workflows',
    'Excel for Data Analysis'
  ]
};

const COMMENTS = {
  positive: [
    "Excellent session! Very informative and well-structured.",
    "The trainer explained complex topics in a simple way.",
    "Loved the practical examples and hands-on exercises.",
    "Best session I've attended. Highly recommend!",
    "Clear explanations and great pacing throughout.",
    "Very engaging session with real-world applications.",
    "The trainer was very knowledgeable and helpful.",
    "Great use of visual aids and demonstrations.",
    "Learned a lot in a short time. Well organized!",
    "Interactive and fun learning experience."
  ],
  neutral: [
    "Good session overall. Could use more examples.",
    "Content was relevant but a bit fast-paced.",
    "Decent coverage of the topic.",
    "Some parts were helpful, others less so.",
    "Average session. Met basic expectations.",
    "Material was okay but nothing exceptional.",
    "Would have liked more Q&A time.",
    "The session covered most key points.",
    "Somewhat useful for my work."
  ],
  negative: [
    "Session was too fast. Hard to follow.",
    "Needed more practical examples.",
    "Audio quality could be improved.",
    "Content was too basic for the target audience.",
    "Expected more in-depth coverage.",
    "The session felt rushed towards the end."
  ]
};

// Default questions template for sessions
const DEFAULT_QUESTIONS = [
  { id: 'q1', text: "How would you rate the trainer's knowledge of the subject?", type: 'rating', required: true, category: 'knowledge' },
  { id: 'q2', text: "Was the trainer able to explain complex concepts clearly?", type: 'rating', required: true, category: 'communication' },
  { id: 'q3', text: "Did the trainer use practical examples and demonstrations?", type: 'rating', required: true, category: 'content' },
  { id: 'q4', text: "How responsive was the trainer to doubts and queries?", type: 'rating', required: true, category: 'engagement' },
  { id: 'q5', text: "How would you rate the overall content quality and relevance?", type: 'rating', required: true, category: 'content' },
  { id: 'q6', text: "Was the session pace appropriate?", type: 'mcq', options: ["Too Fast", "Just Right", "Too Slow"], required: true },
  { id: 'q7', text: "How would you rate the audio/video quality?", type: 'rating', required: true, category: 'delivery' },
  { id: 'q8', text: "Overall, how satisfied are you with this session?", type: 'rating', required: true, category: 'overall' },
  { id: 'q9', text: "Any additional comments or suggestions?", type: 'text', required: false },
  { id: 'q10', text: "What did you learn today?", type: 'topicslearned', required: false },
  { id: 'q11', text: "What topics would you like covered in future sessions?", type: 'futureSession', required: false }
];

/**
 * Generate a random rating based on quality tier
 */
const generateRating = (quality) => {
  const ranges = {
    good: [4, 5],
    average: [3, 4],
    poor: [1, 3]
  };
  const [min, max] = ranges[quality] || [3, 4];
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random date within the current month
 * This ensures trend data appears in the analytics view (which shows current month only)
 */
const randomDateInCurrentMonth = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDay = today.getDate();
  
  // Pick a random day from 1 to today
  const day = Math.floor(Math.random() * currentDay) + 1;
  const date = new Date(year, month, day);
  return date.toISOString().split('T')[0];
};

/**
 * Pick random item from array
 */
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Extract academic structure from config
 * Returns array of { course, branch, year, batch } combinations
 */
const extractAcademicCombinations = (config) => {
  const combinations = [];
  
  if (!config?.courses) return combinations;
  
  Object.entries(config.courses).forEach(([courseName, courseData]) => {
    if (courseData?.departments) {
      Object.entries(courseData.departments).forEach(([deptName, deptData]) => {
        if (deptData?.years) {
          Object.entries(deptData.years).forEach(([yearNum, yearData]) => {
            if (yearData?.batches) {
              yearData.batches.forEach(batch => {
                combinations.push({
                  course: courseName,
                  branch: deptName,
                  year: yearNum,
                  batch: batch
                });
              });
            }
          });
        }
      });
    }
  });
  
  return combinations;
};

/**
 * Generate responses for a session
 */
const generateResponses = async (sessionId, count, quality = 'average', domain = 'Technical') => {
  const responses = [];
  
  for (let i = 0; i < count; i++) {
    const answers = DEFAULT_QUESTIONS.map(q => {
      if (q.type === 'rating') {
        return { questionId: q.id, type: 'rating', value: generateRating(quality) };
      } else if (q.type === 'mcq') {
        const options = q.options || ['Just Right'];
        return { questionId: q.id, type: 'mcq', value: pickRandom(options) };
      } else if (q.type === 'text') {
        // 60% chance of leaving a comment
        if (Math.random() < 0.6) {
          let commentPool;
          if (quality === 'good') commentPool = COMMENTS.positive;
          else if (quality === 'poor') commentPool = COMMENTS.negative;
          else commentPool = COMMENTS.neutral;
          
          return { questionId: q.id, type: 'text', value: pickRandom(commentPool) };
        }
        return { questionId: q.id, type: 'text', value: '' };
      } else if (q.type === 'topicslearned') {
        const domainTopics = TOPICS[domain] || TOPICS.Technical;
        const learned = [];
        const tCount = Math.floor(Math.random() * 3) + 2; 
        for(let j=0; j<tCount; j++) learned.push(pickRandom(domainTopics));
        return { questionId: q.id, type: 'topicslearned', value: learned.join(', ') };
      } else if (q.type === 'futureSession') {
        if (Math.random() < 0.4) {
          const suggestions = [
            "More hands-on labs",
            "Real-world case studies",
            "Advanced implementation details",
            "Troubleshooting and debugging",
            "Best practices and design patterns",
            "Integration with other frameworks"
          ];
          return { questionId: q.id, type: 'futureSession', value: pickRandom(suggestions) };
        }
        return { questionId: q.id, type: 'futureSession', value: '' };
      }
      return { questionId: q.id, type: q.type, value: '' };
    });

    try {
      const response = await addResponse(sessionId, {
        deviceId: `seed-device-${sessionId}-${i}-${Date.now()}`,
        answers
      });
      responses.push(response);
    } catch (err) {
      console.error(`Error adding response ${i}:`, err);
    }
  }
  
  return responses;
};

/**
 * Main seed function
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.sessionsPerCollege - Sessions to create per college (default: 3)
 * @param {number} options.minResponses - Min responses per session (default: 10)
 * @param {number} options.maxResponses - Max responses per session (default: 30)
 * @returns {Promise<Object>} Summary of created data
 */
export const seedSessionsAndResponses = async (options = {}) => {
  const {
    sessionsPerCollege = 3,
    minResponses = 10,
    maxResponses = 30
  } = options;

  console.log('🌱 Starting seed process...');
  console.log('📦 Fetching colleges, trainers, and academic configs...');

  // Fetch all required data
  const colleges = await getAllColleges();
  const { trainers } = await getAllTrainers(100);
  
  if (!colleges?.length) {
    throw new Error('No colleges found. Please create colleges first.');
  }
  if (!trainers?.length) {
    throw new Error('No trainers found. Please create trainers first.');
  }

  console.log(`Found ${colleges.length} colleges and ${trainers.length} trainers`);

  const results = {
    sessions: [],
    totalResponses: 0,
    errors: []
  };

  const domains = Object.keys(TOPICS);
  let sessionCount = 0;

  for (const college of colleges) {
    console.log(`\n📍 Processing college: ${college.code || college.name}`);
    
    // Fetch academic config for this college
    let academicConfig = null;
    let combinations = [];
    
    try {
      academicConfig = await getAcademicConfig(college.id);
      combinations = extractAcademicCombinations(academicConfig);
      console.log(`   Found ${combinations.length} course/batch combinations`);
    } catch (err) {
      console.warn(`   ⚠️ No academic config for ${college.code}, using defaults`);
    }
    
    // Fallback if no academic config
    if (combinations.length === 0) {
      combinations = [{ course: 'B.Tech', branch: 'CSE', year: '1', batch: 'A' }];
    }

    for (let s = 0; s < sessionsPerCollege; s++) {
      sessionCount++;
      
      const domain = pickRandom(domains);
      const topic = pickRandom(TOPICS[domain]);
      const trainer = pickRandom(trainers);
      const sessionDate = randomDateInCurrentMonth();
      const quality = pickRandom(['good', 'average', 'poor']);
      const responseCount = Math.floor(Math.random() * (maxResponses - minResponses + 1)) + minResponses;
      const academic = pickRandom(combinations);

      console.log(`   📝 Session ${sessionCount}: ${topic}`);
      console.log(`      📚 ${academic.course}/${academic.branch}/Year ${academic.year}/Batch ${academic.batch}`);

      try {
        // Create session with real academic config data
        const session = await createSession({
          collegeId: college.id,
          collegeName: college.name,
          academicYear: '2025-26',
          course: academic.course,
          branch: academic.branch,
          year: academic.year,
          batch: academic.batch,
          topic,
          domain,
          sessionDate,
          sessionTime: Math.random() > 0.5 ? 'Morning' : 'Afternoon',
          sessionDuration: pickRandom([60, 90, 120]),
          assignedTrainer: { id: trainer.id, name: trainer.name },
          questions: DEFAULT_QUESTIONS,
          ttl: 24
        });

        console.log(`      ✅ Session created: ${session.id}`);
        console.log(`      👥 Adding ${responseCount} responses (${quality} quality)...`);

        // Generate responses
        const responses = await generateResponses(session.id, responseCount, quality, domain);
        results.totalResponses += responses.length;

        console.log(`      📊 Closing session and compiling stats...`);

        // Close session and compile stats
        await closeSessionWithStats(session.id);

        results.sessions.push({
          id: session.id,
          topic,
          college: college.code,
          trainer: trainer.name,
          academic: `${academic.course}/${academic.branch}/Y${academic.year}/B${academic.batch}`,
          responses: responses.length,
          quality
        });

        console.log(`      ✅ Done!`);

      } catch (err) {
        console.error(`      ❌ Error:`, err.message);
        results.errors.push({ session: sessionCount, topic, error: err.message });
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEEDING COMPLETE!');
  console.log(`   Sessions created: ${results.sessions.length}`);
  console.log(`   Total responses: ${results.totalResponses}`);
  console.log(`   Errors: ${results.errors.length}`);
  console.log('='.repeat(50));
  
  return results;
};

/**
 * Convenience function to run from console
 * Just call: runSeed()
 */
export const runSeed = async (options = {}) => {
  try {
    const results = await seedSessionsAndResponses(options);
    console.table(results.sessions);
    return results;
  } catch (err) {
    console.error('❌ Seed failed:', err);
    throw err;
  }
};

// Make available globally for console access
if (typeof window !== 'undefined') {
  window.runSeed = runSeed;
  window.seedSessionsAndResponses = seedSessionsAndResponses;
  console.log('🌱 Seed functions available: runSeed() or seedSessionsAndResponses(options)');
}

export default seedSessionsAndResponses;
