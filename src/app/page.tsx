// src/app/page.tsx
import Header from './components/Header';
import Pricing from './components/Pricing';
import NavButton from './components/NavButton';
import { query } from '../../lib/db';
import Link from 'next/link';

// Интерфейсы для типизации
interface PlanFeatures {
  companies: number | string;
  employees: number | string;
  reports?: string;
  notes?: string;
  analytics?: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  description: string;
  max_companies: number;
  max_users: number;
  features: PlanFeatures;
}

async function getPlans(): Promise<Plan[]> {
  const plans = await query<Plan>('SELECT * FROM plans');
  return plans;
}

export default async function Home() {
  const plans = await getPlans();

  return (
      <div className="min-h-screen bg-gray-50">
        <Header />

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
                <NavButton href="#about" className="bg-indigo-700 hover:bg-indigo-800 px-8 py-4 text-lg">
                  Попробовать бесплатно
                </NavButton>
              </div>
              <div className="hidden md:block">
                <img
                    src="work_man.png"
                    alt="Превью платформы"
                    className="rounded-xl shadow-lg w-full max-w-md"
                />
              </div>
            </div>
          </div>
        </section>

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
              <NavButton href="#pricing" className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg">
                Выбрать тариф
              </NavButton>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-gray-100 py-20 min-h-screen flex items-start">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-gray-800">Найдите идеальный тариф для вашего бизнеса</h2>
            <p className="text-lg text-gray-600 mb-10 max-w-3xl">
              Мы предлагаем решения для компаний любого размера. Начните бесплатно или выберите премиум-план с расширенными возможностями для более сложных задач.
            </p>
            <Pricing plans={plans} />
            <div className="mt-12">
              <NavButton href="#about" className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg">
                Узнать больше о нас
              </NavButton>
            </div>
          </div>
        </section>

        <footer className="bg-indigo-600 text-white py-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <h3 className="text-2xl font-bold">CompanySync</h3>
                <p className="text-sm mt-2">Ваш партнер в управлении бизнесом</p>
              </div>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <a href="#main" className="text-white hover:text-yellow-300">
                  Главная
                </a>
                <a href="#about" className="text-white hover:text-yellow-300">
                  О нас
                </a>
                <a href="#pricing" className="text-white hover:text-yellow-300">
                  Тарифы
                </a>
                <Link href="/support" className="text-white hover:text-yellow-300">
                  Написать в поддержку
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}