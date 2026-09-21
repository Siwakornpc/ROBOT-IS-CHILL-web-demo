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
        id: "def-robust",
        label: "Default Robust",
        theme: {
            color: "#3024db"
        },
        colors: {
            syntaxName: {
                color: "#88b9f8",
                real: true
            },
            syntaxEscaped: {
                real: true
            },
            renderFlagName: {
                real: true
            },
            renderFlagValue: {
                real: true
            },
            renderVariantName: {
                real: true
            }
        }
    },

    {
        id: "monakii",
        label: "Monakii", // Monokai
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
                color: "#9261f5",
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
    },

    {
        id: "aoy", // Atom One
        label: "Aoy",
        theme: {
            color: "#598fd5"
        },
        colors: {
            syntaxName: {
                color: "#d188ee",
                real: true
            },
            syntaxValue: {
                color: "#ffd34f"
            },
            syntaxEscaped: {
                color: "#43faff"
            },
            syntaxVariable: {
                color: "#55acfa",
                real: true
            },
            syntaxBracketLayer0: {
                real: true
            },
            syntaxBracketLayer1: {
                real: true
            },
            syntaxBracketLayer2: {
                real: true
            },
            renderFlagName: {
                color: "#ee5552",
                real: true
            },
            renderFlagValue: {
                color: "#f8b66d",
                real: true
            },
            renderVariantName: {
                color: "#a072e7",
                real: true
            },
            renderVariantValue: {
                color: "#e33176"
            }
        }
    },

    {
        id: "kimbab", // Kimbie
        label: "Kimbab",
        theme: {
            color: "#f09722"
        },
        colors: {
            syntaxName: {
                color: "#7c4e5e",
                real: true
            },
            syntaxValue: {
                color: "#688d3e",
                real: true
            },
            syntaxEscaped: {
                color: "#7e4e38",
                real: true
            },
            syntaxVariable: {
                color: "#ca2545",
                real: true
            },
            syntaxBracketLayer0: {
                blend: true
            },
            syntaxBracketLayer1: {
                blend: true
            },
            syntaxBracketLayer2: {
                blend: true
            },
            renderFlagName: {
                color: "#73bfb0",
                real: true
            },
            renderFlagValue: {
                color: "#fb532f",
                real: true
            },
            renderVariantName: {
                color: "#d47a29",
                real: true
            },
            renderVariantValue: {
                real: true
            }
        }
    },

    {
        id: "gitly",
        label: "Gitly",
        theme: {
            color: "#0f0097"
        },
        colors: {
            syntaxName: {
                color: "#55acfa",
                real: true
            },
            syntaxValue: {
                color: "#aad0ff",
                real: true
            },
            syntaxEscaped: {
                color: "#ee5552",
                real: true
            },
            syntaxVariable: {
                color: "#ffffff",
                real: true
            },
            syntaxBracketLayer0: {
                color: "#55acfa"
            },
            syntaxBracketLayer1: {
                color: "#80ff55"
            },
            syntaxBracketLayer2: {
                color: "#f5d05f"
            },
            renderFlagName: {
                color: "#a072e7",
                real: true
            },
            renderFlagValue: {
                color: "#ff9f27",
                real: true
            },
            renderVariantName: {
                color: "#ff5d93"
            },
            renderVariantValue: {
                color: "#55acfa",
                real: true
            }
        }
    },

    {
        id: "sunburn",
        label: "Sunburn", // Sunburst (oldest set)
        theme: {
            color: "#53b4d9"
        },
        colors: {
            syntaxName: {
                color: "#4e7ad2"
            },
            syntaxValue: {
                color: "#6ac249",
                real: true
            },
            syntaxEscaped: {
                color: "#4e7ad2",
                real: true
            },
            syntaxVariable: {
                color: "#ffffff",
                real: true
            },
            syntaxBracketLayer0: {
                color: undefined
            },
            syntaxBracketLayer1: {
                color: undefined
            },
            syntaxBracketLayer2: {
                color: undefined
            },
            renderFlagName: {
                color: "#e3e34d",
                real: true
            },
            renderFlagValue: {
                color: "#4e7ad2",
                real: true
            },
            renderVariantName: {
                color: "#e87041",
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