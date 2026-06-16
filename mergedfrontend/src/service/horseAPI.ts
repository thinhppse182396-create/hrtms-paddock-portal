// src/service/horseAPI.ts
// Horse service - calls real backend API

import api from '../api';

export const getHorses = () => api.get('/horses');

export const getHorseById = (id: string) => api.get(`/horses/${id}`);

export const createHorse = (horse: Record<string, unknown>) =>
  api.post('/horses', horse);

export const updateHorse = (id: string, horse: Record<string, unknown>) =>
  api.put(`/horses/${id}`, horse);

export const deleteHorse = (id: string) => api.delete(`/horses/${id}`);
