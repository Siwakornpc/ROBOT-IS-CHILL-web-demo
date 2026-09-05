"use client";

import { useState, useEffect } from "react";
import ColorPicker from "@/components/ColorPicker";
import MenuSelect from "@/components/MenuSelect";
import Slider from "@/components/slider";

import { DEFAULT_THEME } from "@/components/themescript";
import type { ThemeState } from "@/components/themescript";

import { DEFAULT_FONT_STATE, FONT_SANS_OPTIONS, FONT_CODE_OPTIONS } from "@/components/fontscript";
import type { FontState } from "@/components/fontscript";

export default function Body() {
    const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
    const [loaded, setLoaded] = useState(false);
    const [font, setFontState] = useState<FontState>(DEFAULT_FONT_STATE);

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

            const savedFontRaw = localStorage.getItem("font");
            if (savedFontRaw) {
                const parsed = JSON.parse(savedFontRaw);
                setFontState({
                    sans: parsed?.sans ?? DEFAULT_FONT_STATE.sans,
                    code: parsed?.code ?? DEFAULT_FONT_STATE.code,
                    sansSize: parsed?.sansSize ?? DEFAULT_FONT_STATE.sansSize,
                    codeSize: parsed?.codeSize ?? DEFAULT_FONT_STATE.codeSize,
                });
            }
        } catch (e) {
            console.error("Failed to parse settings from localStorage", e);
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
    const handleDefault = () => updateTheme(DEFAULT_THEME);

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

        const handleChange = () => triggerThemeUpdate('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, loaded]);

    const updateFont = (updates: Partial<FontState>) => {
        setFontState((prev) => {
            const updated = { ...prev, ...updates };
            localStorage.setItem("font", JSON.stringify(updated));
            return updated;
        });
    };
    
    useEffect(() => {
        if (!loaded) return;
        const applyFont = (window as any).setFont;
        if (typeof applyFont !== "function") return;
        applyFont(font.sans, font.code, font.sansSize, font.codeSize);
    }, [font, loaded]);

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
                        <p className="text-label text-main-name">Font Size</p>
                        <Slider
                            value={font.sansSize}
                            min={12}
                            max={28}
                            step={1}
                            onChange={(value) => updateFont({ sansSize: value })}
                        />
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font Size</p>
                        <Slider
                            value={font.codeSize}
                            min={10}
                            max={28}
                            step={1}
                            onChange={(value) => updateFont({ codeSize: value })}
                        />
                    </span>
                </div>

                <div className="box-hole">
                    <span className="row-group">
                        <p className="text-label text-main-name">Sans Serif Font</p>
                        <MenuSelect
                            id="font-sans"
                            value={font.sans}
                            options={FONT_SANS_OPTIONS}
                            onChange={(newValue) => updateFont({ sans: newValue })}
                        />
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font</p>
                        <MenuSelect
                            id="font-code"
                            value={font.code}
                            options={FONT_CODE_OPTIONS}
                            onChange={(newValue) => updateFont({ code: newValue })}
                        />
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
                            orientation="horizontal"
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
                    >Reset Default
                    </button>
                </div>
            </div>
        </main>
    );
}