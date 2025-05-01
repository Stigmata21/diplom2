import { create } from 'zustand';
import { User } from '@/types/db';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  supportUnreadCount: number;
  setSupportUnreadCount: (count: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  supportUnreadCount: typeof window !== 'undefined' && localStorage.getItem('supportUnreadCount')
    ? Number(localStorage.getItem('supportUnreadCount'))
    : 0,
  setSupportUnreadCount: (count) => {
    set({ supportUnreadCount: count });
    if (typeof window !== 'undefined') {
      localStorage.setItem('supportUnreadCount', String(count));
    }
  },
})); 