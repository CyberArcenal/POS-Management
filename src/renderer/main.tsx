
import ReactDOM from 'react-dom/client'
import './styles/App.css';
import "reflect-metadata";
import React from 'react';
import ConditionalRouter from './components/Shared/ConditionalRouter';


import { Providers } from './app/providers';
import App from './routes/App';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConditionalRouter>
      <Providers>
        <App />
      </Providers>
    </ConditionalRouter>
  </React.StrictMode>,
)
