"use client";

import React, { useEffect, useState, useCallback } from 'react';
import DeleteCompanyModal from './DeleteCompanyModal';

interface Company {
  id: number;
  name: string;
  users: number;
  created: string;
  description?: string;
}

const PAGE_SIZE = 10;

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/companies?search=${encodeURIComponent(search)}&page=${page}&pageSize=${PAGE_SIZE}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setCompanies(data.companies);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/companies?id=${companyToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления');
      fetchCompanies();
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (company: Partial<Company>) => {
    setModalLoading(true);
    setModalError('');
    try {
      const method = editCompany ? 'PUT' : 'POST';
      const url = '/api/admin/companies';
      const body = editCompany ? { ...company, id: editCompany.id } : company;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      setShowModal(false);
      setEditCompany(null);
      fetchCompanies();
    } catch (err) {
      if (err instanceof Error) setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-gray-800">Компании</h1>
      <div className="mb-4 flex items-center space-x-4">
        <input
          className="p-2 border rounded-lg w-64"
          placeholder="Поиск по названию"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={fetchCompanies} disabled={loading}>Поиск</button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg ml-auto" onClick={() => { setEditCompany(null); setShowModal(true); }}>+ Добавить</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
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
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center">Загрузка...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center">Нет компаний</td></tr>
            ) : companies.map(c => (
              <tr key={c.id} className="border-b last:border-none">
                <td className="p-3">{c.id}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.users}</td>
                <td className="p-3">{c.created}</td>
                <td className="p-3 space-x-2">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg" onClick={() => { setEditCompany(c); setShowModal(true); }}>Редактировать</button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg" onClick={() => handleDeleteClick(c)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Пагинация */}
      <div className="mt-4 flex justify-center items-center space-x-2">
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >Назад</button>
        <span>Стр. {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
        <button
          className="px-3 py-1 rounded bg-gray-200 text-gray-700"
          onClick={() => setPage(p => p + 1)}
          disabled={page * PAGE_SIZE >= total || loading}
        >Вперёд</button>
      </div>
      {showModal && (
        <CompanyModal
          company={editCompany}
          onClose={() => { setShowModal(false); setEditCompany(null); }}
          onSubmit={handleModalSubmit}
          loading={modalLoading}
          error={modalError}
        />
      )}
      <DeleteCompanyModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDelete}
        companyName={companyToDelete?.name || ''}
        companyId={companyToDelete?.id || 0}
        isLoading={loading}
        userCount={companyToDelete?.users || 0}
      />
    </div>
  );
}

function CompanyModal({ company, onClose, onSubmit, loading, error }: {
  company: Company | null;
  onClose: () => void;
  onSubmit: (data: Partial<Company>) => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState<Partial<Company>>(company || { name: '', description: '' });
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">{company ? 'Редактировать компанию' : 'Добавить компанию'}</h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Название</label>
            <input
              className="w-full p-2 border rounded-lg"
              value={form.name || ''}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Описание</label>
            <textarea
              className="w-full p-2 border rounded-lg"
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="flex space-x-2 mt-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
            <button type="button" className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg" onClick={onClose} disabled={loading}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
} 