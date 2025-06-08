'use client';

import React, { useState, useEffect } from 'react';

interface AvatarImageProps {
  avatarUrl: string | null | undefined;
  alt?: string;
  size?: number;
  className?: string;
}

export default function AvatarImage({ 
  avatarUrl, 
  alt = "Аватар пользователя", 
  size = 40,
  className = ""
}: AvatarImageProps) {
  // Используем локальное состояние для хранения полного URL с параметром для обхода кэша
  const [imgSrc, setImgSrc] = useState<string>('/businessman-avatar.svg');
  
  // Создаем уникальный timestamp для избежания кэширования
  const timestamp = Date.now();
  
  // Обновляем изображение при каждом изменении avatarUrl или обновлении компонента
  useEffect(() => {
    if (!avatarUrl) {
      setImgSrc('/businessman-avatar.svg');
      return;
    }
    
    // Принудительно очищаем путь от старых параметров кэширования
    const baseUrl = avatarUrl.split('?')[0];
    const freshUrl = `${baseUrl}?t=${timestamp}`;
    
    console.log('Setting new avatar URL:', freshUrl);
    setImgSrc(freshUrl);
    
    // Создаем новое изображение для проверки загрузки
    const preloadImg = new Image();
    preloadImg.src = freshUrl;
    
    // При успешной загрузке обновляем отображаемое изображение
    preloadImg.onload = () => {
      console.log('Avatar loaded successfully:', freshUrl);
    };
    
    // При ошибке загрузки используем дефолтный аватар
    preloadImg.onerror = () => {
      console.warn('Failed to load avatar, using default');
      setImgSrc('/businessman-avatar.svg');
    };
  }, [avatarUrl, timestamp]);

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Используем непосредственно img вместо компонента Image от Next.js для лучшего контроля кэширования */}
      <img
        src={imgSrc}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setImgSrc('/businessman-avatar.svg')}
        // Добавляем атрибуты для предотвращения кэширования
        crossOrigin="anonymous"
      />
    </div>
  );
} 