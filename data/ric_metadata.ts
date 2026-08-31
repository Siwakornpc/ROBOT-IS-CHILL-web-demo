const SOURCES = {
    variantTypes:
        "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/variant_types.py",

    variants:
        "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/cogs/variants.py",

    flags:
        "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/cogs/flags.py",

    constants:
        "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/constants.py",
} as const;

const FONT_NAMES = [
    "04b03",
    "bytesized",
    "icon",
    "monospace",
    "offset",
    "ui",
] as const;

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

        applied:
            "While applying effects to sprite image",
    },

    croppoly: {
        description:
            "Crops the sprite to the specified polygon.",

        syntax:
            "<croppoly><point_coords: list[int]>",

        applied:
            "While applying effects to sprite image",
    },
};


export const sampleFlags: Flags = {
    background: {
        syntax:
            "(-b | --background)=#<color: Color>",

        description:
            "Sets the background of a render to a color.",
    },

    palette: {
        syntax:
            "(-p | --palette)=<palette: str>",

        description:
            "Sets the palette to use for the render. For a list of palettes, try `search type:palette`.",
    },

    raw: {
        syntax:
            "(-r | --raw)=<name: str>",

        description:
            "Alias for -F=<name> -f=zip -m=1.",
    },

    filename: {
        syntax:
            "(-F | --filename)=<name: str>",

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
            out.push(
                text.slice(start, i).trim(),
            );

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

    while (
        lines.length &&
        !lines[0].trim()
    ) {
        lines.shift();
    }

    while (
        lines.length &&
        !lines.at(-1)!.trim()
    ) {
        lines.pop();
    }

    const indents = lines
        .filter(line => line.trim())
        .map(
            line =>
                (line.match(/^\s*/) || [""])[0]
                    .length,
        );

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

    const tripleD =
        String.fromCharCode(34).repeat(3);

    const tripleS =
        String.fromCharCode(39).repeat(3);

    const re = new RegExp(
        "^\\s*(?:" +
            tripleD +
            "([\\s\\S]*?)" +
            tripleD +
            "|" +
            tripleS +
            "([\\s\\S]*?)" +
            tripleS +
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

    for (
        let i = open;
        i < source.length;
        i++
    ) {
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
        } else if (
            c === ")" &&
            --depth === 0
        ) {
            return i;
        }
    }

    return -1;
}


/*
 * Extract dictionary keys from constants.py.
 *
 * Example:
 *
 * DIRECTION_VARIANTS = {
 *     "right": ...,
 *     "r": ...,
 *     "up": ...,
 * }
 *
 * -> ["right", "r", "up"]
 */
function extractDictionaryKeys(
    source: string,
    name: string,
): string[] | null {
    /*
     * Supports both:
     *
     * NAME = {
     *     "foo": ...,
     * }
     *
     * and:
     *
     * NAME: dict[str, ...] = {
     *     "foo": ...,
     * }
     */
    const declaration = new RegExp(
        `\\b${name}\\s*(?::[^=\\n]+)?=\\s*\\{`,
    );

    const match = source.match(declaration);

    if (!match || match.index === undefined) {
        return null;
    }

    const open =
        match.index +
        match[0].length -
        1;

    let depth = 0;
    let quote: string | null = null;
    let escaped = false;
    let close = -1;

    for (
        let i = open;
        i < source.length;
        i++
    ) {
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
        } else if (c === "{") {
            depth++;
        } else if (c === "}") {
            depth--;

            if (depth === 0) {
                close = i;
                break;
            }
        }
    }

    if (close < 0) {
        return null;
    }

    const body = source.slice(
        open + 1,
        close,
    );

    return [
        ...body.matchAll(
            /["']([^"']+)["']\s*:/g,
        ),
    ].map(match => match[1]);
}


/*
 * Extract strings from a tuple/list constant.
 *
 * Example:
 *
 * BLENDING_MODES = (
 *     "normal",
 *     "add",
 *     "subtract",
 * )
 *
 * -> ["normal", "add", "subtract"]
 */
