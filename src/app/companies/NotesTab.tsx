import React, { useState, useEffect } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export default function NotesTab({ companyId, userId }: { companyId: string, userId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);

  async function fetchNotes() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/companies/${companyId}/notes`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки заметок");
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err.message);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (companyId) fetchNotes(); }, [companyId]);

  async function handleDelete() {
    if (!deleteNote) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/notes/${deleteNote.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new Error('Сервер вернул не JSON. Возможно, вы не авторизованы или сервер упал.');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка удаления заметки");
      setDeleteNote(null);
      fetchNotes();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function canEditOrDelete(note: Note) {
    // owner/admin или автор заметки
    // (owner/admin определяется на сервере, тут только автор)
    return note.author_id === userId;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-indigo-700">Заметки</h3>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" onClick={() => { setEditNote(null); setShowModal(true); }}>
          + Добавить
        </button>
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-8">Загрузка заметок...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : notes.length === 0 ? (
        <div className="text-gray-400 text-center py-8">Нет заметок</div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {notes.map(note => (
            <li key={note.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-indigo-700">{note.title}</div>
                  <div className="text-xs text-gray-500 mb-1">{note.author_name} • {new Date(note.created_at).toLocaleString()}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{note.content}</div>
                </div>
                {canEditOrDelete(note) && (
                  <div className="flex gap-2 items-center">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditNote(note); setShowModal(true); }}>✎</button>
                    <button className="text-red-500 hover:underline" onClick={() => setDeleteNote(note)}>🗑</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <NoteModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSave={async (note) => {
            try {
              if (editNote) {
                // PUT (редактирование)
                const res = await fetch(`/api/companies/${companyId}/notes/${editNote.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(note),
                });
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) throw new Error('Сервер вернул не JSON. Возможно, вы не авторизованы или сервер упал.');
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Ошибка редактирования заметки");
                setShowModal(false);
                fetchNotes();
                return;
              } else {
                // POST (создание)
                const res = await fetch(`/api/companies/${companyId}/notes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(note),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Ошибка создания заметки");
              }
              setShowModal(false);
              fetchNotes();
            } catch (err: any) {
              alert(err.message);
            }
          }}
          initial={editNote}
        />
      )}
      {deleteNote && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">Удалить заметку?</h2>
            <div className="mb-4 text-gray-700 dark:text-gray-200">Вы уверены, что хотите удалить <b>{deleteNote.title}</b>?</div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg" onClick={handleDelete}>Удалить</button>
              <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={() => setDeleteNote(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteModal({ open, onClose, onSave, initial }: {
  open: boolean;
  onClose: () => void;
  onSave: (note: { title: string; content: string }) => void;
  initial?: Note | null;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  useEffect(() => {
    setTitle(initial?.title || "");
    setContent(initial?.content || "");
  }, [initial]);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-6 w-full max-w-full sm:max-w-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">{initial ? 'Редактировать' : 'Добавить'} заметку</h2>
        <form onSubmit={e => { e.preventDefault(); onSave({ title, content }); }} className="space-y-3">
          <input type="text" placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-lg" required />
          <textarea placeholder="Текст заметки" value={content} onChange={e => setContent(e.target.value)} className="w-full p-2 border rounded-lg" rows={4} required />
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">Сохранить</button>
            <button type="button" className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
} 