"use client";

import React, { useEffect, useState } from 'react';

interface Log {
  id: number;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
  username: string;
  user?: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchLogs = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({
        user, action, from, to, page: String(page), pageSize: String(pageSize)
      });
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setLogs(data.logs);
      setTotal(data.total);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [user, action, from, to, page]);

  const handleExport = async () => {
    const params = new URLSearchParams({ user, action, from, to, export: 'csv' });
    const res = await fetch(`/api/admin/logs?${params}`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-gray-800">Логи</h1>
      <div className="mb-4 flex items-center space-x-4">
        <input className="p-2 border rounded-lg w-64" placeholder="Пользователь" value={user} onChange={e => { setUser(e.target.value); setPage(1); }} />
        <input className="p-2 border rounded-lg w-64" placeholder="Действие" value={action} onChange={e => { setAction(e.target.value); setPage(1); }} />
        <input type="date" className="p-2 border rounded-lg" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
        <input type="date" className="p-2 border rounded-lg" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={fetchLogs} disabled={loading}>Фильтр</button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg ml-auto" onClick={handleExport} disabled={loading}>Экспорт</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow text-gray-800">
          <thead>
            <tr className="bg-indigo-50">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Пользователь</th>
              <th className="p-3 text-left">Действие</th>
              <th className="p-3 text-left">Дата/время</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">Загрузка...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">Нет данных</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b last:border-none">
                <td className="p-3">{log.id}</td>
                <td className="p-3">{log.user || <span className="text-gray-400">—</span>}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.created_at?.replace('T', ' ').slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Пагинация */}
      <div className="mt-4 flex justify-center items-center space-x-2">
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >Назад</button>
        <span>Стр. {page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700"
          onClick={() => setPage(p => p + 1)}
          disabled={page * pageSize >= total || loading}
        >Вперёд</button>
      </div>
    </div>
  );
} 