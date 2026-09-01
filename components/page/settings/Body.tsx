"use client";

import { useState, useEffect } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import ColorPicker from "@/components/ColorPicker";
import MenuSelect from "@/components/MenuSelect";

interface ThemeState {
    color: string;
    variant: 'light'
    | 'light-mc'
    | 'light-hc'
    | 'dark'
    | 'dark-mc'
    | 'dark-hc';
}

const DEFAULT_THEME: ThemeState = {
    color: '#6750A4',
    variant: 'light',
};

export default function Body() {
    const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);

    useEffect(() => {
        try {
            const savedThemeRaw = localStorage.getItem("theme");
            if (savedThemeRaw) {
                const parsed = JSON.parse(savedThemeRaw);
                setTheme({
                    color: parsed?.color ?? DEFAULT_THEME.color,
                    variant: parsed?.variant ?? DEFAULT_THEME.variant,
                });
            }
        } catch (e) {
            console.error("Failed to parse theme from localStorage", e);
        }
    }, []);

    const updateTheme = (updates: Partial<ThemeState>) => {
        setTheme((prev) => {
            const updated = { ...prev, ...updates };
            localStorage.setItem("theme", JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <main style={{ width: "stretch" }}>
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
                        <button type="button" className="drop-down">
                            PLACEHOLDER
                        </button>
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font</p>
                        <button type="button" className="drop-down">
                            PLACEHOLDER
                        </button>
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font Size</p>
                        <button type="button" className="drop-down">
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
                    <label className="text-field">
                        <span className="text-field-label">Color</span>
                        <input
                            type="text"
                            placeholder=" "
                            value={theme.color}
                            required={true}
                            onChange={(e) => updateTheme({ color: e.target.value })}
                            autoComplete="off"
                        />
                    </label>
                    <MenuSelect
                        id="theme-contrast"
                        className="dropdown-trigger"
                        value={theme.variant}
                        options={[
                            { value: "light", label: "Light" },
                            { value: "light-mc", label: "Light Medium Contrast" },
                            { value: "light-hc", label: "Light High Contrast" },
                            { value: "dark", label: "Dark" },
                            { value: "dark-mc", label: "Dark Medium Contrast" },
                            { value: "dark-hc", label: "Dark High Contrast" },
                        ]}
                        onChange={(newValue) => updateTheme({ variant: newValue })}
                    />
                </div>
            </div>
        </main>
    );
}