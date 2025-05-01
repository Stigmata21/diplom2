import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CATEGORIES = [
  'Зарплата', 'Аренда', 'Услуги', 'Налоги', 'Продажи', 'Инвестиции', 'Прочее'
];
const CURRENCIES = ['RUB', 'USD', 'EUR'];
const STATUSES = ['pending', 'approved', 'rejected'];

interface Record {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

interface FileAttachment {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
}

export default function FinanceTab({ companyId, userId, userRole }: { companyId: string, userId: string, userRole: string }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ type: '', category: '', status: '', from: '', to: '' });
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<Record | null>(null);

  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function fetchRecords() {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await fetch(`/api/companies/${companyId}/finance?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки финансов");
      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (companyId) fetchRecords(); }, [companyId, JSON.stringify(filters)]);

  // Получение вложений для записи
  async function fetchFiles(recordId: string): Promise<FileAttachment[]> {
    try {
      const res = await fetch(`/api/companies/${companyId}/finance/${recordId}/files`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки вложений');
      return data.files || [];
    } catch {
      return [];
    }
  }

  // Удаление вложения с подтверждением
  async function deleteFile(recordId: string, fileId: string) {
    if (!window.confirm('Удалить этот файл?')) return;
    await fetch(`/api/companies/${companyId}/finance/${recordId}/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchRecords(); // обновить список
  }

  // Массовое удаление файлов
  async function deleteFilesBulk(recordId: string, fileIds: string[]) {
    if (!window.confirm('Удалить выбранные файлы?')) return;
    for (const fileId of fileIds) {
      await fetch(`/api/companies/${companyId}/finance/${recordId}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    }
    fetchRecords();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-2">
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="p-2 border rounded-lg text-xs sm:text-sm">
            <option value="">Тип</option>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded-lg text-xs sm:text-sm">
            <option value="">Категория</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="p-2 border rounded-lg text-xs sm:text-sm">
            <option value="">Статус</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="p-2 border rounded-lg text-xs sm:text-sm" />
        </div>
        <button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1 mt-2 md:mt-0" onClick={() => setShowModal(true)}>
          <span className="text-base">＋</span> <span className="hidden md:inline">Добавить</span>
        </button>
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-8">Загрузка...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-gray-400 text-center py-8">Нет финансовых записей</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={e => {
            const { active, over } = e;
            if (active.id !== over?.id) {
              const oldIndex = records.findIndex(r => r.id === active.id);
              const newIndex = records.findIndex(r => r.id === over?.id);
              setRecords(arrayMove(records, oldIndex, newIndex));
              // TODO: отправить новый порядок на сервер, если нужно
            }
          }}
        >
          <SortableContext items={records.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {records.map((rec, idx) => {
                const canEdit = isAdmin || (rec.author_id === userId && rec.status === 'pending');
                const canDelete = canEdit;
                const canApprove = isAdmin && rec.status === 'pending';
                const canReject = isAdmin && rec.status === 'pending';
                return (
                  <SortableItem rec={rec} idx={idx} key={rec.id}>
                    <FinanceRecordRow
                      rec={rec}
                      isAdmin={isAdmin}
                      userId={userId}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      canApprove={canApprove}
                      canReject={canReject}
                      setEditRecord={setEditRecord}
                      setShowModal={setShowModal}
                      setDeleteRecord={setDeleteRecord}
                      deleteFile={deleteFile}
                      deleteFilesBulk={deleteFilesBulk}
                      fetchFiles={fetchFiles}
                    />
                  </SortableItem>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {showModal && (
        <FinanceModal
          open={showModal}
          onClose={() => { setShowModal(false); setEditRecord(null); }}
          onSave={async (rec) => {
            try {
              if (editRecord) {
                // PUT (редактирование)
                const res = await fetch(`/api/companies/${companyId}/finance/${editRecord.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(rec),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Ошибка редактирования записи");
              } else {
                // POST (создание)
                const res = await fetch(`/api/companies/${companyId}/finance`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(rec),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Ошибка создания записи");
              }
              setShowModal(false);
              setEditRecord(null);
              fetchRecords();
            } catch (err: any) {
              alert(err.message);
            }
          }}
          userRole={userRole}
          initial={editRecord}
          companyId={companyId}
        />
      )}
      {deleteRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">Удалить запись?</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Вы уверены, что хотите удалить <b>{deleteRecord.category} — {deleteRecord.amount} {deleteRecord.currency}</b>?</div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg" onClick={async () => { await handleDelete(); }}>Удалить</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => setDeleteRecord(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleStatus(rec: Record, newStatus: string) {
    try {
      const res = await fetch(`/api/companies/${companyId}/finance/${rec.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...rec, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка обновления статуса");
      fetchRecords();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/finance/${deleteRecord.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка удаления записи");
      setDeleteRecord(null);
      fetchRecords();
    } catch (err: any) {
      alert(err.message);
    }
  }
}

function FinanceModal({ open, onClose, onSave, userRole, initial, companyId }: {
  open: boolean;
  onClose: () => void;
  onSave: (rec: { type: string; category: string; amount: number; currency: string; description: string; status?: string }) => void;
  userRole: string;
  initial?: Record | null;
  companyId: string;
}) {
  const [type, setType] = useState<'income' | 'expense'>(initial?.type || 'expense');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [amount, setAmount] = useState(initial?.amount || 0);
  const [currency, setCurrency] = useState(initial?.currency || 'RUB');
  const [description, setDescription] = useState(initial?.description || '');
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const [status, setStatus] = useState(initial?.status || 'pending');
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  useEffect(() => {
    setType(initial?.type || 'expense');
    setCategory(initial?.category || CATEGORIES[0]);
    setAmount(initial?.amount || 0);
    setCurrency(initial?.currency || 'RUB');
    setDescription(initial?.description || '');
    setStatus(initial?.status || 'pending');
    setUploadError("");
  }, [initial]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files));
  }

  async function checkRecordExists(recordId: string): Promise<boolean> {
    // Проверяем, существует ли запись в finance_records
    const res = await fetch(`/api/companies/${companyId}/finance/${recordId}`);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.record;
  }

  async function handleUpload(recordId: string) {
    setUploadError("");
    // Проверяем, существует ли запись
    const exists = await checkRecordExists(recordId);
    if (!exists) {
      setUploadError("Финансовая запись не найдена. Сначала сохраните запись, затем добавьте вложения.");
      return;
    }
    let success = false;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/companies/${companyId}/finance/${recordId}/files`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || 'Ошибка загрузки файла');
        return;
      } else {
        success = true;
      }
    }
    if (success) setFiles([]); // сбросить выбранные файлы
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">{initial ? 'Редактировать' : 'Добавить'} финансовую запись</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          await onSave({ type, category, amount, currency, description, status: isAdmin ? status : 'pending' });
          // После создания/редактирования — upload файлов
          if (!initial && files.length > 0) {
            // MVP: после создания записи обновляем вложения через fetchRecords
            // В реальном проекте лучше возвращать id из onSave
          }
        }} className="space-y-3">
          <select value={type} onChange={e => setType(e.target.value as 'income' | 'expense')} className="w-full p-2 border rounded-lg">
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded-lg">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Сумма" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-2 border rounded-lg" min={0.01} step={0.01} required />
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-2 border rounded-lg">
            {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
          </select>
          <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" rows={2} />
          {isAdmin && (
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 border rounded-lg">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <div
            className={`w-full p-2 border rounded-lg text-center ${dragActive ? 'border-indigo-500 bg-indigo-50' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
            onDrop={handleDrop}
          >
            <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload-input" accept="*" />
            <label htmlFor="file-upload-input" className="cursor-pointer">
              {files.length === 0 ? 'Перетащите файлы сюда или кликните для выбора' : files.map(f => f.name).join(', ')}
            </label>
            {uploadError && <div className="text-red-500 mt-2 text-xs">{uploadError}</div>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">Сохранить</button>
            <button type="button" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SortableItem({ rec, idx, children }: { rec: Record, idx: number, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rec.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="py-3 flex items-center justify-between gap-2 bg-white dark:bg-gray-900 rounded-lg shadow mb-2"
    >
      {children}
    </li>
  );
}

function FinanceRecordRow({
  rec,
  isAdmin,
  userId,
  canEdit,
  canDelete,
  canApprove,
  canReject,
  setEditRecord,
  setShowModal,
  setDeleteRecord,
  deleteFile,
  deleteFilesBulk,
  fetchFiles
}: any) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filesError, setFilesError] = useState<string>("");
  const reloadFiles = async () => {
    try {
      const f = await fetchFiles(rec.id);
      setFiles(f);
      setFilesError("");
    } catch (e: any) {
      setFiles([]);
      setFilesError(e.message || "Ошибка загрузки вложений");
    }
  };
  useEffect(() => { reloadFiles(); }, [rec.id]);
  return (
    <>
      <div>
        <div className="font-semibold text-indigo-700">{rec.category} — {rec.type === 'income' ? '+' : '-'}{rec.amount} {rec.currency}</div>
        <div className="text-xs text-gray-500 mb-1">{rec.author_name} • {new Date(rec.created_at).toLocaleString()} • {rec.status}</div>
        {rec.description && <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{rec.description}</div>}
        <div className="text-xs text-gray-400 mt-1">Вложения:
          {filesError && <span className="text-red-500">{filesError}</span>}
          {canEdit && files.length > 0 && (
            <button className="text-red-600 underline mr-2" onClick={() => deleteFilesBulk(rec.id, selectedFiles)} disabled={selectedFiles.length === 0}>Удалить выбранные</button>
          )}
          {files.length === 0 ? <span className="italic">нет</span> : files.map(f => (
            <span key={f.id} className="inline-flex items-center mr-2">
              {canEdit && (
                <input type="checkbox" className="mr-1" checked={selectedFiles.includes(f.id)} onChange={e => {
                  setSelectedFiles(sel => e.target.checked ? [...sel, f.id] : sel.filter(x => x !== f.id));
                }} />
              )}
              <a href={f.url} download className="underline text-indigo-600 mr-1" target="_blank" rel="noopener noreferrer">{f.filename}</a>
              {f.mimetype.startsWith('image/') && (
                <img src={f.url} alt={f.filename} className="w-8 h-8 object-cover rounded ml-1 border" style={{ display: 'inline-block' }} />
              )}
              {canEdit && (
                <button className="text-red-500 ml-1" title="Удалить" onClick={async () => { await deleteFile(rec.id, f.id); setFiles(files.filter(x => x.id !== f.id)); }}>✕</button>
              )}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-1 sm:gap-2 items-center">
        {canEdit && <button className="text-blue-600 hover:underline min-w-[32px] text-base" onClick={() => { setEditRecord(rec); setShowModal(true); }}>✎</button>}
        {canDelete && <button className="text-red-500 hover:underline min-w-[32px] text-base" onClick={() => setDeleteRecord(rec)}>🗑</button>}
        {canApprove && <button className="text-green-600 hover:underline min-w-[32px] text-base" onClick={async () => { /* handleStatus */ }}>Подтвердить</button>}
        {canReject && <button className="text-yellow-600 hover:underline min-w-[32px] text-base" onClick={async () => { /* handleStatus */ }}>Отклонить</button>}
      </div>
    </>
  );
} 