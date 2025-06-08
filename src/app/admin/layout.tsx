"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useSession } from 'next-auth/react';
import Image from 'next/image';

const adminMenu = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Пользователи", icon: "👥" },
  { href: "/admin/companies", label: "Компании", icon: "🏢" },
  { href: "/admin/logs", label: "Логи", icon: "📜" },
  { href: "/admin/settings", label: "Настройки", icon: "⚙️" },
  { href: "/admin/support", label: "Чат поддержки", icon: "💬" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (status === 'loading') return;
    if (!user || user.role !== 'admin') router.push('/');
  }, [user, status, router]);
  React.useEffect(() => { setOpen(false); }, [pathname]);

  if (status === 'loading') return null;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-950">
      {/* Бургер-иконка */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white/80 dark:bg-gray-900/80 rounded-full p-2 shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Открыть меню"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 shadow-lg flex flex-col p-6 space-y-4
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="text-2xl font-bold text-indigo-700 mb-8 text-gray-800 dark:text-white flex items-center gap-2">
          AdminPanel
        </div>
        <nav className="flex flex-col space-y-2 flex-1 overflow-y-auto">
          {adminMenu.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg px-3 py-2 font-medium text-gray-800 dark:text-white ${pathname === href ? "bg-indigo-100 dark:bg-gray-800" : ""}`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <ThemeSwitcher />
          <button
            onClick={() => { router.push("/"); }}
            className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg px-3 py-2 mt-2"
          >Выйти</button>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">&copy; {new Date().getFullYear()} CompanySync</div>
        </div>
        {/* Кнопка закрытия на мобиле */}
        <button
          className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          onClick={() => setOpen(false)}
          aria-label="Закрыть меню"
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
      </aside>
      {/* Затемнение фона при открытом меню на мобиле */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Main */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-2 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 