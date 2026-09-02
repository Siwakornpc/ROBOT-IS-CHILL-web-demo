"use client";

import { useState, useEffect } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import ColorPicker from "@/components/ColorPicker";
import MenuSelect from "@/components/MenuSelect";

interface ThemeState {
    color: string;
    scheme: 'light' | 'dark' | 'system';
    contrast: 'normal' | 'mc' | 'hc' | 'system';
}

const DEFAULT_THEME: ThemeState = {
    color: '#3024db',
    scheme: 'system',   // it's better to use System as default as most devices.
    contrast: 'normal',
};

export default function Body() {
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
            console.error("Failed to parse theme from localStorage", e);
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

    const handleDefault = () => {
        updateTheme(DEFAULT_THEME);
    };

    useEffect(() => {
        if (!loaded) return;

        const applyTheme = (window as any).setTheme;
        if (typeof applyTheme !== "function") return;

        const triggerThemeUpdate = (currentScheme: 'light' | 'dark' | 'system') => {
            applyTheme(
                theme.color,
                currentScheme,
                theme.contrast
            );
        };

        if (theme.scheme !== 'system') {
            triggerThemeUpdate(theme.scheme);
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        triggerThemeUpdate('system');

        const handleChange = () => {
            triggerThemeUpdate('system');
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [theme, loaded]);


    return (
        <main
            className="ascroll-y"
            style={{ width: "stretch" }}
        >
            <div className="main-body">
                <p className="text-label">Settings</p>
                <hr />

                {
                    // Fonts Section
                }

                <p className="text-label text-xl">Fonts</p>

                <div className="box-hole">
                    <span className="row-group">
                        <p className="text-label text-main-name">Sans Serif Font</p>
                        <button type="button" className="dropdown-trigger">
                            PLACEHOLDER
                        </button>
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font</p>
                        <button type="button" className="dropdown-trigger">
                            PLACEHOLDER
                        </button>
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font Size</p>
                        <button type="button" className="dropdown-trigger">
                            PLACEHOLDER
                        </button>
                    </span>
                </div>

                <hr />

                {
                    // Theme Section
                }

                <p className="text-label text-xl">Theme</p>

                <div className="box-hole">
                    
                    <div className="row-group">
                        <p className="text-label text-main-name">Theme Color</p>

                        <ColorPicker
                            value={theme.color}
                            onChange={(color) => {
                                if (color !== null) updateTheme({ color });
                            }}
                            hasNone={false}
                        />
                    </div>

                    <div className="row-group">
                        <p className="text-label text-main-name">Appearance</p>

                        <MenuSelect
                            id="theme-scheme"
                            value={theme.scheme}
                            options={[
                                { value: "system", label: "System" },
                                { value: "light", label: "Light" },
                                { value: "dark", label: "Dark" },
                            ]}
                            onChange={(newValue) => updateTheme({ scheme: newValue })}
                        />
                    </div>

                    <div className="row-group">
                        <p className="text-label text-main-name">Contrast</p>

                        <MenuSelect
                            id="theme-contrast"
                            value={theme.contrast}
                            options={[
                                { value: "system", label: "System" },
                                { value: "normal", label: "Normal" },
                                { value: "mc", label: "Medium Contrast" },
                                { value: "hc", label: "High Contrast" },
                            ]}
                            onChange={(newValue) => updateTheme({ contrast: newValue })}
                        />
                    </div>
                    <button
                        type="button"
                        className="btn small btn-filled !w-48 !justify-center"
                        onClick={handleDefault}
                    >
                        Reset Default
                    </button>
                </div>
            </div>
        </main>
    );
}