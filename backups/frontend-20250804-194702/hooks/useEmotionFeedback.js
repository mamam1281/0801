// cc-webapp/frontend/hooks/useEmotionFeedback.js
import axios from 'axios'; // Or your configured apiClient

// This hook provides a function to fetch emotion feedback.
// It's not a traditional React hook that manages its own state here,
// but rather a provider of an async utility function.
export const useEmotionFeedback = () => {
  // apiClient could be initialized here or imported if globally configured
  const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api', // Backend API base URL
    // timeout: 5000, // Example timeout
  });

  const fetchEmotionFeedback = async (userId, actionType) => {
    console.log(`[useEmotionFeedback] Fetching feedback for user ${userId}, action: ${actionType}`);
    try {
      // TODO: Replace MOCKED RESPONSE with actual API call when backend endpoint is ready.
      // const response = await apiClient.post('/feedback', { userId, actionType });
      // return response.data; // Assuming backend returns { emotion: '...', message: '...' }

      // MOCKED RESPONSE FOR NOW:
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

      let emotion = 'neutral';
      let message = 'Action processed.';

      if (actionType.includes("WIN")) {
        emotion = 'happiness';
        message = 'Congratulations! A fantastic win!';
      } else if (actionType.includes("LOSE")) {
        emotion = 'frustration';
        message = 'Oh no! Better luck next time.';
      } else if (actionType.includes("SLOT")) { // Generic slot action
        emotion = 'determination';
        message = 'Spinning the reels of fate!';
      } else if (actionType.includes("RPS")) {
        emotion = 'determination';
        message = 'Rock, Paper, Scissors - choose wisely!';
      } else if (actionType.includes("ROULETTE")) {
        emotion = 'determination';
        message = 'Round and round it goes!';
      }
      // Add more specific mocked responses based on actionType if needed

      return { emotion, message };

    } catch (error) {
      console.error('[useEmotionFeedback] Error fetching emotion feedback:', error);
      // Fallback message on error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        return { emotion: 'frustration', message: `Server error: ${error.response.status}. Please try again.` };
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        return { emotion: 'frustration', message: 'Network error. Please check your connection.' };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error', error.message);
        return { emotion: 'neutral', message: 'An unexpected error occurred while fetching feedback.' };
      }
    }
  };

  return { fetchEmotionFeedback };
};
