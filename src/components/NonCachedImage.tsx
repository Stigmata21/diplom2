'use client';

import { useEffect, useState } from 'react';
import Image, { ImageProps } from 'next/image';

type NonCachedImageProps = Omit<ImageProps, 'src'> & {
  src: string | null | undefined;
  fallbackSrc?: string;
};

/**
 * Компонент, который добавляет временную метку к URL изображения для предотвращения кэширования
 */
export function NonCachedImage({ src, fallbackSrc = '/support-avatar.png', ...props }: NonCachedImageProps) {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  
  // Периодически обновляем timestamp каждые 2 секунды, чтобы изображение обновлялось
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(Date.now());
    }, 2000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Обновляем URL изображения при изменении src или timestamp
  useEffect(() => {
    if (!src) {
      setImgSrc(fallbackSrc);
      return;
    }
    
    try {
      // Добавляем или обновляем временную метку в URL
      const url = new URL(src, window.location.origin);
      url.searchParams.set('t', timestamp.toString());
      setImgSrc(url.toString());
    } catch (error) {
      // Если URL недействительный, используем fallback
      console.warn('Invalid URL in NonCachedImage:', src);
      setImgSrc(fallbackSrc);
    }
  }, [src, timestamp, fallbackSrc]);
  
  // Функция для принудительного обновления изображения
  const refresh = () => {
    setTimestamp(Date.now());
  };
  
  return (
    <Image
      {...props}
      src={imgSrc}
      unoptimized={true}
      alt={props.alt || "Image"}
      key={timestamp}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
} 