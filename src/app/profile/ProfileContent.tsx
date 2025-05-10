'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import AvatarImage from '@/components/AvatarImage';

export default function ProfileContent() {
    const t = useTranslations('Profile');
    const { data: session, status, update: updateSession } = useSession();
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

    useEffect(() => {
        if (user?.avatar_url) {
            setAvatarUrl(user.avatar_url);
        }
    }, [user?.avatar_url]);

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
            userId: user?.id, 
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
                userId: user?.id,
                username: username || user?.name, 
                email: email || user?.email, 
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
        } catch (err: unknown) {
            console.error('Ошибка при смене пароля:', err);
            setError(err instanceof Error ? err.message : 'Ошибка смены пароля');
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Ошибка отправки кода');
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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Ошибка подтверждения кода');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-blue-500 flex items-center justify-center py-4 md:py-12 p-2">
            <div className="bg-white p-2 sm:p-4 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg">
                <h1 className="text-3xl font-bold mb-6 text-indigo-700 text-center">{t('profile_title')}</h1>
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-200 shadow mb-2 flex items-center justify-center bg-gray-100 relative">
                        <AvatarImage
                            avatarUrl={avatarUrl}
                            size={80}
                            className="w-20 h-20"
                        />
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

                {editMode ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                {t('username')}
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                disabled={loading}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                disabled={loading}
                            >
                                {loading ? t('saving') : t('save')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="border-t border-b border-gray-200 py-4 mb-4">
                            <h2 className="text-lg font-semibold mb-2">{t('account_info')}</h2>
                            <div className="grid grid-cols-3 gap-1 text-sm">
                                <div className="font-medium text-gray-700">{t('username')}:</div>
                                <div className="col-span-2">{user.name}</div>
                                <div className="font-medium text-gray-700">Email:</div>
                                <div className="col-span-2">{user.email}</div>
                                <div className="font-medium text-gray-700">{t('account_created')}:</div>
                                <div className="col-span-2">{new Date().toLocaleDateString()}</div>
                                <div className="font-medium text-gray-700">{t('status')}:</div>
                                <div className="col-span-2">{t('active')}</div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <button
                                type="button"
                                onClick={() => setEditMode(true)}
                                className="w-full px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('edit_profile')}
                            </button>
                            
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-semibold mb-2">{t('change_password')}</h3>
                                <form onSubmit={handlePasswordChange} className="space-y-3">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            {t('current_password')}
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                            disabled={loading}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                            {t('new_password')}
                                        </label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                            disabled={loading}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                            {t('confirm_password')}
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                            disabled={loading}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        disabled={loading || !password || !newPassword || !confirmPassword}
                                    >
                                        {loading ? t('updating') : t('update_password')}
                                    </button>
                                </form>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-semibold mb-2">{t('change_email')}</h3>
                                <div className="space-y-3">
                                    {emailStep === 'idle' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label htmlFor="pendingEmail" className="block text-sm font-medium text-gray-700">
                                                    {t('new_email')}
                                                </label>
                                                <input
                                                    type="email"
                                                    id="pendingEmail"
                                                    value={pendingEmail}
                                                    onChange={e => setPendingEmail(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSendEmailCode}
                                                className="w-full px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                disabled={loading || !pendingEmail || pendingEmail === user.email}
                                            >
                                                {loading ? t('sending') : t('send_confirmation_code')}
                                            </button>
                                        </div>
                                    )}
                                    
                                    {emailStep === 'sent' && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-600">
                                                {t('code_sent_info', { email: pendingEmail })}
                                            </p>
                                            <div>
                                                <label htmlFor="emailCode" className="block text-sm font-medium text-gray-700">
                                                    {t('confirmation_code')}
                                                </label>
                                                <input
                                                    type="text"
                                                    id="emailCode"
                                                    value={emailCode}
                                                    onChange={e => setEmailCode(e.target.value)}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEmailStep('idle')}
                                                    className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                                    disabled={loading}
                                                >
                                                    {t('back')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleVerifyEmailCode}
                                                    className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    disabled={loading || !emailCode}
                                                >
                                                    {loading ? t('verifying') : t('verify_code')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 