'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || '';
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

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
      toast.success('Файл успешно загружен');
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/companies/files/${id}`, { method: 'DELETE' });
    fetchFiles();
    toast.success('Файл удалён');
    setDeleteFileId(null);
  }

  async function handleEditDesc(id: string) {
    await fetch(`/api/companies/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDesc }),
    });
    setEditingId(null);
    fetchFiles();
    toast.success('Описание обновлено');
  }

  return (
    <div className="w-full p-2 sm:p-4">
      <h1 className="text-xl font-bold mb-4">Файлы компании</h1>
      <form className="flex flex-col gap-2 w-full mb-4" onSubmit={e => { e.preventDefault(); handleUpload(); }}>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full" />
        <input type="text" placeholder="Описание" value={desc} onChange={e => setDesc(e.target.value)} className="border rounded p-2 w-full" />
        <button type="submit" disabled={!file || uploading || !companyId} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg w-full">Загрузить</button>
      </form>
      {loading ? <div className="text-gray-400 text-center py-8">Загрузка файлов...</div> : error ? <div className="text-red-500 text-center py-8">{error}</div> : files.length === 0 ? <div className="text-gray-400 text-center py-8">Нет файлов</div> : (
        <ul className="space-y-4 w-full">
          {files.map(f => {
            const canEdit = userRole === 'admin' || userRole === 'owner' || String(f.uploadedBy) === String(userId);
            let dateStr = '';
            if (f.createdAt) {
              const d = new Date(f.createdAt);
              dateStr = isNaN(d.getTime()) ? '' : d.toLocaleString();
            }
            return (
              <li key={f.id} className="bg-white dark:bg-gray-900 rounded-lg shadow p-3 flex flex-col gap-1 w-full">
                <div className="font-semibold text-base break-words">{f.name}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 break-words">{editingId === f.id ? (
                  <div className="flex gap-2 items-center w-full">
                    <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="border rounded p-1 flex-1 text-sm" />
                    <button onClick={() => handleEditDesc(f.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Сохранить</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded">Отмена</button>
                  </div>
                ) : f.description}</div>
                <div className="text-xs text-gray-500">Загружен: {dateStr} • {f.uploadedBy}</div>
                <div className="flex flex-row gap-2 mt-1">
                  <a href={f.path} download target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs cursor-pointer">Скачать</a>
                  {canEdit && (
                    <>
                      <button onClick={() => { setEditingId(f.id); setEditDesc(f.description); }} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs">Изменить</button>
                      <button onClick={() => setDeleteFileId(f.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">Удалить</button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {deleteFileId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">Удалить файл?</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Вы уверены, что хотите удалить файл? Это действие нельзя отменить.</div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg" onClick={() => handleDelete(deleteFileId)}>Удалить</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => setDeleteFileId(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 