import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  mustChangePassword: boolean;
  setAuth: (token: string, username: string, role: string, mustChangePassword?: boolean) => void;
  updateMustChangePassword: (status: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      role: null,
      mustChangePassword: false,
      setAuth: (token, username, role, mustChangePassword = false) => set({ token, username, role, mustChangePassword }),
      updateMustChangePassword: (status) => set({ mustChangePassword: status }),
      logout: () => set({ token: null, username: null, role: null, mustChangePassword: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
