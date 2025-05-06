// src/app/profile/page.tsx
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Импортируем компонент профиля динамически с опцией отключения SSR
const ProfileContent = dynamic(
  () => import('./ProfileContent'),
  { ssr: false }
);

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-indigo-600 to-blue-500 flex items-center justify-center"><div className="text-white text-xl">Загрузка...</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}