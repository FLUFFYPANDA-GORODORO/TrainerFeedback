import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';

/**
 * Response Service
 * Handles feedback responses stored in subcollections: sessions/{sessionId}/responses
 */

const getResponsesCollection = (sessionId) => {
  return collection(db, 'sessions', sessionId, 'responses');
};

/**
 * Add a new response to a session's responses subcollection
 * @param {string} sessionId - The session document ID
 * @param {Object} responseData - The response data
 * @param {string} responseData.deviceId - Unique device identifier
 * @param {Array} responseData.answers - Array of answer objects
 * @returns {Promise<Object>} - Created response with ID
 */
export const addResponse = async (sessionId, responseData) => {
  try {
    const responsesRef = getResponsesCollection(sessionId);
    
    const docRef = await addDoc(responsesRef, {
      ...responseData,
      submittedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...responseData };
  } catch (error) {
    console.error('Error adding response:', error);
    throw error;
  }
};

/**
 * Get all responses for a session
 * @param {string} sessionId - The session document ID
 * @returns {Promise<Array>} - Array of response objects
 */
export const getResponses = async (sessionId) => {
  try {
    const responsesRef = getResponsesCollection(sessionId);
    const q = query(responsesRef, orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting responses:', error);
    throw error;
  }
};

/**
 * Get response count for a session (efficient count query)
 * @param {string} sessionId - The session document ID
 * @returns {Promise<number>} - Count of responses
 */
export const getResponseCount = async (sessionId) => {
  try {
    const responsesRef = getResponsesCollection(sessionId);
    const snapshot = await getCountFromServer(responsesRef);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting response count:', error);
    throw error;
  }
};

/**
 * Compile statistics from all responses for a session
 * @param {string} sessionId - The session document ID
 * @returns {Promise<Object>} - Compiled statistics object
 */
export const compileSessionStats = async (sessionId) => {
  try {
    const responses = await getResponses(sessionId);
    
    if (responses.length === 0) {
      return {
        totalResponses: 0,
        avgRating: 0,
        topRating: 0,
        leastRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topComments: [],
        leastRatedComments: [],
        avgComments: [],
        questionStats: {},
        compiledAt: new Date().toISOString()
      };
    }

    // Calculate per-response averages and extract comments
    const responseStats = responses.map(response => {
      const answers = response.answers || [];
      
      // Get rating answers
      const ratingAnswers = answers.filter(a => a.type === 'rating');
      const avgRating = ratingAnswers.length > 0
        ? ratingAnswers.reduce((sum, a) => sum + (Number(a.value) || 0), 0) / ratingAnswers.length
        : 0;
      
      // Get text comments
      const textAnswers = answers.filter(a => a.type === 'text' && a.value?.trim());
      
      return {
        responseId: response.id,
        avgRating,
        textComments: textAnswers.map(a => a.value),
        answers
      };
    });

    // Calculate global average rating
    const allRatings = responseStats.map(r => r.avgRating).filter(r => r > 0);
    const globalAvgRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 2.5; // Default to middle if no ratings

    // Sort all responses by rating (descending) for percentile-based categorization
    const sortedResponses = [...responseStats].sort((a, b) => b.avgRating - a.avgRating);
    const totalCount = sortedResponses.length;

    // Percentile-based split: Top 20%, Middle 60%, Bottom 20%
    // This ensures consistent distribution regardless of actual rating values
    const topCutoff = Math.ceil(totalCount * 0.2);       // Top 20%
    const bottomCutoff = Math.ceil(totalCount * 0.2);    // Bottom 20%

    const highRated = sortedResponses.slice(0, topCutoff);
    const lowRated = sortedResponses.slice(totalCount - bottomCutoff).reverse(); // Reverse so lowest first
    const avgRated = sortedResponses.slice(topCutoff, totalCount - bottomCutoff);

    // Extract comments from a category
    const extractComments = (responses, count = 5) => {
      const comments = [];
      const usedResponseIds = new Set();
      
      for (const resp of responses) {
        if (usedResponseIds.has(resp.responseId)) continue;
        
        for (const comment of resp.textComments) {
          if (comments.length < count) {
            comments.push({ 
              text: comment, 
              avgRating: Math.round(resp.avgRating * 100) / 100,
              responseId: resp.responseId 
            });
            usedResponseIds.add(resp.responseId);
          }
        }
        if (comments.length >= count) break;
      }
      return comments;
    };

    // Extract non-overlapping comments for each category
    const topComments = extractComments(highRated, 5);
    const leastRatedComments = extractComments(lowRated, 5);
    const avgComments = extractComments(avgRated, 5);

    // [NEW] Extract Topics Learned & Future Expectations
    const topicsLearnedRaw = [];
    const futureTopicsRaw = [];

    responses.forEach(resp => {
      (resp.answers || []).forEach(ans => {
        if (ans.type === 'topicslearned' && ans.value?.trim()) {
          // Split by commas and clean up
          const topics = ans.value.split(',').map(t => t.trim()).filter(Boolean);
          topicsLearnedRaw.push(...topics);
        }
        if (ans.type === 'futureSession' && ans.value?.trim()) {
          futureTopicsRaw.push({
            text: ans.value,
            avgRating: 0, // We'll fill this if needed
            responseId: resp.id
          });
        }
      });
    });

    // Process Topics Learned (Unique and Counted)
    const topicCounts = {};
    topicsLearnedRaw.forEach(t => {
      const normalized = t.toLowerCase();
      topicCounts[normalized] = (topicCounts[normalized] || 0) + 1;
    });
    
    // Sort and get top 15 topics
    const topicsLearned = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .slice(0, 15);

    // Process Future Topics (Top 5 Recent/Relevant)
    // For now we just take the first 5 unique ones
    const futureTopics = futureTopicsRaw.slice(0, 5);

    // Global rating stats
    const avgRating = globalAvgRating;
    const topRating = allRatings.length > 0 ? Math.max(...allRatings) : 0;
    const leastRating = allRatings.length > 0 ? Math.min(...allRatings) : 0;

    // Rating distribution (count of each rating value across all answers)
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    responseStats.forEach(resp => {
      resp.answers.filter(a => a.type === 'rating').forEach(a => {
        const val = Math.round(Number(a.value) || 0);
        if (val >= 1 && val <= 5) {
          ratingDistribution[val]++;
        }
      });
    });

    // Per-question stats
    const questionStats = {};
    responseStats.forEach(resp => {
      resp.answers.forEach(answer => {
        if (!questionStats[answer.questionId]) {
          questionStats[answer.questionId] = {
            type: answer.type,
            values: [],
            count: 0
          };
        }
        questionStats[answer.questionId].values.push(answer.value);
        questionStats[answer.questionId].count++;
      });
    });

    // Calculate averages for rating questions
    Object.keys(questionStats).forEach(qId => {
      const stat = questionStats[qId];
      if (stat.type === 'rating') {
        const numericValues = stat.values.map(v => Number(v) || 0);
        stat.avg = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
        stat.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        numericValues.forEach(v => {
          const rounded = Math.round(v);
          if (rounded >= 1 && rounded <= 5) {
            stat.distribution[rounded]++;
          }
        });
      } else if (stat.type === 'mcq') {
        // Count option frequencies
        stat.optionCounts = {};
        stat.values.forEach(v => {
          stat.optionCounts[v] = (stat.optionCounts[v] || 0) + 1;
        });
      }
      // Clean up raw values array to save space
      delete stat.values;
    });

    // Calculate category averages for radar chart
    // We need to get the session to look up question categories
    const { getSessionById } = await import('./sessionService');
    const session = await getSessionById(sessionId);
    const sessionQuestions = session?.questions || [];
    
    // Build a map of questionId -> category
    const questionCategoryMap = {};
    sessionQuestions.forEach(q => {
      if (q.category) {
        questionCategoryMap[q.id] = q.category;
      }
    });
    
    // Aggregate ratings by category
    const categoryTotals = {};
    const categoryCounts = {};
    
    responseStats.forEach(resp => {
      resp.answers.filter(a => a.type === 'rating').forEach(a => {
        const category = questionCategoryMap[a.questionId] || 'overall';
        const value = Number(a.value) || 0;
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
          categoryCounts[category] = 0;
        }
        categoryTotals[category] += value;
        categoryCounts[category]++;
      });
    });
    
    // Calculate averages per category
    const categoryAverages = {};
    Object.keys(categoryTotals).forEach(cat => {
      categoryAverages[cat] = Math.round((categoryTotals[cat] / categoryCounts[cat]) * 100) / 100;
    });

    return {
      totalResponses: responses.length,
      avgRating: Math.round(avgRating * 100) / 100,
      topRating: Math.round(topRating * 100) / 100,
      leastRating: Math.round(leastRating * 100) / 100,
      ratingDistribution,
      topComments,
      leastRatedComments,
      avgComments,
      questionStats,
      categoryAverages,
      topicsLearned,
      futureTopics,
      compiledAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error compiling session stats:', error);
    throw error;
  }
};
