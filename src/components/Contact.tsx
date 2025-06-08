'use client';

import React from 'react';
import { motion } from 'framer-motion';
import NavButton from './NavButton';

export default function Contact() {
  return (
    <>
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
                href="/register"
                className="px-10 py-4 text-xl font-medium border-2 border-white/20"
                variant="secondary"
              >
                Начать бесплатно
              </NavButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-3">CompanySync</h3>
              <p className="text-gray-300 dark:text-gray-400 mb-6 max-w-2xl">
                Современное решение для управления бизнесом. Простое, эффективное, безопасное.
              </p>
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
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-4 md:mb-0">© 2024 CompanySync. Все права защищены.</p>
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
    </>
  );
} 