import api from './api';

export const analysisService = {
  forInterview: async (id) => (await api.get(`/api/interviews/${id}/analysis`)).data,
  forAnswer: async (id) => (await api.get(`/api/answers/${id}/analysis`)).data,
};
