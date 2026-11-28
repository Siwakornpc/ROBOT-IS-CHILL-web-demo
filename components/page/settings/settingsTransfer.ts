import {
    DEFAULT_EDITOR_SETTINGS,
    WHITESPACE_ICONS,
    type EditorSettings,
    type WhitespaceIcon,
} from "@/components/editor/editorSettings";
import {
    DEFAULT_FONT_STATE,
    FONT_CODE_OPTIONS,
    FONT_SANS_OPTIONS,
} from "@/components/fontscript";
import type { FontState } from "@/components/fontscript";
import {
    DEFAULT_SYNTAX_BLEND,
    DEFAULT_SYNTAX_HIGHLIGHT,
    DEFAULT_SYNTAX_REAL,
    DEFAULT_THEME,
} from "@/components/themescript";
import type {
    SyntaxBlendState,
    SyntaxHighlightKey,
    SyntaxHighlightState,
    SyntaxRealState,
    ThemeState,
} from "@/components/themescript";

export type SettingsSnapshot = {
    theme: ThemeState;
    font: FontState;
    syntax: {
        highlight: SyntaxHighlightState;
        blend: SyntaxBlendState;
        real: SyntaxRealState;
    };
    editor: EditorSettings;
};

export type SettingsOverrides = {
    version: 1;
    theme?: Partial<ThemeState>;
    font?: Partial<FontState>;
    syntax?: {
        highlight?: Partial<SyntaxHighlightState>;
        blend?: Partial<SyntaxBlendState>;
        real?: Partial<SyntaxRealState>;
    };
    editor?: Partial<EditorSettings>;
};

function changedFields<T extends object>(current: T, defaults: T): Partial<T> {
    const changed: Partial<T> = {};
    for (const key of Object.keys(current) as (keyof T)[]) {
        const value = current[key];
        const defaultValue = defaults[key];
        const equal = Array.isArray(value) && Array.isArray(defaultValue)
            ? value.length === defaultValue.length && value.every((item, index) => item === defaultValue[index])
            : Object.is(value, defaultValue);

        if (!equal) Object.assign(changed, { [key]: value });
    }
    return changed;
}

export function createSettingsOverrides(settings: SettingsSnapshot): SettingsOverrides {
    const result: SettingsOverrides = { version: 1 };
    const theme = changedFields(settings.theme, DEFAULT_THEME);
    const font = changedFields(settings.font, DEFAULT_FONT_STATE);
    const editor = changedFields({
        ...settings.editor,
        whitespaceIcons: WHITESPACE_ICONS.filter((icon) => settings.editor.whitespaceIcons.includes(icon)),
    }, DEFAULT_EDITOR_SETTINGS);
    const syntax: NonNullable<SettingsOverrides["syntax"]> = {};

    if (Object.keys(theme).length > 0) result.theme = theme;
    if (Object.keys(font).length > 0) result.font = font;
    if (Object.keys(editor).length > 0) result.editor = editor;

    const highlight = changedFields(settings.syntax.highlight, DEFAULT_SYNTAX_HIGHLIGHT);
    const blend = changedFields(settings.syntax.blend, DEFAULT_SYNTAX_BLEND);
    const real = changedFields(settings.syntax.real, DEFAULT_SYNTAX_REAL);
    if (Object.keys(highlight).length > 0) syntax.highlight = highlight;
    if (Object.keys(blend).length > 0) syntax.blend = blend;
    if (Object.keys(real).length > 0) syntax.real = real;
    if (Object.keys(syntax).length > 0) result.syntax = syntax;

    return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
    if (!isRecord(value)) throw new Error(`${label} must be an object.`);
    return value;
}

function assertKnownKeys(record: Record<string, unknown>, knownKeys: readonly string[], label: string) {
    const unknownKey = Object.keys(record).find((key) => !knownKeys.includes(key));
    if (unknownKey) throw new Error(`Unknown ${label} setting: ${unknownKey}.`);
}

function isHexColor(value: unknown): value is string {
    return typeof value === "string" && /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value);
}

function isSyntaxKey(key: string): key is SyntaxHighlightKey {
    return Object.prototype.hasOwnProperty.call(DEFAULT_SYNTAX_HIGHLIGHT, key);
}

function isWhitespaceIcon(value: unknown): value is WhitespaceIcon {
    return typeof value === "string" && (WHITESPACE_ICONS as readonly string[]).includes(value);
}

function parseTheme(value: unknown): Partial<ThemeState> {
    const record = requireRecord(value, "theme");
    assertKnownKeys(record, ["color", "scheme", "contrast", "brightness"], "theme");
    const theme: Partial<ThemeState> = {};

    if ("color" in record) {
        if (!isHexColor(record.color)) throw new Error("theme.color must be a hex color.");
        theme.color = record.color;
    }
    if ("scheme" in record) {
        if (record.scheme !== "system" && record.scheme !== "light" && record.scheme !== "dark")
            throw new Error("theme.scheme must be system, light, or dark.");
        theme.scheme = record.scheme;
    }
    if ("contrast" in record) {
        if (record.contrast !== "system" && record.contrast !== "normal" && record.contrast !== "mc" && record.contrast !== "hc")
            throw new Error("theme.contrast is invalid.");
        theme.contrast = record.contrast;
    }
    if ("brightness" in record) {
        if (typeof record.brightness !== "number" || !Number.isInteger(record.brightness) || record.brightness < -30 || record.brightness > 30)
            throw new Error("theme.brightness must be an integer from -30 to 30.");
        theme.brightness = record.brightness;
    }

    return theme;
}

