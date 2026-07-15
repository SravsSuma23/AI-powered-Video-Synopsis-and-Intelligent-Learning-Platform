import api from './api';
import type { User } from './authService';

export interface AdminErrorLog {
  id: string;
  time: string;
  action: string;
  error: string;
}

export interface AdminActivityPoint {
  date: string;
  count: number;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSummaries: number;
  avgProcessingTimeSec: number;
  tokenConsumption: number;
  recentErrors: AdminErrorLog[];
  activityData: AdminActivityPoint[];
}

export const adminService = {
  /**
   * Retrieves registered user accounts list from FastAPI.
   */
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
  },

  /**
   * Updates user role credentials.
   */
  async toggleUserRole(userId: string): Promise<User[]> {
    const response = await api.post<User[]>(`/admin/users/${userId}/toggle-role`);
    return response.data;
  },

  /**
   * Permanently erases user credentials from database.
   */
  async deleteUser(userId: string): Promise<User[]> {
    const response = await api.delete<User[]>(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Fetches daily runs, token counters, and pipeline errors list.
   */
  async getMetrics(): Promise<AdminMetrics> {
    const response = await api.get<AdminMetrics>('/admin/metrics');
    return response.data;
  }
};
export default adminService;
