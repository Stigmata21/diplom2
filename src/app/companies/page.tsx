// src/app/companies/page.tsx
"use client";
import { useState, useEffect } from "react";
import CompanySidebar from "./CompanySidebar";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Company, CompanyRole } from "./types";
import Image from "next/image";

function CompanyCreateModal({ open, onClose, onCreate }: { open: boolean, onClose: () => void, onCreate: (company: Company) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Добавить компанию</h2>
        <form onSubmit={async e => {
        e.preventDefault();
          setLoading(true); setError("");
          try {
            const res = await fetch("/api/companies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, description, role_in_company: 'owner' }),
              credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ошибка создания");
            onCreate(data.company || { id: data.id, name, description });
            setName(""); setDescription("");
          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        }} className="space-y-4">
          <input type="text" placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
          <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" rows={2} />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg" disabled={loading}>{loading ? "Создание..." : "Создать"}</button>
            <button type="button" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={onClose} disabled={loading}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ open, onClose, onInvite }: { open: boolean, onClose: () => void, onInvite: (email: string, role: CompanyRole) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyRole>("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  function validateEmail(email: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }
  return open ? (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Пригласить сотрудника</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          setError(""); setSuccess(false); setLoading(true);
          if (!validateEmail(email)) { setError("Некорректный email"); setLoading(false); return; }
          try {
            await onInvite(email, role);
            setSuccess(true); setEmail(""); setRole("member");
            setTimeout(() => { setSuccess(false); onClose(); }, 1200);
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally { setLoading(false); }
        }} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-lg" required />
          <select value={role} onChange={e => setRole(e.target.value as CompanyRole)} className="w-full p-2 border rounded-lg">
            <option value="member">Участник</option>
            <option value="admin">Админ</option>
          </select>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Приглашение отправлено!</div>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg" disabled={loading}>{loading ? "Отправка..." : "Пригласить"}</button>
            <button type="button" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={onClose} disabled={loading}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
}

export default function CompaniesPage() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [inviteCompany, setInviteCompany] = useState<Company | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveCompany, setLeaveCompany] = useState<Company | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  async function fetchCompanies() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/companies", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки компаний");
      setCompanies(data.companies || []);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCompanies(); }, []);

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // Быстрое действие: выйти из компании
  async function handleLeave(company: Company) {
    setLeaveCompany(company);
    setLeaveError('');
  }

  async function confirmLeave() {
    if (!leaveCompany) return;
    setLeaveLoading(true);
    setLeaveError('');
    try {
      const res = await fetch(`/api/companies/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ companyId: leaveCompany.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка выхода');
      if (selectedCompany?.id === leaveCompany.id) setSidebarOpen(false);
      fetchCompanies();
      setLeaveCompany(null);
    } catch (e: any) {
      setLeaveError(e.message);
    } finally {
      setLeaveLoading(false);
    }
  }

  // Быстрое действие: удалить компанию
  async function handleDelete(company: Company) {
    if (!confirm(`Удалить компанию «${company.name}»? Это действие необратимо!`)) return;
    try {
      const res = await fetch(`/api/companies?companyId=${company.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления');
      if (selectedCompany?.id === company.id) {
        setSelectedCompany(null);
        setSidebarOpen(false);
      }
      fetchCompanies();
    } catch (e) {
      alert(e instanceof Error ? e.message : e);
    }
  }

  // Быстрое действие: приглашение
  function handleInvite(company: Company) {
    setInviteCompany(company);
    setInviteOpen(true);
  }

  async function sendInvite(email: string, role: CompanyRole) {
    if (!inviteCompany) throw new Error("Компания не выбрана");
    const res = await fetch("/api/companies/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ companyId: inviteCompany.id, email, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка приглашения");
    fetchCompanies();
  }

    return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-6 py-2 sm:py-4 gap-2 sm:gap-0 border-b border-indigo-100 dark:border-gray-800">
        <h1 className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-white">Мои компании</h1>
        <button className="w-full sm:w-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition text-xs sm:text-base justify-center" onClick={() => setShowCreate(true)}>
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Добавить компанию</span>
        </button>
      </header>
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Companies list */}
        <section className="w-full md:w-1/3 lg:w-1/4 p-2 sm:p-4 space-y-4">
          <input
            type="text"
            placeholder="Поиск по компаниям..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mb-3 p-2 border rounded-lg text-xs sm:text-sm"
          />
          {loading ? (
            <div className="text-gray-400 text-center mt-16">Загрузка компаний...</div>
          ) : error ? (
            <div className="text-red-500 text-center mt-16">{error}</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 text-center mt-16 gap-4">
              <span className="text-5xl">🏢</span>
              <div>У вас пока нет компаний</div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg mt-2" onClick={() => setShowCreate(true)}>Создать первую компанию</button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4">
              {filteredCompanies.map((company) => (
                <li key={company.id}>
                  <div
                    className={`w-full flex flex-col items-center px-4 py-4 rounded-xl transition shadow-md border border-indigo-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-indigo-50 dark:hover:bg-indigo-900 focus:ring-2 focus:ring-indigo-300 focus:outline-none ${selectedCompany?.id === company.id ? "bg-indigo-100 border-indigo-400 dark:bg-indigo-900" : ""}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => { setSelectedCompany(company); setSidebarOpen(true); }}
                    onKeyDown={e => { if (e.key === 'Enter') { setSelectedCompany(company); setSidebarOpen(true); } }}
                  >
                    <div className="font-semibold text-indigo-700 text-base sm:text-lg text-center w-full truncate mb-2">{company.name}</div>
                    {company.logo ? (
                      <Image src={company.logo} alt={company.name} width={48} height={48} className="rounded-full object-cover bg-gray-200 mb-2" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl mb-2">{company.name[0]}</div>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 whitespace-nowrap">{company.user_role === 'owner' ? 'Владелец' : company.user_role === 'admin' ? 'Админ' : 'Участник'}</span>
                      {company.user_role !== 'owner' && (
                        <span role="button" tabIndex={0} className="text-red-500 hover:underline text-xs cursor-pointer ml-1" onClick={e => { e.stopPropagation(); handleLeave(company); }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleLeave(company); } }}>Покинуть</span>
                      )}
                      {(company.user_role === 'owner' || company.user_role === 'admin') && (
                        <span role="button" tabIndex={0} className="text-indigo-500 hover:underline text-xs cursor-pointer ml-1" onClick={e => { e.stopPropagation(); handleInvite(company); }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleInvite(company); } }}>Пригласить</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">{company.employees_count || 0} сотрудник{company.employees_count === 1 ? '' : 'ов'}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {/* Sidebar with company details */}
        <CompanySidebar
          open={sidebarOpen && !!selectedCompany}
          onClose={() => setSidebarOpen(false)}
          company={selectedCompany}
          onEmployeesChange={fetchCompanies}
        />
      </main>
      <CompanyCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={company => {
          fetchCompanies();
          setSelectedCompany(company);
          setSidebarOpen(true);
          setShowCreate(false);
        }}
      />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={sendInvite} />
      {/* Модалка подтверждения выхода из компании */}
      {leaveCompany && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">Покинуть компанию?</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Вы уверены, что хотите выйти из компании <b>{leaveCompany.name}</b>? Вы потеряете доступ к её данным.</div>
            {leaveError && <div className="text-red-500 mb-2 text-sm">{leaveError}</div>}
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg" onClick={confirmLeave} disabled={leaveLoading}>{leaveLoading ? 'Выход...' : 'Покинуть'}</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => setLeaveCompany(null)} disabled={leaveLoading}>Отмена</button>
            </div>
          </div>
        </div>
      )}
        </div>
    );
}