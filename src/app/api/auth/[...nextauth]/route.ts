import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';
import { compare } from 'bcrypt';
import { User } from '@/types/db';
import NextAuth from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Нет email или пароля');
          return null;
        }

        const users = await query<User>('SELECT * FROM users WHERE email = $1', [credentials.email]);
        const user = users[0];
        console.log('[NextAuth] Пользователь найден:', !!user, user?.email);

        if (!user) {
          console.log('[NextAuth] Нет пользователя с таким email');
          return null;
        }

        const isValid = await compare(credentials.password, user.password_hash);
        console.log('[NextAuth] Пароль валиден:', isValid);

        if (!isValid) {
          console.log('[NextAuth] Пароль не совпадает');
          return null;
        }

        if ('is_active' in user && user.is_active === false) {
          console.log('[NextAuth] Пользователь деактивирован');
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          rememberMe: String(credentials.rememberMe) === 'true',
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        (token as any).rememberMe = (user as any).rememberMe;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin';
        (session as any).rememberMe = (token as any).rememberMe;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 час по умолчанию
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 