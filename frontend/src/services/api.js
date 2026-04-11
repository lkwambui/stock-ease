import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('stockease_token');
      localStorage.removeItem('stockease_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
