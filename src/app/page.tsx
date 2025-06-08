'use client';

// src/app/page.tsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import NavButton from './components/NavButton';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Plan {
  id: number;
  name: string;
  price: number;
  description: string;
  max_companies: number;
  max_users: number;
  features: {
    companies: number | string;
    employees: number | string;
    reports?: string;
    notes?: string;
    analytics?: string;
  };
}

function Pricing({ plans }: { plans: Plan[] }) {
  if (!plans || plans.length === 0) {
    return <div className="text-center text-gray-500">Тарифы недоступны</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map(plan => (
        <div key={plan.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
          <div className="text-2xl font-bold mb-2 text-indigo-600">{plan.name}</div>
          <div className="text-3xl font-bold mb-4">{plan.price} ₽<span className="text-sm text-gray-500">/мес</span></div>
          <p className="text-gray-600 mb-4">{plan.description}</p>
          <ul className="mt-4 mb-6 flex-grow space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> До {plan.features.companies} компаний
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span> До {plan.features.employees} сотрудников
            </li>
            {plan.features.reports && (
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span> {plan.features.reports}
              </li>
            )}
            {plan.features.notes && (
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span> {plan.features.notes}
              </li>
            )}
            {plan.features.analytics && (
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span> {plan.features.analytics}
              </li>
            )}
          </ul>
          <NavButton href="/register" className="w-full text-center" variant="primary">
            Выбрать
          </NavButton>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  
  useEffect(() => {
    async function getPlans() {
      try {
        const res = await fetch('/api/plans');
        const data = await res.json();
        if (data && Array.isArray(data)) {
          // Фильтруем только нужные тарифы, убираем дубли, сортируем по цене
          const order = ["Free", "Pro", "Enterprise"];
          const filteredPlans = data
            .filter((plan, idx, arr) => 
              order.includes(plan.name) && 
              arr.findIndex(p => p.name === plan.name && p.price === plan.price) === idx
            )
            .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name) || a.price - b.price);
          setPlans(filteredPlans);
        }
      } catch (error) {
        console.error('Ошибка получения тарифов:', error);
      }
    }
    
    getPlans();
  }, []);

  // Функция для прокрутки к началу страницы
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Шапка с высоким z-index */}
      <div className="relative z-50">
        <Header />
      </div>

      {/* Основное содержимое с низким z-index */}
      <div className="relative z-10 pt-16">
        {/* Hero Section - полноэкранный */}
        <section id="main" className="h-screen bg-gradient-to-br from-indigo-600 via-blue-500 to-purple-500 dark:from-indigo-900 dark:via-blue-800 dark:to-purple-900 text-white relative overflow-hidden flex items-start justify-center pt-24 md:pt-40">
          {/* Декоративные элементы фона */}
          <div className="absolute inset-0 overflow-hidden z-0">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 dark:bg-purple-600 opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-300 dark:bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-indigo-300 dark:bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div 
                className="max-w-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl font-extrabold mb-6 leading-tight">
                  Управление компанией стало проще с <span className="text-yellow-300">CompanySync</span>
                </h1>
                <p className="text-xl mb-6 leading-relaxed">
                  Забудьте о сложных таблицах и устаревших системах. CompanySync — это современное решение для управления персоналом, отделами и финансами в одном удобном интерфейсе.
                </p>
                <p className="text-lg mb-8 leading-relaxed">
                  Автоматизируйте рутинные задачи, отслеживайте прогресс команды в реальном времени и получайте детализированные отчеты для принятия лучших решений.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <NavButton href="/register" className="px-8 py-4 text-lg font-medium" variant="secondary">
                    Попробовать бесплатно
                  </NavButton>
                </motion.div>
              </motion.div>
              <motion.div 
                className="flex justify-center items-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative w-full max-w-xl mx-auto">
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-indigo-300 rounded-xl blur opacity-30"
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  ></motion.div>
                  <Image
                    src="/work_man.png"
                    alt="Управление компанией"
                    width={700}
                    height={600}
                    className="rounded-xl shadow-2xl w-full relative"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Преимущества - полноэкранный */}
        <section id="features" className="h-screen py-0 bg-white dark:bg-gray-900 flex items-center relative">
          <div className="container mx-auto px-6 py-16">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Почему <span className="text-indigo-600 dark:text-indigo-400">CompanySync</span>?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Наша платформа помогает компаниям оптимизировать процессы, экономить время и принимать правильные решения.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Всё в одном месте",
                  description: "Управляйте персоналом, проектами, задачами и финансами в одном удобном интерфейсе",
                  icon: "💼",
                  delay: 0.1
                },
                {
                  title: "Аналитика в реальном времени",
                  description: "Получайте подробные отчеты и наглядные графики для принятия обоснованных решений",
                  icon: "📊",
                  delay: 0.3
                },
                {
                  title: "Безопасность данных",
                  description: "Вся информация надежно защищена с использованием современных технологий шифрования",
                  icon: "🔒",
                  delay: 0.5
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  whileHover={{ y: -10 }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Как это работает - полноэкранный */}
        <section id="how-it-works" className="h-screen py-0 bg-gray-50 dark:bg-gray-800 flex items-center relative">
          <div className="container mx-auto px-6 py-16">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Как это работает</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Всего несколько шагов для начала работы с CompanySync</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Регистрация",
                  description: "Создайте аккаунт на нашей платформе за 2 минуты",
                  delay: 0.1
                },
                {
                  step: "02",
                  title: "Настройка",
                  description: "Добавьте информацию о вашей компании и сотрудниках",
                  delay: 0.3
                },
                {
                  step: "03",
                  title: "Приглашение",
                  description: "Пригласите членов вашей команды присоединиться к платформе",
                  delay: 0.5
                },
                {
                  step: "04",
                  title: "Управление",
                  description: "Начните использовать все возможности платформы для развития бизнеса",
                  delay: 0.7
                }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: step.delay }}
                >
                  <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md relative z-10 h-full">
                    <div className="text-5xl font-bold text-indigo-100 dark:text-indigo-900 absolute -top-4 -left-4 z-0">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400 mt-2 relative z-10">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 relative z-10">{step.description}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform translate-x-full z-20">
                      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-200 dark:text-indigo-700">
                        <path d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807611 27.9792 0.807611 27.3934 1.3934C26.8076 1.97919 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z" fill="currentColor"/>
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Отзывы пользователей - полноэкранный */}
        <section id="testimonials" className="h-screen py-0 bg-indigo-50 dark:bg-indigo-950 flex items-center relative">
          <div className="container mx-auto px-6 py-16">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Что говорят наши пользователи</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Тысячи компаний уже выбрали CompanySync для управления бизнесом</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Анна Смирнова",
                  position: "CEO, TechStart",
                  text: "CompanySync полностью изменил подход к управлению персоналом в нашей компании. Мы экономим до 15 часов в неделю на административных задачах!",
                  delay: 0.1
                },
                {
                  name: "Дмитрий Петров",
                  position: "HR-директор, InnoGroup",
                  text: "Интуитивный интерфейс и мощная аналитика превзошли все наши ожидания. Рекомендую всем, кто ценит время и эффективность.",
                  delay: 0.3
                },
                {
                  name: "Елена Козлова",
                  position: "Финансовый директор, АльфаТех",
                  text: "Система помогла нам автоматизировать отчетность и значительно сократить ошибки в финансовых документах. Отличное решение!",
                  delay: 0.5
                }
              ].map((testimonial, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: testimonial.delay }}
                  whileHover={{ y: -10 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-700 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-100 font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-lg dark:text-white">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.position}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic">&ldquo;{testimonial.text}&rdquo;</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Призыв к действию - компактный */}
        <section id="cta" className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-900 text-white relative">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6">Начните использовать CompanySync сегодня</h2>
              <p className="text-xl mb-8">Присоединяйтесь к тысячам компаний, которые уже оптимизировали свои бизнес-процессы с нашей платформой</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mb-8"
              >
                <NavButton 
                  className="px-10 py-4 text-xl font-medium border-2 border-white/20"
                  onClick={scrollToTop}
                  variant="secondary"
                >
                  Начать бесплатно
                </NavButton>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Переработанный футер */}
        <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-3">CompanySync</h3>
                <p className="text-gray-300 dark:text-gray-400 mb-6 max-w-2xl">Современное решение для управления бизнесом. Простое, эффективное, безопасное.</p>
                
                <div className="flex space-x-4 mb-8">
                  <a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 mb-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-white">Компания</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">О нас</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Команда</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Карьера</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Блог</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-white">Ресурсы</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Документация</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Справка</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Руководства</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Вебинары</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-white">Поддержка</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Контакты</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Тикеты</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Чат</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">FAQ</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-white">Безопасность</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Условия использования</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Политика конфиденциальности</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Правовая информация</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-white dark:text-gray-400 dark:hover:text-white transition-colors block">Статус сервиса</a></li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-700 dark:border-gray-800 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-4 md:mb-0">© 2023 CompanySync. Все права защищены.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a href="#" className="text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-white text-sm transition-colors">Политика конфиденциальности</a>
                    <span className="text-gray-600 dark:text-gray-700">•</span>
                    <a href="#" className="text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-white text-sm transition-colors">Условия использования</a>
                    <span className="text-gray-600 dark:text-gray-700">•</span>
                    <a href="#" className="text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-white text-sm transition-colors">Cookie</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}