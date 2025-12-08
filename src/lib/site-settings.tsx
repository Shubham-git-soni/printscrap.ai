'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SiteSettings {
    supportEmail: string;
    supportPhone: string;
}

interface SiteSettingsContextType {
    settings: SiteSettings;
    updateSettings: (newSettings: Partial<SiteSettings>) => void;
}

const defaultSettings: SiteSettings = {
    supportEmail: 'wecare@indusanalytics.in',
    supportPhone: '+91 82695 98608',
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'printscrap_site_settings';

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setSettings({ ...defaultSettings, ...parsed });
                } catch {
                    console.error('Failed to parse site settings');
                }
            }
            setIsLoaded(true);
        }
    }, []);

    const updateSettings = (newSettings: Partial<SiteSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
    };

    // Don't render until loaded to prevent hydration mismatch
    if (!isLoaded) {
        return <>{children}</>;
    }

    return (
        <SiteSettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    const context = useContext(SiteSettingsContext);
    if (context === undefined) {
        // Return default settings if context is not available
        return {
            settings: defaultSettings,
            updateSettings: () => { },
        };
    }
    return context;
}
