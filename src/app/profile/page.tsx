// src/app/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '../../components/ui/skeleton';
import { useTranslations } from 'next-intl';

interface User {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
}

export default function Profile() {
    const t = useTranslations('Profile');
    const { data: session, status } = useSession();
    const user = session?.user;
    const router = useRouter();
    const [editMode, setEditMode] = useState(false);
    const [username, setUsername] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');
    const [emailCode, setEmailCode] = useState('');
    const [emailStep, setEmailStep] = useState<'idle'|'sent'|'verifying'>('idle');
    const [avatarFile, setAvatarFile] = useState<File|null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!user) {
            router.push('/');
        }
    }, [user, status, router]);

    if (status === 'loading') {
        return <div className="text-center text-white">Загрузка...</div>;
    }
    if (!user) {
        return null;
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email, avatar_url: avatarUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ошибка обновления профиля');
            setUsername(data.username);
            setEmail(data.email);
            setAvatarUrl(data.avatar_url || '');
            setSuccess('Профиль обновлён!');
            setEditMode(false);
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
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Drag-n-drop avatar
    const handleAvatarDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
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
    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setLoading(true);
        setError('');
        setSuccess('');
        // Stub: upload to /api/upload-avatar (реализуй на сервере для реального upload)
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        try {
            const res = await fetch('/api/upload-avatar', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ошибка загрузки аватара');
            setAvatarUrl(data.url);
            setUsername(data.username);
            setEmail(data.email);
            setSuccess('Аватар обновлён!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    // Email change with code
    const handleSendEmailCode = async () => {
        setError('');
        setSuccess('');
        setEmailStep('idle');
        if (!pendingEmail || pendingEmail === user.email) {
            setError('Введите новый email');
            return;
        }
        setLoading(true);
        try {
            // Stub: send code to email
            const res = await fetch('/api/send-email-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: pendingEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ошибка отправки кода');
            setEmailStep('sent');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleVerifyEmailCode = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            // Stub: verify code
            const res = await fetch('/api/verify-email-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: pendingEmail, code: emailCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Неверный код');
            setUsername(data.username);
            setEmail(data.email);
            setPendingEmail('');
            setEmailCode('');
            setEmailStep('idle');
            setSuccess('Email подтверждён и обновлён!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-blue-500 flex items-center justify-center py-4 md:py-12 p-2">
            <div className="bg-white p-2 sm:p-4 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg">
                <h1 className="text-3xl font-bold mb-6 text-indigo-700 text-center">{t('profile_title')}</h1>
                <div className="flex flex-col items-center mb-6">
                    <div
                        className="w-20 h-20 rounded-full border-4 border-indigo-200 shadow mb-2 flex items-center justify-center bg-gray-100 cursor-pointer hover:shadow-lg transition relative"
                        onDrop={handleAvatarDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        title="Перетащите или кликните для смены аватара"
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
                                onClick={e => { e.stopPropagation(); handleAvatarUpload(); }}
                                disabled={loading}
                            >
                                {loading ? '...' : '⬆️'}
                            </button>
                        )}
                    </div>
                    {!editMode ? (
                        <>
                            <p className="font-semibold text-lg">{user.name}</p>
                            <p className="text-gray-500">{user.email}</p>
                        </>
                    ) : null}
                </div>
                {error && <div className="text-red-500 text-center mb-2">{error}</div>}
                {success && <div className="text-green-600 text-center mb-2">{success}</div>}
                {!editMode ? (
                    <>
                        <button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg mb-2 transition"
                            onClick={() => setEditMode(true)}
                        >
                            {t('edit_profile')}
                        </button>
                        <button
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg mb-2 transition"
                            onClick={() => router.push('/')}
                        >
                            {t('logout')}
                        </button>
                        <details className="mt-4">
                            <summary className="cursor-pointer text-indigo-600 font-semibold">{t('change_password')}</summary>
                            <form onSubmit={handlePasswordChange} className="space-y-3 mt-3">
                                <input
                                    type="password"
                                    placeholder={t('current_password')}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder={t('new_password')}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder={t('confirm_new_password')}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition"
                                    disabled={loading}
                                >
                                    {loading ? 'Сохраняю...' : t('change_password')}
                                </button>
                            </form>
                        </details>
                    </>
                ) : (
                    <form onSubmit={handleSave} className="space-y-3 md:space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">{t('username')}</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">{t('email')}</label>
                            <div className="flex space-x-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                    disabled
                                />
                                <button
                                    type="button"
                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg text-sm"
                                    onClick={() => {
                                        setEmailStep('idle');
                                        setPendingEmail('');
                                    }}
                                >
                                    {t('change')}
                                </button>
                            </div>
                            {emailStep === 'idle' && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex space-x-2">
                                        <input
                                            type="email"
                                            value={pendingEmail}
                                            onChange={e => setPendingEmail(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder={t('new_email')}
                                        />
                                        <button
                                            type="button"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm"
                                            onClick={handleSendEmailCode}
                                            disabled={loading}
                                        >
                                            {loading ? '...' : t('get_code')}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {emailStep === 'sent' && (
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={emailCode}
                                        onChange={e => setEmailCode(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={t('code_from_email')}
                                    />
                                    <button
                                        type="button"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm"
                                        onClick={handleVerifyEmailCode}
                                        disabled={loading}
                                    >
                                        {loading ? '...' : t('verify')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">{t('avatar_url')}</label>
                            <input
                                type="url"
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="flex flex-col md:flex-row md:space-x-4 gap-2 md:gap-0">
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition"
                                disabled={loading}
                            >
                                {loading ? 'Сохраняю...' : t('save')}
                            </button>
                            <button
                                type="button"
                                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition"
                                onClick={() => {
                                    setEditMode(false);
                                    setUsername(user.name);
                                    setEmail(user.email);
                                    setAvatarUrl(user.avatar_url || '');
                                    setError('');
                                    setSuccess('');
                                }}
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}