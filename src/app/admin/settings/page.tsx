"use client";

import React, { useState } from 'react';

export default function AdminSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [supportEmail, setSupportEmail] = useState('support@companysync.local');
  const [siteTitle, setSiteTitle] = useState('CompanySync');

  return (
    <div>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-gray-800">Настройки</h1>
      <div className="bg-white rounded-xl shadow p-6 max-w-xl space-y-6 text-gray-800">
        <div>
          <label className="block font-semibold mb-1">Название сайта</label>
          <input
            className="w-full p-2 border rounded-lg"
            value={siteTitle}
            onChange={e => setSiteTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email поддержки</label>
          <input
            className="w-full p-2 border rounded-lg"
            value={supportEmail}
            onChange={e => setSupportEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={e => setEmailNotifications(e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600"
          />
          <span className="text-gray-700">Включить email-уведомления</span>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4">Сохранить</button>
      </div>
    </div>
  );
} 