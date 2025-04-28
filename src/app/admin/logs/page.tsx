"use client";

import React from 'react';

const logs = [
  { id: 1, user: 'admin', action: 'Удалил компанию', date: '2024-06-10 12:34' },
  { id: 2, user: 'user1', action: 'Вошёл в систему', date: '2024-06-10 11:20' },
  { id: 3, user: 'admin', action: 'Забанил пользователя', date: '2024-06-09 18:05' },
];

export default function AdminLogs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-gray-800">Логи</h1>
      <div className="mb-4 flex items-center space-x-4">
        <input className="p-2 border rounded-lg w-64" placeholder="Пользователь или действие" />
        <input type="date" className="p-2 border rounded-lg" />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Фильтр</button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg ml-auto">Экспорт</button>
      </div>
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
            {logs.map(log => (
              <tr key={log.id} className="border-b last:border-none">
                <td className="p-3">{log.id}</td>
                <td className="p-3">{log.user}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 