function extractStringSequence(
    source: string,
    name: string,
): string[] | null {
    const re = new RegExp(
        `\\b${name}\\s*=\\s*[\\(\\[]([\\s\\S]*?)[\\)\\]]`,
    );

    const match = source.match(re);

    if (!match) {
        return null;
    }

    return [
        ...match[1].matchAll(
            /["']([^"']+)["']/g,
        ),
    ].map(match => match[1]);
}


/*
 * Resolve dynamic Literal expressions used
 * by Robot Is Chill.
 */
function resolveLiteralAnnotation(
    annotation: string,
    constantsSource: string,
): string {
    const normalized = annotation
        .replace(/\s+/g, " ")
        .trim();

    /*
     * Resolve:
     *
     * Literal[*constants.COLOR_NAMES.keys()]
     *
     * as well as expressions where the dynamic value is
     * contained inside a larger Literal[...] expression.
     */
    const literalMatch = normalized.match(
        /^Literal\[(.*)\]$/,
    );

    if (!literalMatch) {
        return annotation;
    }

    let contents = literalMatch[1];

    /*
     * Literal[*constants.X.keys()]
     *
     * Literal[*tuple(constants.X.keys())]
     */
    const dictionaryKeys = contents.match(
        /^\*(?:tuple\(\s*)?constants\.([A-Za-z_][A-Za-z0-9_]*)\.keys\(\)\s*\)?$/,
    );

    if (dictionaryKeys) {
        const values = extractDictionaryKeys(
            constantsSource,
            dictionaryKeys[1],
        );

        if (values) {
            return `Literal[${values
                .map(value => `'${value}'`)
                .join(", ")}]`;
        }
    }

    /*
     * Literal[*constants.X]
     */
    const sequence = contents.match(
        /^\*constants\.([A-Za-z_][A-Za-z0-9_]*)$/,
    );

    if (sequence) {
        const values = extractStringSequence(
            constantsSource,
            sequence[1],
        );

        if (values) {
            return `Literal[${values
                .map(value => `'${value}'`)
                .join(", ")}]`;
        }
    }

    /*
     * Literal[*tuple(
     *     Path(f).stem
     *     for f in glob.glob('data/fonts/*.ttf')
     * )]
     */
    if (
        contents.includes(
            "Path(f).stem for f in glob.glob('data/fonts/*.ttf')",
        )
    ) {
        return `Literal[${FONT_NAMES
            .map(name => `'${name}'`)
            .join(", ")}]`;
    }

    return annotation;
}


function pythonParameterText(
    parameter: string,
    constantsSource: string,
): string {
    const colonIndex =
        parameter.indexOf(":");

    if (colonIndex < 0) {
        return parameter
            .replace(/\s+/g, " ")
            .trim();
    }

    const name =
        parameter
            .slice(0, colonIndex)
            .trim();

    const annotationAndDefault =
        parameter
            .slice(colonIndex + 1)
            .trim();

    const equalsIndex =
        annotationAndDefault.indexOf("=");

    const annotation =
        equalsIndex >= 0
            ? annotationAndDefault
                  .slice(0, equalsIndex)
                  .trim()
            : annotationAndDefault;

    const defaultValue =
        equalsIndex >= 0
            ? annotationAndDefault
                  .slice(equalsIndex + 1)
                  .trim()
            : null;

    const resolvedAnnotation =
        resolveLiteralAnnotation(
            annotation,
            constantsSource,
        );

    return (
        `${name}: ${resolvedAnnotation}` +
        (
            defaultValue !== null
                ? ` = ${defaultValue}`
                : ""
        )
    );
}


function makeVariantSyntax(
    names: string[] | null,
    params: string[],
    constantsSource: string,
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
                    pythonParameterText(
                        parameter,
                        constantsSource,
                    );

                return text.includes("=")
                    ? `[${text}]`
                    : `<${text}>`;
            })
            .join("/")
    );
}