function parseFont(value: unknown): Partial<FontState> {
    const record = requireRecord(value, "font");
    assertKnownKeys(record, ["sans", "code", "sansSize", "codeSize"], "font");
    const font: Partial<FontState> = {};

    if ("sans" in record) {
        if (typeof record.sans !== "string" || !FONT_SANS_OPTIONS.some((option) => option.value === record.sans))
            throw new Error("font.sans is not a supported font.");
        font.sans = record.sans;
    }
    if ("code" in record) {
        if (typeof record.code !== "string" || !FONT_CODE_OPTIONS.some((option) => option.value === record.code))
            throw new Error("font.code is not a supported font.");
        font.code = record.code;
    }
    if ("sansSize" in record) {
        if (typeof record.sansSize !== "number" || !Number.isInteger(record.sansSize) || record.sansSize < 12 || record.sansSize > 28)
            throw new Error("font.sansSize must be an integer from 12 to 28.");
        font.sansSize = record.sansSize;
    }
    if ("codeSize" in record) {
        if (typeof record.codeSize !== "number" || !Number.isInteger(record.codeSize) || record.codeSize < 10 || record.codeSize > 28)
            throw new Error("font.codeSize must be an integer from 10 to 28.");
        font.codeSize = record.codeSize;
    }

    return font;
}

function parseSyntaxValues<T>(
    value: unknown,
    label: string,
    isValid: (value: unknown) => value is T,
): Partial<Record<SyntaxHighlightKey, T>> {
    const record = requireRecord(value, label);
    const values: Partial<Record<SyntaxHighlightKey, T>> = {};
    for (const [key, entry] of Object.entries(record)) {
        if (!isSyntaxKey(key)) throw new Error(`Unknown ${label} setting: ${key}.`);
        if (!isValid(entry)) throw new Error(`${label}.${key} has an invalid value.`);
        values[key] = entry;
    }
    return values;
}

function parseEditor(value: unknown): Partial<EditorSettings> {
    const record = requireRecord(value, "editor");
    assertKnownKeys(record, ["showLineNumbers", "showWhitespace", "whitespaceIcons", "showIndentGuides", "tabSize"], "editor");
    const editor: Partial<EditorSettings> = {};

    for (const key of ["showLineNumbers", "showWhitespace", "showIndentGuides"] as const) {
        if (key in record) {
            if (typeof record[key] !== "boolean") throw new Error(`editor.${key} must be a boolean.`);
            editor[key] = record[key];
        }
    }
    if ("whitespaceIcons" in record) {
        if (!Array.isArray(record.whitespaceIcons))
            throw new Error("editor.whitespaceIcons contains an unsupported icon.");
        const whitespaceIcons: WhitespaceIcon[] = [];
        for (const icon of record.whitespaceIcons) {
            if (!isWhitespaceIcon(icon))
                throw new Error("editor.whitespaceIcons contains an unsupported icon.");
            whitespaceIcons.push(icon);
        }
        editor.whitespaceIcons = WHITESPACE_ICONS.filter((icon) => whitespaceIcons.includes(icon));
    }
    if ("tabSize" in record) {
        if (typeof record.tabSize !== "number" || !Number.isInteger(record.tabSize) || record.tabSize < 1 || record.tabSize > 8)
            throw new Error("editor.tabSize must be an integer from 1 to 8.");
        editor.tabSize = record.tabSize;
    }

    return editor;
}

export function parseSettingsOverrides(value: unknown): SettingsOverrides {
    const record = requireRecord(value, "settings");
    assertKnownKeys(record, ["version", "theme", "font", "syntax", "editor"], "settings");
    if (record.version !== 1) throw new Error("Unsupported settings file version.");

    const result: SettingsOverrides = { version: 1 };
    if (record.theme !== undefined) result.theme = parseTheme(record.theme);
    if (record.font !== undefined) result.font = parseFont(record.font);
    if (record.editor !== undefined) result.editor = parseEditor(record.editor);
    if (record.syntax !== undefined) {
        const syntaxRecord = requireRecord(record.syntax, "syntax");
        assertKnownKeys(syntaxRecord, ["highlight", "blend", "real"], "syntax");
        result.syntax = {};
        if (syntaxRecord.highlight !== undefined)
            result.syntax.highlight = parseSyntaxValues(syntaxRecord.highlight, "syntax.highlight", isHexColor);
        if (syntaxRecord.blend !== undefined)
            result.syntax.blend = parseSyntaxValues(syntaxRecord.blend, "syntax.blend", (entry): entry is boolean => typeof entry === "boolean");
        if (syntaxRecord.real !== undefined)
            result.syntax.real = parseSyntaxValues(syntaxRecord.real, "syntax.real", (entry): entry is boolean => typeof entry === "boolean");
    }
    return result;
}
