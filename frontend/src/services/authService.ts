import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Check if we are in demo/mock mode
const IS_DEMO_MODE = false; // Set to true to use the local mock DB by default, fallback to API if false

// In-memory/LocalStorage Mock Database helper
const getMockUsers = (): User[] => {
  const users = localStorage.getItem('mock_users');
  if (!users) {
    const defaultUsers: User[] = [
      {
        id: 'user_1',
        name: 'John Doe',
        email: 'user@example.com',
        role: 'user',
        createdAt: new Date().toISOString()
      },
      {
        id: 'admin_1',
        name: 'Admin Master',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('mock_users', JSON.stringify(defaultUsers));
    // Set default passwords
    localStorage.setItem('mock_passwords', JSON.stringify({
      'user@example.com': 'password123',
      'admin@example.com': 'admin123'
    }));
    return defaultUsers;
  }
  return JSON.parse(users);
};

export const authService = {
  // Register a new user
  async register(name: string, email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<AuthResponse> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getMockUsers();
          if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            reject(new Error('User already exists with this email address.'));
            return;
          }

          const assignedRole = email.toLowerCase() === 'sravssravanthi634@gmail.com' ? 'admin' : 'user';

          const newUser: User = {
            id: `user_${Math.random().toString(36).substr(2, 9)}`,
            name,
            email,
            role: assignedRole,
            createdAt: new Date().toISOString()
          };

          // Save user
          users.push(newUser);
          localStorage.setItem('mock_users', JSON.stringify(users));

          // Save password
          const passwords = JSON.parse(localStorage.getItem('mock_passwords') || '{}');
          passwords[email] = password;
          localStorage.setItem('mock_passwords', JSON.stringify(passwords));

          const token = `mock_jwt_token_${newUser.id}_${Date.now()}`;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(newUser));

          resolve({ user: newUser, token });
        }, 800);
      });
    }

    // Real API Call
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password, role });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  // Login existing user
  async login(email: string, password: string): Promise<AuthResponse> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getMockUsers();
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          const passwords = JSON.parse(localStorage.getItem('mock_passwords') || '{}');
          
          if (!user || passwords[email] !== password) {
            reject(new Error('Invalid email or password. Please try again.'));
            return;
          }

          const token = `mock_jwt_token_${user.id}_${Date.now()}`;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          resolve({ user, token });
        }, 800);
      });
    }

    // Real API Call
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: `Password reset instructions have been sent to ${email}.` });
        }, 500);
      });
    }

    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  // Update profile
  async updateProfile(name: string, email: string): Promise<User> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr) as User;
            const updated = { ...user, name, email };
            localStorage.setItem('user', JSON.stringify(updated));
            resolve(updated);
          }
        }, 500);
      });
    }

    const response = await api.post<User>('/auth/update-profile', { name, email });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    if (IS_DEMO_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: 'Password updated successfully.' });
        }, 500);
      });
    }

    const response = await api.post<{ message: string }>('/auth/update-password', { currentPassword, newPassword });
    return response.data;
  },

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!IS_DEMO_MODE) {
      api.post('/auth/logout').catch(() => {});
    }
  },

  // Get current user from localStorage (sync)
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  // Check if authenticated
  isAuthenticated(): boolean {
    return localStorage.getItem('token') !== null;
  }

};
