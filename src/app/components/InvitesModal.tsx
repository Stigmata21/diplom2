import React, { useEffect, useState } from 'react';

interface Invite {
  id: string;
  company_id: string;
  company_name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string;
  created_at: string;
}

interface InvitesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InvitesModal({ open, onClose }: InvitesModalProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    fetch('/api/me/invites', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) throw new Error('Войдите для просмотра приглашений');
        const data = await res.json();
        setInvites(data.invites || []);
      })
      .catch(e => setError(e.message || 'Ошибка загрузки приглашений'))
      .finally(() => setLoading(false));
  }, [open]);

  const handleAction = async (inviteId: string, action: 'accept' | 'decline') => {
    setActionLoading(inviteId + action);
    setError('');
    try {
      const res = await fetch('/api/me/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inviteId, action })
      });
      if (res.status === 401) throw new Error('Войдите для просмотра приглашений');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setInvites(invites => invites.map(i => i.id === inviteId ? { ...i, status: action === 'accept' ? 'accepted' : 'declined' } : i));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl">×</button>
        <h2 className="text-xl font-bold mb-4 text-green-800">Приглашения в компании</h2>
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        {loading ? (
          <div className="text-gray-400 text-center py-8">Загрузка...</div>
        ) : invites.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Нет приглашений</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800 text-sm max-h-96 overflow-y-auto">
            {invites.map(invite => (
              <li key={invite.id} className="py-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-900">{invite.company_name}</span>
                  <span className="px-2 py-0.5 rounded bg-green-50 text-green-900 border border-green-200 ml-1 text-xs">{invite.role === 'admin' ? 'Админ' : invite.role === 'owner' ? 'Владелец' : 'Участник'}</span>
                  <span className={`ml-2 text-xs ${invite.status === 'pending' ? 'text-yellow-600' : invite.status === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>{invite.status === 'pending' ? 'Ожидание' : invite.status === 'accepted' ? 'Принято' : 'Отклонено'}</span>
                </div>
                {invite.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white py-1 rounded-lg text-xs disabled:opacity-60"
                      disabled={actionLoading === invite.id + 'accept'}
                      onClick={() => handleAction(invite.id, 'accept')}
                    >{actionLoading === invite.id + 'accept' ? '...' : 'Принять'}</button>
                    <button
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 rounded-lg text-xs disabled:opacity-60"
                      disabled={actionLoading === invite.id + 'decline'}
                      onClick={() => handleAction(invite.id, 'decline')}
                    >{actionLoading === invite.id + 'decline' ? '...' : 'Отклонить'}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 