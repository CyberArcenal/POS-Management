// src/contexts/SystemInfoContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { systemCache } from '../utils/cacheUtils';
import systemConfigAPI from '../api/system_config';


// System Info Context Types
export interface SystemInfo {
    site_name: string;
    logo: string;
    currency: string;
    admin_email: string;
    tax_enabled: boolean;
    tax_rate: number;
    shipping_threshold_enabled: boolean;
    system_version: string;
}

export interface PublicSettings {
    general: {
        [key: string]: {
            value: string | number | boolean;
            description: string;
        };
    };
    system: {
        site_name: string;
        currency: string;
        cache_timestamp: string;
    };
}

interface SystemInfoContextType {
    systemInfo: SystemInfo | null;
    publicSettings: PublicSettings | null;
    loading: boolean;
    error: string | null;
    refreshSystemInfo: () => Promise<void>;
    clearCache: () => void;
    isCacheValid: boolean;
}

const SystemInfoContext = createContext<SystemInfoContextType | undefined>(undefined);

// Default system info fallback
const DEFAULT_SYSTEM_INFO: SystemInfo = {
    site_name: 'Inventory Management System',
    logo: '/logo.png',
    currency: 'PHP',
    admin_email: 'admin@example.com',
    tax_enabled: false,
    tax_rate: 0,
    shipping_threshold_enabled: false,
    system_version: '1.0.0'
};

interface SystemInfoProviderProps {
    children: React.ReactNode;
}

export const SystemInfoProvider: React.FC<SystemInfoProviderProps> = ({ children }) => {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [publicSettings, setPublicSettings] = useState<PublicSettings | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Check if cache is valid
    const isCacheValid = systemCache.isCacheValid();

    // Load system info from cache or API
    const loadSystemInfo = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        try {
            // Check cache first unless force refresh
            if (!forceRefresh && systemCache.isCacheValid()) {
                const cachedInfo = systemCache.getSystemInfo();
                if (cachedInfo) {
                    setSystemInfo(cachedInfo.system_info);
                    setPublicSettings(cachedInfo.public_settings);
                    setLoading(false);
                    return;
                }
            }

            // Fetch fresh data from API
            const freshData = await systemConfigAPI.getSystemInfoForFrontend();
            // console.log('Fetched fresh system info:', freshData);
            systemCache.saveSystemInfo(freshData);

            setSystemInfo(freshData.system_info);
            setPublicSettings(freshData.public_settings);
        } catch (err: any) {
            console.error('Failed to load system info:', err);
            setError(err.message || 'Failed to load system information');

            // Fallback to cached data even if expired
            const cachedInfo = systemCache.getSystemInfo();
            if (cachedInfo) {
                // console.log('Using cached system info as fallback');
                setSystemInfo(cachedInfo.system_info);
                setPublicSettings(cachedInfo.public_settings);
            } else {
                // Fallback to defaults
                setSystemInfo(DEFAULT_SYSTEM_INFO);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load public settings (no authentication required)
    const loadPublicSettings = useCallback(async (forceRefresh = false) => {
        try {
            if (!forceRefresh && systemCache.isCacheValid()) {
                const cachedSettings = systemCache.getPublicSettings();
                if (cachedSettings) {
                    setPublicSettings(cachedSettings);
                    return;
                }
            }

            const publicData = await systemConfigAPI.getPublicSystemSettings();
            systemCache.saveSystemInfo({ public_settings: publicData });
            setPublicSettings(publicData);
        } catch (err: any) {
            console.error('Failed to load public settings:', err);
            // Even if API fails, we can set some basic public settings
            setPublicSettings({
                system: {
                    site_name: DEFAULT_SYSTEM_INFO.site_name,
                    currency: DEFAULT_SYSTEM_INFO.currency,
                    cache_timestamp: new Date().toISOString()
                },
                general: {},
            });
        }
    }, []);

    // Refresh system info manually
    const refreshSystemInfo = useCallback(async () => {
        await loadSystemInfo(true);
    }, [loadSystemInfo]);

    // Clear cache
    const clearCache = useCallback(() => {
        systemCache.clearCache();
        setSystemInfo(null);
        setPublicSettings(null);
        // Reload data after clearing cache
        loadSystemInfo(true);
    }, [loadSystemInfo]);

    // Effect to load system info on mount and when authentication changes
    useEffect(() => {
        loadSystemInfo();
    }, [loadSystemInfo]);

    // Auto-refresh cache every hour
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                loadSystemInfo(true);
            }
        }, 60 * 60 * 1000); // 1 hour

        return () => clearInterval(interval);
    }, [loading, loadSystemInfo]);

    const value: SystemInfoContextType = {
        systemInfo: systemInfo || DEFAULT_SYSTEM_INFO,
        publicSettings,
        loading,
        error,
        refreshSystemInfo,
        clearCache,
        isCacheValid
    };

    return (
        <SystemInfoContext.Provider value={value}>
            {children}
        </SystemInfoContext.Provider>
    );
};

// Custom hook to use system info
export const useSystemInfo = (): SystemInfoContextType => {
    const context = useContext(SystemInfoContext);
    if (context === undefined) {
        throw new Error('useSystemInfo must be used within a SystemInfoProvider');
    }
    return context;
};

// Hook for quick access to common system info
export const useSystemSettings = () => {
    const { systemInfo, publicSettings } = useSystemInfo();

    return {
        siteName: systemInfo?.site_name || DEFAULT_SYSTEM_INFO.site_name,
        logo: systemInfo?.logo || DEFAULT_SYSTEM_INFO.logo,
        currency: systemInfo?.currency || DEFAULT_SYSTEM_INFO.currency,
        adminEmail: systemInfo?.admin_email || DEFAULT_SYSTEM_INFO.admin_email,
        taxEnabled: systemInfo?.tax_enabled || DEFAULT_SYSTEM_INFO.tax_enabled,
        taxRate: systemInfo?.tax_rate || DEFAULT_SYSTEM_INFO.tax_rate,
        shippingThreshold: systemInfo?.shipping_threshold_enabled || DEFAULT_SYSTEM_INFO.shipping_threshold_enabled,
        publicSettings
    };
};