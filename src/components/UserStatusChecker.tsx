import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import BannedModal from './BannedModal';

export default function UserStatusChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isBanned, setIsBanned] = useState(false);
  
  useEffect(() => {
    // Только для авторизованных пользователей проверяем статус
    if (status === 'authenticated' && session?.user) {
      checkUserStatus();
    }
  }, [status, session]);
  
  const checkUserStatus = async () => {
    try {
      const res = await fetch('/api/user/status');
      const data = await res.json();
      
      if (data.is_active === false) {
        setIsBanned(true);
      } else {
        setIsBanned(false);
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса пользователя:', error);
    }
  };
  
  return (
    <>
      <BannedModal isOpen={isBanned} />
      {/* Если пользователь забанен, все равно рендерим контент под модалкой */}
      {children}
    </>
  );
} 