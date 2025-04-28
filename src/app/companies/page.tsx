// src/app/companies/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import NavButton from '../components/NavButton';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { useUserStore } from '@/store/userStore';
import CompanyFiles from '../components/CompanyFiles';
import CompanyEmployees from '../components/CompanyEmployees';
import CompanyLogs from '../components/CompanyLogs';
import RightSidebar from '../components/RightSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';
import { User } from '@/types/db';

interface Company {
    id: string;
    name: string;
    description: string;
    created_at: string;
    user_role: string;
}

interface CompaniesResponse {
    companies: Company[];
    error?: string;
}

interface CompanyResponse {
    message: string;
    company: Company;
    error?: string;
}

interface DeleteResponse {
    message: string;
    error?: string;
}

interface CompanyFormData {
    id?: string;
    name: string;
    description: string;
    user_role: string;
    created_at?: string;
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export default function Companies() {
    const router = useRouter();
    const { user, setUser } = useUserStore();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<CompanyFormData | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [openFilesCompanyId, setOpenFilesCompanyId] = useState<string | null>(null);
    const [openEmployeesCompanyId, setOpenEmployeesCompanyId] = useState<string | null>(null);
    const [openLogsCompanyId, setOpenLogsCompanyId] = useState<string | null>(null);
    const [sidebar, setSidebar] = useState<{ type: 'edit' | 'employees' | 'logs' | null, company: Company | null }>({ type: null, company: null });
    const deleteButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
                if (!token) {
                    router.push('/login');
                    return;
                }

                const { payload } = await jwtVerify(token, JWT_SECRET);
                const userId = payload.id as string;

                const result = await query<User>(
                    'SELECT id, username, email, role, avatar_url, name, password_hash, created_at, updated_at FROM users WHERE id = $1',
                    [userId]
                );

                if (result.length === 0) {
                    router.push('/login');
                    return;
                }

                setUser(result[0]);
                fetchCompanies(userId);
            } catch (error) {
                console.error('Auth error:', error);
                router.push('/login');
            }
        };

        if (!user) {
            checkAuth();
        } else {
            fetchCompanies(user.id);
        }
    }, [user, router, setUser]);

    const fetchCompanies = async (userId: string) => {
        try {
            const result = await query<Company>(
                `SELECT c.*, cm.role as user_role 
                FROM companies c 
                JOIN company_members cm ON c.id = cm.company_id 
                WHERE cm.user_id = $1`,
                [userId]
            );
            setCompanies(result);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCompany) return;

        try {
            const response = await fetch('/api/companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: currentCompany.name,
                    description: currentCompany.description || '',
                    role: currentCompany.user_role,
                }),
            });

            if (response.ok) {
                const newCompany: Company = await response.json();
                setCompanies([...companies, newCompany]);
                setShowAddModal(false);
                setCurrentCompany(null);
            } else {
                setError('Failed to add company');
            }
        } catch (err) {
            setError('An error occurred while adding the company');
        }
    };

    const handleEditCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCompany?.id) return;

        try {
            const response = await fetch(`/api/companies/${currentCompany.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: currentCompany.name,
                    description: currentCompany.description || '',
                    role: currentCompany.user_role,
                }),
            });

            if (response.ok) {
                const updatedCompany = await response.json();
                setCompanies(companies.map(c => c.id === currentCompany.id ? updatedCompany : c));
                setShowEditModal(false);
                setCurrentCompany(null);
            } else {
                setError('Failed to update company');
            }
        } catch (err) {
            setError('An error occurred while updating the company');
        }
    };

    const handleDeleteCompany = async (companyId: string) => {
        setError('');

        if (!user) return;

        const token = Cookies.get('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await fetch(`/api/companies?userId=${user.id}&companyId=${companyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
            });

            const data: DeleteResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при удалении компании');
            }

            setCompanies(companies.filter((c) => c.id !== companyId));
            setDeleteConfirmId(null);
        } catch (err) {
            console.error('Delete company error:', err);
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        }
    };

    const handleCompanyChange = (field: keyof CompanyFormData, value: string) => {
        if (currentCompany) {
            setCurrentCompany({
                ...currentCompany,
                [field]: value
            });
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.25, ease: 'easeIn' } },
    };

    const confirmVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } },
    };

    const handlePageChange = (newPage: string | number) => {
        setCurrentPage(Number(newPage));
    };

    if (!user) {
        return <div className="text-center text-white">Загрузка...</div>;
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                ))}
            </div>
        );
    }

    const itemsPerPage = 10;
    const startIndex = (Number(currentPage) - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCompanies = companies.slice(startIndex, endIndex);
    const calculatedTotalPages = Math.ceil(companies.length / itemsPerPage);

    useEffect(() => {
        setTotalPages(calculatedTotalPages);
    }, [companies.length]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-blue-500 text-white flex flex-col items-center py-4 md:py-12">
            <div className="bg-white text-gray-800 rounded-xl shadow-xl p-2 sm:p-4 md:p-8 w-full max-w-4xl">
                <h1 className="text-3xl font-bold mb-6 text-indigo-600">Мои компании</h1>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-end mb-6">
                    <NavButton onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        Добавить компанию
                    </NavButton>
                </div>
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <SearchInput
                        placeholder="Поиск компаний..."
                        value={searchTerm}
                        onChange={(value) => setSearchTerm(value)}
                        className="w-full sm:w-64"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    >
                        <option value="all">Все роли</option>
                        <option value="owner">Владелец</option>
                        <option value="admin">Администратор</option>
                        <option value="employee">Сотрудник</option>
                    </select>
                </div>
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                    <AnimatePresence>
                        {paginatedCompanies.length > 0 ? (
                            paginatedCompanies.map((company) => (
                                <motion.div
                                    key={company.id}
                                    variants={cardVariants}
                                    className="p-3 sm:p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow relative overflow-x-auto"
                                >
                                    <h3 className="text-xl font-semibold text-indigo-600 mb-2">{company.name}</h3>
                                    <p className="text-gray-600 mb-2">{company.description || 'Описание отсутствует'}</p>
                                    <p className="text-sm text-gray-500 mb-4">Роль: {company.user_role}</p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <NavButton onClick={() => setSidebar({ type: 'edit', company })} className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3">Редактировать</NavButton>
                                        <NavButton onClick={() => setSidebar({ type: 'employees', company })} className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3">Сотрудники</NavButton>
                                        {(company.user_role === 'owner' || company.user_role === 'admin') && (
                                            <NavButton onClick={() => setSidebar({ type: 'logs', company })} className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3">История</NavButton>
                                        )}
                                        <div className="relative">
                                            <NavButton
                                                ref={(el: HTMLButtonElement | null) => {
                                                    if (el) {
                                                        deleteButtonRefs.current.set(company.id, el);
                                                    } else {
                                                        deleteButtonRefs.current.delete(company.id);
                                                    }
                                                }}
                                                onClick={() => setDeleteConfirmId(company.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3"
                                            >
                                                Удалить
                                            </NavButton>
                                            <AnimatePresence>
                                                {deleteConfirmId === company.id && (
                                                    <motion.div
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                        variants={confirmVariants}
                                                        className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-lg shadow-lg p-2 z-50 border border-gray-200 w-48"
                                                    >
                                                        <p className="text-sm mb-2">Вы уверены, что хотите удалить?</p>
                                                        <div className="flex space-x-2">
                                                            <NavButton
                                                                onClick={() => handleDeleteCompany(company.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2"
                                                            >
                                                                Да
                                                            </NavButton>
                                                            <NavButton
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs py-1 px-2"
                                                            >
                                                                Нет
                                                            </NavButton>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    {openFilesCompanyId === company.id && (
                                        <CompanyFiles
                                            companyId={company.id}
                                            canEdit={company.user_role === 'owner' || company.user_role === 'admin'}
                                        />
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-gray-600 col-span-full text-center">У вас пока нет компаний</p>
                        )}
                    </AnimatePresence>
                </motion.div>
                <div className="mt-4 md:mt-8 flex justify-center">
                    <NavButton onClick={() => router.push('/')} className="bg-gray-300 hover:bg-gray-400 text-gray-800 w-full max-w-xs">
                        Назад
                    </NavButton>
                </div>
            </div>

            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <div className="bg-white text-gray-800 rounded-xl shadow-xl p-2 sm:p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4 text-indigo-600">Добавить компанию</h2>
                            <form onSubmit={handleAddCompany} className="space-y-3 md:space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">Название компании</label>
                                    <input
                                        type="text"
                                        value={currentCompany?.name || ''}
                                        onChange={(e) => handleCompanyChange('name', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">Описание</label>
                                    <textarea
                                        value={currentCompany?.description || ''}
                                        onChange={(e) => handleCompanyChange('description', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">Роль в компании</label>
                                    <select
                                        value={currentCompany?.user_role || ''}
                                        onChange={(e) => handleCompanyChange('user_role', e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="member">Участник</option>
                                        <option value="admin">Администратор</option>
                                        <option value="owner">Владелец</option>
                                    </select>
                                </div>
                                <div className="flex flex-col md:flex-row md:space-x-4 gap-2 md:gap-0">
                                    <NavButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        Сохранить
                                    </NavButton>
                                    <NavButton onClick={() => setShowAddModal(false)} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800">
                                        Отмена
                                    </NavButton>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditModal && currentCompany && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalVariants}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <div className="bg-white text-gray-800 rounded-xl shadow-xl p-2 sm:p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4 text-indigo-600">Редактировать компанию</h2>
                            <form onSubmit={handleEditCompany} className="space-y-3 md:space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">Название компании</label>
                                    <input
                                        type="text"
                                        value={currentCompany.name}
                                        onChange={(e) => setCurrentCompany({ ...currentCompany, name: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">Описание</label>
                                    <textarea
                                        value={currentCompany.description}
                                        onChange={(e) => setCurrentCompany({ ...currentCompany, description: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        rows={3}
                                        placeholder="Краткое описание компании (необязательно)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">Роль в компании</label>
                                    <select
                                        value={currentCompany.user_role}
                                        onChange={(e) => setCurrentCompany({ ...currentCompany, user_role: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="member">Участник</option>
                                        <option value="admin">Администратор</option>
                                        <option value="owner">Владелец</option>
                                    </select>
                                </div>
                                <div className="flex flex-col md:flex-row md:space-x-4 gap-2 md:gap-0">
                                    <NavButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        Сохранить
                                    </NavButton>
                                    <NavButton onClick={() => setShowEditModal(false)} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800">
                                        Отмена
                                    </NavButton>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <RightSidebar
                open={!!sidebar.type}
                onClose={() => setSidebar({ type: null, company: null })}
                title={sidebar.type === 'edit' ? 'Редактировать компанию' : sidebar.type === 'employees' ? 'Сотрудники' : sidebar.type === 'logs' ? 'История действий' : ''}
            >
                {sidebar.type === 'edit' && sidebar.company && (
                    <form
                        onSubmit={handleEditCompany}
                        className="space-y-3 md:space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">Название компании</label>
                            <input
                                type="text"
                                value={currentCompany?.name}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, name: e.target.value })}
                                className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">Описание</label>
                            <textarea
                                value={currentCompany?.description}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, description: e.target.value })}
                                className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                                placeholder="Краткое описание компании (необязательно)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">Роль в компании</label>
                            <select
                                value={currentCompany?.user_role}
                                onChange={(e) => setCurrentCompany({ ...currentCompany, user_role: e.target.value })}
                                className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="member">Участник</option>
                                <option value="admin">Администратор</option>
                                <option value="owner">Владелец</option>
                            </select>
                        </div>
                        <div className="flex flex-col md:flex-row md:space-x-4 gap-2 md:gap-0">
                            <NavButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                Сохранить
                            </NavButton>
                            <NavButton onClick={() => setSidebar({ type: null, company: null })} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800">
                                Отмена
                            </NavButton>
                        </div>
                    </form>
                )}
                {sidebar.type === 'employees' && sidebar.company && (
                    <CompanyEmployees
                        companyId={sidebar.company.id}
                        currentUserId={user.id}
                        currentUserRole={sidebar.company.user_role}
                    />
                )}
                {sidebar.type === 'logs' && sidebar.company && (
                    <CompanyLogs companyId={sidebar.company.id} />
                )}
            </RightSidebar>

            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
}