function parseVariants(
    source: string,
    constantsSource: string,
): Variants {
    const result: Variants = {};

    const re =
        /@([A-Za-z_][A-Za-z0-9_]*(?:VariantFactory|AbstractVariantFactory))\.define_variant\s*\(([\s\S]*?)\)\s*\n\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

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

        const signatureOpen =
            re.lastIndex - 1;

        const signatureClose =
            findMatchingParen(
                source,
                signatureOpen,
            );

        if (signatureClose < 0) {
            continue;
        }

        const params =
            splitTopLevel(
                source.slice(
                    signatureOpen + 1,
                    signatureClose,
                ),
            )
                .filter(Boolean)
                .slice(2);

        const namesMatch =
            args.match(
                /names\s*=\s*(\[[\s\S]*?\]|"[^"]*"|'[^']*'|None)/,
            );

        let names: string[] | null = [];

        if (namesMatch) {
            const raw =
                namesMatch[1].trim();

            if (raw === "None") {
                names = null;
            } else if (
                raw.startsWith("[")
            ) {
                names = [
                    ...raw.matchAll(
                        /["']([^"']+)["']/g,
                    ),
                ].map(match => match[1]);
            } else {
                names = [
                    raw.slice(1, -1),
                ];
            }
        }

        /*
         * Find the function body's colon,
         * then read its first docstring.
         */
        const bodyStart =
            source.indexOf(
                ":",
                signatureClose,
            );

        const description =
            bodyStart >= 0
                ? extractDocstring(
                      source,
                      bodyStart + 1,
                  )
                : "";

        result[name] = {
            description,

            syntax: makeVariantSyntax(
                names,
                params,
                constantsSource,
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

            description:
                extractDocstring(
                    source,
                    re.lastIndex,
                ),
        };
    }

    return result;
}


export async function loadUpstream(): Promise<RobotIsChillMetadata> {
    const [
        ,
        variantsSource,
        flagsSource,
        constantsSource,
    ] = await Promise.all([
        /*
         * Kept because this is part of the upstream
         * source set we're mirroring.
         */
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

        fetch(SOURCES.constants).then(
            response => {
                if (!response.ok) {
                    throw new Error(
                        `constants.py HTTP ${response.status}`,
                    );
                }

                return response.text();
            },
        ),
    ]);

    return {
        variants: parseVariants(
            variantsSource,
            constantsSource,
        ),

        flags: parseFlags(
            flagsSource,
        ),
    };
}


export async function loadVariants(): Promise<Variants> {
    const [
        variantsSource,
        constantsSource,
    ] = await Promise.all([
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

        fetch(SOURCES.constants).then(
            response => {
                if (!response.ok) {
                    throw new Error(
                        `constants.py HTTP ${response.status}`,
                    );
                }

                return response.text();
            },
        ),

    ]);

    return parseVariants(
        variantsSource,
        constantsSource,
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

const OVERLAYS = [
    "ace",
    "fbm",
    "aro",
    "babgay",
    "bi",
    "bigender",
    "candycane",
    "debug",
    "enby",
    "fbm",
    "fluid",
    "frozen",
    "gay",
    "groupproject",
    "it",
    "lesbian",
    "missing",
    "missing2",
    "missing3",
    "mlm",
    "omni",
    "pan",
    "pold",
    "poly",
    "space",
    "test",
    "trans",
    "uwbo",
    "vibe",
] as const; // There wasn't going to be any changes, but I'm not sure after this has been uploaded.

export type Overlay = {
    url: string;
};

export type Overlays = Record<string, Overlay>;

const OVERLAY_BASE =
    "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/data/overlays";

export function getOverlays(): Overlays {
    return Object.fromEntries(
        OVERLAYS.map(name => [
            name,
            {
                url: `${OVERLAY_BASE}/${name}.png${name === "fbm" ? "~" : ""}`,
            },
        ])
    );
}