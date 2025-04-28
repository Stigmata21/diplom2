import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  role: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-store', // localStorage key
    }
  )
); 