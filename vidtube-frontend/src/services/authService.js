import httpClient from './httpClient.js';

export const login = (credentials) =>
  httpClient.post('/users/login', credentials);

export const register = (formData) =>
  httpClient.post('/users/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const logout = () => httpClient.post('/users/logout');

export const getCurrentUser = () => httpClient.get('/users/profile');


