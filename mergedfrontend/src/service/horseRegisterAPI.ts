// src/service/horseRegisterAPI.ts
// Horse registration service - calls real backend API

import api from '../api';

export const createRegistration = (registration: Record<string, unknown>) =>
  api.post('/registrations', registration);

export const getRegistrations = () => api.get('/registrations');

export const updateRegistration = (id: string, data: Record<string, unknown>) =>
  api.put(`/registrations/${id}`, data);
