import api from './api';

export const interviewService = {
  create: async (payload) => (await api.post('/api/interviews', payload)).data,
  list: async () => (await api.get('/api/interviews')).data,
  get: async (id) => (await api.get(`/api/interviews/${id}`)).data,
  start: async (id) => (await api.post(`/api/interviews/${id}/start`)).data,
  answer: async (id, payload) => (await api.post(`/api/interviews/${id}/answers`, payload)).data,
  finish: async (id) => (await api.post(`/api/interviews/${id}/finish`)).data,
  remove: async (id) => api.delete(`/api/interviews/${id}`),
  analysis: async (id) => (await api.get(`/api/interviews/${id}/analysis`)).data,
};
