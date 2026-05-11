const STORAGE_KEY = 'chatbot_unmatched_queries';

export const logUnmatchedQuery = (query) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push({ query, timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-50)));
  } catch (e) {
    // ignore quota / private mode
  }
};

export const getUnmatchedQueries = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
};
