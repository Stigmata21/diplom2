// src/app/components/Header.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavButton from './NavButton';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';
import ProfileModal from './ProfileModal';
import InvitesModal from './InvitesModal';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AvatarImage from '@/components/AvatarImage';

export default function Header() {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const { data: session, update: updateSession } = useSession();
    const user = session?.user as { id: string; name: string; email: string; avatar_url?: string; role?: string } | undefined;
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isInvitesOpen, setIsInvitesOpen] = useState(false);
    const [invitesCount, setInvitesCount] = useState(0);
    const [avatarUpdateTrigger, setAvatarUpdateTrigger] = useState(() => Date.now());

    useEffect(() => {
        if (!user) return;
        fetch('/api/me/invites', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setInvitesCount((data.invites || []).filter((i: { status: string }) => i.status === 'pending').length);
            })
            .catch(() => setInvitesCount(0));
    }, [user, isInvitesOpen]);

    useEffect(() => {
        if (session?.user) {
            console.log('Session updated, refreshing avatar display');
            setAvatarUpdateTrigger(Date.now());
        }
    }, [session?.user?.avatar_url, session?.user?.name]);

    const refreshUserSession = useCallback(async () => {
        if (updateSession) {
            try {
                await updateSession();
                console.log('Сессия обновлена, обновляем аватар');
                setAvatarUpdateTrigger(Date.now());
            } catch (error) {
                console.error('Ошибка обновления сессии:', error);
            }
        }
    }, [updateSession]);

    const handleProfileModalClose = useCallback(() => {
        setIsProfileModalOpen(false);
        console.log('Профиль модальное окно закрыто, обновляем сессию');
        refreshUserSession();
        
        setTimeout(() => {
            setAvatarUpdateTrigger(Date.now());
        }, 50);
    }, [refreshUserSession]);

    const scrollToSection = (sectionId: string) => {
        return () => {
            const section = document.getElementById(sectionId);
            if (section) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                const offset = sectionId === 'pricing' ? 50 : 0;
                const sectionTop = section.getBoundingClientRect().top + window.scrollY - headerHeight + offset;
                window.scrollTo({ top: sectionTop, behavior: 'smooth' });
            }
        };
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (!email || !email.includes('@')) {
            setError('Введите корректный email');
            setLoading(false);
            return;
        }
        if (isRegister) {
            if (!username || username.length < 3) {
                setError('Имя пользователя слишком короткое');
                setLoading(false);
                return;
            }
            if (!password || password.length < 6) {
                setError('Пароль слишком короткий');
                setLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setError('Пароли не совпадают');
                setLoading(false);
                return;
            }
            const regRes = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const regData = await regRes.json();
            if (!regRes.ok) {
                setError(regData.error || 'Ошибка регистрации');
                setLoading(false);
                return;
            }
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
                rememberMe,
            });
            if (res?.error) {
                setError(res.error);
            } else {
                if (rememberMe) {
                    await fetch('/api/auth/remember', { method: 'POST' });
                }
                setIsAuthOpen(false);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setUsername('');
                setRememberMe(false);
            }
            setLoading(false);
            return;
        } else {
            if (!password) {
                setError('Введите пароль');
                setLoading(false);
                return;
            }
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
                rememberMe,
            });
            if (res?.error) {
                setError(res.error);
            } else {
                if (rememberMe) {
                    await fetch('/api/auth/remember', { method: 'POST' });
                }
                setIsAuthOpen(false);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setUsername('');
                setRememberMe(false);
            }
            setLoading(false);
            return;
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        setIsProfileOpen(false);
    };

    const profileVariants = {
        hidden: { opacity: 0, height: 0, transformOrigin: 'top', transition: { duration: 0.3, ease: 'easeIn' } },
        visible: { opacity: 1, height: 'auto', transformOrigin: 'top', transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, height: 0, transformOrigin: 'top', transition: { duration: 0.25, ease: 'easeIn' } },
    };

    const renderProfileDropdown = () => (
        <motion.div
            variants={profileVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white text-gray-800 rounded-xl shadow-xl p-4 z-50 border border-gray-100 overflow-hidden"
        >
            <div className="flex items-center mb-4">
                <AvatarImage
                    key={avatarUpdateTrigger}
                    avatarUrl={user?.avatar_url}
                    size={40}
                    className="mr-3"
                />
                <div>
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
            </div>
            <div className="border-t pt-2 flex flex-col gap-1">
                <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md"
                >
                    Настройки профиля
                </button>
                {user?.role === 'admin' && (
                    <Link href="/admin" className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md text-indigo-600 font-semibold">
                        Админ-панель
                    </Link>
                )}
                <Link href="/companies" className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md">
                    Мои компании
                </Link>
                <button
                    onClick={() => { setIsInvitesOpen(true); setIsProfileOpen(false); }}
                    className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md flex items-center gap-2"
                >
                    Приглашения
                    {invitesCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-gray-900">{invitesCount}</span>
                    )}
                </button>
                <div className="block w-full text-left py-2 px-3 hover:bg-gray-100 rounded-md">
                    <ThemeSwitcher />
                </div>
                <NavButton
                    onClick={handleLogout}
                    className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white"
                >
                    Выйти
                </NavButton>
            </div>
        </motion.div>
    );

    if (!user) {
        return (
            <header className="fixed top-0 w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-4 shadow-lg z-50 backdrop-blur-sm bg-gradient-to-r from-indigo-600/95 to-blue-500/95">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center">
                        <Image
                            src="/logo.webp"
                            alt="Логотип"
                            width={48}
                            height={48}
                            className="h-12 mr-3"
                            loading="lazy"
                        />
                        <span className="text-2xl font-bold">CompanySync</span>
                    </div>
                    <nav className="flex items-center space-x-4">
                        <a href="#about" className="text-white hover:text-yellow-300 transition-colors text-lg">
                            О нас
                        </a>
                        <a href="#pricing" className="text-white hover:text-yellow-300 transition-colors text-lg">
                            Тарифы
                        </a>
                        <NavButton onClick={() => setIsAuthOpen(true)} className="bg-indigo-700 hover:bg-indigo-800">Войти</NavButton>
                    </nav>
                </div>
                {isAuthOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white text-gray-800 rounded-xl shadow-xl p-6 z-50 border border-gray-100 max-h-[calc(100vh-100px)] overflow-y-auto">
                        <h3 className="font-bold text-xl mb-4 text-indigo-600">
                            {isRegister ? 'Регистрация' : 'Вход'}
                        </h3>
                        <form onSubmit={handleAuth} className="space-y-4">
                            {isRegister && (
                                <input
                                    type="text"
                                    placeholder="Имя пользователя"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            )}
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            {isRegister && (
                                <input
                                    type="password"
                                    placeholder="Повторите пароль"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            )}
                            {!isRegister && (
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-indigo-600"
                                    />
                                    <span className="text-sm text-gray-600">Запомнить пароль</span>
                                </label>
                            )}
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <NavButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                {loading ? '...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
                            </NavButton>
                            <p className="text-sm text-center">
                                {isRegister ? 'Уже есть аккаунт?' : 'Ещё не с нами?'}{' '}
                                <button
                                    type="button"
                                    onClick={() => { setIsRegister(!isRegister); setError(''); setPassword(''); setConfirmPassword(''); }}
                                    className="text-indigo-600 hover:underline"
                                >
                                    {isRegister ? 'Войти' : 'Создать аккаунт'}
                                </button>
                            </p>
                        </form>
                    </div>
                )}
            </header>
        );
    }

    return (
        <header className="bg-indigo-600 dark:bg-indigo-900 shadow-lg fixed top-0 w-full z-50 backdrop-blur-sm bg-indigo-600/95 dark:bg-indigo-900/95">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <span className="text-white font-bold text-xl">CompanySync</span>
                        </Link>
                    </div>
                    <nav className="hidden md:flex space-x-6 items-center">
                        <a href="#about" className="text-white hover:text-yellow-300 transition-colors">
                            О нас
                        </a>
                        <a href="#pricing" className="text-white hover:text-yellow-300 transition-colors">
                            Тарифы
                        </a>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        aria-expanded={isProfileOpen}
                                        className="flex items-center space-x-2 focus:outline-none"
                                    >
                                        <AvatarImage
                                            key={avatarUpdateTrigger}
                                            avatarUrl={user.avatar_url}
                                            size={32}
                                            className="w-8 h-8 rounded-full object-cover mr-3"
                                        />
                                        <span className="text-white">
                                            {user.name}
                                        </span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`h-5 w-5 text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <AnimatePresence>{isProfileOpen && renderProfileDropdown()}</AnimatePresence>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-4">
                                        <ThemeSwitcher />
                                        <NavButton onClick={() => setIsAuthOpen(true)} variant="secondary">Войти</NavButton>
                                    </div>
                                </>
                            )}
                        </div>
                    </nav>
                    <div className="md:hidden flex items-center space-x-4">
                        {user && (
                            <AvatarImage
                                key={avatarUpdateTrigger}
                                avatarUrl={user.avatar_url}
                                size={32}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        )}
                        <button
                            className="text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div 
                        className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-75 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div 
                            className="h-full bg-white dark:bg-gray-900 w-72 p-5 shadow-lg overflow-y-auto"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <Link href="/" className="text-xl font-bold text-indigo-700 dark:text-indigo-400">CompanySync</Link>
                                <button
                                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <nav className="space-y-2 mb-6">
                                <a
                                    href="#about"
                                    className="block py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    О нас
                                </a>
                                <a
                                    href="#pricing"
                                    className="block py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Тарифы
                                </a>
                                {user ? (
                                    <>
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
                                            <div className="flex items-center py-2">
                                                <AvatarImage
                                                    key={avatarUpdateTrigger}
                                                    avatarUrl={user.avatar_url}
                                                    size={40}
                                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                                />
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                            <Link 
                                                href="/profile" 
                                                className="block py-2 px-3 mt-2 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-200"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Профиль
                                            </Link>
                                            <Link 
                                                href="/companies" 
                                                className="block py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-200"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Мои компании
                                            </Link>
                                            {user.role === 'admin' && (
                                                <Link 
                                                    href="/admin" 
                                                    className="block py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    Админ-панель
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => { setIsInvitesOpen(true); setMobileMenuOpen(false); }}
                                                className="block w-full text-left py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                                            >
                                                Приглашения
                                                {invitesCount > 0 && (
                                                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-gray-900">{invitesCount}</span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                                className="block w-full text-left py-2 px-3 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 mt-4"
                                            >
                                                Выйти
                                            </button>
                                            <div className="block w-full text-left py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-200 mt-4 flex justify-between">
                                                <span>Переключить тему</span>
                                                <ThemeSwitcher />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <NavButton onClick={() => { setIsAuthOpen(true); setMobileMenuOpen(false); }} className="w-full mt-2" variant="primary">
                                            Войти
                                        </NavButton>
                                        <div className="block w-full text-left py-2 px-3 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900 text-gray-700 dark:text-gray-200 mt-4 flex justify-between">
                                            <span>Переключить тему</span>
                                            <ThemeSwitcher />
                                        </div>
                                    </div>
                                )}
                            </nav>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ProfileModal
                open={isProfileModalOpen}
                onClose={handleProfileModalClose}
            />
            <InvitesModal open={isInvitesOpen} onClose={() => setIsInvitesOpen(false)} />
        </header>
    );
}