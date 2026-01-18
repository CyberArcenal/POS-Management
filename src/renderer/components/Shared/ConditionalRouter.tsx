// src/components/Shared/ConditionalRouter.tsx
import React from 'react';
import { HashRouter } from 'react-router-dom';

interface ConditionalRouterProps {
    children: React.ReactNode;
}

const ConditionalRouter: React.FC<ConditionalRouterProps> = ({ children }) => {
    // Always use HashRouter for Electron apps
    return <HashRouter>{children}</HashRouter>;
};

export default ConditionalRouter;