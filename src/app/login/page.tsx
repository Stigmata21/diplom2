'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import NavButton from '../components/NavButton';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при входе');
            }

            Cookies.set('token', data.token, { expires: 7 });
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-600 to-blue-500">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md"
            >
                <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">Вход в систему</h1>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <NavButton
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={loading}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </NavButton>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Нет аккаунта?{' '}
                        <button
                            onClick={() => router.push('/register')}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                            Зарегистрироваться
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
} 