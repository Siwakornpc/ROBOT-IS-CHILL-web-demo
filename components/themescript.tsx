'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as MCU from '@material/material-color-utilities';

export interface ThemeState {
    color: string;
    scheme: 'light' | 'dark' | 'system';
    contrast: 'normal' | 'mc' | 'hc' | 'system';
}

export const DEFAULT_THEME: ThemeState = {
    color: '#3024db',
    scheme: 'system',
    contrast: 'system',
};

export type SyntaxHighlightKey =
    | 'syntaxName'
    | 'syntaxValue'
    | 'syntaxEscaped'
    | 'syntaxVariable'
    | 'syntaxBracketLayer0'
    | 'syntaxBracketLayer1'
    | 'syntaxBracketLayer2'
    | 'renderFlagName'
    | 'renderFlagValue'
    | 'renderVariantName'
    | 'renderVariantValue'
    | 'typeArgumentname'
    | 'typeIdentifier'
    | 'typeFunction'
    | 'typeString'
    | 'typeNumber';

export type SyntaxHighlightState = Record<SyntaxHighlightKey, string>;

export const DEFAULT_SYNTAX_HIGHLIGHT: SyntaxHighlightState = {
    syntaxName: '#72a5e7',
    syntaxValue: '#ffcb22',
    syntaxEscaped: '#ff8147',
    syntaxVariable: '#1ccad7',
    syntaxBracketLayer0: '#f1c43e',
    syntaxBracketLayer1: '#c85acc',
    syntaxBracketLayer2: '#5f94f5',
    renderFlagName: '#ecea8b',
    renderFlagValue: '#79f86d',
    renderVariantName: '#be6ed4',
    renderVariantValue: '#ee5552',
    typeArgumentname: '#3a7bf5',
    typeIdentifier: '#0fa7a4',
    typeFunction: '#fcff36',
    typeString: '#ffb325',
    typeNumber: '#5aff44',
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

        const triggerThemeUpdate = () => applyTheme(theme.color, theme.scheme, theme.contrast);

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

const customThemeColors = {
    success: '#84cc7b',
    syntaxName: DEFAULT_SYNTAX_HIGHLIGHT.syntaxName,
    syntaxValue: DEFAULT_SYNTAX_HIGHLIGHT.syntaxValue,
    syntaxEscaped: DEFAULT_SYNTAX_HIGHLIGHT.syntaxEscaped,
    syntaxVariable: DEFAULT_SYNTAX_HIGHLIGHT.syntaxVariable,
    syntaxBracketLayer0: { color: DEFAULT_SYNTAX_HIGHLIGHT.syntaxBracketLayer0, blend: false },
    syntaxBracketLayer1: { color: DEFAULT_SYNTAX_HIGHLIGHT.syntaxBracketLayer1, blend: false },
    syntaxBracketLayer2: { color: DEFAULT_SYNTAX_HIGHLIGHT.syntaxBracketLayer2, blend: false },

    renderFlagName: DEFAULT_SYNTAX_HIGHLIGHT.renderFlagName,
    renderFlagValue: DEFAULT_SYNTAX_HIGHLIGHT.renderFlagValue,
    renderVariantName: DEFAULT_SYNTAX_HIGHLIGHT.renderVariantName,
    renderVariantValue: DEFAULT_SYNTAX_HIGHLIGHT.renderVariantValue,

    typeArgumentname: DEFAULT_SYNTAX_HIGHLIGHT.typeArgumentname,
    typeIdentifier: DEFAULT_SYNTAX_HIGHLIGHT.typeIdentifier,
    typeFunction: DEFAULT_SYNTAX_HIGHLIGHT.typeFunction,
    typeString: DEFAULT_SYNTAX_HIGHLIGHT.typeString,
    typeNumber: DEFAULT_SYNTAX_HIGHLIGHT.typeNumber,
};

function isValidHex(hex: string): boolean {
    return /^#?([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(hex);
}

export function applySyntaxHighlightColors(colors: Partial<SyntaxHighlightState>) {
    if (typeof window === 'undefined') return;

    const apply = (window as any).setSyntaxHighlightColors;
    if (typeof apply === 'function') apply(colors);
}

export default function ThemeScript() {
    useEffect(() => {
        const toKebab = (str: string) =>
            str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

        const rgbStr = (argb: number) =>
            `${MCU.redFromArgb(argb)}, ${MCU.greenFromArgb(argb)}, ${MCU.blueFromArgb(argb)}`;

        function setTheme(sourceColor: string, scheme = 'light', contrast = 'normal') {
            document.documentElement.setAttribute('data-theme-variant', scheme);
            
            // Fall back to default color if sourceColor is empty or invalid hex
            const validColor = isValidHex(sourceColor) ? sourceColor : DEFAULT_THEME.color;
            
            let sourceArgb: number;
            try {
                sourceArgb = MCU.argbFromHex(validColor.startsWith('#') ? validColor : `#${validColor}`);
            } catch {
                sourceArgb = MCU.argbFromHex(DEFAULT_THEME.color);
            }

            const hct = MCU.Hct.fromInt(sourceArgb);
            const target = document.documentElement;

            let isDark = false;
            if (scheme === 'system') {
                isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
            } else {
                isDark = scheme === 'dark';
            }
            let contrastLevel = 0.0;
            let resolvedContrast = contrast;
            if (scheme === 'system' && contrast === 'normal') {
                const wantsMoreContrast = typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: more)').matches;
                if (wantsMoreContrast) resolvedContrast = 'hc';
            }
            if (contrast === 'mc') contrastLevel = 0.5;
            if (contrast === 'hc') contrastLevel = 1.0;

            const dynamicScheme = new MCU.DynamicScheme({
                sourceColorHct: hct,
                variant: MCU.Variant.VIBRANT,
                isDark: isDark,
                contrastLevel: contrastLevel,

                primaryPalette: MCU.TonalPalette.fromHueAndChroma(
                    hct.hue,
                    hct.chroma * 0.8
                ),
                secondaryPalette: MCU.TonalPalette.fromHueAndChroma(
                    hct.hue,
                    hct.chroma * 0.4
                ),
                tertiaryPalette: MCU.TonalPalette.fromHueAndChroma(
                    hct.hue + 60.0,
                    hct.chroma * 0.6
                ),

                neutralPalette: MCU.TonalPalette.fromHueAndChroma(
                    hct.hue,
                    Math.min(hct.chroma / 10, 8)
                ),
                neutralVariantPalette: MCU.TonalPalette.fromHueAndChroma(
                    hct.hue,
                    Math.min(hct.chroma / 5, 16)
                ),
            });

            const tokens = [
                'primary',
                'on-primary',
                'primary-container',
                'on-primary-container',
                'secondary',
                'on-secondary',
                'secondary-container',
                'on-secondary-container',
                'tertiary',
                'on-tertiary',
                'tertiary-container',
                'on-tertiary-container',
                'error',
                'on-error',
                'error-container',
                'on-error-container',
                'background',
                'on-background',
                'surface',
                'on-surface',
                'surface-variant',
                'on-surface-variant',
                'outline',
                'outline-variant',
                'shadow',
                'scrim',
                'inverse-surface',
                'inverse-on-surface',
                'inverse-primary',
                'surface-dim',
                'surface-bright',
                'surface-container-lowest',
                'surface-container-low',
                'surface-container',
                'surface-container-high',
                'surface-container-highest',
            ];

            tokens.forEach((token) => {
                const camelToken = token.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                const dynamicColors = MCU.MaterialDynamicColors as Record<string, any>;
                if (dynamicColors[camelToken]) {
                    const argb = dynamicColors[camelToken].getArgb(dynamicScheme);
                    target.style.setProperty(
                        `--md-color-${token}`,
                        rgbStr(argb)
                    );
                }
            });
            
            // custom color harmonization
            // Custom color processing with per-color blending option
            let savedSyntax: Partial<SyntaxHighlightState> = {};
            try {
                savedSyntax = JSON.parse(localStorage.getItem('syntaxHighlight') || '{}');
            } catch {
                savedSyntax = {};
            }

            Object.entries(customThemeColors).forEach(([name, config]) => {
                // Normalize string vs object config
                const savedColor = savedSyntax[name as SyntaxHighlightKey];
                const configuredColor = typeof config === 'string' ? config : config.color;
                const hex = savedColor && isValidHex(savedColor) ? savedColor : configuredColor;
                const blend = typeof config === 'string' ? true : config.blend;

                const designArgb = MCU.argbFromHex(hex);
                
                // Only harmonize if shouldBlend is true
                const targetArgb = blend 
                    ? MCU.Blend.harmonize(designArgb, sourceArgb) 
                    : designArgb;

                const customGroup = MCU.customColor(sourceArgb, {
                    value: targetArgb,
                    name: name,
                    blend,
                });

                const themeGroup = isDark ? customGroup.dark : customGroup.light;

                const kebabName = toKebab(name);
                target.style.setProperty(`--md-color-${kebabName}`, rgbStr(themeGroup.color));
                target.style.setProperty(`--md-color-on-${kebabName}`, rgbStr(themeGroup.onColor));
                target.style.setProperty(`--md-color-${kebabName}-container`, rgbStr(themeGroup.colorContainer));
                target.style.setProperty(`--md-color-on-${kebabName}-container`, rgbStr(themeGroup.onColorContainer));
            });

        }

        let savedTheme: Partial<ThemeState> = {};
        try {
            savedTheme = JSON.parse(localStorage.getItem("theme") || "{}");
        } catch {
            savedTheme = {};
        }

        const initialColor = savedTheme.color && isValidHex(savedTheme.color) 
            ? savedTheme.color 
            : DEFAULT_THEME.color;

        (window as any).setTheme = setTheme;
        (window as any).setSyntaxHighlightColors = (colors: Partial<SyntaxHighlightState>) => {
            localStorage.setItem('syntaxHighlight', JSON.stringify(colors));

            let currentTheme: Partial<ThemeState> = {};
            try {
                currentTheme = JSON.parse(localStorage.getItem('theme') || '{}');
            } catch {
                currentTheme = {};
            }

            setTheme(
                currentTheme.color || DEFAULT_THEME.color,
                currentTheme.scheme || DEFAULT_THEME.scheme,
                currentTheme.contrast || DEFAULT_THEME.contrast
            );
        };
        setTheme(
            initialColor,
            savedTheme.scheme || DEFAULT_THEME.scheme,
            savedTheme.contrast || DEFAULT_THEME.contrast
        );
    }, []);

    return null;
}