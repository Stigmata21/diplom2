"use client";

import React from 'react';

const companies = [
  { id: 1, name: 'Acme Corp', users: 12, created: '2024-06-01' },
  { id: 2, name: 'Globex', users: 5, created: '2024-05-20' },
];

export default function AdminCompanies() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-gray-800">Компании</h1>
      <div className="mb-4 flex items-center space-x-4">
        <input className="p-2 border rounded-lg w-64" placeholder="Поиск по названию" />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Поиск</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow text-gray-800">
          <thead>
            <tr className="bg-indigo-50">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Название</th>
              <th className="p-3 text-left">Пользователей</th>
              <th className="p-3 text-left">Создана</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} className="border-b last:border-none">
                <td className="p-3">{c.id}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.users}</td>
                <td className="p-3">{c.created}</td>
                <td className="p-3 space-x-2">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg">Просмотр</button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 