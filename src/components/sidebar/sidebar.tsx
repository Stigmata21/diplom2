"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

const menu = [
  { href: "/companies", label: "Компании", icon: "🏢" },
  { href: "/support", label: "Поддержка", icon: "💬" },
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
        className="md:hidden fixed top-4 left-4 z-50 bg-white/80 dark:bg-gray-900/80 rounded-full p-2 shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Открыть меню"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-900 shadow-lg flex flex-col p-6 space-y-4
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        style={{ minHeight: '100vh' }}
      >
        <div className="text-2xl font-bold text-indigo-700 mb-8 text-gray-800 dark:text-white flex items-center gap-2">
          <img src="/logo.png" alt="logo" className="h-8 w-8" />
          CompanySync
        </div>
        <nav className="flex flex-col space-y-2">
          {menu.map(({ href, label, icon }) => (
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
    </>
  );
} 