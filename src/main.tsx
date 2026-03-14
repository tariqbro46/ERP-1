import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { SettingsProvider } from './contexts/SettingsContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
