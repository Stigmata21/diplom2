'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Регистрируем компоненты ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

interface FinancialReport {
  id: string;
  title: string;
  period: string;
  created_at: string;
  status: string;
  type: string;
  file_url?: string;
  data: Record<string, any>;
  generateFile?: boolean;
  generated?: boolean;
  company_id?: string; // Add company_id property
}

interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  employees_count?: number;
  user_role: string;
}

const CATEGORIES = [
  'Зарплата', 'Аренда', 'Услуги', 'Налоги', 'Продажи', 'Инвестиции', 'Прочее'
];

const CURRENCIES = ['RUB', 'USD', 'EUR'];
const REPORT_TYPES = ['Квартальный', 'Годовой', 'Бюджет', 'Прогноз', 'Аналитика'];

// Обертка компонента для использования useSearchParams в Suspense
function FinanceContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || '';
  
  // State для данных
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [companyRole, setCompanyRole] = useState<string>('member');
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'reports' | 'analytics'>('transactions');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState<FinanceRecord | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editReport, setEditReport] = useState<FinancialReport | null>(null);
  
  // Фильтры
  const [filters, setFilters] = useState({ 
    type: '', 
    category: '', 
    status: '', 
    from: '', 
    to: '' 
  });

  const [updating, setUpdating] = useState(false);

  // Получение списка компаний пользователя
  const fetchUserCompanies = useCallback(async () => {
    try {
      const res = await fetch('/api/companies', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки компаний');
      setUserCompanies(data.companies || []);
      
      // Если у нас есть выбранная компания, установим роль пользователя в ней
      if (selectedCompanyId && data.companies) {
        const selectedCompany = data.companies.find((c: Company) => c.id === selectedCompanyId);
        if (selectedCompany) {
          setCompanyRole(selectedCompany.user_role);
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки компаний');
      setUserCompanies([]);
    }
  }, [selectedCompanyId]);

  // Получение финансовых записей
  const fetchFinanceRecords = useCallback(async () => {
    if (!selectedCompanyId) {
      setRecords([]);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      
      const res = await fetch(`/api/companies/finance?companyId=${selectedCompanyId}&${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка загрузки финансов');
      }
      
      const data = await res.json();
      setRecords(data.records || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки финансов');
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки финансов');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, filters]);

  // Получение финансовых отчетов
  const fetchFinanceReports = useCallback(async () => {
    if (!selectedCompanyId) {
      setReports([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/companies/reports?companyId=${selectedCompanyId}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка загрузки отчетов');
      }
      
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки отчетов');
      setReports([]);
    }
  }, [selectedCompanyId]);

  // Эффект для загрузки данных при изменении компании
  useEffect(() => {
    fetchUserCompanies();
  }, [fetchUserCompanies]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchFinanceRecords();
      fetchFinanceReports();
    }
  }, [selectedCompanyId, fetchFinanceRecords, fetchFinanceReports]);

  // Обновление данных при изменении фильтров
  useEffect(() => {
    if (selectedCompanyId) {
      fetchFinanceRecords();
    }
  }, [filters, fetchFinanceRecords]);

  // Создание новой финансовой записи
  async function handleCreateRecord(record: Partial<FinanceRecord>) {
    try {
      const res = await fetch('/api/companies/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...record,
          companyId: selectedCompanyId,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при создании записи');
      }
      
      toast.success('Запись успешно создана');
      
      // Обновляем список записей
      fetchFinanceRecords();
      
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Не удалось создать запись');
      return false;
    }
  }
  
  // Обновление существующей записи
  async function handleUpdateRecord(record: Partial<FinanceRecord>) {
    if (!record.id) return false;
    
    try {
      const res = await fetch(`/api/companies/finance/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при обновлении записи');
      }
      
      toast.success('Запись успешно обновлена');
      
      // Обновляем список записей
      fetchFinanceRecords();
      
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Не удалось обновить запись');
      return false;
    }
  }
  
  // Удаление записи
  async function handleDeleteRecord(recordId: string) {
    try {
      const res = await fetch(`/api/companies/finance/${recordId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при удалении записи');
      }
      
      toast.success('Запись успешно удалена');
      
      // Обновляем список записей
      fetchFinanceRecords();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Не удалось удалить запись');
    }
  }
  
  // Обновление статуса записи
  async function handleUpdateStatus(recordId: string, status: string) {
    try {
      const res = await fetch(`/api/companies/finance/${recordId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при обновлении статуса');
      }
      
      toast.success('Статус успешно обновлен');
      
      // Обновляем список записей
      fetchFinanceRecords();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Не удалось обновить статус');
    }
  }
  
  // Создание нового отчета
  async function handleCreateReport(reportData: Partial<FinancialReport>): Promise<boolean> {
    try {
      const res = await fetch('/api/companies/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          companyId: selectedCompanyId,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при создании отчета');
      }
      
      toast.success('Отчет успешно создан');
      
      // Обновляем список отчетов
      fetchFinanceReports();
      
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Не удалось создать отчет');
      return false;
    }
  }
  
  // Обновление существующего отчета
  async function handleUpdateReport(report: Partial<FinancialReport>): Promise<boolean> {
    if (!report.id) return false;
    
    try {
      const res = await fetch(`/api/companies/reports/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при обновлении отчета');
      }
      
      toast.success('Отчет успешно обновлен');
      
      // Обновляем список отчетов
      fetchFinanceReports();
      
      return true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Не удалось обновить отчет');
      return false;
    }
  }
  
  // Удаление отчета
  async function handleDeleteReport(reportId: string) {
    try {
      const res = await fetch(`/api/companies/reports/${reportId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при удалении отчета');
      }
      
      toast.success('Отчет успешно удален');
      
      // Обновляем список отчетов
      fetchFinanceReports();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Не удалось удалить отчет');
    }
  }

  // Права на создание/подтверждение записей
  const canCreateRecords = companyRole === 'owner' || companyRole === 'admin' || companyRole === 'member';
  const canApproveRecords = companyRole === 'owner' || companyRole === 'admin';
  
  // Расчет суммарных показателей
  const totalIncome = records
    .filter(r => r.type === 'income' && r.status === 'approved')
    .reduce((sum, record) => sum + (parseFloat(record.amount.toString()) || 0), 0);
    
  const totalExpense = records
    .filter(r => r.type === 'expense' && r.status === 'approved')
    .reduce((sum, record) => sum + (parseFloat(record.amount.toString()) || 0), 0);
    
  const profit = totalIncome - totalExpense;
  
  // Обработчики для открытия модальных окон с редактированием
  const handleEditRecord = (record: FinanceRecord) => {
    setEditRecord(record);
    setShowModal(true);
  };
  
  const handleNewRecord = () => {
    setEditRecord(null);
    setShowModal(true);
  };
  
  const handleEditReport = (report: FinancialReport) => {
    setEditReport(report);
    setShowReportModal(true);
  };
  
  const handleNewReport = () => {
    setEditReport(null);
    setShowReportModal(true);
  };
  
  // Обработчик сохранения записи (для новой или существующей)
  const handleSaveRecord = async (recordData: Partial<FinanceRecord>) => {
    let success = false;
    
    if (editRecord?.id) {
      // Обновление существующей записи
      success = await handleUpdateRecord({ ...editRecord, ...recordData });
    } else {
      // Создание новой записи
      success = await handleCreateRecord(recordData);
    }
    
    if (success) {
      setShowModal(false);
    }
  };
  
  // Обработчик сохранения отчета (для нового или существующего)
  const handleSaveReport = async (reportData: Partial<FinancialReport>) => {
    let success = false;
    
    if (editReport?.id) {
      // Обновление существующего отчета
      success = await handleUpdateReport({ ...editReport, ...reportData });
    } else {
      // Создание нового отчета
      success = await handleCreateReport(reportData);
    }
    
    if (success) {
      setShowReportModal(false);
    }
  };

  // Функция для обновления всех отчетов с актуальными данными
  const handleUpdateAllReports = async () => {
    toast.error('Отчеты генерируются с фиксированными данными и не могут быть обновлены');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400">Финансы компании</h1>
        
        {/* Выпадающий список компаний */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <select 
            value={selectedCompanyId} 
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full sm:w-auto p-2 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
          >
            <option value="">Выберите компанию</option>
            {userCompanies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          
          {canCreateRecords && (
            <button 
              onClick={handleNewRecord} 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow flex items-center justify-center gap-1"
              disabled={!selectedCompanyId}
            >
              <span>+</span> Добавить запись
            </button>
          )}
        </div>
      </div>
      
      {selectedCompanyId ? (
        <>
          {/* Карточки с основными показателями */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow">
              <h3 className="text-sm uppercase text-green-700 dark:text-green-300 font-semibold">Доходы</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Number(totalIncome).toLocaleString()} ₽</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg shadow">
              <h3 className="text-sm uppercase text-red-700 dark:text-red-300 font-semibold">Расходы</h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{Number(totalExpense).toLocaleString()} ₽</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow">
              <h3 className="text-sm uppercase text-blue-700 dark:text-blue-300 font-semibold">Прибыль</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Number(profit).toLocaleString()} ₽</p>
            </div>
          </div>
          
          {/* Вкладки */}
          <div className="mb-6 border-b">
            <nav className="flex space-x-4">
              <button
                className={`py-2 px-3 ${activeTab === 'transactions' ? 'border-b-2 border-indigo-500 font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('transactions')}
              >
                Транзакции
              </button>
              <button
                className={`py-2 px-3 ${activeTab === 'reports' ? 'border-b-2 border-indigo-500 font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('reports')}
              >
                Отчеты
              </button>
              <button
                className={`py-2 px-3 ${activeTab === 'analytics' ? 'border-b-2 border-indigo-500 font-semibold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('analytics')}
              >
                Аналитика
              </button>
            </nav>
          </div>
          
          {/* Содержимое активной вкладки */}
          <div className="mt-4">
            {activeTab === 'transactions' && (
              <TransactionsTab
                records={records}
                loading={loading}
                error={error}
                filters={filters}
                setFilters={setFilters}
                onDelete={handleDeleteRecord}
                onEdit={handleEditRecord}
                onUpdateStatus={handleUpdateStatus}
                canApprove={canApproveRecords}
                userRole={userRole}
              />
            )}
            
            {activeTab === 'reports' && (
              <ReportsTab
                reports={reports}
                onCreateReport={handleNewReport}
                onEditReport={handleEditReport}
                onDeleteReport={handleDeleteReport}
                userRole={companyRole}
              />
            )}
            
            {activeTab === 'analytics' && (
              <AnalyticsTab
                companyId={selectedCompanyId}
                records={records}
              />
            )}
          </div>
          
          {/* Модальное окно для создания/редактирования записи */}
          {showModal && (
            <FinanceRecordModal
              record={editRecord}
              onClose={() => setShowModal(false)}
              onSave={handleSaveRecord}
            />
          )}
          
          {/* Модальное окно для создания/редактирования отчета */}
          {showReportModal && (
            <FinanceReportModal
              report={editReport}
              onClose={() => setShowReportModal(false)}
              onSave={handleSaveReport}
              companyId={selectedCompanyId}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Выберите компанию</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Для просмотра финансов выберите компанию из списка выше</p>
        </div>
      )}
    </div>
  );
}

export default function CompanyFilesPage() {
  return (
    <main>
      <Suspense fallback={<div className="p-4 text-center">Загрузка...</div>}>
        <FinanceContent />
      </Suspense>
    </main>
  );
}

// Компонент для вкладки "Транзакции"
interface TransactionsTabProps {
  records: FinanceRecord[];
  loading: boolean;
  error: string;
  filters: {
    type: string;
    category: string;
    status: string;
    from: string;
    to: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    type: string;
    category: string;
    status: string;
    from: string;
    to: string;
  }>>;
  onDelete: (id: string) => void;
  onEdit: (record: FinanceRecord) => void;
  onUpdateStatus: (id: string, status: string) => void;
  canApprove: boolean;
  userRole: string;
}

function TransactionsTab({
  records,
  loading,
  error,
  filters,
  setFilters,
  onDelete,
  onEdit,
  onUpdateStatus,
  canApprove,
  userRole
}: TransactionsTabProps) {
  // Состояние для категорий и доступных фильтров
  const [availableCategories, setAvailableCategories] = useState<string[]>(CATEGORIES);
  
  // Получаем уникальные категории из записей
  useEffect(() => {
    if (records.length > 0) {
      const categories = Array.from(new Set(records.map(r => r.category)));
      if (categories.length > 0) {
        setAvailableCategories(categories);
      }
    }
  }, [records]);
  
  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };
  
  // Определяем классы для статуса (цвета)
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };
  
  // Определяем классы для типа операции
  const getTypeClass = (type: string) => {
    return type === 'income' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };
  
  // Получаем текст для статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Подтверждено';
      case 'rejected':
        return 'Отклонено';
      default:
        return 'Ожидает';
    }
  };
  
  // Получаем текст для типа операции
  const getTypeText = (type: string) => {
    return type === 'income' ? 'Доход' : 'Расход';
  };
  
  // Сброс фильтров
  const resetFilters = () => {
    setFilters({ 
      type: '', 
      category: '', 
      status: '', 
      from: '', 
      to: '' 
    });
  };

  return (
    <div>
      {/* Фильтры */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Фильтры</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Тип транзакции */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Все типы</label>
            <select
              id="type-filter"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">Все типы</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
          </div>
          
          {/* Категория */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Все категории</label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">Все категории</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Статус */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Все статусы</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">Все статусы</option>
              <option value="pending">Ожидающие</option>
              <option value="approved">Подтвержденные</option>
              <option value="rejected">Отклоненные</option>
            </select>
          </div>
          
          {/* Дата от */}
          <div>
            <label htmlFor="from-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата от</label>
            <input
              type="date"
              id="from-filter"
              value={filters.from}
              onChange={(e) => setFilters({...filters, from: e.target.value})}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          
          {/* Дата до */}
          <div>
            <label htmlFor="to-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата до</label>
            <input
              type="date"
              id="to-filter"
              value={filters.to}
              onChange={(e) => setFilters({...filters, to: e.target.value})}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        
        {/* Кнопка сброса фильтров */}
        <div className="mt-4">
          <button 
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
      
      {/* Таблица записей */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Загрузка...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-4 text-center">Нет записей. Создайте первую.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Дата</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Тип</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Категория</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Сумма</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Описание</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs inline-flex rounded-full ${getTypeClass(record.type)}`}>
                        {getTypeText(record.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {record.amount.toLocaleString()} {record.currency}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate">
                        {record.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs inline-flex rounded-full ${getStatusClass(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Кнопка редактирования */}
                        <button
                          onClick={() => onEdit(record)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Изменить
                        </button>
                        
                        {/* Кнопка удаления */}
                        <button
                          onClick={() => onDelete(record.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Удалить
                        </button>
                        
                        {/* Кнопки изменения статуса (только для админов/владельцев) */}
                        {canApprove && record.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(record.id, 'approved')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Подтвердить
                            </button>
                            <button
                              onClick={() => onUpdateStatus(record.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Отклонить
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент для вкладки "Отчеты"
interface ReportsTabProps {
  reports: FinancialReport[];
  onCreateReport: () => void;
  onEditReport: (report: FinancialReport) => void;
  onDeleteReport: (reportId: string) => void;
  userRole: string;
}

function ReportsTab({ reports, onCreateReport, onEditReport, onDeleteReport, userRole }: ReportsTabProps) {
  const canCreateReports = userRole === 'owner' || userRole === 'admin' || userRole === 'member';
  
  // Function needed for updating reports within the tab
  const fetchFinanceReports = () => {
    // This is a placeholder - the actual fetching is handled by parent components
    // We just need to reload the page to see updated reports
    window.location.reload();
  };
  
  // Обработчик скачивания отчета
  const handleDownloadReport = async (reportId: string | number) => {
    try {
      // Для просмотра в браузере напрямую открываем отчет в новой вкладке
      window.open(`/api/companies/reports/${reportId}/download`, '_blank');
      toast.success('Отчет открыт в новой вкладке');
    } catch (error) {
      console.error('Ошибка при открытии отчета:', error);
      toast.error('Не удалось открыть отчет');
    }
  };
  
  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };
  
  // Форматирование денежных сумм
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0 ₽';
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB',
      maximumFractionDigits: 0 
    }).format(amount);
  };
  
  // Преобразование типа отчета
  const getReportTypeText = (type: string) => {
    switch (type) {
      case 'quarterly':
        return 'Квартальный';
      case 'annual':
        return 'Годовой';
      case 'budget':
        return 'Бюджет';
      case 'forecast':
        return 'Прогноз';
      case 'analytics':
        return 'Аналитика';
      default:
        return type;
    }
  };
  
  // Проверяем и обрабатываем данные отчета
  const processReportData = (report: FinancialReport) => {
    try {
      // Убедимся, что у нас есть данные отчета
      let reportData: any = null;
      
      console.log(`Обработка отчета [${report.id}]: ${report.title}`);
      
      // Если данные приходят как строка JSON, парсим их
      if (typeof report.data === 'string') {
        try {
          reportData = JSON.parse(report.data);
          console.log('Данные отчета успешно распарсены из строки:', reportData);
        } catch (e) {
          console.error('Ошибка парсинга JSON данных отчета:', e);
          reportData = {};
        }
      } else {
        // Если данные уже в виде объекта, используем их напрямую
        reportData = report.data || {};
        console.log('Данные отчета в виде объекта:', reportData);
      }
      
      // Логируем данные отчета для отладки
      console.log(`Отчет [${report.id}] "${report.title}" типа "${report.type}":`, reportData);
      
      // Базовые финансовые показатели - используем parseFloat для преобразования строк в числа
      const income = reportData.income !== undefined ? parseFloat(reportData.income) : 0;
      const expenses = reportData.expenses !== undefined ? parseFloat(reportData.expenses) : 0;
      const profit = reportData.profit !== undefined ? parseFloat(reportData.profit) : 0;

      console.log('Финансовые показатели отчета:', { income, expenses, profit });

      // Дополнительные данные в зависимости от типа отчета
      const additionalData: Record<string, string> = {};
      
      switch (report.type) {
        case 'Бюджет':
          const budget = reportData.budget !== undefined ? parseFloat(reportData.budget) : null;
          const spent = reportData.spent !== undefined ? parseFloat(reportData.spent) : null;
          const remaining = reportData.remaining !== undefined ? parseFloat(reportData.remaining) : null;
          
          if (budget !== null && !isNaN(budget)) additionalData['Бюджет'] = `${budget.toLocaleString('ru-RU')} ₽`;
          if (spent !== null && !isNaN(spent)) additionalData['Потрачено'] = `${spent.toLocaleString('ru-RU')} ₽`;
          if (remaining !== null && !isNaN(remaining)) additionalData['Остаток'] = `${remaining.toLocaleString('ru-RU')} ₽`;
          break;
          
        case 'Квартальный':
          const quarter = reportData.quarter || '';
          const year = reportData.year || '';
          if (quarter && year) additionalData['Период'] = `Q${quarter} ${year}`;
          break;
          
        case 'Годовой':
          const yearValue = reportData.year || '';
          const monthsCovered = reportData.monthsCovered || '';
          if (yearValue) additionalData['Год'] = `${yearValue}`;
          if (monthsCovered) additionalData['Охвачено месяцев'] = `${monthsCovered}`;
          break;
          
        case 'Прогноз':
          if (reportData.shortTerm) {
            const shortTerm = typeof reportData.shortTerm.profit === 'number' 
              ? reportData.shortTerm.profit 
              : parseFloat(reportData.shortTerm.profit || 0);
            additionalData['Краткосрочный прогноз'] = `${shortTerm.toLocaleString('ru-RU')} ₽`;
          }
          if (reportData.midTerm) {
            const midTerm = typeof reportData.midTerm.profit === 'number' 
              ? reportData.midTerm.profit 
              : parseFloat(reportData.midTerm.profit || 0);
            additionalData['Среднесрочный прогноз'] = `${midTerm.toLocaleString('ru-RU')} ₽`;
          }
          if (reportData.longTerm) {
            const longTerm = typeof reportData.longTerm.profit === 'number' 
              ? reportData.longTerm.profit 
              : parseFloat(reportData.longTerm.profit || 0);
            additionalData['Долгосрочный прогноз'] = `${longTerm.toLocaleString('ru-RU')} ₽`;
          }
          break;
          
        case 'Аналитика':
          if (reportData.topIncomeCategories && reportData.topIncomeCategories.length > 0) {
            const topIncome = reportData.topIncomeCategories[0];
            const topIncomeAmount = typeof topIncome.amount === 'number' 
              ? topIncome.amount 
              : parseFloat(topIncome.amount || 0);
            additionalData['Топ категория дохода'] = `${topIncome.category}: ${topIncomeAmount.toLocaleString('ru-RU')} ₽`;
          }
          if (reportData.topExpenseCategories && reportData.topExpenseCategories.length > 0) {
            const topExpense = reportData.topExpenseCategories[0];
            const topExpenseAmount = typeof topExpense.amount === 'number' 
              ? topExpense.amount 
              : parseFloat(topExpense.amount || 0);
            additionalData['Топ категория расхода'] = `${topExpense.category}: ${topExpenseAmount.toLocaleString('ru-RU')} ₽`;
          }
          break;
      }
      
      // Проверяем, есть ли у нас какие-либо данные
      const hasData = income !== 0 || expenses !== 0 || profit !== 0 || Object.keys(additionalData).length > 0;
      
      // Форматируем финансовые показатели для отображения
      return {
        income: income !== 0 ? `${income.toLocaleString('ru-RU')} ₽` : '0 ₽',
        expenses: expenses !== 0 ? `${expenses.toLocaleString('ru-RU')} ₽` : '0 ₽',
        profit: profit !== 0 ? `${profit.toLocaleString('ru-RU')} ₽` : '0 ₽',
        additionalData,
        hasData
      };
    } catch (error) {
      console.error('Ошибка при обработке данных отчета:', error);
      return {
        income: '0 ₽',
        expenses: '0 ₽',
        profit: '0 ₽',
        additionalData: {},
        hasData: false
      };
    }
  };
  
  return (
    <div>
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Финансовые отчеты</h2>
        <div className="flex gap-2">
          {canCreateReports && (
            <button
              onClick={onCreateReport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Создать отчет
            </button>
          )}
        </div>
      </div>
      
      {/* Список отчетов */}
      {reports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">У вас пока нет финансовых отчетов</p>
          {canCreateReports && (
            <button
              onClick={onCreateReport}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Создать первый отчет
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="px-6 py-4 border-b dark:border-gray-700">
                <div className="font-bold text-xl mb-1 text-gray-800 dark:text-white">{report.title}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getReportTypeText(report.type)} • {report.period}
                </p>
              </div>
              
              <div className="px-6 py-4">
                {report.data && (
                  <div className="mb-4">
                    {(() => {
                      // Убедимся, что data - это объект, а не строка
                      const processedData = processReportData(report);
                      
                      // Всегда отображаем доходы, расходы и прибыль независимо от типа отчета
                      if (processedData.hasData) {
                        return (
                          <>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Доходы:</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {processedData.income}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Расходы:</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                {processedData.expenses}
                              </span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Прибыль:</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {processedData.profit}
                              </span>
                            </div>
                            
                            {/* Отображаем дополнительные данные в зависимости от типа отчета */}
                            {Object.entries(processedData.additionalData).length > 0 && (
                              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                {Object.entries(processedData.additionalData).map(([key, value]) => (
                                  <div key={key} className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{key}:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                      {value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      } else {
                        return (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Подробная информация доступна внутри отчета
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Создан: {formatDate(report.created_at)}
                </p>
              </div>
              
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between">
                <div className="space-x-2">
                  <button
                    onClick={() => onEditReport(report)}
                    className="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => onDeleteReport(report.id)}
                    className="text-xs text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Удалить
                  </button>
                </div>
                
                <button
                  onClick={() => handleDownloadReport(report.id)}
                  className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-1 px-2 rounded dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                >
                  Скачать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент для вкладки "Аналитика"
interface AnalyticsTabProps {
  companyId: string;
  records: FinanceRecord[];
}

function AnalyticsTab({ companyId, records }: AnalyticsTabProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'doughnut'>('bar');
  const [timeFrame, setTimeFrame] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Add formatCurrency function to format financial values consistently
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '0 ₽';
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB',
      maximumFractionDigits: 0 
    }).format(amount);
  };
  
  // Получаем уникальные категории из записей
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(records.map(r => r.category)));
    return uniqueCategories;
  }, [records]);
  
  // Выбираем все категории по умолчанию
  useEffect(() => {
    if (categories.length > 0 && selectedCategories.length === 0) {
      setSelectedCategories(categories);
    }
  }, [categories, selectedCategories]);
  
  // Подготовка данных для графиков по датам
  const prepareChartData = useCallback(() => {
    if (records.length === 0) return null;

    // Функция для группировки по периоду
    const getGroupKey = (date: Date) => {
      if (timeFrame === 'month') {
        // Формат: 'Янв 2024'
        return new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' }).format(date);
      } else if (timeFrame === 'quarter') {
        // Формат: 'Q1 2024'
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      } else {
        // Формат: '2024'
        return date.getFullYear().toString();
      }
    };
    
    // Фильтруем записи по выбранным категориям и группируем по датам
    const filteredRecords = records.filter(r => 
      selectedCategories.includes(r.category) && r.status === 'approved'
    );
    
    // Создаем словарь для хранения данных по периодам
    const incomeByPeriod: Record<string, number> = {};
    const expenseByPeriod: Record<string, number> = {};
    
    // Заполняем данные
    filteredRecords.forEach(record => {
      const date = new Date(record.created_at);
      const group = getGroupKey(date);
      
      const amount = typeof record.amount === 'number' ? record.amount : parseFloat(record.amount) || 0;
      
      if (record.type === 'income') {
        incomeByPeriod[group] = (incomeByPeriod[group] || 0) + amount;
      } else {
        expenseByPeriod[group] = (expenseByPeriod[group] || 0) + amount;
      }
    });
    
    // Получаем все уникальные периоды и сортируем их
    const allPeriods = Array.from(new Set([
      ...Object.keys(incomeByPeriod),
      ...Object.keys(expenseByPeriod)
    ])).sort();
    
    // Подготавливаем данные в зависимости от типа графика
    if (chartType === 'line' || chartType === 'bar') {
      return {
        labels: allPeriods,
        datasets: [
          {
            label: 'Доходы',
            data: allPeriods.map(period => incomeByPeriod[period] || 0),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
          },
          {
            label: 'Расходы',
            data: allPeriods.map(period => expenseByPeriod[period] || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false,
          }
        ]
      };
    } else {
      // Для круговых графиков анализируем категории
      const categorySums: Record<string, number> = {};
      
      filteredRecords.forEach(record => {
        const amount = typeof record.amount === 'number' ? record.amount : parseFloat(record.amount) || 0;
        categorySums[record.category] = (categorySums[record.category] || 0) + amount;
      });
      
      const categoryNames = Object.keys(categorySums);
      
      // Генерируем случайные цвета для категорий
      const backgroundColors = categoryNames.map(() => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 0.2)`;
      });
      
      const borderColors = backgroundColors.map(color => color.replace('0.2', '1'));
      
      return {
        labels: categoryNames,
        datasets: [
          {
            label: 'Сумма',
            data: categoryNames.map(category => categorySums[category] || 0),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
          }
        ]
      };
    }
  }, [records, selectedCategories, timeFrame, chartType]);
  
  // Подготовка опций для графика
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Финансовая аналитика',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            
            let value;
            if (chartType === 'pie' || chartType === 'doughnut') {
              value = context.parsed || 0;
            } else {
              value = context.parsed.y || 0;
            }
            
            if (value !== null && !isNaN(value)) {
              label += new Intl.NumberFormat('ru-RU', { 
                style: 'currency', 
                currency: 'RUB',
                maximumFractionDigits: 0 
              }).format(value);
            } else {
              label += '0 ₽';
            }
            return label;
          }
        }
      }
    },
    scales: chartType === 'line' || chartType === 'bar' ? {
      x: {
        title: {
          display: true,
          text: 'Период',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Сумма (₽)',
        },
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('ru-RU', { 
              style: 'currency', 
              currency: 'RUB',
              maximumFractionDigits: 0 
            }).format(value);
          }
        }
      },
    } : undefined,
  };
  
  // Обработчик изменения выбранных категорий
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Выбор всех категорий
  const selectAllCategories = () => {
    setSelectedCategories(categories);
  };
  
  // Очистка выбранных категорий
  const clearCategories = () => {
    setSelectedCategories([]);
  };
  
  // Получаем данные для графика
  const chartData = prepareChartData();
  
  // Компонент графика в зависимости от выбранного типа
  const renderChart = () => {
    if (!chartData) return null;
    
    const chartProps = {
      data: chartData,
      options: chartOptions,
      height: 300,
    };
    
    switch (chartType) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Финансовая аналитика</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Выбор типа графика */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип графика</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="bar">Столбчатый</option>
              <option value="line">Линейный</option>
              <option value="pie">Круговой</option>
              <option value="doughnut">Кольцевой</option>
            </select>
          </div>
          
          {/* Выбор временного периода */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Период</label>
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as any)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="month">По месяцам</option>
              <option value="quarter">По кварталам</option>
              <option value="year">По годам</option>
            </select>
          </div>
          
          {/* Кнопки для выбора категорий */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Действия</label>
            <div className="flex gap-2">
              <button 
                onClick={selectAllCategories}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex-1"
              >
                Выбрать все
              </button>
              <button 
                onClick={clearCategories}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex-1"
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
        
        {/* Выбор категорий */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">Категории:</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <label key={category} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* График */}
        <div className="h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Загрузка данных...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Нет данных для отображения</p>
            </div>
          ) : selectedCategories.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Выберите хотя бы одну категорию</p>
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>
      
      {/* Дополнительная аналитика */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Топ категорий доходов */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Топ категорий доходов</h3>
            {(() => {
              const incomeByCategory: Record<string, number> = {};
              
              records
                .filter(r => r.type === 'income' && r.status === 'approved')
                .forEach(r => {
                  const amount = parseFloat(r.amount.toString()) || 0;
                  incomeByCategory[r.category] = (incomeByCategory[r.category] || 0) + amount;
                });
              
              const sortedCategories = Object.entries(incomeByCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
              
              const totalIncome = Object.values(incomeByCategory).reduce((sum, amount) => sum + amount, 0);
              
              return sortedCategories.length > 0 ? (
                <div className="space-y-3">
                  {sortedCategories.map(([category, amount]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="flex items-center">
                          <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            {formatCurrency(amount)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({Math.round(amount / totalIncome * 100)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.round(amount / totalIncome * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 mt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Всего</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(totalIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Нет данных о доходах</p>
              );
            })()}
          </div>
          
          {/* Топ категорий расходов */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Топ категорий расходов</h3>
            {(() => {
              const expenseByCategory: Record<string, number> = {};
              
              records
                .filter(r => r.type === 'expense' && r.status === 'approved')
                .forEach(r => {
                  const amount = parseFloat(r.amount.toString()) || 0;
                  expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + amount;
                });
              
              const sortedCategories = Object.entries(expenseByCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
              
              const totalExpense = Object.values(expenseByCategory).reduce((sum, amount) => sum + amount, 0);
              
              return sortedCategories.length > 0 ? (
                <div className="space-y-3">
                  {sortedCategories.map(([category, amount]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="flex items-center">
                          <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                            {formatCurrency(amount)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({Math.round(amount / totalExpense * 100)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full">
                        <div 
                          className="bg-red-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.round(amount / totalExpense * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 mt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Всего</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(totalExpense)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Нет данных о расходах</p>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Модальное окно для добавления/редактирования финансовой записи
interface FinanceRecordModalProps {
  record: FinanceRecord | null;
  onClose: () => void;
  onSave: (record: Partial<FinanceRecord>) => void;
}

function FinanceRecordModal({ record, onClose, onSave }: FinanceRecordModalProps) {
  const [type, setType] = useState<string>(record?.type || 'expense');
  const [category, setCategory] = useState<string>(record?.category || '');
  const [amount, setAmount] = useState<string>(record ? record.amount.toString() : '');
  const [currency, setCurrency] = useState<string>(record?.currency || 'RUB');
  const [description, setDescription] = useState<string>(record?.description || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка обязательных полей
    if (!type || !category || !amount || !currency) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    // Проверка суммы
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }
    
    // Формируем объект записи
    const recordData: Partial<FinanceRecord> = {
      type: type as 'income' | 'expense',
      category,
      amount: amountValue,
      currency,
      description
    };
    
    onSave(recordData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-semibold mb-4">
          {record ? 'Редактирование записи' : 'Новая запись'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Тип операции */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип операции <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={type === 'income'}
                  onChange={() => setType('income')}
                  className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2">Доход</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={() => setType('expense')}
                  className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2">Расход</span>
              </label>
            </div>
          </div>
          
          {/* Категория */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Категория <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
              required
            >
              <option value="">Выберите категорию</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          {/* Сумма и валюта */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сумма <span className="text-red-500">*</span>
              </label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
                required
              />
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Валюта <span className="text-red-500">*</span>
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
                required
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Описание */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
            ></textarea>
          </div>
          
          {/* Кнопки */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {record ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модальное окно для создания/редактирования отчета
interface FinanceReportModalProps {
  report: FinancialReport | null;
  onClose: () => void;
  onSave: (report: Partial<FinancialReport>) => void;
  companyId: string;
}

function FinanceReportModal({ report, onClose, onSave, companyId }: FinanceReportModalProps) {
  const [title, setTitle] = useState(report?.title || '');
  const [reportType, setReportType] = useState(report?.type || 'Квартальный');
  const [period, setPeriod] = useState(report?.period || '');
  const [generateFile, setGenerateFile] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const generateReportData = (type: string) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Определяем квартал
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    // Получаем данные для активных записей
    const fetchFinanceData = async () => {
      setLoading(true);
      try {
        // Получаем все одобренные финансовые транзакции
        const res = await fetch(`/api/companies/finance?companyId=${companyId}&status=approved`, {
          credentials: 'include'
        });
        
        if (!res.ok) {
          throw new Error('Не удалось получить финансовые данные');
        }
        
        const data = await res.json();
        const records = data.records || [];
        
        console.log(`Получено ${records.length} финансовых записей для отчета`);
        
        // Выведем их для дебага
        records.forEach((r: any) => {
          console.log(`Запись ID:${r.id}, Тип:${r.type}, Категория:${r.category}, Сумма:${r.amount}, Статус:${r.status}`);
        });
        
        let reportData = {};
        let periodText = '';
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript месяцы с 0
        
        // Применим соответствующую логику в зависимости от типа отчета
        switch (type) {
          case 'Квартальный':
            // Определяем текущий квартал
            const currentQuarter = Math.ceil(currentMonth / 3);
            const startQuarterMonth = (currentQuarter - 1) * 3;
            const endQuarterMonth = startQuarterMonth + 3;
            
            // Фильтруем записи за текущий квартал
            const quarterRecords = records.filter((r: any) => {
              const recordDate = new Date(r.created_at);
              const recordMonth = recordDate.getMonth();
              console.log(`Проверка записи за квартал: ${r.id}, дата: ${r.created_at}, месяц: ${recordMonth}, входит в квартал ${startQuarterMonth}-${endQuarterMonth}:`, 
                recordDate.getFullYear() === currentYear && recordMonth >= startQuarterMonth && recordMonth < endQuarterMonth);
              return recordDate.getFullYear() === currentYear && 
                recordMonth >= startQuarterMonth && 
                recordMonth < endQuarterMonth;
            });
            
            console.log(`Отфильтровано ${quarterRecords.length} записей для квартального отчета`);
            
            // Суммы за квартал
            const quarterIncome = quarterRecords
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                console.log(`Доход за квартал (ID: ${r.id}): ${r.category} - ${amount} ₽`);
                return sum + amount;
              }, 0);
              
            const quarterExpenses = quarterRecords
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                console.log(`Расход за квартал (ID: ${r.id}): ${r.category} - ${amount} ₽`);
                return sum + amount;
              }, 0);
            
            const quarterProfit = quarterIncome - quarterExpenses;
            
            console.log(`Финансы за Q${currentQuarter}:`, {
              доходы: quarterIncome,
              расходы: quarterExpenses,
              прибыль: quarterProfit
            });
            
            periodText = `Q${currentQuarter} ${currentYear}`;
            reportData = {
              type,
              period: periodText,
              income: quarterIncome,
              expenses: quarterExpenses,
              profit: quarterProfit,
              quarter: currentQuarter,
              year: currentYear,
              generatedAt: new Date().toISOString()
            };
            break;
          case 'Годовой':
            // Фильтруем транзакции за текущий год
            const yearRecords = records.filter((r: any) => {
              const recordDate = new Date(r.created_at);
              return recordDate.getFullYear() === currentYear;
            });
            
            console.log('Отфильтровано записей за год:', yearRecords.length);
            
            // Суммы за год
            const yearIncome = yearRecords
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                console.log(`Доход за год (ID: ${r.id}): ${r.category} - ${amount} ₽`);
                return sum + amount;
              }, 0);
              
            const yearExpenses = yearRecords
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                console.log(`Расход за год (ID: ${r.id}): ${r.category} - ${amount} ₽`);
                return sum + amount;
              }, 0);
            
            const yearProfit = yearIncome - yearExpenses;
            
            console.log(`Финансы за ${currentYear}:`, {
              доходы: yearIncome,
              расходы: yearExpenses,
              прибыль: yearProfit
            });
            
            periodText = `${currentYear}`;
            reportData = {
              type,
              period: periodText,
              income: yearIncome,
              expenses: yearExpenses,
              profit: yearProfit,
              monthsCovered: currentMonth,
              year: currentYear,
              generatedAt: new Date().toISOString()
            };
            break;
          case 'Бюджет':
            // Рассчитаем общие доходы и расходы за все время
            const totalIncome = records
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
              
            const totalExpenses = records
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
            
            const remaining = totalIncome - totalExpenses;
            
            periodText = `${currentYear}`;
            reportData = {
              type,
              period: periodText,
              budget: totalIncome,
              spent: totalExpenses,
              remaining,
              income: totalIncome,  // Для совместимости с отображением
              expenses: totalExpenses,  // Для совместимости с отображением
              profit: remaining,  // Для совместимости с отображением
              year: currentYear
            };
            break;
          case 'Прогноз':
            // Рассчитаем общие доходы и расходы
            const forecastIncome = records
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
              
            const forecastExpenses = records
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
            
            const forecastProfit = forecastIncome - forecastExpenses;
            
            periodText = `${currentYear} - ${currentYear + 2}`;
            reportData = {
              type,
              period: periodText,
              income: forecastIncome,  // Базовые показатели
              expenses: forecastExpenses,
              profit: forecastProfit,
              shortTerm: { income: forecastIncome * 1.1, expenses: forecastExpenses * 1.05, profit: forecastIncome * 1.1 - forecastExpenses * 1.05 },
              midTerm: { income: forecastIncome * 1.3, expenses: forecastExpenses * 1.2, profit: forecastIncome * 1.3 - forecastExpenses * 1.2 },
              longTerm: { income: forecastIncome * 1.5, expenses: forecastExpenses * 1.4, profit: forecastIncome * 1.5 - forecastExpenses * 1.4 }
            };
            break;
          case 'Аналитика':
            // Рассчитаем общие доходы и расходы
            const analyticsIncome = records
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
              
            const analyticsExpenses = records
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
            
            const analyticsProfit = analyticsIncome - analyticsExpenses;
            
            // Получаем топ категорий по доходам
            const incomeByCategory: Record<string, number> = {};
            records
              .filter((r: any) => r.type === 'income')
              .forEach((r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                incomeByCategory[r.category] = (incomeByCategory[r.category] || 0) + amount;
              });
            
            const topIncomeCategories = Object.entries(incomeByCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([category, amount]) => ({ category, amount }));
            
            // Получаем топ категорий по расходам
            const expenseByCategory: Record<string, number> = {};
            records
              .filter((r: any) => r.type === 'expense')
              .forEach((r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + amount;
              });
            
            const topExpenseCategories = Object.entries(expenseByCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([category, amount]) => ({ category, amount }));
            
            periodText = `${currentYear}`;
            reportData = {
              type,
              period: periodText,
              income: analyticsIncome,
              expenses: analyticsExpenses,
              profit: analyticsProfit,
              topIncomeCategories,
              topExpenseCategories
            };
            break;
          default:
            // Базовый отчет с общими показателями
            const defaultIncome = records
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
              
            const defaultExpenses = records
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0;
                return sum + amount;
              }, 0);
            
            const defaultProfit = defaultIncome - defaultExpenses;
            
            periodText = `${currentYear}`;
            reportData = {
              type,
              period: periodText,
              income: defaultIncome,
              expenses: defaultExpenses,
              profit: defaultProfit
            };
        }
        
        setPeriod(periodText);
        return reportData;
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
        toast.error('Не удалось получить финансовые данные');
        
        // Возвращаем базовые данные в случае ошибки
        return {
          type,
          period: `${currentYear}`,
          income: 0,
          expenses: 0,
          profit: 0
        };
      } finally {
        setLoading(false);
      }
    };
    
    return fetchFinanceData();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !reportType) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    setLoading(true);
    
    try {
      // Генерируем данные отчета
      const reportData = await generateReportData(reportType);
      
      // Логируем для отладки
      console.log('Создаваемый отчет:', {
        title,
        type: reportType,
        period,
        data: reportData
      });
      
      const finalReport: Partial<FinancialReport> = {
        title,
        type: reportType,
        period,
        data: reportData, // Убедимся, что data не будет null
        status: 'active',
        generated: true
      };
      
      if (generateFile) {
        finalReport.generateFile = true;
      }
      
      onSave(finalReport);
    } catch (error) {
      console.error('Ошибка при создании отчета:', error);
      toast.error('Ошибка при создании отчета');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
        >
          ✕
        </button>
        
        <h2 className="text-xl font-semibold mb-4">
          {report ? 'Редактирование отчета' : 'Новый отчет'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Название отчета */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название отчета <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
              required
            />
          </div>
          
          {/* Тип отчета */}
          <div className="mb-4">
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип отчета <span className="text-red-500">*</span>
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
              required
            >
              {REPORT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Период (только для отображения) */}
          <div className="mb-4">
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Период
            </label>
            <input
              id="period"
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
              placeholder="Будет рассчитан автоматически"
            />
          </div>
          
          {/* Создание файла */}
          <div className="mb-6">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={generateFile}
                onChange={() => setGenerateFile(!generateFile)}
                className="form-checkbox h-5 w-5 text-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Создать PDF-файл отчета
              </span>
            </label>
          </div>
          
          {/* Кнопки */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin">◌</span>
                  Обработка...
                </>
              ) : (
                report ? 'Сохранить' : 'Создать'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 