import React, { useEffect, useState } from 'react';
import NavButton from './NavButton';
import { Skeleton } from '../../components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../components/ui/tooltip';

interface Employee {
  id: number;
  username: string;
  email: string;
  role_in_company: string;
}

interface CompanyEmployeesProps {
  companyId: number;
  currentUserId: number;
  currentUserRole: string;
}

function RoleBadge({ role }: { role: string }) {
  const color = role === 'owner' ? 'bg-yellow-400 text-yellow-900' : role === 'admin' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700';
  const label = role === 'owner' ? 'Владелец: полный контроль' : role === 'admin' ? 'Админ: управление сотрудниками и файлами' : 'Участник: только просмотр';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{role}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function CompanyEmployees({ companyId, currentUserId, currentUserRole }: CompanyEmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line
  }, [companyId]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/companies/employees?companyId=${companyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки сотрудников');
      setEmployees(data.employees);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setSaving(userId);
    setError('');
    try {
      const res = await fetch('/api/companies/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, userId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка смены роли');
      setEmployees(employees.map(e => e.id === userId ? { ...e, role_in_company: newRole } : e));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setSaving(null);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setError('');
    try {
      const res = await fetch('/api/companies/add-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка добавления сотрудника');
      setEmployees([...employees, data.employee]);
      setInviteEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteEmployee = async (userId: number) => {
    if (!window.confirm('Удалить сотрудника из компании?')) return;
    setSaving(userId);
    setError('');
    try {
      const res = await fetch('/api/companies/remove-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления сотрудника');
      setEmployees(employees.filter(e => e.id !== userId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setSaving(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="mt-4 overflow-x-auto">
        <h4 className="text-lg font-semibold mb-2 text-indigo-700">Сотрудники компании</h4>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex space-x-4 items-center">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-6 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <table className="min-w-full bg-white rounded-lg shadow text-gray-800 text-sm md:text-base">
            <thead>
              <tr className="bg-indigo-50">
                <th className="p-2 text-left">Имя</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Роль</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} className="border-b last:border-none">
                  <td className="p-2">{e.username}</td>
                  <td className="p-2">{e.email}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {(currentUserRole === 'owner' || currentUserRole === 'admin') && e.id !== currentUserId && e.role_in_company !== 'owner' ? (
                        <>
                          <select
                            className="border rounded px-2 py-1 bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            value={e.role_in_company}
                            onChange={ev => handleRoleChange(e.id, ev.target.value)}
                            disabled={saving === e.id}
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                            {currentUserRole === 'owner' && <option value="owner">owner</option>}
                          </select>
                          <RoleBadge role={e.role_in_company} />
                          <button
                            className="ml-2 text-red-500 hover:text-red-700"
                            title="Удалить сотрудника"
                            onClick={() => handleDeleteEmployee(e.id)}
                            disabled={saving === e.id}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <RoleBadge role={e.role_in_company} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <form onSubmit={handleAddEmployee} className="mb-4 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Email сотрудника"
              className="border rounded p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
            <NavButton type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              {inviteLoading ? 'Добавление...' : 'Добавить'}
            </NavButton>
          </form>
        )}
      </div>
    </TooltipProvider>
  );
} 