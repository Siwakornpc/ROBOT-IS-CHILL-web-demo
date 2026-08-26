// Turns ROBOT IS CHILL flags and variants components into a JSONified object

const SOURCES = {
    variantTypes:
        "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/variant_types.py",
    variants:
        "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/cogs/variants.py",
    flags:
        "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/cogs/flags.py",
} as const;

export interface Variant {
    description: string;
    syntax: string;
    applied: string;
}

export interface Flag {
    syntax: string;
    description: string;
}

export type Variants = Record<string, Variant>;
export type Flags = Record<string, Flag>;

export interface RobotIsChillMetadata {
    variants: Variants;
    flags: Flags;
}


export const sampleVariants: Variants = {
    crop: {
        description:
            "Crops the sprite to the specified bounding box.\n" +
            "If the `change_bbox` toggle is on, then the sprite's bounding box is altered, as opposed to removing pixels.",
        syntax:
            "<crop|cr><x: int>/<y: int>/<u: int>/<v: int>/[change_bbox: bool = False]",
        applied: "While applying effects to sprite image",
    },

    croppoly: {
        description:
            "Crops the sprite to the specified polygon.",
        syntax:
            "<croppoly><point_coords: list[int]>",
        applied: "While applying effects to sprite image",
    },
};


export const sampleFlags: Flags = {
    background: {
        syntax: "(-b | --background)=#<color: Color>",
        description:
            "Sets the background of a render to a color.",
    },

    palette: {
        syntax: "(-p | --palette)=<palette: str>",
        description:
            "Sets the palette to use for the render. For a list of palettes, try `search type:palette`.",
    },

    raw: {
        syntax: "(-r | --raw)=<name: str>",
        description:
            "Alias for -F=<name> -f=zip -m=1.",
    },

    filename: {
        syntax: "(-F | --filename)=<name: str>",
        description:
            "Sets the filename of the render.\n" +
            "When used in conjunction with `--format=zip`, each frame in the zip will be named `<filename>_<frame // 3>_<frame % 3>.png`.\n" +
            "The filename must be at most 64 characters long, and must be valid.",
    },
};


function splitTopLevel(text: string): string[] {
    const out: string[] = [];

    let start = 0;
    let depth = 0;
    let quote: string | null = null;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (c === "\\") {
                escaped = true;
            } else if (c === quote) {
                quote = null;
            }

            continue;
        }

        if (c === "'" || c === '"') {
            quote = c;
        } else if ("([{".includes(c)) {
            depth++;
        } else if (")]}" .includes(c)) {
            depth--;
        } else if (c === "," && depth === 0) {
            out.push(text.slice(start, i).trim());
            start = i + 1;
        }
    }

    const last = text.slice(start).trim();

    if (last) {
        out.push(last);
    }

    return out;
}


function normalizeDocstring(raw: string): string {
    const lines = raw
        .replace(/\r/g, "")
        .split("\n");

    while (lines.length && !lines[0].trim()) {
        lines.shift();
    }

    while (lines.length && !lines.at(-1)!.trim()) {
        lines.pop();
    }

    const indents = lines
        .filter(line => line.trim())
        .map(line => (line.match(/^\s*/) || [""])[0].length);

    const indent = indents.length
        ? Math.min(...indents)
        : 0;

    return lines
        .map(line => line.slice(indent))
        .join("\n")
        .trim();
}


function extractDocstring(
    source: string,
    after: number,
): string {
    const rest = source.slice(after);

    const tripleD = String.fromCharCode(34).repeat(3);
    const tripleS = String.fromCharCode(39).repeat(3);

    const re = new RegExp(
        "^\\s*(?:" +
        tripleD + "([\\s\\S]*?)" + tripleD +
        "|" +
        tripleS + "([\\s\\S]*?)" + tripleS +
        ")",
    );

    const match = rest.match(re);

    if (!match) {
        return "";
    }

    return normalizeDocstring(
        match[1] ?? match[2],
    );
}


function findMatchingParen(
    source: string,
    open: number,
): number {
    let depth = 0;
    let quote: string | null = null;
    let escaped = false;

    for (let i = open; i < source.length; i++) {
        const c = source[i];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (c === "\\") {
                escaped = true;
            } else if (c === quote) {
                quote = null;
            }

            continue;
        }

        if (c === "'" || c === '"') {
            quote = c;
        } else if (c === "(") {
            depth++;
        } else if (c === ")" && --depth === 0) {
            return i;
        }
    }

    return -1;
}


