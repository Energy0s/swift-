import api from './api';

export const login = (email: string, password: string) => {
  return api.post('/auth/login', { email, password });
};

export const register = (name: string, email: string, password: string) => {
  return api.post('/auth/register', { name, email, password });
};

export const logout = () => {
  return api.post('/auth/logout');
};

export const getProfile = () => {
  return api.get('/users/profile');
};

export const updateProfile = (userData: { name: string; email: string }) => {
  return api.put('/users/profile', userData);
};