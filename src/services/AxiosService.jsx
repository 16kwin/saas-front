// services/AxiosService.js
import axios from 'axios';

const AxiosService = axios.create({
  baseURL: 'http://localhost:8086',
  headers: {
    'Content-Type': 'application/json',
  },
});

AxiosService.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response?.status, error?.response?.data);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default AxiosService;