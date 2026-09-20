import {
    DEFAULT_SYNTAX_HIGHLIGHT,
    DEFAULT_SYNTAX_BLEND,
    DEFAULT_SYNTAX_REAL,
    DEFAULT_THEME,
} from "@/components/themescript";
import type {
    ThemeState,
    SyntaxHighlightKey,
    SyntaxHighlightState,
    SyntaxBlendState,
    SyntaxRealState,
} from "@/components/themescript";

export type PresetColor = {
    color?: string;
    blend?: boolean;
    real?: boolean;
};

export type ThemePreset = {
    id: string;
    label: string;
    theme?: Partial<ThemeState>;
    colors?: Partial<Record<SyntaxHighlightKey, PresetColor>>;
};

// Define presets here

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: "default",
        label: "Default",
        theme: { color: DEFAULT_THEME.color },
    },

    {
        id: "monakii",
        label: "Monakii",
        theme: {
            color: "#938d68"
        },
        colors: {
            syntaxName: {
                color: "#72d4e7"
            },
            syntaxValue: {
                color: "#ffe370",
                real: true
            },
            syntaxEscaped: {
                color: "#8851f7",
                real: true
            },
            syntaxVariable: {
                color: "#ffffff",
                real: true
            },
            renderFlagName: {
                color: "#a2f347",
                real: true
            },
            renderFlagValue: {
                color: "#f0991e",
                real: true
            },
            renderVariantName: {
                color: "#f34274",
                real: true
            },
            renderVariantValue: {
                color: "#ffffff",
                real: true
            }
        }
    }
];

// Unspecified keys fall back to defaults, so switching presets never leaves leftovers
export const resolvePreset = (p: ThemePreset) => {
    const highlight: SyntaxHighlightState = { ...DEFAULT_SYNTAX_HIGHLIGHT };
    const blend: SyntaxBlendState = { ...DEFAULT_SYNTAX_BLEND };
    const real: SyntaxRealState = { ...DEFAULT_SYNTAX_REAL };

    for (const [k, c] of Object.entries(p.colors ?? {}) as [SyntaxHighlightKey, PresetColor][]) {
        if (c.color !== undefined) highlight[k] = c.color;
        if (c.blend !== undefined) blend[k] = c.blend;
        if (c.real !== undefined) real[k] = c.real;
    }

    return { highlight, blend, real };
};