function pythonParameterText(
    parameter: string,
): string {
    return parameter
        .replace(/\s+/g, " ")
        .replace(/\s*:\s*/g, ": ")
        .replace(/\s*=\s*/g, " = ")
        .trim();
}


function makeVariantSyntax(
    names: string[] | null,
    params: string[],
): string {
    const prefix =
        names === null
            ? ""
            : `<${names.join("|")}>`;

    return (
        prefix +
        params
            .map(parameter => {
                const text =
                    pythonParameterText(parameter);

                return text.includes("=")
                    ? `[${text}]`
                    : `<${text}>`;
            })
            .join("/")
    );
}


function parseVariants(
    source: string,
): Variants {
    const result: Variants = {};

    const re =
        /@([A-Za-z_][A-Za-z0-9_]*(?:VariantFactory|AbstractVariantFactory))\.define_variant\s*\(([\s\S]*?)\)\s*\n\s*async\s+def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

    const applied: Record<string, string> = {
        SkeletonVariantFactory:
            "While parsing",

        SignVariantFactory:
            "While placing sign texts",

        TileVariantFactory:
            "While deciding sprite",

        SpriteVariantFactory:
            "While applying effects to sprite image",

        PostVariantFactory:
            "While placing sprite onto image",

        AbstractVariantFactory:
            "None",
    };

    let match: RegExpExecArray | null;

    while ((match = re.exec(source))) {
        const factory = match[1];
        const args = match[2];
        const name = match[3];

        const signatureOpen = re.lastIndex - 1;

        const signatureClose =
            findMatchingParen(
                source,
                signatureOpen,
            );

        if (signatureClose < 0) {
            continue;
        }

        const params = splitTopLevel(
            source.slice(
                signatureOpen + 1,
                signatureClose,
            ),
        )
            .filter(Boolean)
            .slice(2);

        const namesMatch = args.match(
            /names\s*=\s*(\[[\s\S]*?\]|"[^"]*"|'[^']*'|None)/,
        );

        let names: string[] | null = [];

        if (namesMatch) {
            const raw = namesMatch[1].trim();

            if (raw === "None") {
                names = null;
            } else if (raw.startsWith("[")) {
                names = [
                    ...raw.matchAll(
                        /["']([^"']+)["']/g,
                    ),
                ].map(match => match[1]);
            } else {
                names = [raw.slice(1, -1)];
            }
        }

        result[name] = {
            description: extractDocstring(
                source,
                signatureClose + 1,
            ),

            syntax: makeVariantSyntax(
                names,
                params,
            ),

            applied:
                applied[factory] ?? "None",
        };
    }

    return result;
}


function parseFlags(
    source: string,
): Flags {
    const result: Flags = {};

    const re =
        /@flags\.register\s*\(\s*[\s\S]*?syntax\s*=\s*"((?:\\.|[^"])*)"\s*,?\s*\)\s*\n\s*async\s+def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*:/g;

    let match: RegExpExecArray | null;

    while ((match = re.exec(source))) {
        result[match[2]] = {
            syntax: match[1]
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\"),

            description: extractDocstring(
                source,
                re.lastIndex,
            ),
        };
    }

    return result;
}


export async function loadVariants(): Promise<Variants> {
    const response = await fetch(
        SOURCES.variants,
    );

    if (!response.ok) {
        throw new Error(
            `variants.py HTTP ${response.status}`,
        );
    }

    return parseVariants(
        await response.text(),
    );
}


export async function loadFlags(): Promise<Flags> {
    const response = await fetch(
        SOURCES.flags,
    );

    if (!response.ok) {
        throw new Error(
            `flags.py HTTP ${response.status}`,
        );
    }

    return parseFlags(
        await response.text(),
    );
}


export async function loadUpstream(): Promise<RobotIsChillMetadata> {
    const [, variantsSource, flagsSource] =
        await Promise.all([
            fetch(SOURCES.variantTypes).then(
                response => {
                    if (!response.ok) {
                        throw new Error(
                            `variant_types.py HTTP ${response.status}`,
                        );
                    }

                    return response.text();
                },
            ),

            fetch(SOURCES.variants).then(
                response => {
                    if (!response.ok) {
                        throw new Error(
                            `variants.py HTTP ${response.status}`,
                        );
                    }

                    return response.text();
                },
            ),

            fetch(SOURCES.flags).then(
                response => {
                    if (!response.ok) {
                        throw new Error(
                            `flags.py HTTP ${response.status}`,
                        );
                    }

                    return response.text();
                },
            ),
        ]);

    return {
        variants: parseVariants(
            variantsSource,
        ),

        flags: parseFlags(
            flagsSource,
        ),
    };
}