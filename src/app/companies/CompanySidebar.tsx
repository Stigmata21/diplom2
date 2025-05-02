import React, { useState, useEffect, useRef } from "react";
import EmployeesTab from "./EmployeesTab";
import TasksTab from "./TasksTab";
import NotesTab from "./NotesTab";
import FinanceTab from "./FinanceTab";
import CompanyFilesTab from './FilesTab';
import { useSession, signOut } from 'next-auth/react';
import { toast } from "react-hot-toast";
import { Company, CompanyUser, CompanyInvite } from "./types";

interface Log {
  id: number;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
  user_id?: string;
}

interface CompanySidebarProps {
  open: boolean;
  onClose: () => void;
  company: Company | null;
  onEmployeesChange?: () => void;
}

const TABS = [
  { key: "employees", label: "Сотрудники" },
  { key: "tasks", label: "Задачи" },
  { key: "notes", label: "Заметки" },
  { key: "finance", label: "Финансы" },
  { key: "files", label: "Файлы" },
  { key: "settings", label: "Настройки" },
];

function TabStub({ icon, title, description, onAdd }: { icon: React.ReactNode, title: string, description: string, onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-300">
      <div className="mb-4 text-5xl">{icon}</div>
      <div className="text-xl font-bold mb-2 text-indigo-700 dark:text-white">{title}</div>
      <div className="mb-4 text-gray-500 dark:text-gray-400">{description}</div>
      {onAdd && <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" onClick={onAdd}>Добавить</button>}
    </div>
  );
}

export default function CompanySidebar({ open, onClose, company, onEmployeesChange }: CompanySidebarProps) {
  const [activeTab, setActiveTab] = useState("employees");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";
  const [editModal, setEditModal] = useState(false);
  const [companyData, setCompanyData] = useState<Company | null>(company);
  const currentUserCompanyRole = companyData?.users?.find(u => u.id === currentUserId)?.role || "member";
  const isOwner = currentUserCompanyRole === 'owner';
  const isAdmin = currentUserCompanyRole === 'admin' || isOwner;
  const [deleteModal, setDeleteModal] = useState(false);
  const [ownerModal, setOwnerModal] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [invites, setInvites] = useState<CompanyInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // Проверка, нужно ли показывать стрелки и fade
  function checkTabsScroll() {
    const el = tabsRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }
  useEffect(() => { checkTabsScroll(); }, [activeTab]);
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    // Скроллим к активному табу
    const active = el.querySelector('.tab-active');
    if (active && active instanceof HTMLElement) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    checkTabsScroll();
    el.addEventListener('scroll', checkTabsScroll);
    window.addEventListener('resize', checkTabsScroll);
    return () => {
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [activeTab]);

  function scrollTabs(dir: 'left' | 'right') {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
  }

  useEffect(() => {
    async function fetchLogs() {
      if (!companyData?.id) return;
      setLogsLoading(true);
      try {
        const res = await fetch(`/api/companies/logs?companyId=${companyData.id}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    }
    fetchLogs();
  }, [companyData?.id]);

  useEffect(() => {
    setCompanyData(company);
  }, [company]);

  useEffect(() => {
    async function fetchInvites() {
      if (!company?.id) return;
      setInvitesLoading(true);
      try {
        const res = await fetch(`/api/companies/invites?companyId=${company.id}`);
        const data = await res.json();
        setInvites(data.invites || []);
      } catch { setInvites([]); }
      finally { setInvitesLoading(false); }
    }
    fetchInvites();
  }, [company?.id]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !company) return null;

  function formatLog(log: Log) {
    const meta = typeof log.meta === 'string' ? JSON.parse(log.meta || '{}') : log.meta || {};
    switch (log.action) {
      case 'add_employee':
        return `Добавлен сотрудник ${meta.email || meta.addedUserId}`;
      case 'remove_employee':
        return `Удалён сотрудник ${meta.removedUserId}`;
      case 'create_user_and_add':
        return `Создан и добавлен пользователь ${meta.email}`;
      case 'change_role':
        return `Роль пользователя ${meta.userId} изменена на ${meta.newRole}`;
      case 'change_owner':
        return `Владелец компании изменён на пользователя ${meta.newOwnerId}`;
      case 'update_company':
        return `Обновлены параметры компании`;
      default:
        return log.action;
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!companyData) return;
    try {
      const res = await fetch('/api/companies/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: companyData.id, userId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка смены роли');
      toast.success('Роль обновлена');
      await reloadCompany();
      if (onEmployeesChange) onEmployeesChange();
      // Если ты понизил СЕБЯ и больше не owner/admin — делаем logout
      if (userId === currentUserId && newRole !== 'owner' && newRole !== 'admin') {
        setTimeout(() => signOut({ callbackUrl: '/' }), 500);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleRemoveUser(userId: string) {
    if (!companyData) return;
    if (userId === currentUserId) return toast.error('Нельзя удалить себя');
    try {
      const res = await fetch('/api/companies/remove-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: companyData.id, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления пользователя');
      toast.success('Пользователь удалён');
      await reloadCompany();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function reloadCompany() {
    if (!companyData) return;
    try {
      const res = await fetch(`/api/companies?companyId=${companyData.id}`);
      const data = await res.json();
      if (data.companies && data.companies.length > 0) {
        const updated = data.companies.find((c: any) => c.id === companyData.id);
        if (updated) setCompanyData(updated);
      }
    } catch {}
  }

  return (
    <>
      {/* Затемнение фона */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] max-w-full sm:max-w-[520px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}
        rounded-none sm:rounded-l-2xl`}
        style={{ minHeight: '100vh', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-bold text-indigo-700 dark:text-white truncate max-w-[70%]">
            {company.name || "Компания"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl font-bold min-w-[40px] min-h-[40px] flex items-center justify-center">×</button>
        </div>
        {/* Tabs */}
        <div className="relative">
          {/* Fade-эффект справа */}
          {showRight && <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-10 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />}
          {showLeft && <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-10 bg-gradient-to-r from-white dark:from-gray-900 to-transparent" />}
          {/* Стрелки */}
          {showLeft && <button className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow border border-gray-200 dark:border-gray-700" onClick={() => scrollTabs('left')}><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          {showRight && <button className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow border border-gray-200 dark:border-gray-700" onClick={() => scrollTabs('right')}><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
          <div
            ref={tabsRef}
            className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-base gap-1 px-2 py-2 overflow-x-auto no-scrollbar relative"
            style={{ scrollBehavior: 'smooth' }}
          >
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-colors duration-200 whitespace-nowrap ${activeTab === tab.key ? 'text-indigo-700 bg-white dark:bg-gray-900 shadow border border-indigo-200 dark:border-gray-700 tab-active' : 'text-gray-500 hover:text-indigo-700 bg-transparent'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 relative">
          {activeTab === "employees" && (
            <EmployeesTab companyId={company.id} canEdit={true} onEmployeesChange={onEmployeesChange} />
          )}
          {activeTab === "tasks" && (
            <TasksTab companyId={company.id} isOwner={company.user_role === 'owner'} />
          )}
          {activeTab === "notes" && (
            <NotesTab companyId={company.id} userId={currentUserId} />
          )}
          {activeTab === "finance" && (
            <FinanceTab companyId={company.id} userId={currentUserId} userRole={currentUserCompanyRole} />
          )}
          {activeTab === "files" && (
            <CompanyFilesTab companyId={company.id} />
          )}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Основные параметры */}
              {companyData ? (
                <section>
                  <h3 className="text-base sm:text-lg font-bold text-indigo-700 mb-2">Параметры компании</h3>
                  <div className="flex items-center gap-2 sm:gap-4 mb-2">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold">
                      {companyData.logo ? <img src={companyData.logo} alt="logo" className="w-16 h-16 rounded-full object-cover" /> : companyData.name?.[0] || 'К'}
                    </div>
                    <div>
                      <div className="font-semibold text-xl">{companyData.name}</div>
                      <div className="text-gray-500 text-sm">{companyData.description || 'Нет описания'}</div>
                    </div>
                    {isAdmin && (
                      <button className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm" onClick={() => setEditModal(true)}>Редактировать</button>
                    )}
                  </div>
                </section>
              ) : (
                <div className="text-gray-400 text-center py-8">Нет данных о компании</div>
              )}
              {/* Управление ролями */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-indigo-700 mb-2">Роли и доступ</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-[480px] text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-2 text-left">Пользователь</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Роль</th>
                        <th className="p-2 text-left w-12">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(companyData?.users || []).map((u: CompanyUser) => (
                        <tr key={u.id} className="border-b">
                          <td className="p-2 font-bold text-indigo-800">{u.name}</td>
                          <td className="p-2">{u.email}</td>
                          <td className="p-2">
                            {(isOwner || isAdmin) && u.id !== currentUserId ? (
                              <select
                                value={u.role}
                                disabled={u.role === 'owner' || !isOwner}
                                className="border rounded px-2 py-1"
                                onChange={e => handleRoleChange(u.id, e.target.value)}
                              >
                                <option value="owner">Владелец</option>
                                <option value="admin">Админ</option>
                                <option value="member">Пользователь</option>
                              </select>
                            ) : (
                              <span>{u.role === 'owner' ? 'Владелец' : u.role === 'admin' ? 'Админ' : 'Пользователь'}</span>
                            )}
                          </td>
                          <td className="p-1 sm:p-2 w-12 text-center">
                            {u.role !== 'owner' && isOwner && (
                              <button
                                className="text-red-500 hover:text-red-700 p-1 rounded-full focus:outline-none min-w-[32px] min-h-[32px] flex items-center justify-center"
                                title="Удалить пользователя"
                                onClick={() => handleRemoveUser(u.id)}
                              >
                                <span role="img" aria-label="Удалить" className="text-base sm:text-lg">🗑</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              {/* Опасные действия */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-red-700 mb-2">Опасные действия</h3>
                <div className="flex flex-col gap-2">
                  {isOwner && (
                    <button className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 sm:px-4 py-2 rounded-lg border border-yellow-300 text-xs sm:text-sm" onClick={() => setOwnerModal(true)}>Сменить владельца</button>
                  )}
                  {isOwner && (
                    <button className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm" onClick={() => setDeleteModal(true)}>Удалить компанию</button>
                  )}
                </div>
              </section>
              {/* Логи изменений */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-indigo-700 mb-2">Логи изменений</h3>
                {logsLoading ? (
                  <div className="text-gray-400 text-center py-4">Загрузка...</div>
                ) : logs.length === 0 ? (
                  <div className="text-gray-400 text-center py-4">Нет истории изменений</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                    {logs.slice(0, 30).map(log => (
                      <li key={log.id} className="py-2 flex items-center gap-2">
                        <span className="font-semibold text-indigo-700">{log.user_id}</span>
                        <span>{formatLog(log)}</span>
                        <span className="ml-auto text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {/* Добавляю кнопку 'Написать нам на почту' */}
              <div className="mt-6 flex justify-center">
                <a
                  href="mailto:support@companysync.local"
                  className="inline-flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold px-4 py-2 rounded-lg shadow transition-all border border-indigo-200"
                  style={{ textDecoration: 'none' }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm0 0l8 8 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Написать нам на почту
                </a>
              </div>
            </div>
          )}
        </div>
      </aside>
      {editModal && companyData && (
        <EditCompanyModal
          open={editModal}
          onClose={() => setEditModal(false)}
          company={companyData}
          onSave={async (data: { name: string; description: string }) => {
            try {
              const res = await fetch('/api/companies', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: companyData.id, ...data }),
              });
              const result = await res.json();
              if (!res.ok) throw new Error(result.error || 'Ошибка обновления компании');
              await reloadCompany();
              setEditModal(false);
              toast.success('Параметры компании обновлены');
            } catch (e) {
              if (e instanceof Error) toast.error(e.message);
            }
          }}
        />
      )}
      {deleteModal && companyData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">Удалить компанию?</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Вы уверены, что хотите <b>безвозвратно удалить</b> компанию <b>{companyData?.name}</b>? Это действие нельзя отменить.</div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg" onClick={async () => {
                try {
                  const res = await fetch(`/api/companies?companyId=${companyData.id}`, { method: 'DELETE' });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Ошибка удаления компании');
                  toast.success('Компания удалена');
                  setDeleteModal(false);
                  onClose();
                  // Можно вызвать onEmployeesChange или другой коллбек для обновления списка компаний
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}>Удалить</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => setDeleteModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
      {ownerModal && companyData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-yellow-700">Сменить владельца</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Выберите нового владельца компании <b>{companyData?.name}</b>:</div>
            <select
              className="w-full p-2 border rounded-lg mb-4"
              value={newOwnerId}
              onChange={e => setNewOwnerId(e.target.value)}
            >
              <option value="">Выберите пользователя</option>
              {(companyData?.users || []).filter((u: CompanyUser) => u.role !== 'owner').map((u: CompanyUser) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg disabled:opacity-50"
                disabled={!newOwnerId}
                onClick={async () => {
                  try {
                    if (!companyData) return;
                    // 1. Новый владелец
                    const res = await fetch('/api/companies/role', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ companyId: companyData.id, userId: newOwnerId, newRole: 'owner' }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Ошибка смены владельца');
                    // 2. Старый owner становится админом
                    const oldOwner = (companyData?.users || []).find((u: CompanyUser) => u.role === 'owner');
                    if (oldOwner && oldOwner.id !== newOwnerId) {
                      const res2 = await fetch('/api/companies/role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ companyId: companyData.id, userId: oldOwner.id, newRole: 'admin' }),
                      });
                      const data2 = await res2.json();
                      if (!res2.ok) throw new Error(data2.error || 'Ошибка смены роли старого владельца');
                    }
                    toast.success('Владелец компании изменён, предыдущий владелец стал админом');
                    setOwnerModal(false);
                    setNewOwnerId("");
                    await reloadCompany();
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
              >Сменить владельца</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => { setOwnerModal(false); setNewOwnerId(""); }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EditCompanyModal({ open, onClose, company, onSave }: { open: boolean, onClose: () => void, company: any, onSave: (data: { name: string; description: string }) => void }) {
  const [name, setName] = useState(company.name || '');
  const [description, setDescription] = useState(company.description || '');
  const [loading, setLoading] = useState(false);
  return open ? (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Редактировать компанию</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          setLoading(true);
          await onSave({ name, description });
          setLoading(false);
        }} className="space-y-3">
          <input type="text" className="w-full p-2 border rounded-lg" value={name} onChange={e => setName(e.target.value)} placeholder="Название" required minLength={2} maxLength={64} />
          <textarea className="w-full p-2 border rounded-lg" value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание" maxLength={256} rows={3} />
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg" disabled={loading}>Сохранить</button>
            <button type="button" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={onClose} disabled={loading}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
} 