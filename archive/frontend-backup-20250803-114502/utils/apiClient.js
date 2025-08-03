import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api', // Adjusted to include /api prefix if backend routes use it
});

export default apiClient;
