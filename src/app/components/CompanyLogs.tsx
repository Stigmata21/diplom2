import React, { useEffect, useState } from 'react';

interface Log {
  id: number;
  action: string;
  meta: any;
  created_at: string;
  username: string;
}

export default function CompanyLogs({ companyId }: { companyId: number }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [companyId]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/companies/logs?companyId=${companyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки истории');
      setLogs(data.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <h4 className="text-lg font-semibold mb-2 text-indigo-700">История действий</h4>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Загрузка...</div>
      ) : logs.length === 0 ? (
        <div className="text-gray-500">Нет записей</div>
      ) : (
        <table className="min-w-full bg-white rounded-lg shadow text-gray-800 text-sm md:text-base">
          <thead>
            <tr className="bg-indigo-50">
              <th className="p-2 text-left">Дата</th>
              <th className="p-2 text-left">Пользователь</th>
              <th className="p-2 text-left">Действие</th>
              <th className="p-2 text-left">Детали</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b last:border-none">
                <td className="p-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-2">{log.username || '—'}</td>
                <td className="p-2">{log.action}</td>
                <td className="p-2">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 rounded p-1">{JSON.stringify(log.meta, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 