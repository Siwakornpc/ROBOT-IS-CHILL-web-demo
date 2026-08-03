import { loadVariants } from "../editor/getVariantName.js";

export let variants = [];
export let flags = [];

const sourceUrls = {
    flags: "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/src/cogs/flags.py",
};

async function loadFlags() {
    if (typeof window === "undefined") {
        return;
    }

    const flagsSource = await fetch(sourceUrls.flags).then((response) => response.text());
    flags = [...new Set([...flagsSource.matchAll(/--[\w-]+|-\w\b/g)].map((match) => match[0]))];
}

async function loadVariantData() {
    if (typeof window === "undefined") {
        return [];
    }

    variants = await loadVariants();
    return variants;
}

if (typeof window !== "undefined") {
    void loadFlags();
    void loadVariantData();
}

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function createSpan(className, value) {
    return `<span class="${className}">${escapeHtml(value)}</span>`;
}

export function highlightText(text, variantNames = variants, flagNames = flags) {
    const flagPattern = /^((?:--|-(?:[^ >:;&/]+)))=([^ >:;&/]+)/;
    const variantPattern = /^([:;])([^ >:;&/]+)/;

    let result = "";
    let index = 0;

    while (index < text.length) {
        const remaining = text.slice(index);
        const flagMatch = remaining.match(flagPattern);
        const variantMatch = remaining.match(variantPattern);

        if (flagMatch) {
            const [, name, value] = flagMatch;
            result += createSpan("flag-name", name);
            result += createSpan("flag-value", "=");
            result += createSpan("flag-value", value);
            index += name.length + 1 + value.length;
            continue;
        }

        if (variantMatch) {
            const [, delimiter, rawValue] = variantMatch;
            const matchedVariant = (variantNames || [])
                .filter((variant) => rawValue.startsWith(variant))
                .sort((left, right) => right.length - left.length)[0] ?? null;

            result += createSpan("variant-name", delimiter);

            if (matchedVariant) {
                result += createSpan("variant-name", matchedVariant);
                result += createSpan("variant-value", rawValue.slice(matchedVariant.length));
            }
            else {
                result += createSpan("variant-value", rawValue);
            }

            index += delimiter.length + rawValue.length;
            continue;
        }

        const current = text[index];
        result += escapeHtml(current);
        index += 1;
    }

    return result;
}

export const renderHighlighter = (text) => highlightText(text, variants, flags);

if (typeof window !== "undefined") {
    window.renderHighlighter = renderHighlighter;
}

