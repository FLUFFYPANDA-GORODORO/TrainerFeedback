/**
 * Question Categories for Radar Chart Analytics
 * 
 * These categories are used to group rating questions
 * and calculate category-wise averages for spider/radar charts.
 */

export const QUESTION_CATEGORIES = [
  { value: 'knowledge', label: 'Subject Knowledge', description: 'Trainer\'s expertise in the topic' },
  { value: 'communication', label: 'Communication', description: 'Clarity and explanation skills' },
  { value: 'engagement', label: 'Engagement', description: 'Interaction and responsiveness to doubts' },
  { value: 'content', label: 'Content Quality', description: 'Relevance and quality of materials' },
  { value: 'delivery', label: 'Delivery', description: 'Pace, presentation, and session flow' },
  { value: 'futureSessions', label: 'Future Sessions', description: 'Expectations and suggestions for upcoming sessions' },
  { value: 'overall', label: 'Overall', description: 'General satisfaction' }
];

// Helper to get category label by value
export const getCategoryLabel = (value) => {
  const cat = QUESTION_CATEGORIES.find(c => c.value === value);
  return cat ? cat.label : value;
};

// Default category for new rating questions
export const DEFAULT_CATEGORY = 'overall';
