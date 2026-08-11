'use client';

import { useEffect } from 'react';
import * as MCU from '@material/material-color-utilities';

const variant = 'dark'; // 'light', 'light-mc', 'light-hc', 'dark', 'dark-mc', 'dark-hc'

export default function ThemeScript() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const rgbStr = (argb: number) =>
      `${MCU.redFromArgb(argb)}, ${MCU.greenFromArgb(argb)}, ${MCU.blueFromArgb(argb)}`;

    function setTheme(sourceColor: string, variant = 'dark', suffix = '') {
      const hct = MCU.Hct.fromInt(MCU.argbFromHex(sourceColor));
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
        if ((MCU.MaterialDynamicColors as Record<string, any>)[camelToken]) {
          const argb = (
            MCU.MaterialDynamicColors as Record<string, any>
          )[camelToken].getArgb(scheme);
          target.style.setProperty(
            `--md-sys-color-${token}${suffix}`,
            rgbStr(argb)
          );
        }
      });
    }

    (window as any).setTheme = setTheme;

    let color = '#68548E';
    intervalId = setInterval(() => {
      const dsmColor = (window as any).DSM?.pluginSettings?.[
        'set-primary-color'
      ]?.primaryColor;
      if (dsmColor && dsmColor !== color) {
        color = dsmColor;
        setTheme(color, variant);
      }
    }, 100);

    setTheme(color, variant);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
}