"use client";

import { useState, useEffect } from "react";
import ColorPicker from "@/components/ColorPicker";
import MenuSelect from "@/components/MenuSelect";
import Slider from "@/components/slider";

import {
    applySyntaxHighlightColors,
    DEFAULT_SYNTAX_HIGHLIGHT,
    DEFAULT_SYNTAX_BLEND,
    DEFAULT_SYNTAX_REAL,
    DEFAULT_THEME,
} from "@/components/themescript";
import type {
    SyntaxHighlightKey,
    SyntaxHighlightState,
    SyntaxBlendState,
    SyntaxRealState,
    ThemeState,
} from "@/components/themescript";

import { DEFAULT_FONT_STATE, FONT_SANS_OPTIONS, FONT_CODE_OPTIONS } from "@/components/fontscript";
import type { FontState } from "@/components/fontscript";

import { THEME_PRESETS, resolvePreset } from "@/components/themepresets";
import type { ThemePreset, PresetColor } from "@/components/themepresets";

type SelectionCollapsable = {
    isOpen: boolean,
    id: string,
}

const SYNTAX_HIGHLIGHT_OPTIONS: { key: SyntaxHighlightKey; label: string }[] = [
    { key: "syntaxName", label: "Macro Name" },
    { key: "syntaxValue", label: "Macro Value" },
    { key: "syntaxEscaped", label: "Escaped Value" },
    { key: "syntaxVariable", label: "Macro Variable" },
    { key: "syntaxBracketLayer0", label: "Bracket Layer 1" },
    { key: "syntaxBracketLayer1", label: "Bracket Layer 2" },
    { key: "syntaxBracketLayer2", label: "Bracket Layer 3" },
    { key: "renderFlagName", label: "Render Flag Name" },
    { key: "renderFlagValue", label: "Render Flag Value" },
    { key: "renderVariantName", label: "Render Variant Name" },
    { key: "renderVariantValue", label: "Render Variant Value" },
];

