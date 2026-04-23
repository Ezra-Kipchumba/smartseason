/**
 * api.js
 * Centralised Axios instance.
 * Automatically attaches the JWT from localStorage to every request
 * so individual components never need to manage headers.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
});

// Request interceptor — inject auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
// Weather API helper
export const getFieldWeather = async (fieldId) => {
  const res = await api.get(`/api/fields/${fieldId}/weather`);
  return res.data;
};
