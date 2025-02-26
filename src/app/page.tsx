'use client';

import { useState } from 'react';
import NavButton from './components/NavButton';
import Pricing from './components/Pricing';

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Функция для плавной прокрутки к секции с учетом высоты шапки и дополнительного отступа для "pricing"
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      let offset = 0;
      if (sectionId === 'pricing') {
        offset = 50; // Дополнительный отступ вниз для блока "Тарифы"
      }
      const sectionTop = section.getBoundingClientRect().top + window.scrollY - headerHeight + offset;
      window.scrollTo({ top: sectionTop, behavior: 'smooth' });
    }
  };

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Шапка */}
        <header className="fixed top-0 w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-4 shadow-lg z-10">
          <div className="container mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center">
              <img src="/logo.png" alt="Логотип" className="h-12 mr-3" />
              <span className="text-2xl font-bold">CompanySync</span>
            </div>
            <nav className="flex items-center space-x-8">
              <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('about');
                  }}
                  className="text-white hover:text-yellow-300 transition-colors text-lg"
              >
                О нас
              </a>
              <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('pricing');
                  }}
                  className="text-white hover:text-yellow-300 transition-colors text-lg"
              >
                Тарифы
              </a>
              <div className="relative">
                <NavButton onClick={() => setIsAuthOpen(!isAuthOpen)} className="bg-indigo-700 hover:bg-indigo-800">
                  Войти
                </NavButton>
                {isAuthOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white text-gray-800 rounded-xl shadow-xl p-6 z-20 border border-gray-100">
                      <h3 className="font-bold text-xl mb-4 text-indigo-600">Добро пожаловать</h3>
                      <input
                          type="text"
                          placeholder="Ваш логин"
                          className="w-full p-3 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                          type="password"
                          placeholder="Пароль"
                          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <NavButton onClick={() => {}} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Войти в систему
                      </NavButton>
                      <p className="text-sm mt-3 text-gray-600">
                        Еще не с нами?{' '}
                        <a href="#" className="text-indigo-600 hover:underline">
                          Создать аккаунт
                        </a>
                      </p>
                    </div>
                )}
              </div>
            </nav>
          </div>
        </header>

        {/* Главная секция */}
        <section id="main" className="bg-gradient-to-b from-indigo-600 to-blue-500 text-white pt-24 pb-20 min-h-screen">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="max-w-lg">
                <h1 className="text-5xl font-extrabold mb-6 leading-tight">
                  Управление компанией стало проще с CompanySync
                </h1>
                <p className="text-xl mb-6 leading-relaxed">
                  Забудьте о сложных таблицах и устаревших системах. CompanySync — это современное решение для управления персоналом, отделами и финансами в одном удобном интерфейсе.
                </p>
                <p className="text-lg mb-8 leading-relaxed">
                  Автоматизируйте рутинные задачи, отслеживайте прогресс команды в реальном времени и получайте детализированные отчеты для принятия лучших решений. Подходит для бизнеса любого размера — от стартапов до корпораций.
                </p>
                <NavButton
                    onClick={() => scrollToSection('about')}
                    className="bg-indigo-700 hover:bg-indigo-800 px-8 py-4 text-lg"
                >
                  Попробовать бесплатно
                </NavButton>
              </div>
              <div className="hidden md:block">
                <img
                    src="/dashboard-preview.png"
                    alt="Превью платформы"
                    className="rounded-xl shadow-lg w-full max-w-md"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Секция "О нас" */}
        <section id="about" className="bg-gray-100 py-20 min-h-screen">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-gray-800">Почему выбирают CompanySync?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-semibold mb-4 text-indigo-600">Простота в каждом шаге</h3>
                <p className="text-gray-600 leading-relaxed">
                  Мы создали платформу, которая понятна даже новичкам. Управляйте сотрудниками, задачами и отчетами без лишних усилий. Интуитивный дизайн и пошаговые инструкции помогут вам освоиться за минуты.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-semibold mb-4 text-indigo-600">Гибкость для вашего бизнеса</h3>
                <p className="text-gray-600 leading-relaxed">
                  Независимо от размера вашей компании — от стартапа до крупного предприятия — наши тарифы подстраиваются под ваши нужды. Бесплатный план для начала и премиум-функции для роста.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-semibold mb-4 text-indigo-600">Безопасность на высоте</h3>
                <p className="text-gray-600 leading-relaxed">
                  Ваши данные под надежной защитой благодаря современным технологиям шифрования и ежедневному резервному копированию. Сосредоточьтесь на бизнесе, а мы позаботимся о безопасности.
                </p>
              </div>
            </div>
            <div className="mt-12">
              <NavButton
                  onClick={() => scrollToSection('pricing')}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg"
              >
                Выбрать тариф
              </NavButton>
            </div>
          </div>
        </section>

        {/* Секция "Тарифы" */}
        <section id="pricing" className="bg-gray-100 py-20 min-h-screen flex items-start">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-gray-800">Найдите идеальный тариф для вашего бизнеса</h2>
            <p className="text-lg text-gray-600 mb-10 max-w-3xl">
              Мы предлагаем решения для компаний любого размера. Начните бесплатно или выберите премиум-план с расширенными возможностями для более сложных задач.
            </p>
            <Pricing />
            <div className="mt-12">
              <NavButton
                  onClick={() => scrollToSection('about')}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg"
              >
                Узнать больше о нас
              </NavButton>
            </div>
          </div>
        </section>

        {/* Футер */}
        <footer className="bg-indigo-600 text-white py-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <h3 className="text-2xl font-bold">CompanySync</h3>
                <p className="text-sm mt-2">Ваш партнер в управлении бизнесом</p>
              </div>
              <div className="flex space-x-6">
                <a
                    href="#main"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('main');
                    }}
                    className="text-white hover:text-yellow-300"
                >
                  Главная
                </a>
                <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('about');
                    }}
                    className="text-white hover:text-yellow-300"
                >
                  О нас
                </a>
                <a
                    href="#pricing"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection('pricing');
                    }}
                    className="text-white hover:text-yellow-300"
                >
                  Тарифы
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}