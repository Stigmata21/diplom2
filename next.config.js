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
  // Отключаем оптимизацию изображений для директории uploads
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 