'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Features() {
  return (
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
  );
} 