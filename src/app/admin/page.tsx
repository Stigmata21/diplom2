import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="text-4xl font-bold text-indigo-600">1,234</div>
          <div className="text-gray-500 mt-2">Пользователей</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="text-4xl font-bold text-indigo-600">87</div>
          <div className="text-gray-500 mt-2">Компаний</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="text-4xl font-bold text-indigo-600">5,678</div>
          <div className="text-gray-500 mt-2">Запросов</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Активность за неделю</h2>
        <div className="h-48 flex items-center justify-center text-gray-400">[График активности (заглушка)]</div>
      </div>
    </div>
  );
} 