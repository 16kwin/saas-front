import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@fontsource/inter';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './services/AuthContext';

// Полная блокировка масштабирования
window.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    e.stopPropagation();
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
    e.preventDefault();
    e.stopPropagation();
  }
});

document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('gesturechange', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('gestureend', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);