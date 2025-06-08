import React, { useState, useEffect, useCallback } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee_id?: string;
  assignee_name?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

export default function TasksTab({ companyId, isOwner }: { companyId: string, isOwner?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}/tasks`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки задач");
      setTasks(data.tasks || []);
    } catch {
      setTasks([]);
    }
  }, [companyId]);

  useEffect(() => { if (companyId) fetchTasks(); }, [companyId, fetchTasks]);

  async function handleStatusToggle(task: Task) {
    if (!isOwner) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status === 'open' ? 'closed' : 'open',
          assignee_id: task.assignee_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка обновления статуса");
      fetchTasks();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Ошибка обновления статуса');
    }
  }

  async function handleDelete() {
    if (!deleteTask) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/tasks/${deleteTask.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка удаления задачи");
      setDeleteTask(null);
      fetchTasks();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Ошибка удаления задачи');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-indigo-700">Задачи</h3>
        {isOwner && (
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" onClick={() => { setEditTask(null); setShowModal(true); }}>
            + Добавить
          </button>
        )}
      </div>
      {tasks.length === 0 ? (
        <div className="text-gray-400 text-center py-8">Нет задач</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {tasks.map(task => (
            <li key={task.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-indigo-700">{task.title}</div>
                  <div className="text-xs text-gray-500 mb-1">{task.status === 'open' ? 'Открыта' : 'Закрыта'}{task.assignee_name ? ` • ${task.assignee_name}` : ''}</div>
                  {task.description && <div className="text-sm text-gray-700 dark:text-gray-200">{task.description}</div>}
                </div>
                {isOwner && (
                  <div className="flex gap-2 items-center">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditTask(task); setShowModal(true); }}>✎</button>
                    <button className={`text-xs px-2 py-1 rounded ${task.status === 'open' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} onClick={() => handleStatusToggle(task)}>
                      {task.status === 'open' ? 'Закрыть' : 'Открыть'}
                    </button>
                    <button className="text-red-500 hover:underline" onClick={() => setDeleteTask(task)}>🗑</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <TaskModal
          onClose={() => setShowModal(false)}
          onSave={async (task) => {
            try {
              if (editTask) {
                // PUT (редактирование)
                const res = await fetch(`/api/companies/${companyId}/tasks/${editTask.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(task),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Ошибка редактирования задачи");
              } else {
                // POST (создание)
                const res = await fetch(`/api/companies/${companyId}/tasks`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(task),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Ошибка создания задачи");
              }
              setShowModal(false);
              fetchTasks();
            } catch (err: unknown) {
              alert(err instanceof Error ? err.message : 'Ошибка сохранения задачи');
            }
          }}
          initial={editTask}
          companyId={companyId}
        />
      )}
      {deleteTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">Удалить задачу?</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Вы уверены, что хотите удалить <b>{deleteTask.title}</b>?</div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg" onClick={handleDelete}>Удалить</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => setDeleteTask(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskModal({ onClose, onSave, initial, companyId }: {
  onClose: () => void;
  onSave: (task: { title: string; description: string; status: string; assignee_id?: string }) => void;
  initial?: Task | null;
  companyId: string;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState(initial?.status || "open");
  const [assignee, setAssignee] = useState(initial?.assignee_id || "");
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch(`/api/companies/${companyId}/employees`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ошибка загрузки сотрудников");
        setEmployees((data.employees || []).map((e: unknown) => {
          if (typeof e === 'object' && e !== null && 'id' in e && 'username' in e && 'email' in e) {
            const emp = e as { id: string; username: string; email: string };
            return { id: emp.id, name: emp.username, email: emp.email };
          }
          return { id: '', name: '', email: '' };
        }));
      } catch {
        setEmployees([]);
      }
    }
    fetchEmployees();
  }, [companyId]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">{initial ? 'Редактировать' : 'Добавить'} задачу</h2>
        <form onSubmit={e => { e.preventDefault(); onSave({ title, description, status, assignee_id: assignee || undefined }); }} className="space-y-3">
          <input type="text" placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-lg" required />
          <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" rows={2} />
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 border rounded-lg">
            <option value="open">Открыта</option>
            <option value="closed">Закрыта</option>
          </select>
          <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full p-2 border rounded-lg">
            <option value="">Без исполнителя</option>
            {employees.filter(emp => emp.id).map(emp => (
              <option key={String(emp.id)} value={String(emp.id)}>{emp.name} ({emp.email})</option>
            ))}
          </select>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">Сохранить</button>
            <button type="button" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
} 