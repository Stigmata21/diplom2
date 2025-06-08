import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Стандартный режим сборки вместо статического экспорта
  // output: 'export', 
  
  // Настройки изображений
  images: {
    // Включаем оптимизацию изображений для улучшения производительности
    unoptimized: true,  // Неоптимизированные изображения для избежания проблем со сборкой
    domains: ['localhost'], 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Добавляем переменные окружения для пропуска запросов к БД при сборке
  env: {
    // Пропускаем запросы к БД только при production сборке, 
    // во время разработки запросы работают нормально
    NEXT_SKIP_DB_QUERY: process.env.NODE_ENV === 'production' ? 'true' : 'false',
    NEXT_PHASE: process.env.NEXT_PHASE || '',
    DATABASE_SSL: 'false'  // Отключаем SSL для локальной базы данных
  },
  
  // Отключаем минимизацию серверного кода для лучшей отладки
  experimental: {
    serverMinification: false,
  },
  
  // Отключаем ESLint только во время сборки
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Кастомная конфигурация webpack для обработки Node.js модулей
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Не включаем Node.js модули на клиенте
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        path: false,
        crypto: false,
        os: false
      };
    }
    
    return config;
  },
};

export default nextConfig;
