// src/app/companies/page.tsx
"use client";
import { useState, useEffect } from "react";
import CompanySidebar from "./CompanySidebar";
import { PlusIcon } from "@heroicons/react/24/solid";

function CompanyCreateModal({ open, onClose, onCreate }: { open: boolean, onClose: () => void, onCreate: (company: any) => void }) {
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

export default function CompaniesPage() {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCompanies() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/companies", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки компаний");
      setCompanies(data.companies || []);
    } catch (err: any) {
      setError(err.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCompanies(); }, []);

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
          {/* TODO: фильтры, поиск */}
          {loading ? (
            <div className="text-gray-400 text-center mt-16">Загрузка компаний...</div>
          ) : error ? (
            <div className="text-red-500 text-center mt-16">{error}</div>
          ) : companies.length === 0 ? (
            <div className="text-gray-400 text-center mt-16">Нет компаний. Создайте первую!</div>
          ) : (
            <ul className="grid grid-cols-1 gap-4">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    className={`w-full text-left px-4 py-3 sm:px-6 sm:py-4 rounded-xl transition shadow-md border border-indigo-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-indigo-50 dark:hover:bg-indigo-900 focus:ring-2 focus:ring-indigo-300 focus:outline-none ${selectedCompany?.id === company.id ? "bg-indigo-100 border-indigo-400 dark:bg-indigo-900" : ""}`}
                    onClick={() => { setSelectedCompany(company); setSidebarOpen(true); }}
                  >
                    <div className="font-semibold text-indigo-700 text-base sm:text-lg whitespace-normal break-words leading-tight">{company.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{company.employees_count || 0} сотрудников</div>
                  </button>
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
        </div>
    );
}