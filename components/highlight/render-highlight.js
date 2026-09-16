import { loadUpstream } from "@/data/ric_metadata";
import { loadVariants } from "../editor/getVariantName.js";

export let variants = [];
export let flags = [];

export async function loadFlags() {
    if (typeof window === "undefined") return;

    const { variables, flags: flagsSource } = await loadUpstream();

    if (!flagsSource) return;

    const flagsMatch = Object.values(flagsSource)
        .flatMap(flag =>
            flag.syntax?.match(/--[\w-]+|-[\w-]+/g) ?? []
        );

    flags = flagsMatch;

    console.log(flags);
}

export async function loadVariantData() {
    if (typeof window === "undefined") return [];

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
        )
            match = variant;
    }

    return match;
}

export function highlightText(
    text,
    variantNames = variants,
    flagNames = flags,
) {
    // "\n" is excluded from every char class below so a flag/variant name or value
    // can never match across a line break. That keeps every generated <span> free of
    // embedded newlines, which lets callers safely split the rendered HTML on "\n"
    // to get one chunk per source line without cutting a tag in half.
    const flagPattern = /^((?:--|-)(?:[^- >:;&=\n]+))(=)?([^ >:;&\n]+)?/;
    const variantPattern = /^([:;]\.?)([^ >:;&\n]+)/;

    let result = "";
    let index = 0;

    while (index < text.length) {
        const char = text[index];
        const remaining = text.slice(index);

        const flagMatch = remaining.match(flagPattern);

        if (flagMatch) {
            const name = flagMatch[1];
            const equals = flagMatch[2] ?? 0;
            const value = flagMatch[3] ?? 0;

            const isKnownFlag = flagNames.some(flag => flag.startsWith(name));

            if (isKnownFlag)
                result += createSpan("flag-name", name);
            else
                result += escapeHtml(name);

            index += name.length;

            if (equals) {
                result += equals;
                index += equals.length;
            }

            if (equals && value) {
                if (isKnownFlag) {
                    result += value
                        .split("/")
                        .map(part => createSpan("flag-value", part))
                        .join("/");
                } else
                    result += escapeHtml(value);

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
        index++;
    }

    return result;
}

export const renderHighlighter = (text) => highlightText(text, variants, flags);