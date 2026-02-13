import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.response = error.response || {};
      error.response.data = { message: 'NT01 - Tempo esgotado. Verifique sua conexão e tente novamente.' };
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      error.response = error.response || {};
      error.response.data = { message: 'NT02 - Sem conexão. Verifique sua rede e tente novamente.' };
    }
    return Promise.reject(error);
  }
);

export default api;