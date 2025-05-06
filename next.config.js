/** @type {import('next').NextConfig} */
const nextConfig = {
  // Разрешаем доступ к папке uploads в качестве статического контента
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*',
      },
    ];
  },
  // Добавляем webpack конфигурацию для исправления проблемы с emitter
  webpack: (config, { isServer }) => {
    // Фикс для emitter и других зависимостей
    config.resolve.alias = {
      ...config.resolve.alias,
      'emitter': 'component-emitter'
    };
    
    return config;
  },
};

module.exports = nextConfig; 