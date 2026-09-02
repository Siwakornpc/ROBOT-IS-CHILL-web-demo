"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeState {
    color: string;
    scheme: 'light' | 'dark' | 'system';
    contrast: 'normal' | 'mc' | 'hc' | 'system';
}

const DEFAULT_THEME: ThemeState = {
    color: '#3024db',
    scheme: 'system',
    contrast: 'normal',
};

const ThemeContext = createContext<{
    theme: ThemeState;
    updateTheme: (updates: Partial<ThemeState>) => void;
    resetDefault: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedThemeRaw = localStorage.getItem("theme");
            if (savedThemeRaw) {
                const parsed = JSON.parse(savedThemeRaw);
                setTheme({
                    color: parsed?.color ?? DEFAULT_THEME.color,
                    scheme: parsed?.scheme ?? DEFAULT_THEME.scheme,
                    contrast: parsed?.contrast ?? DEFAULT_THEME.contrast,
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoaded(true);
        }
    }, []);

    const updateTheme = (updates: Partial<ThemeState>) => {
        setTheme((prev) => {
            const updated = { ...prev, ...updates };
            localStorage.setItem("theme", JSON.stringify(updated));
            return updated;
        });
    };

    const resetDefault = () => updateTheme(DEFAULT_THEME);

    useEffect(() => {
        if (!loaded) return;
        const applyTheme = (window as any).setTheme;
        if (typeof applyTheme !== "function") return;

        const triggerThemeUpdate = () => {
            applyTheme(theme.color, theme.scheme, theme.contrast);
        };

        triggerThemeUpdate();

        if (theme.scheme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', triggerThemeUpdate);
            return () => mediaQuery.removeEventListener('change', triggerThemeUpdate);
        }
    }, [theme, loaded]);

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, resetDefault }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
