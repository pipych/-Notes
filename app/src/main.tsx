import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Early Telegram WebApp initialization (Auto-fullscreen on any device)
if (typeof window !== 'undefined') {
  const tg = (window as any).Telegram?.WebApp;
  if (tg) {
    const ensureFullscreen = () => {
      try {
        tg.ready();
        tg.expand();
        if (typeof tg.requestFullscreen === 'function' && !tg.isFullscreen) {
          tg.requestFullscreen();
        }
        if (typeof tg.disableVerticalSwipes === 'function') {
          tg.disableVerticalSwipes();
        }
      } catch (err) {
        console.warn('Telegram fullscreen error:', err);
      }
    };

    try {
      ensureFullscreen();

      if (typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor('#131314');
      }
      if (typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor('#131314');
      }
      if (typeof tg.enableClosingConfirmation === 'function') {
        tg.enableClosingConfirmation();
      }
      document.body.classList.add('in-tg');

      // Re-trigger after short delays to ensure Telegram client shell bridge is ready
      setTimeout(ensureFullscreen, 100);
      setTimeout(ensureFullscreen, 350);

      // Listen for viewport changes & fullscreen failures
      if (typeof tg.onEvent === 'function') {
        tg.onEvent('viewportChanged', () => {
          try {
            if (!tg.isExpanded) tg.expand();
            if (typeof tg.requestFullscreen === 'function' && !tg.isFullscreen) {
              tg.requestFullscreen();
            }
          } catch {}
        });

        tg.onEvent('fullscreenFailed', (err: any) => {
          console.warn('Telegram fullscreenFailed:', err);
          try {
            tg.expand();
          } catch {}
        });
      }

      // First user interaction gesture fallback (required by some Telegram desktop/mobile clients)
      const onFirstInteraction = () => {
        ensureFullscreen();
      };
      window.addEventListener('pointerdown', onFirstInteraction, { once: true });
      window.addEventListener('keydown', onFirstInteraction, { once: true });
    } catch (e) {
      console.warn('Telegram WebApp init warning:', e);
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
