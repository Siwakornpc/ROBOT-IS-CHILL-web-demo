'use client';

import { useEffect } from 'react';
import * as MCU from '@material/material-color-utilities';

const variant = 'dark'; // 'light', 'light-mc', 'light-hc', 'dark', 'dark-mc', 'dark-hc'
const color = '#2a36e5';

const customThemeColors = {
    success: '#84cc7b',
    syntaxName: '#72a5e7',
    syntaxValue: '#e7be72',
    syntaxEscaped: '#fc9929',
    syntaxBracketLayer0: { color: '#e4dc6a', blend: false }, 
    syntaxBracketLayer1: { color: '#c85acc', blend: false }, 
    syntaxBracketLayer2: { color: '#5f94f5', blend: false },
    renderFlagName: '#8bd1ec',
    renderFlagValue: '#84cc7b',
    renderVariantName: '#c06ed4',
    renderVariantValue: '#5f94f5',
};

export default function ThemeScript() {
    useEffect(() => {
        const toKebab = (str: string) =>
            str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

        const rgbStr = (argb: number) =>
            `${MCU.redFromArgb(argb)}, ${MCU.greenFromArgb(argb)}, ${MCU.blueFromArgb(argb)}`;

        function setTheme(sourceColor: string, variant = 'dark') {
            document.documentElement.setAttribute('data-theme-variant', variant);
            
            const sourceArgb = MCU.argbFromHex(sourceColor);
            const hct = MCU.Hct.fromInt(sourceArgb);
            const target = document.documentElement;

            const isDark = variant.startsWith('dark');
            let contrastLevel = 0.0;
            if (variant.endsWith('-mc')) contrastLevel = 0.5;
            if (variant.endsWith('-hc')) contrastLevel = 1.0;

            const scheme = new MCU.DynamicScheme({
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
                    const argb = dynamicColors[camelToken].getArgb(scheme);
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

        (window as any).setTheme = setTheme;
        setTheme(color, variant);
    }, []);

    return null;
}