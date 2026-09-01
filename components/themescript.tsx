'use client';

import { useEffect } from 'react';
import * as MCU from '@material/material-color-utilities';

const customThemeColors = {
    success: '#84cc7b',
    syntaxName: '#72a5e7',
    syntaxValue: '#e7be72',
    syntaxEscaped: '#fc9929',
    syntaxBracketLayer0: { color: '#f1f363', blend: false }, 
    syntaxBracketLayer1: { color: '#c85acc', blend: false }, 
    syntaxBracketLayer2: { color: '#5f94f5', blend: false },

    renderFlagName: '#8bd1ec',
    renderFlagValue: '#84cc7b',
    renderVariantName: '#c06ed4',
    renderVariantValue: '#5f94f5',

    typeArgumentname: '#5f94f5',
    typeIdentifier: '#0fa779',
    typeFunction: '#f1f363',
    typeString: '#e7be72',
    typeNumber: '#a6ee9d',
};

export interface ThemeState {
    color: string;
    scheme: 'light' | 'dark' | 'system';
    contrast: 'normal' | 'mc' | 'hc' | 'system';
}

export const DEFAULT_THEME: ThemeState = {
    color: '#6750A4',
    scheme: 'light',
    contrast: 'normal',
};

function isValidHex(hex: string): boolean {
    return /^#?([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(hex);
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
            Object.entries(customThemeColors).forEach(([name, config]) => {
                // Normalize string vs object config
                const hex = typeof config === 'string' ? config : config.color;
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
        setTheme(
            initialColor,
            savedTheme.scheme || DEFAULT_THEME.scheme,
            savedTheme.contrast || DEFAULT_THEME.contrast
        );
    }, []);

    return null;
}