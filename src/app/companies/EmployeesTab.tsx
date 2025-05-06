import React, { useState, useEffect, useCallback } from "react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  salary: number;
  note?: string;
}

interface EmployeesTabProps {
  companyId: string;
  canEdit: boolean;
  onEmployeesChange?: () => void;
}

export default function EmployeesTab({ companyId, canEdit, onEmployeesChange }: EmployeesTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Получаем id текущего пользователя (пример: window.__userId, заменить на актуальный способ)
  const userId = (typeof window !== 'undefined' && (window as unknown as { __userId?: string }).__userId) || '';
  const currentUser = employees.find(e => e.id === userId);
  const userRole = currentUser?.role || 'member';

  async function fetchEmployees() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/companies/${companyId}/employees`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки сотрудников');
      setEmployees((data.employees || []).map((e: unknown) => ({
        id: (e as Employee).id,
        name: (e as Employee).name,
        email: (e as Employee).email,
        role: (e as Employee).role,
        salary: (e as Employee).salary || 0,
        note: (e as Employee).note || '',
      })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchEmployeesCallback = useCallback(fetchEmployees, [companyId]);

  useEffect(() => { if (companyId) fetchEmployeesCallback(); }, [companyId, fetchEmployeesCallback]);

  const filtered = employees.filter(e =>
    (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteEmployee) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/employees/${deleteEmployee.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления');
      setDeleteEmployee(null);
      fetchEmployees();
      if (onEmployeesChange) onEmployeesChange();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <input
          type="text"
          placeholder="Поиск сотрудника..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs p-2 border rounded-lg text-xs sm:text-sm"
        />
        {canEdit && (
          <button
            className="w-full sm:w-auto mt-2 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1"
            onClick={() => { setEditEmployee(null); setShowModal(true); }}
          >
            <span className="text-base">＋</span> <span className="hidden sm:inline">Добавить</span>
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-8">Загрузка сотрудников...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {filtered.length === 0 ? (
            <li className="text-gray-400 py-8 text-center">Нет сотрудников</li>
          ) : filtered.map(emp => (
            <li key={emp.id} className="py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <div>
                <div className="font-bold text-indigo-800 text-xs sm:text-base">{emp.name}</div>
                <div className="text-xs text-gray-700">{emp.email}</div>
                <div className="text-xs text-gray-700">{emp.role === 'owner' ? 'Владелец' : emp.role === 'admin' ? 'Админ' : 'Пользователь'} • {emp.salary}₽</div>
                {emp.note && <div className="text-xs text-gray-700 mt-1 italic">Заметка: {emp.note}</div>}
              </div>
              {canEdit && (
                <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-0">
                  <button className="text-blue-600 hover:underline min-w-[32px] text-base" onClick={() => { setEditEmployee(emp); setShowModal(true); }}>✎</button>
                  <button className="text-red-500 hover:underline min-w-[32px] text-base" onClick={() => setDeleteEmployee(emp)}>🗑</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <EmployeeModal
          onClose={() => setShowModal(false)}
          onSave={async emp => {
            try {
              if (editEmployee) {
                // PUT (редактирование)
                const res = await fetch(`/api/companies/${companyId}/employees/${editEmployee.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    name: emp.name,
                    email: emp.email,
                    role: emp.role,
                    salary: emp.salary,
                    note: emp.note,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Ошибка редактирования');
              } else {
                // POST (добавление)
                const res = await fetch(`/api/companies/${companyId}/employees`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(emp),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Ошибка добавления');
              }
              setShowModal(false);
              fetchEmployees();
              if (onEmployeesChange) onEmployeesChange();
            } catch (err: unknown) {
              alert(err instanceof Error ? err.message : 'Ошибка');
            }
          }}
          initial={editEmployee}
          isOwner={userRole === 'owner'}
        />
      )}
      {deleteEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">Удалить сотрудника?</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Вы уверены, что хотите удалить <b>{deleteEmployee.name}</b> ({deleteEmployee.email}) из компании?</div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg" onClick={handleDelete}>Удалить</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => setDeleteEmployee(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeModal({ onClose, onSave, initial, isOwner }: {
  onClose: () => void;
  onSave: (emp: Employee) => void;
  initial: Employee | null;
  isOwner: boolean;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [role, setRole] = useState<Employee['role']>(initial?.role || 'member');
  const [salary, setSalary] = useState(initial?.salary || 0);
  const [note, setNote] = useState(initial?.note || '');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">{initial ? 'Редактировать' : 'Добавить'} сотрудника</h2>
        <form onSubmit={e => { e.preventDefault(); onSave({ id: initial?.id || Math.random().toString(), name, email, role, salary, note }); }} className="space-y-3">
          <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-lg" required />
          {isOwner ? (
            <select value={role} onChange={e => setRole(e.target.value as Employee['role'])} className="w-full p-2 border rounded-lg">
              <option value="member">Сотрудник</option>
              <option value="admin">Админ</option>
              <option value="owner">Владелец</option>
            </select>
          ) : (
            <div className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700">{role === 'owner' ? 'Владелец' : role === 'admin' ? 'Админ' : 'Сотрудник'}</div>
          )}
          <input type="number" placeholder="Зарплата" value={salary} onChange={e => setSalary(Number(e.target.value))} className="w-full p-2 border rounded-lg" min={0} />
          <textarea placeholder="Заметка" value={note} onChange={e => setNote(e.target.value)} className="w-full p-2 border rounded-lg" rows={2} />
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">Сохранить</button>
            <button type="button" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
} 