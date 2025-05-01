// src/app/support/page.tsx
'use client';

import { useState, useEffect } from 'react';
import NavButton from '../components/NavButton';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Support() {
    const { data: session, status } = useSession();
    const user = session?.user;
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;
        if (!user) {
            router.push('/');
        }
    }, [user, status, router]);

    const handleSubmitSupport = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!user) return;

        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, message }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при отправке сообщения');
            }

            setSuccessMessage(data.message);
            setMessage('');
        } catch (err: any) {
            console.error('Support submit error:', err);
            setError(err.message);
        }
    };

    if (status === 'loading') {
        return <div className="text-center text-white">Загрузка...</div>;
    }
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-blue-500 text-white flex items-center justify-center py-12">
            <div className="bg-white text-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-indigo-600">Поддержка</h1>
                <form onSubmit={handleSubmitSupport} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Ваше сообщение</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                            rows={5}
                            placeholder="Опишите вашу проблему или вопрос"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
                    <div className="flex space-x-4">
                        <NavButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                            Отправить
                        </NavButton>
                        <NavButton
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800"
                        >
                            Назад
                        </NavButton>
                    </div>
                </form>
            </div>
        </div>
    );
}