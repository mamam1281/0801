import apiRequest from './api';

export async function apiGet(path: string) {
  return await apiRequest(path, { method: 'GET' });
}
