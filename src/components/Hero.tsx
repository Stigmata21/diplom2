'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import NavButton from './NavButton';

export default function Hero() {
  return (
    <section id="main" className="h-screen bg-gradient-to-br from-indigo-600 via-blue-500 to-purple-500 dark:from-indigo-900 dark:via-blue-800 dark:to-purple-900 text-white relative overflow-hidden flex items-start justify-center pt-24 md:pt-40">
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
  );
} 