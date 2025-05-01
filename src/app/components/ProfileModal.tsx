import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { data: session } = useSession();
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления профиля');
      setSuccess('Профиль обновлён!');
      setAvatarFile(null);
      if (data.user) {
        setEmail(data.user.email || '');
        setUsername(data.user.username || '');
        const avatarUrl = data.user.avatar_url ? data.user.avatar_url + '?t=' + Date.now() : '';
        setAvatar(avatarUrl);
        setAvatarPreview(avatarUrl);
        if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
          if (typeof (session as any)?.update === 'function') {
            (session as any).update({
              email: data.user.email,
              name: data.user.username,
              image: avatarUrl,
              avatar_url: avatarUrl,
            });
          }
          setTimeout(() => window.location.reload(), 300);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !newPassword || newPassword !== confirmPassword) {
      setError('Проверьте правильность заполнения полей');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка смены пароля');
      setSuccess('Пароль обновлён!');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Редактировать профиль</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full border-4 border-indigo-200 shadow mb-2 flex items-center justify-center bg-gray-100 cursor-pointer hover:shadow-lg transition relative"
              onClick={() => fileInputRef.current?.click()}
              title="Кликните для смены аватара"
            >
              <img
                src={avatarPreview || 'https://via.placeholder.com/80'}
                alt="Аватар"
                className="w-20 h-20 rounded-full object-cover"
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
              />
              {avatarFile && (
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1 shadow hover:bg-indigo-700"
                  onClick={e => { e.stopPropagation(); }}
                  disabled={loading}
                >
                  {loading ? '...' : '⬆️'}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500" required />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Имя пользователя</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500" required />
          </div>

          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {showPasswordChange ? 'Скрыть смену пароля' : 'Изменить пароль'}
            </button>

            <AnimatePresence>
              {showPasswordChange && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Текущий пароль</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500" autoComplete="current-password" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Новый пароль</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500" autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Подтвердите новый пароль</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500" autoComplete="new-password" />
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition"
                    disabled={loading}
                  >
                    {loading ? 'Сохраняю...' : 'Изменить пароль'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition"
              disabled={loading}
            >
              {loading ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 