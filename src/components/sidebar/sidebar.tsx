"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

const menu = [
  { href: "/companies", label: "Компании", icon: "🏢" },
  { href: "/companies/files", label: "Файлы компании", icon: "📁" },
];

export function Sidebar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Закрывать меню при переходе
  React.useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Бургер-иконка */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white/80 dark:bg-gray-900/80 rounded-full p-3 shadow-lg active:scale-95 transition-transform backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        style={{ touchAction: 'manipulation' }}
        onClick={() => setOpen(true)}
        aria-label="Открыть меню"
      >
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 z-40 h-full w-4/5 max-w-xs md:w-64 bg-white/90 dark:bg-gray-900/90 shadow-lg flex flex-col p-4 sm:p-6 space-y-4
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        style={{ minHeight: '100vh', backdropFilter: 'blur(8px)' }}
      >
        <div className="text-2xl font-bold text-indigo-700 mb-8 text-gray-800 dark:text-white flex items-center gap-2">
          <img src="/logo.png" alt="logo" className="h-10 w-10" />
          CompanySync
        </div>
        <nav className="flex flex-col space-y-2">
          {menu.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg px-4 py-3 font-medium text-gray-800 dark:text-white text-lg md:text-base ${pathname === href ? "bg-indigo-100 dark:bg-gray-800" : ""}`}
              style={{ minHeight: 48 }}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <ThemeSwitcher />
          <button
            onClick={() => { router.push("/"); }}
            className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg px-4 py-3 mt-2 text-lg md:text-base"
            style={{ minHeight: 48 }}
          >Выйти</button>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">&copy; {new Date().getFullYear()} CompanySync</div>
        </div>
        {/* Кнопка закрытия на мобиле */}
        <button
          className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white p-2"
          onClick={() => setOpen(false)}
          aria-label="Закрыть меню"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
      </aside>
      {/* Затемнение фона при открытом меню на мобиле */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
} 