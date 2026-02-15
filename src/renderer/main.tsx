
import ReactDOM from 'react-dom/client'
import './styles/App.css';
import './styles/scrollbar.css';
import './styles/windows-friendly.css';
import "reflect-metadata";
import React from 'react';
import ConditionalRouter from './components/Shared/ConditionalRouter';


import App from './routes/App';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConditionalRouter>
        <App />
    </ConditionalRouter>
  </React.StrictMode>,
)
