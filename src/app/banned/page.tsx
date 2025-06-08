'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function BannedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Если пользователь не авторизован, перенаправляем на страницу логина
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 bg-red-100 p-4 rounded-full">
            <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-red-600 mb-4">Аккаунт заблокирован</h1>
          
          <p className="text-gray-700 text-lg mb-6">
            Ваш аккаунт был заблокирован администратором. Вы не можете использовать функциональность системы.
          </p>
          
          <p className="text-gray-600 mb-8">
            Если вы считаете, что произошла ошибка, пожалуйста, обратитесь в службу поддержки.
          </p>
          
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Выйти из системы
          </button>
        </div>
      </motion.div>
    </div>
  );
} 