export default function Body() {
    const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
    const [loaded, setLoaded] = useState(false);
    const [font, setFontState] = useState<FontState>(DEFAULT_FONT_STATE);
    const [syntaxHighlight, setSyntaxHighlight] = useState<SyntaxHighlightState>(DEFAULT_SYNTAX_HIGHLIGHT);
    const [syntaxBlend, setSyntaxBlend] = useState<SyntaxBlendState>(DEFAULT_SYNTAX_BLEND);
    const [syntaxReal, setSyntaxReal] = useState<SyntaxRealState>(DEFAULT_SYNTAX_REAL);

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

            const savedSyntaxRaw = localStorage.getItem("syntaxHighlight");
            if (savedSyntaxRaw) {
                setSyntaxHighlight({
                    ...DEFAULT_SYNTAX_HIGHLIGHT,
                    ...JSON.parse(savedSyntaxRaw),
                });
            }

            const savedBlendRaw = localStorage.getItem("syntaxBlend");
            if (savedBlendRaw) {
                setSyntaxBlend({
                    ...DEFAULT_SYNTAX_BLEND,
                    ...JSON.parse(savedBlendRaw),
                });
            }

            const savedRealRaw = localStorage.getItem("syntaxReal");
            if (savedRealRaw) {
                setSyntaxReal({
                    ...DEFAULT_SYNTAX_REAL,
                    ...JSON.parse(savedRealRaw),
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
    const handleDefaultTheme = () => updateTheme(DEFAULT_THEME);

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

    const handleDefaultFont = () => updateFont(DEFAULT_FONT_STATE);

    const updateSyntaxHighlight = (key: SyntaxHighlightKey, color: string) => {
        setSyntaxHighlight((prev) => {
            const updated = { ...prev, [key]: color };
            localStorage.setItem("syntaxHighlight", JSON.stringify(updated));
            return updated;
        });
    };

    const updateSyntaxBlend = (key: SyntaxHighlightKey, value: boolean) => {
        setSyntaxBlend((prev) => {
            const updated = { ...prev, [key]: value };
            localStorage.setItem("syntaxBlend", JSON.stringify(updated));
            return updated;
        });
    };

    const updateSyntaxReal = (key: SyntaxHighlightKey, value: boolean) => {
        setSyntaxReal((prev) => {
            const updated = { ...prev, [key]: value };
            localStorage.setItem("syntaxReal", JSON.stringify(updated));
            return updated;
        });
    };

    const handleDefaultSyntaxHighlight = () => {
        localStorage.setItem("syntaxHighlight", JSON.stringify(DEFAULT_SYNTAX_HIGHLIGHT));
        localStorage.setItem("syntaxBlend", JSON.stringify(DEFAULT_SYNTAX_BLEND));
        localStorage.setItem("syntaxReal", JSON.stringify(DEFAULT_SYNTAX_REAL));
        setSyntaxHighlight(DEFAULT_SYNTAX_HIGHLIGHT);
        setSyntaxBlend(DEFAULT_SYNTAX_BLEND);
        setSyntaxReal(DEFAULT_SYNTAX_REAL);
    };

    useEffect(() => {
        if (!loaded) return;
        applySyntaxHighlightColors(syntaxHighlight, syntaxBlend, syntaxReal);
    }, [syntaxHighlight, syntaxBlend, syntaxReal, loaded]);
    
    useEffect(() => {
        if (!loaded) return;
        const applyFont = (window as any).setFont;
        if (typeof applyFont !== "function") return;
        applyFont(font.sans, font.code, font.sansSize, font.codeSize);
    }, [font, loaded]);

    const [isCollapsableOpen, setIsCollapsableOpen] = useState<SelectionCollapsable>();

    const handleOnClickCollapsable = (id: string) => {
        setIsCollapsableOpen({
            isOpen: !isCollapsableOpen?.isOpen,
            id,
        });
    }

    const isSyntaxHighlightDefault = (key: SyntaxHighlightKey) =>
        syntaxHighlight[key].toLowerCase() === DEFAULT_SYNTAX_HIGHLIGHT[key].toLowerCase() &&
        syntaxBlend[key] === DEFAULT_SYNTAX_BLEND[key] &&
        syntaxReal[key] === DEFAULT_SYNTAX_REAL[key];

    const handleDefaultSyntaxHighlightKey = (key: SyntaxHighlightKey) => {
        updateSyntaxHighlight(key, DEFAULT_SYNTAX_HIGHLIGHT[key]);
        updateSyntaxBlend(key, DEFAULT_SYNTAX_BLEND[key]);
        updateSyntaxReal(key, DEFAULT_SYNTAX_REAL[key]);
    };

    const handleApplyPreset = (presetId: string) => {
        const preset = THEME_PRESETS.find((p) => p.id === presetId);
        if (!preset) return; // "custom" does nothing

        const { highlight, blend, real } = resolvePreset(preset);

        if (preset.theme) updateTheme(preset.theme);

        localStorage.setItem("syntaxHighlight", JSON.stringify(highlight));
        localStorage.setItem("syntaxBlend", JSON.stringify(blend));
        localStorage.setItem("syntaxReal", JSON.stringify(real));
        setSyntaxHighlight(highlight);
        setSyntaxBlend(blend);
        setSyntaxReal(real);
    };

    const matchesPreset = (p: ThemePreset) => {
        const { highlight, blend, real } = resolvePreset(p);

        const themeMatches = Object.entries(p.theme ?? {}).every(
            ([k, v]) => String(theme[k as keyof ThemeState]).toLowerCase() === String(v).toLowerCase()
        );

        return (
            themeMatches &&
            (Object.keys(highlight) as SyntaxHighlightKey[]).every(
                (k) =>
                    syntaxHighlight[k].toLowerCase() === highlight[k].toLowerCase() &&
                    syntaxReal[k] === real[k] &&
                    (real[k] || syntaxBlend[k] === blend[k])
            )
        );
    };

    const currentPresetId = THEME_PRESETS.find(matchesPreset)?.id ?? "custom";

    const handlePrintPreset = () => {
        const colors: Partial<Record<SyntaxHighlightKey, PresetColor>> = {};

        for (const { key } of SYNTAX_HIGHLIGHT_OPTIONS) {
            const entry: PresetColor = {};

            if (syntaxHighlight[key].toLowerCase() !== DEFAULT_SYNTAX_HIGHLIGHT[key].toLowerCase())
                entry.color = syntaxHighlight[key];
            if (syntaxReal[key] !== DEFAULT_SYNTAX_REAL[key])
                entry.real = syntaxReal[key];
            // blend is irrelevant while Real is on, so skip it
            if (!syntaxReal[key] && syntaxBlend[key] !== DEFAULT_SYNTAX_BLEND[key])
                entry.blend = syntaxBlend[key];

            if (Object.keys(entry).length > 0) colors[key] = entry;
        }

        console.log(
            JSON.stringify({ id: "my-preset", label: "My Preset", theme: { color: theme.color }, colors }, null, 4)
        );
    };

    return (
        <main
            className="ascroll-y"
            style={{ width: "stretch" }}
        >
            <div className="main-body">
                <h2 className="text-label font-bold">Settings</h2>
                <hr />

                {
                    // Fonts Section
                }

                <h3 className="text-label font-bold">Fonts</h3>
                <hr style={{ borderColor: "rgb(var(--md-color-surface-container))" }} />

                <h4 className="text-label font-bold">Size</h4>

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

                <h4 className="text-label font-bold">Fontface</h4>

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

                {
                    // Reset Defalt for Fonts
                }
                <button
                    type="button"
                    className="btn small btn-filled !w-48 !justify-center mb-[8px]"
                    onClick={handleDefaultFont}
                >Reset Default
                </button>

                <hr />

                {
                    // Theme Section
                }

                <h3 className="text-label font-bold">Theme</h3>

                <hr style={{ borderColor: "rgb(var(--md-color-surface-container))" }} />

                <h4 className="text-label font-bold">Appearance</h4>

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
                </div>

                {
                    // Reset Defalt for Theme
                }
                <button
                    type="button"
                    className="btn small btn-filled !w-48 !justify-center mb-[8px]"
                    onClick={handleDefaultTheme}
                >Reset Default
                </button>

                <h4 className="text-label font-bold">Syntax Highlights</h4>

                <div className="box-hole">
                    <div
                        className="selection-collapsable"
                        onClick={() => handleOnClickCollapsable("1")}
                    >
                        Code Editor
                    </div>
                    {isCollapsableOpen && isCollapsableOpen.isOpen && isCollapsableOpen.id === "1" && 
                        (<div
                            className={`this selection-collapsable-content flex flex-col gap-[8px]` /* woah, tailwind hidden */}
                        >
                            {SYNTAX_HIGHLIGHT_OPTIONS.map(({ key, label }) => (
                                <span className="row-group items-center" key={key}>
                                    <p className="text-label text-main-name" style={{ height: "stretch" }}>{label}</p>
                                    <div className="flex gap-[8px] items-center">
                                        <MenuSelect
                                            id={`syntax-${key}`}
                                            value="color"
                                            options={[{ value: "color", label }]}
                                            trigger={({ getInputProps }) => (
                                                <>
                                                    <button
                                                        {...getInputProps({
                                                            type: "button",
                                                            className: "selection-color-label",
                                                            "aria-label": `Choose ${label} color`,
                                                        })}
                                                        style={{ "--this-label-color": syntaxHighlight[key] } as React.CSSProperties}
                                                    />
                                                    <span className="ml-[4px] mr-[4px] text-label">Visibly:</span>
                                                    <button
                                                        {...getInputProps({
                                                            type: "button",
                                                            className: "selection-color-label",
                                                            "aria-label": `Choose ${label} color`,
                                                        })}
                                                        style={{ "--this-label-color": `rgb(var(--md-color-${
                                                            key.replace(/([A-Z])/g, "-$1").toLowerCase()
                                                        }))` }}
                                                    />
                                                </>
                                            )}
                                            content={
                                                <div className="ml-[12px] mr-[12px] mt-[8px] mb-[8px]">
                                                    <ColorPicker
                                                        value={syntaxHighlight[key]}
                                                        onChange={(color) => {
                                                            if (color !== null) updateSyntaxHighlight(key, color);
                                                        }}
                                                        hasNone={false}
                                                    />
                                                </div>
                                            }
                                            onChange={() => undefined}
                                        />

                                        <label className="ml-[4px] mr-[4px] checkbox">
                                            <input
                                                type="checkbox"
                                                checked={syntaxReal[key]}
                                                onChange={(e) => updateSyntaxReal(key, e.target.checked)}
                                            />
                                            <span>Real</span>
                                        </label>

                                        <label
                                            className="ml-[4px] mr-[4px] checkbox"
                                            style={{ opacity: syntaxReal[key] ? 0.4 : 1 }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={syntaxBlend[key]}
                                                disabled={syntaxReal[key]}
                                                onChange={(e) => updateSyntaxBlend(key, e.target.checked)}
                                            />
                                            <span>MD3 Blend</span>
                                        </label>

                                        <button
                                            type="button"
                                            className={`box-content w-[20px] h-[20px] !p-[2px] btn ibtn small btn-text ${isSyntaxHighlightDefault(key) ? "disabled" : ""}`}
                                            aria-label={`Reset ${label} color`}
                                            title={`Reset ${label}`}
                                            disabled={isSyntaxHighlightDefault(key)}
                                            style={{ opacity: isSyntaxHighlightDefault(key) ? 0.4 : 1 }}
                                            onClick={() => handleDefaultSyntaxHighlightKey(key)}
                                        >
                                            <span className="icon">refresh</span>
                                        </button>
                                    </div>
                                </span>
                            ))}
                        </div>)
                    }
                </div>

                <button
                    type="button"
                    className="btn small btn-filled !w-48 !justify-center mb-[8px]"
                    onClick={handleDefaultSyntaxHighlight}
                >Reset Default
                </button>

                <h4 className="text-label font-bold">Set Themes</h4>

                <div className="box-hole">
                    <span className="row-group">
                        <p className="text-label text-main-name">Presets</p>
                        <MenuSelect
                            id="theme-preset"
                            value={currentPresetId}
                            options={[
                                ...THEME_PRESETS.map((p) => ({ value: p.id, label: p.label })),
                                { value: "custom", label: "Custom" },
                            ]}
                            onChange={handleApplyPreset}
                        />
                    </span>
                </div>

                <button
                    type="button"
                    className="btn small btn-filled !w-48 !justify-center mb-[8px]"
                    onClick={() => handleApplyPreset("default")}
                >Reset Default
                </button>

                <hr />

                {
                    // Reset All To Default
                }
                <h3 className="text-label font-bold">Default</h3>

                <hr style={{ borderColor: "rgb(var(--md-color-surface-container))" }} />

                <button
                    type="button"
                    className="btn small btn-filled !w-48 !justify-center"
                    onClick={() => {
                        handleDefaultFont();
                        handleDefaultTheme();
                        handleDefaultSyntaxHighlight();
                    }}
                >Reset All To Default
                </button>
                <button
                    type="button"
                    className="btn small btn-filled !w-48 !justify-center"
                    onClick={handlePrintPreset}
                >Print Log
                </button>
            </div>
        </main>
    );
}