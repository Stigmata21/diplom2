import React from 'react';

interface BannedModalProps {
  isOpen: boolean;
}

export default function BannedModal({ isOpen }: BannedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 bg-red-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Аккаунт заблокирован</h2>
          <p className="text-gray-600 mb-6">
            Ваш аккаунт был заблокирован администратором. Вы не можете использовать функциональность системы.
          </p>
          <p className="text-gray-500 text-sm">
            Если вы считаете, что произошла ошибка, пожалуйста, обратитесь в службу поддержки.
          </p>
        </div>
      </div>
    </div>
  );
} 