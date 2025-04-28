import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const users = await query<{
            id: string;
            email: string;
            password: string;
            role: string;
          }>(
            'SELECT id, email, password, role FROM users WHERE email = $1',
            [credentials.email]
          );

          if (users.length === 0) {
            return null;
          }

          const user = users[0];
          const bcrypt = require('bcrypt');
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  }
}; 