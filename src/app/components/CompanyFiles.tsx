import React, { useEffect, useState, useRef } from 'react';
import NavButton from './NavButton';
import { Skeleton } from '../../components/ui/skeleton';

interface FileItem {
  id: number;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  version: number;
  created_at: string;
}

interface CompanyFilesProps {
  companyId: number;
  canEdit: boolean;
}

export default function CompanyFiles({ companyId, canEdit }: CompanyFilesProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line
  }, [companyId]);

  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/files?companyId=${companyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки файлов');
      setFiles(data.files);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Удалить файл?')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/files?id=${fileId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления файла');
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('companyId', String(companyId));
    try {
      const res = await fetch('/api/files', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки файла');
      setFiles([data.file, ...files]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <h4 className="text-lg font-semibold mb-2 text-indigo-700">Файлы компании</h4>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {canEdit && (
        <form onSubmit={handleUpload} className="mb-4 flex flex-col sm:flex-row items-center gap-2">
          <input type="file" ref={fileInputRef} className="border rounded p-2" />
          <NavButton type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={uploading}>
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </NavButton>
        </form>
      )}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-4 items-center">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-gray-500">Нет файлов</div>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow p-2 sm:p-4 min-w-[320px]">
          {files.map(f => (
            <li key={f.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium text-gray-800">{f.filename}</span>
                <span className="ml-2 text-xs text-gray-500">({(f.size/1024).toFixed(1)} КБ, v{f.version})</span>
              </div>
              <div className="flex items-center space-x-2">
                <a href={f.url} download className="text-indigo-600 hover:underline text-sm">Скачать</a>
                {canEdit && (
                  <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:underline text-sm">Удалить</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 