const escapeHtml = (str) => str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const span = (
    className,
    textValue,
    kind = "",
    id = -1,
    depth = 0,
    pos = -1
) => {
    if (kind === "open" || kind === "close") {
        return `<span class="${className} ${kind}-bracket bracket-level-${depth % 3}" data-bid="${id}" data-pos="${pos}">${escapeHtml(textValue)}</span>`;
    }

    const position = pos >= 0 ? ` data-pos="${pos}"` : "";
    return `<span class="${className}"${position}>${escapeHtml(textValue)}</span>`;
};

const findBracketPairsInternal = (text) => {
    const pairStack = [];
    const topLevel = new Map(); // open index -> close index

    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\\") {
            i++;
        } else if (text[i] === "[") {
            pairStack.push(i);
        } else if (text[i] === "]" && pairStack.length) {
            const open = pairStack.pop();
            if (pairStack.length === 0) {
                topLevel.set(open, i);
            }
        }
    }

    return topLevel;
};

const typeWords = new Set([
    "number",
]);

function buildVariantTokens(text) {
    const topLevelPairs = findBracketPairsInternal(text);
    const tokens = [];

    const appendText = (textValue, className = "", pos = -1) => {
        const previous = tokens.at(-1);

        if (
            previous &&
            previous.type === "text" &&
            previous.className === className &&
            previous.pos + previous.text.length === pos
        ) {
            previous.text += textValue;
            return;
        }

        tokens.push({
            type: "text",
            text: textValue,
            className,
            pos,
        });
    };

    let insideVariant = false;
    let expectingParameter = false;
    let expectingValue = false;
    let seenFirstVariant = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (ch === "\n") {
            appendText(ch, "", i);
            continue;
        }

        if (ch === "\\" && next && escapable.has(next)) {
            appendText(ch + next, "type-escape", i);
            i++;
            continue;
        }

        if (ch === "<") {
            insideVariant = true;
            // Only the first <...> block is a variant-name block.
            // Every subsequent block is <param: value>, so start it
            // straight in "expecting a parameter name" mode.
            expectingParameter = seenFirstVariant;
            expectingValue = false;

            appendText(ch, "type-encapsulated", i);
            continue;
        }

        if (ch === ">" && insideVariant) {
            insideVariant = false;
            expectingParameter = false;
            expectingValue = false;
            seenFirstVariant = true;

            appendText(ch, "type-encapsulated", i);
            continue;
        }

        /*
         * Literal [ ... ] — whole match, brackets included, single class
         */
        if (ch === "[" && topLevelPairs.has(i)) {
            const close = topLevelPairs.get(i);
            const literalText = text.slice(i, close + 1);

            tokens.push({
                type: "bracket",
                pos: i,
                length: close - i + 1,
                html: span("type-literal", literalText, "", -1, 0, i),
            });

            i = close;
            continue;
        }

        /*
         * Other encapsulation characters (unmatched [ ] fall through here too)
         */
        if (/[()[\]{}]/.test(ch)) {
            appendText(ch, "type-encapsulated", i);
            continue;
        }

        /*
         * Inside <variant ...>
         */
        if (insideVariant) {
            if (!expectingParameter && !expectingValue) {
                const match = text
                    .slice(i)
                    .match(/^[A-Za-z_][A-Za-z0-9_]*/);

                if (match) {
                    const word = match[0];

                    appendText(
                        word,
                        "type-variantname",
                        i
                    );

                    i += word.length - 1;

                    if (text[i + 1] !== ":") {
                        expectingParameter = true;
                    }

                    continue;
                }
            }

            if (expectingParameter) {
                const match = text
                    .slice(i)
                    .match(/^[A-Za-z_][A-Za-z0-9_]*/);

                if (match) {
                    const word = match[0];

                    appendText(
                        word,
                        "type-variable",
                        i
                    );

                    i += word.length - 1;

                    continue;
                }

                if (ch === ":") {
                    appendText(ch, "", i);

                    expectingParameter = false;
                    expectingValue = true;

                    continue;
                }

                if (ch === "/") {
                    appendText(ch, "", i);
                    continue;
                }
            }

            if (expectingValue) {
                const stringMatch = text
                    .slice(i)
                    .match(/^"(?:\\.|[^"\\])*"/);

                if (stringMatch) {
                    appendText(
                        stringMatch[0],
                        "type-string",
                        i
                    );

                    i += stringMatch[0].length - 1;

                    continue;
                }

                const match = text
                    .slice(i)
                    .match(/^[A-Za-z_][A-Za-z0-9_]*/);

                if (match) {
                    const word = match[0];

                    appendText(
                        word,
                        typeWords.has(word)
                            ? "type-typeword"
                            : "type-value",
                        i
                    );

                    i += word.length - 1;

                    continue;
                }

                if (ch === "/") {
                    appendText(ch, "", i);

                    expectingValue = false;
                    expectingParameter = true;

                    continue;
                }

                appendText(ch, "type-value", i);
                continue;
            }

            appendText(ch, "type-variantname", i);
            continue;
        }

        /*
         * Outside <variant ...>
         */
        const match = text
            .slice(i)
            .match(/^[A-Za-z_][A-Za-z0-9_]*/);

        if (match) {
            const word = match[0];

            appendText(
                word,
                typeWords.has(word)
                    ? "type-typeword"
                    : "",
                i
            );

            i += word.length - 1;
        } else {
            appendText(ch, "", i);
        }
    }

    return tokens;
}

const tokenHtml = (token) => {
    if (token.type === "bracket") {
        return token.html;
    }

    if (token.text.includes("\n")) {
        return escapeHtml(token.text).replace(/\n/g, "<br>");
    }

    if (!token.className) {
        return escapeHtml(token.text);
    }

    return span(
        token.className,
        token.text,
        "",
        -1,
        0,
        token.pos
    );
};

export const variantHighlighter = (text) =>
    buildVariantTokens(text)
        .map(tokenHtml)
        .join("");

export const updateVariantStaticHighlight = (element, text) => {
    if (!element) return;

    element.innerHTML = variantHighlighter(text);
};