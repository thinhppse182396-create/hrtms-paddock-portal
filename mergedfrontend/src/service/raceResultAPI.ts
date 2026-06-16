// src/service/raceResultAPI.ts
// Race result service - calls real backend API

import api from '../api';

export const createRaceResult = (result: Record<string, unknown>) =>
  api.post('/raceResults', result);

export const getRaceResults = (raceId?: string) =>
  raceId ? api.get(`/raceResults?raceId=${raceId}`) : api.get('/raceResults');

export const updateRaceResult = (id: string, result: Record<string, unknown>) =>
  api.put(`/raceResults/${id}`, result);
