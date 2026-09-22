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
    description?: string;
    theme?: Partial<ThemeState>;
    colors?: Partial<Record<SyntaxHighlightKey, PresetColor>>;
};

// Define presets here

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: "on-dark",
        label: "On Dark",
        description: "Default",
        theme: {
            color: DEFAULT_THEME.color,
            scheme: DEFAULT_THEME.scheme,
            contrast: DEFAULT_THEME.contrast,
            brightness: 0,
        },
    },
    
    {
        id: "od-robust",
        label: "On Dark Robust",
        theme: {
            color: "#3024db",
            scheme: "dark",
            contrast: DEFAULT_THEME.contrast,
            brightness: 0,
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
        id: "on-darkest",
        label: "On Darkest",
        theme: {
            color: DEFAULT_THEME.color,
            scheme: DEFAULT_THEME.scheme,
            contrast: DEFAULT_THEME.contrast,
            brightness: -4,
        },
    },
    
    {
        id: "odt-robust",
        label: "On Darkest Robust",
        theme: {
            color: "#3024db",
            scheme: "dark",
            contrast: DEFAULT_THEME.contrast,
            brightness: -4,
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
        id: "on-light",
        label: "On Light",
        theme: {
            color: DEFAULT_THEME.color,
            scheme: "light",
            contrast: DEFAULT_THEME.contrast,
            brightness: 0,
        },
        colors: {
            syntaxBracketLayer0: {
                color: "#5f94f5"
            },
            syntaxBracketLayer1: {
                color: "#4c8a34",
                real: true
            },
            syntaxBracketLayer2: {
                color: "#b6822f",
                real: true
            },
        }
    },
    
    {
        id: "ol-robust",
        label: "On Light Robust",
        theme: {
            color: DEFAULT_THEME.color,
            scheme: "light",
            contrast: DEFAULT_THEME.contrast,
            brightness: 0,
        },
        colors: {
            syntaxName: {
                color: "#308bff",
                real: true
            },
            syntaxValue: {
                color: "#d7933d",
                real: true
            },
            syntaxEscaped: {
                color: "#ca5218",
                real: true
            },
            syntaxVariable: {
                color: "#1f9fa9",
                real: true
            },
            syntaxBracketLayer0: {
                color: "#5f94f5"
            },
            syntaxBracketLayer1: {
                color: "#4c8a34",
                real: true
            },
            syntaxBracketLayer2: {
                color: "#b6822f",
                real: true
            },
            renderFlagName: {
                color: "#c0aa3a",
                real: true
            },
            renderFlagValue: {
                color: "#899c39",
                real: true
            }
        }
    },

    {
        id: "monakii",
        label: "Monakii", // Monokai
        theme: {
            color: "#938d68",
            scheme: "dark",
            brightness: 2,
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
        id: "aoy-dark", // Atom One
        label: "Aoy Dark",
        theme: {
            color: "#598fd5",
            scheme: "dark",
            brightness: 2,
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
        id: "kimbab-dark", // Kimbie
        label: "Kimbab Dark",
        theme: {
            color: "#f09722",
            scheme: "dark",
            brightness: 1,
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
        id: "gitly-dark",
        label: "Gitly Dark",
        theme: {
            color: "#004797",
            scheme: "dark",
            brightness: -3,
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
            color: "#53b4d9",
            scheme: "dark",
            brightness: -4,
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
    },

    {
        id: "autnun",
        label: "Autnun",
        theme: {
            color: "#ff6c00",
            scheme: "dark",
            contrast: "system",
            brightness: -3,
        },
        colors: {
            syntaxName: {
                color: "#de8536",
                real: true
            },
            syntaxValue: {
                color: "#e1a843",
                real: true
            },
            syntaxEscaped: {
                color: "#c85a2a",
                real: true
            },
            syntaxVariable: {
                color: "#777721",
                real: true
            },
            syntaxBracketLayer0: {
                color: "#742417",
                real: true
            },
            syntaxBracketLayer1: {
                color: "#883114",
                real: true
            },
            syntaxBracketLayer2: {
                color: "#744017",
                real: true
            },
            renderFlagName: {
                color: "#b57c34",
                real: true
            },
            renderFlagValue: {
                color: "#6d7d1f",
                real: true
            },
            renderVariantName: {
                color: "#7c6925",
                real: true
            },
            renderVariantValue: {
                color: "#943f2e",
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