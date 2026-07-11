import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }

  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getBackendBaseUrl = () => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api$/, '');
};

export const reviewQuestion = async (question) => {
  const response = await api.post('/review', { question });
  return response.data;
};

export const reviewQuestionsBatch = async (questions) => {
  const response = await api.post('/review/batch', questions);
  return response.data;
};

export const reviewExamPaper = async (data) => {
  const response = await api.post('/exam', data);
  return response.data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default api;
