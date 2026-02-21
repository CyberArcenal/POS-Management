// main.tsx (updated)
import ReactDOM from 'react-dom/client'
import './styles/App.css';
import './styles/scrollbar.css';
import './styles/windows-friendly.css';
import "reflect-metadata";
import React from 'react';
import ConditionalRouter from './components/Shared/ConditionalRouter';
import App from './routes/App';
import { SettingsProvider } from './contexts/SettingsContext'; // adjust path

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ConditionalRouter>
        <App />
      </ConditionalRouter>
    </SettingsProvider>
  </React.StrictMode>,
)