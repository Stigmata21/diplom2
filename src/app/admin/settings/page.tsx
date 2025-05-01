"use client";

import React, { useEffect, useState } from 'react';

interface AdminUser { id: string; name: string; }

export default function AdminSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [supportEmail, setSupportEmail] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [supportAvatarUrl, setSupportAvatarUrl] = useState('');
  const [activeSupportModeratorId, setActiveSupportModeratorId] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setSiteTitle(data.settings.siteTitle || '');
          setSupportEmail(data.settings.supportEmail || '');
          setEmailNotifications(data.settings.emailNotifications !== 'false');
          setSupportAvatarUrl(data.settings.supportAvatarUrl || '/avatar-support.png');
          setActiveSupportModeratorId(data.settings.activeSupportModeratorId || '');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    fetch('/api/admin/support/admins')
      .then(r => r.json())
      .then(data => setAdmins(data.admins || []));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    const res = await fetch('/api/admin/support/upload-avatar', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok && data.url) setSupportAvatarUrl(data.url);
    else setError(data.error || 'Ошибка загрузки аватара');
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle,
          supportEmail,
          emailNotifications: String(emailNotifications),
          supportAvatarUrl,
          activeSupportModeratorId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-gray-800">Настройки</h1>
      <div className="bg-white rounded-xl shadow p-6 max-w-xl space-y-6 text-gray-800">
        {loading ? <div className="text-gray-400">Загрузка...</div> : <>
        <div>
          <label className="block font-semibold mb-1">Название сайта</label>
          <input
            className="w-full p-2 border rounded-lg"
            value={siteTitle}
            onChange={e => setSiteTitle(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email поддержки</label>
          <input
            className="w-full p-2 border rounded-lg"
            value={supportEmail}
            onChange={e => setSupportEmail(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={e => setEmailNotifications(e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600"
            disabled={saving}
          />
          <span className="text-gray-700">Включить email-уведомления</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Аватар поддержки</label>
            <div className="flex items-center gap-4">
              <img src={supportAvatarUrl} alt="Аватар поддержки" className="w-14 h-14 rounded-full border-2 border-indigo-500" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={saving} />
            </div>
            <input
              className="w-full p-2 border rounded-lg mt-2"
              value={supportAvatarUrl}
              onChange={e => setSupportAvatarUrl(e.target.value)}
              disabled={saving}
              placeholder="URL аватара"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Активный модератор поддержки</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={activeSupportModeratorId}
              onChange={e => setActiveSupportModeratorId(e.target.value)}
              disabled={saving}
            >
              <option value="">Не выбран</option>
              {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4" onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mt-2">Сохранено!</div>}
        </>}
      </div>
    </div>
  );
} 