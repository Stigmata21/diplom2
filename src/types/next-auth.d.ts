import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'user' | 'admin';
      avatar_url: string | null;
    }
  }
} 