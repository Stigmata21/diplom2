'use client';
import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/metrics')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setMetrics(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{label:'Пользователей', key:'users'},{label:'Компаний',key:'companies'},{label:'Запросов',key:'logs'}].map((m,i) => (
          <div key={m.key} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-4xl font-bold text-indigo-600">
              {loading ? <span className="animate-pulse text-gray-300">...</span> : metrics?.[m.key] ?? '-'}
            </div>
            <div className="text-gray-500 mt-2">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6 mt-8">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">Активность за неделю</h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400">Загрузка...</div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center text-red-400">{error}</div>
        ) : metrics?.activity?.length ? (
          <ActivityChart data={metrics.activity} />
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">Нет данных</div>
        )}
      </div>
    </div>
  );
}

function ActivityChart({ data }: { data: { day: string, count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end h-48 gap-2 w-full">
      {data.map(d => (
        <div key={d.day} className="flex-1 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">{d.count}</div>
          <div className="bg-indigo-400 rounded w-6" style={{ height: `${(d.count / max) * 100}%`, minHeight: 8 }} />
          <div className="text-xs text-gray-400 mt-1">{d.day.slice(5)}</div>
        </div>
      ))}
    </div>
  );
} 