import apiClient from './client.ts';
import type { User } from '../types/models.ts';

export async function login(email: string, password: string): Promise<User> {
  const response = await apiClient.post('/auth/sign_in', {
    user: { email, password },
  });
  const { token, user } = response.data;
  if (token) {
    localStorage.setItem('token', token);
  }
  return user;
}

export async function register(
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<User> {
  const response = await apiClient.post('/auth/register', {
    user: { email, password, password_confirmation: passwordConfirmation },
  });
  const { token, user } = response.data;
  if (token) {
    localStorage.setItem('token', token);
  }
  return user;
}

export async function logout(): Promise<void> {
  await apiClient.delete('/auth/sign_out');
  localStorage.removeItem('token');
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get('/auth/me');
  return response.data.user || response.data;
}
