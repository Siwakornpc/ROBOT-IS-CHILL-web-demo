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

    flags = [
        ...new Set(
            [...flagsSource.matchAll(/--[\w-]+|-\w\b/g)].map((match) => match[0]),
        ),
    ];
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

function findLongestVariant(rawValue, variantNames) {
    let match = null;

    for (const variant of variantNames) {
        if (
            rawValue.startsWith(variant) &&
            (!match || variant.length > match.length)
        ) {
            match = variant;
        }
    }

    return match;
}

export function highlightText(
    text,
    variantNames = variants,
    flagNames = flags,
) {
    const flagPattern = /^((?:--|-)(?:[^ >:;&]+))(=)([^ >:;&]+)/;
    const variantPattern = /^([:;])([^ >:;&]+)/;

    let result = "";
    let index = 0;

    while (index < text.length) {
        const remaining = text.slice(index);
        const flagMatch = remaining.match(flagPattern);

        if (flagMatch) {
            const [, name, equals, value] = flagMatch;

            result += createSpan("flag-name", name);
            index += name.length;

            if (equals) {
                result += equals;
                index += equals.length;
            }

            if (value) {
                result += value
                    .split("/")
                    .map((part) => createSpan("flag-value", part))
                    .join("/");

                index += value.length;
            }

            continue;
        }

        const variantMatch = remaining.match(variantPattern);
        if (variantMatch) {
            const [, delimiter, rawValue] = variantMatch;

            result += createSpan("variant-name", delimiter);

            const matchedVariant = findLongestVariant(rawValue, variantNames);

            if (matchedVariant) {
                result += createSpan("variant-name", matchedVariant);

                const remainder = rawValue.slice(matchedVariant.length);

                if (remainder) {
                    result += remainder
                        .split("/")
                        .map((part) => createSpan("variant-value", part))
                        .join("/");
                }
            } else {
                result += createSpan("variant-value", rawValue);
            }

            index += delimiter.length + rawValue.length;
            continue;
        }

        result += escapeHtml(text[index]);
        index += 1;
    }

    return result;
}

export const renderHighlighter = (text) =>
    highlightText(text, variants, flags);

if (typeof window !== "undefined") {
    window.renderHighlighter = renderHighlighter;
}