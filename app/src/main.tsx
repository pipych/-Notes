import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Early Telegram WebApp initialization
if (typeof window !== 'undefined') {
  const tg = (window as any).Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
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
