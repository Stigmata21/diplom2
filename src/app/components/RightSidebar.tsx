import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyEmployees from './CompanyEmployees';
import CompanyFiles from './CompanyFiles';

const TABS = [
  { key: 'profile', label: 'Профиль' },
  { key: 'employees', label: 'Сотрудники' },
  { key: 'files', label: 'Файлы' },
  { key: 'finance', label: 'Финансы' },
  { key: 'plan', label: 'Тариф' },
];

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
  company?: { id?: number; name?: string; description?: string };
  user?: { id?: number; role_in_company?: string };
  onUpdateCompany?: (data: { id?: number; name?: string; description?: string }) => void;
}

export default function RightSidebar({
  open,
  onClose,
  company,
  user,
  onUpdateCompany,
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const userRoleInCompany = user?.role_in_company || 'member';

  // Сброс вкладки при смене компании
  React.useEffect(() => {
    setActiveTab('profile');
  }, [company?.id]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sidebar */}
          <motion.aside
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-indigo-700 dark:text-white truncate max-w-[70%]">
                {company?.name || 'Компания'}
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl font-bold">×</button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`flex-1 py-2 px-2 text-sm font-medium transition-colors duration-200 ${activeTab === tab.key ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-gray-900' : 'text-gray-500 hover:text-indigo-600'}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Tab content with animation */}
            <div className="flex-1 overflow-y-auto p-4 relative">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0"
                  >
                    {/* TODO: Профиль компании (редактирование, смена названия, описания, плана) */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Название</label>
                        <input
                          type="text"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:bg-gray-800 dark:text-white"
                          value={String(company?.name ?? '')}
                          onChange={e => onUpdateCompany && onUpdateCompany({ ...company, name: e.target.value })}
                          disabled={userRoleInCompany !== 'owner' && userRoleInCompany !== 'admin'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Описание</label>
                        <textarea
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:bg-gray-800 dark:text-white"
                          value={String(company?.description ?? '')}
                          onChange={e => onUpdateCompany && onUpdateCompany({ ...company, description: e.target.value })}
                          disabled={userRoleInCompany !== 'owner' && userRoleInCompany !== 'admin'}
                        />
                      </div>
                      {/* TODO: смена плана, кнопка апгрейда */}
                    </div>
                  </motion.div>
                )}
                {activeTab === 'employees' && company?.id && user?.id && (
                  <motion.div
                    key="employees"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0"
                  >
                    <CompanyEmployees
                      companyId={company.id}
                      currentUserId={user.id}
                      currentUserRole={userRoleInCompany}
                    />
                  </motion.div>
                )}
                {activeTab === 'files' && company?.id && (
                  <motion.div
                    key="files"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0"
                  >
                    <CompanyFiles
                      companyId={company.id}
                      canEdit={userRoleInCompany === 'owner' || userRoleInCompany === 'admin'}
                    />
                  </motion.div>
                )}
                {activeTab === 'finance' && (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0"
                  >
                    {/* TODO: Финансы (расчеты, история, экспорт) */}
                  </motion.div>
                )}
                {activeTab === 'plan' && (
                  <motion.div
                    key="plan"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0"
                  >
                    {/* TODO: Тариф, ограничения, апгрейд */}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
} 