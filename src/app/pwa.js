'use client';
import { useEffect } from 'react';

export default function PwaRegistrador() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('PWA: Motor Service Worker ligado!'))
        .catch((err) => console.error('PWA: Erro no motor', err));
    }
  }, []);

  return null; 
}