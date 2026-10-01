import api from './api';

export const authService = {
  register: async (payload) => (await api.post('/api/auth/register', payload)).data,
  login: async (payload) => (await api.post('/api/auth/login', payload)).data,
  me: async () => (await api.get('/api/auth/me')).data,
};
