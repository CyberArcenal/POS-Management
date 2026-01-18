// src/app/providers.tsx
import React from 'react';
import { SystemInfoProvider } from '../contexts/SystemInfoContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <SystemInfoProvider>
      {children}
    </SystemInfoProvider>

  );
};