"use client";

import React, { useEffect, useState } from 'react';
import { Skeleton } from '../../../components/ui/skeleton';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [search, page]);

  const handleBan = async (id: number, active: boolean) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/ban?id=${id}&active=${!active}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/delete?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRole = async (id: number, role: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/role?id=${id}&role=${role}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-gray-800">Пользователи</h1>
      <div className="mb-4 flex items-center space-x-4">
        <input
          className="p-2 border rounded-lg w-64"
          placeholder="Поиск по email или username"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={fetchUsers} disabled={loading}>Поиск</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow text-gray-800 text-sm md:text-base">
          <thead>
            <tr className="bg-indigo-50">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Роль</th>
              <th className="p-3 text-left">Статус</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="p-6">
                    <div className="flex space-x-4">
                      <Skeleton className="h-6 w-12 rounded" />
                      <Skeleton className="h-6 w-24 rounded" />
                      <Skeleton className="h-6 w-32 rounded" />
                      <Skeleton className="h-6 w-16 rounded" />
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-6">Нет пользователей</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b last:border-none">
                <td className="p-3">{u.id}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select
                    className="border rounded px-2 py-1"
                    value={u.role}
                    onChange={e => handleRole(u.id, e.target.value)}
                    disabled={loading}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="p-3">
                  {u.is_active ? <span className="text-green-600">Активен</span> : <span className="text-red-500">Забанен</span>}
                </td>
                <td className="p-3 space-x-2">
                  <button
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg"
                    onClick={() => handleBan(u.id, u.is_active)}
                    disabled={loading}
                  >
                    {u.is_active ? 'Бан' : 'Разбан'}
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                    onClick={() => handleDelete(u.id)}
                    disabled={loading}
                  >
                    Удалить
                  </button>
                </td>
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
        >
          Назад
        </button>
        <span>Стр. {page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700"
          onClick={() => setPage(p => p + 1)}
          disabled={page * pageSize >= total || loading}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
} 