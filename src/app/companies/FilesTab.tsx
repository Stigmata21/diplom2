'use client';
import React, { useState, useEffect } from 'react';

interface FileItem {
  id: string;
  name: string;
  url: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
  canEdit: boolean;
}

export default function CompanyFilesTab({ companyId }: { companyId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');

  async function fetchFiles() {
    if (!companyId) { setError('companyId не найден'); setFiles([]); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/companies/files?companyId=${companyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки файлов');
      setFiles(data.files || []);
    } catch (e: any) {
      setError(e.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFiles(); }, [companyId]);

  async function handleUpload() {
    if (!file || !companyId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', desc);
    formData.append('companyId', companyId);
    try {
      const res = await fetch('/api/companies/files', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setFile(null); setDesc('');
      fetchFiles();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Удалить файл?')) return;
    await fetch(`/api/companies/files/${id}`, { method: 'DELETE' });
    fetchFiles();
  }

  async function handleEditDesc(id: string) {
    await fetch(`/api/companies/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDesc }),
    });
    setEditingId(null);
    fetchFiles();
  }

  return (
    <div className="w-full p-2 sm:p-4">
      <h1 className="text-xl font-bold mb-4">Файлы компании</h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center w-full">
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full sm:w-auto" />
        <input type="text" placeholder="Описание" value={desc} onChange={e => setDesc(e.target.value)} className="border rounded p-2 flex-1 w-full sm:w-auto" />
        <button onClick={handleUpload} disabled={!file || uploading || !companyId} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto">Загрузить</button>
      </div>
      {loading ? <div className="text-gray-400 text-center py-8">Загрузка файлов...</div> : error ? <div className="text-red-500 text-center py-8">{error}</div> : files.length === 0 ? <div className="text-gray-400 text-center py-8">Нет файлов</div> : (
        <ul className="space-y-4 w-full">
          {files.map(f => (
            <li key={f.id} className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base break-words">{f.name}</div>
                <div className="text-xs text-gray-500 mb-1">Загружен: {new Date(f.createdAt).toLocaleString()} • {f.uploadedBy}</div>
                {editingId === f.id ? (
                  <div className="flex gap-2 items-center">
                    <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border rounded p-1 flex-1 text-sm" />
                    <button onClick={() => handleEditDesc(f.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Сохранить</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded">Отмена</button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 dark:text-gray-200 break-words">{f.description}</div>
                )}
              </div>
              <a href={f.url} download className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">Скачать</a>
              {f.canEdit && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setEditingId(f.id); setEditDesc(f.description); }} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs">Изменить</button>
                  <button onClick={() => handleDelete(f.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">Удалить</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 