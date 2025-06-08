'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
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
  );
} 