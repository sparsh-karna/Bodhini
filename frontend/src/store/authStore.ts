import { create } from 'zustand';
import axios from 'axios';

interface AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5001/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      set({ isAuthenticated: true });
    } catch (error) {
      console.error('Login failed:', error);
    }
  },
  signup: async (email: string, password: string) => {
    try {
      await axios.post('http://localhost:5001/register', { email, password });
      set({ isAuthenticated: true });
    } catch (error) {
      console.error('Signup failed:', error);
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false });
  },
}));