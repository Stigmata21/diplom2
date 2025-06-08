import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { NonCachedImage } from '@/components/NonCachedImage';
import AvatarImage from '@/components/AvatarImage';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Обновляем состояние, когда меняется пользователь в сессии
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setUsername(user.name || '');
      if (user.avatar_url) {
        const avatarWithTimestamp = `${user.avatar_url}?t=${timestamp}`;
        setAvatar(avatarWithTimestamp);
      }
    }
  }, [user, timestamp]);

  // Вспомогательная функция для принудительного обновления аватаров на странице
  const forceUpdateAvatars = (avatarUrl: string) => {
    // Немедленно обновляем существующие изображения
    const updateAllAvatars = () => {
      // Находим все аватары на странице (как img, так и внутри компонентов)
      const avatarImages = document.querySelectorAll('img[alt="Аватар пользователя"]');
      
      console.log(`Обновляем ${avatarImages.length} изображений аватара на странице`);
      
      if (avatarImages.length === 0) {
        console.log('Не найдено изображений аватара для обновления, пробуем другой селектор');
        // Пробуем другой подход, если первый не сработал
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
          const imgElement = img as HTMLImageElement;
          const imgSrc = imgElement.src;
          
          // Проверяем, содержит ли URL путь к uploads (где хранятся аватары)
          if (imgSrc.includes('/uploads/')) {
            console.log('Найдено изображение аватара:', imgSrc);
            // Создаем новый URL с временной меткой
            const baseUrl = imgSrc.split('?')[0];
            const newUrl = `${baseUrl}?cache=${Date.now()}`;
            console.log(`Обновляем изображение с ${imgSrc} на ${newUrl}`);
            imgElement.src = newUrl;
          }
        });
        return;
      }
      
      // Обновляем все найденные аватары
      avatarImages.forEach(img => {
        const imgElement = img as HTMLImageElement;
        // Очищаем URL от старых параметров кэширования
        const baseUrl = imgElement.src.split('?')[0];
        // Создаем новый URL с временной меткой
        const newUrl = `${baseUrl}?cache=${Date.now()}`;
        console.log(`Обновляем аватар с ${imgElement.src} на ${newUrl}`);
        imgElement.src = newUrl;
      });
    };
    
    // Вызываем обновление сразу и повторно через небольшие промежутки времени
    // для гарантии обновления всех аватаров, даже если они появляются с задержкой
    updateAllAvatars();
    setTimeout(updateAllAvatars, 100);
    setTimeout(updateAllAvatars, 500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const formData = new FormData();
      if (email) formData.append('email', email);
      if (username) formData.append('username', username);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      
      console.log('Ответ от сервера:', data);
      
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления профиля');
      
      // Инкрементируем timestamp для обновления URL
      const newTimestamp = Date.now();
      setTimestamp(newTimestamp);
      
      setSuccess('Профиль обновлён!');
      
      if (data.user) {
        setEmail(data.user.email || '');
        setUsername(data.user.username || '');
        
        // Используем аватар из ответа сервера с добавлением временной метки
        if (data.user.avatar_url) {
          const avatarUrl = `${data.user.avatar_url}?t=${newTimestamp}`;
          console.log('Новый URL аватара:', avatarUrl);
          setAvatar(avatarUrl);
          
          // Обновляем сессию с новыми данными
          if (updateSession) {
            try {
              // Вызываем метод принудительного обновления сессии
              await updateSession({
                ...session,
                user: {
                  ...session?.user,
                  name: data.user.username,
                  email: data.user.email,
                  avatar_url: data.user.avatar_url
                }
              });
              
              console.log('Сессия успешно обновлена с новым аватаром');
              
              // Принудительно обновляем все аватары на странице
              forceUpdateAvatars(data.user.avatar_url);
              
              // Показываем сообщение об успехе и закрываем модальное окно через паузу
              setTimeout(() => {
                onClose();
              }, 1500);
            } catch (sessionError) {
              console.error('Ошибка обновления сессии:', sessionError);
              // Сессия не обновилась, но аватар должен быть загружен - принудительно обновляем DOM
              forceUpdateAvatars(data.user.avatar_url);
              setTimeout(() => onClose(), 1500);
            }
          } else {
            // Если функции обновления сессии нет, просто обновляем DOM вручную
            forceUpdateAvatars(data.user.avatar_url);
            setTimeout(() => onClose(), 1500);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    console.log('Данные пользователя:', { 
      userId: session?.user?.id, 
      username,
      email
    });
    
    // Проверяем только пароли
    if (!password || !newPassword || newPassword !== confirmPassword) {
      setError('Проверьте правильность заполнения полей пароля');
      return;
    }
    
    setLoading(true);
    try {
      const payload = { 
        userId: session?.user?.id,
        username: username || session?.user?.name, 
        email: email || session?.user?.email, 
        currentPassword: password, 
        newPassword: newPassword 
      };
      
      console.log('Отправляемые данные:', payload);
      
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      console.log('Статус ответа:', res.status);
      const data = await res.json();
      console.log('Ответ сервера:', data);
      
      if (!res.ok) throw new Error(data.error || 'Ошибка смены пароля');
      setSuccess('Пароль обновлён!');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: unknown) {
      console.error('Ошибка при смене пароля:', err);
      setError(err instanceof Error ? err.message : 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !mounted) return null;

  const modalContent = (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="modal-container bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-auto relative"
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Редактировать профиль</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-2">
            <AvatarImage
              avatarUrl={avatar}
              size={80}
              className="w-20 h-20"
            />
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        {success && <div className="text-green-500 text-sm mb-4">{success}</div>}

        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Имя пользователя
              </label>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="button"
              className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              {showPasswordChange ? 'Отменить изменение пароля' : 'Изменить пароль'}
            </button>

            {showPasswordChange && (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50"
                  onClick={handlePasswordChange}
                  disabled={loading || !password || !newPassword || newPassword !== confirmPassword}
                >
                  {loading ? 'Обновление...' : 'Обновить пароль'}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="button"
              className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // Используем портал для рендеринга модального окна вне компонента
  return createPortal(
    <AnimatePresence>
      {open && modalContent}
    </AnimatePresence>,
    document.body
  );
} 