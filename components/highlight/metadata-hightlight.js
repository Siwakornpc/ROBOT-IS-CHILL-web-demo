const escapeHtml = (str) =>
    str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

const span = (className, textValue, pos = -1) => {
    const position = pos >= 0 ? ` data-pos="${pos}"` : "";

    return `<span class="${className}"${position}>${escapeHtml(textValue)}</span>`;
};


/*
 * Keywords / identifiers that should receive special highlighting.
 *
 * Add more names here as needed.
 */
const keywords = new Set([
    "for",
    "while",
    "try",
    "catch",
    "if",
    "else",
    "elif",
    "finally",
    "return",
    "in",
    "is",
    "not",
    "and",
    "or",
    "false",
    "true",
]);

const identifiers = new Set([
    "int",
    "string",
    "number",
    "bool",
    "float",
    "double",
    "bigint",
    "Literal",
    "Color",
]);

function getIdentifierClass(
    token,
    before,
    after
) {
    if (keywords.has(token)) {
        return "type-keyword";
    }

    if (identifiers.has(token)) {
        return "type-identifier";
    }

    if (/^\s*\(/.test(after)) {
        return "type-function";
    }

    if (/\d+/.test(after)) {
        return "type-number";
    }

    return "type-variable";
}


/*
 * Tokenize the value inside:
 *
 * <name: VALUE>
 */
function tokenizeValue(text, start, end) {
    const tokens = [];

    const tokenPattern =
        /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|[()[\]{}.,:|]|[+\-*/%=<>]|[\s]+|./g;

    const value = text.slice(start, end);

    let match;

    while ((match = tokenPattern.exec(value)) !== null) {
        const token = match[0];
        const localPos = match.index;
        const pos = start + localPos;

        const before = value.slice(0, localPos);
        const after = value.slice(
            localPos + token.length
        );


        /*
         * String
         */
        if (
            token.startsWith("'") ||
            token.startsWith('"')
        ) {
            tokens.push({
                type: "html",
                html: span(
                    "type-string",
                    token,
                    pos
                ),
            });

            continue;
        }


        /*
         * Number
         */
        if (/^\d+(?:\.\d+)?$/.test(token)) {
            tokens.push({
                type: "html",
                html: span(
                    "type-number",
                    token,
                    pos
                ),
            });

            continue;
        }


        /*
         * Identifier
         */
        if (/^[A-Za-z_$][\w$]*$/.test(token)) {
            const className = getIdentifierClass(
                token,
                before,
                after
            );

            tokens.push({
                type: "html",
                html: span(
                    className,
                    token,
                    pos
                ),
            });

            continue;
        }


        /*
         * Brackets
         */
        if (/^[()[\]{}]$/.test(token)) {
            tokens.push({
                type: "html",
                html: span(
                    "type-brackets",
                    token,
                    pos
                ),
            });

            continue;
        }


        /*
         * Operators
         */
        if (/^[+\-*/%=<>]$/.test(token)) {
            tokens.push({
                type: "html",
                html: span(
                    "type-operator",
                    token,
                    pos
                ),
            });

            continue;
        }


        /*
         * Punctuation
         */
        if (/^[.,:|]$/.test(token)) {
            tokens.push({
                type: "html",
                html: span(
                    "type-punctuation",
                    token,
                    pos
                ),
            });

            continue;
        }


        /*
         * Whitespace / unknown
         */
        tokens.push({
            type: "text",
            text: token,
            className: "",
            pos,
        });
    }

    return tokens;
}

/*
 * Parse:
 *
 * <f!|font!>
 */
function parseVariantNames(text, start) {
    const match = text
        .slice(start)
        .match(/^<([^:>]+)>/);

    if (!match) {
        return null;
    }

    const contents = match[1];
    const names = contents.split("|");

    const tokens = [];

    /*
     * <
     */
    tokens.push({
        type: "html",
        html: span(
            "type-encapsulated",
            "<",
            start
        ),
    });

    let pos = start + 1;

    names.forEach((name, index) => {
        /*
         * f!
         *
         * font!
         */
        tokens.push({
            type: "html",
            html: span(
                "type-variantname",
                name,
                pos
            ),
        });

        pos += name.length;


        /*
         * |
         */
        if (index < names.length - 1) {
            tokens.push({
                type: "html",
                html: "|"
            });

            pos++;
        }
    });


    /*
     * >
     */
    tokens.push({
        type: "html",
        html: span(
            "type-encapsulated",
            ">",
            pos
        ),
    });

    return {
        tokens,
        end: pos,
    };
}

function parseFlagNames(text, start) {
    const slice = text.slice(start);

    const flagPattern = /-{1,2}(?:[\w-]+|\[[^\]]+\])/g;

    let pos = start;
    const tokens = [];

    /*
     * Opening '('
     */
    if (text[pos] === "(") {
        tokens.push({
            type: "html",
            html: span(
                "type-encapsulated",
                "(",
                pos
            ),
        });

        pos++;
    }

    /*
     * Find flags until we reach something that is
     * not part of the flag expression.
     */
    flagPattern.lastIndex = pos - start;

    let match;

    while ((match = flagPattern.exec(slice)) !== null) {
        const flag = match[0];
        const flagStart = start + match.index;

        /*
         * Only accept the flag if it is the next meaningful
         * thing after the previous token.
         */
        const between = text.slice(pos, flagStart);

        if (!/^\s*(?:\|\s*)?$/.test(between)) {
            break;
        }

        /*
         * Preserve whitespace before the flag.
         */
        if (flagStart > pos) {
            tokens.push({
                type: "text",
                text: text.slice(pos, flagStart),
                className: "",
                pos,
            });
        }

        /*
         * Flag
         */
        tokens.push({
            type: "html",
            html: span(
                "type-flagname",
                flag,
                flagStart
            ),
        });

        pos = flagStart + flag.length;

        /*
         * Continue to the next flag.
         */
        const next = slice.slice(
            flagStart - start + flag.length
        );

        if (!/^\s*\|/.test(next)) {
            break;
        }

        /*
         * The next loop will consume the separator's
         * whitespace and '|'.
         */
        const separatorMatch = next.match(
            /^(\s*\|\s*)/
        );

        if (separatorMatch) {
            tokens.push({
                type: "text",
                text: separatorMatch[1],
                className: "",
                pos,
            });

            pos += separatorMatch[1].length;
            flagPattern.lastIndex =
                pos - start;
        }
    }

    /*
     * Closing ')'
     */
    if (text[pos] === ")") {
        tokens.push({
            type: "html",
            html: span(
                "type-encapsulated",
                ")",
                pos
            ),
        });

        pos++;
    }

    /*
     * We only parsed something if at least one flag
     * was actually found.
     */
    const hasFlag = tokens.some(
        token =>
            token.type === "html" &&
            token.html.includes("type-flag")
    );

    if (!hasFlag) {
        return null;
    }

    return {
        tokens,
        end: pos,
    };
}

/*
 * Parse:
 * <name: VALUE>
 */
function parseNamedValue(text, start) {
    const match = text.slice(start).match(/^<([A-Za-z_$][\w$]*):/);
    if (!match) return null;

    const name = match[1];
    const tokens = [];

    // Opening '<'
    tokens.push({
        type: "html",
        html: span("type-encapsulated", "<", start)
    });

    // Argument Name
    tokens.push({
        type: "html",
        html: span("type-argumentname", name, start + 1)
    });

    // Colon ':'
    const colonPos = start + name.length + 1;
    tokens.push({
        type: "html",
        html: ":",
    });

    // Find closing '>' balancing nested brackets/angle brackets
    let depthAngle = 1;
    let depthSquare = 0;
    let valueEnd = -1;

    for (let pos = colonPos + 1; pos < text.length; pos++) {
        const char = text[pos];
        if (char === '<') depthAngle++;
        else if (char === '>') {
            depthAngle--;
            if (depthAngle === 0) {
                valueEnd = pos;
                break;
            }
        } else if (char === '[') depthSquare++;
        else if (char === ']') depthSquare--;
    }

    if (valueEnd === -1) valueEnd = text.length;

    const valueStart = colonPos + 1;
    if (valueStart < valueEnd) {
        tokens.push(...tokenizeValue(text, valueStart, valueEnd));
    }

    // Closing '>'
    if (valueEnd < text.length) {
        tokens.push({
            type: "html",
            html: span("type-encapsulated", ">", valueEnd)
        });
    }

    return { tokens, end: valueEnd };
}

/*
 * Parse outermost brackets:
 * [x: int = 0] or [VALUE]
 */
function parseBracketed(text, start) {
    if (text[start] !== "[") return null;

    // Track matching bracket depth
    let depth = 0;
    let endPos = -1;

    for (let i = start; i < text.length; i++) {
        if (text[i] === "[") depth++;
        else if (text[i] === "]") {
            depth--;
            if (depth === 0) {
                endPos = i;
                break;
            }
        }
    }

    if (endPos === -1) endPos = text.length;

    const tokens = [];
    tokens.push({
        type: "html",
        html: span("type-encapsulated-optional", "[", start)
    });

    const innerText = text.slice(start + 1, endPos);
    const namedMatch = innerText.match(/^([A-Za-z_$][\w$]*)\s*:/);

    let valueStart = start + 1;

    if (namedMatch) {
        const argName = namedMatch[1];
        // Highlight optional argument name
        tokens.push({
            type: "html",
            html: span("type-argumentname", argName, start + 1)
        });

        const colonIndex = text.indexOf(":", start + 1);
        tokens.push({
            type: "html",
            html: ":",
        });

        valueStart = colonIndex + 1;
    }

    // Tokenize everything inside the outer brackets up to closing ]
    if (valueStart < endPos) {
        tokens.push(...tokenizeValue(text, valueStart, endPos));
    }

    if (endPos < text.length) {
        tokens.push({
            type: "html",
            html: span("type-encapsulated-optional", "]", endPos)
        });
    }

    return { tokens, end: endPos };
}

/*
 * Main tokenizer
 */
function buildVariantTokens(text) {
    const tokens = [];

    const appendText = (
        textValue,
        className = "",
        pos = -1
    ) => {
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


    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        /*
        * [x: int = 0]
        */
        if (ch === "[") {
            const bracketed = parseBracketed(text, i);
            if (bracketed) {
                tokens.push(...bracketed.tokens);
                i = bracketed.end;
                continue;
            }
        }

        /*
        * <f!|font!> or <name: VALUE>
        */
        if (ch === "<") {
            const variantNames = parseVariantNames(text, i);
            if (variantNames) {
                tokens.push(...variantNames.tokens);
                i = variantNames.end;
                continue;
            }

            const namedValue = parseNamedValue(text, i);
            if (namedValue) {
                tokens.push(...namedValue.tokens);
                i = namedValue.end;
                continue;
            }

            appendText("<", "", i);
            continue;
        }

        if (ch === "\n") {
            appendText("\n", "", i);
            continue;
        }

        appendText(ch, "", i);
    }

    return tokens;
}

function buildFlagTokens(text) {
    const tokens = [];

    const appendText = (
        textValue,
        className = "",
        pos = -1
    ) => {
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


    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (ch === "[") {
            const bracketed = parseBracketed(text, i);
            if (bracketed) {
                tokens.push(...bracketed.tokens);
                i = bracketed.end;
                continue;
            }
        }

        // NEW: flags start with "(" or "-", never "<"
        if (ch === "(" || ch === "-") {
            const flagNames = parseFlagNames(text, i);
            if (flagNames) {
                tokens.push(...flagNames.tokens);
                i = flagNames.end - 1;   // end is exclusive, unlike the other parsers
                continue;
            }
        }

        if (ch === "<") {
            const namedValue = parseNamedValue(text, i);   // parseFlagNames call removed from here
            if (namedValue) {
                tokens.push(...namedValue.tokens);
                i = namedValue.end;
                continue;
            }

            appendText("<", "", i);
            continue;
        }

        if (ch === "\n") {
            appendText("\n", "", i);
            continue;
        }

        appendText(ch, "", i);
    }

    return tokens;
}


/*
 * Convert tokens to HTML
 */
const tokenHtml = (token) => {
    if (token.type === "html") {
        return token.html;
    }

    if (token.text.includes("\n")) {
        return escapeHtml(token.text)
            .replace(/\n/g, "<br>");
    }

    if (!token.className) {
        return escapeHtml(token.text);
    }

    return span(
        token.className,
        token.text,
        token.pos
    );
};


/*
 * Public API
 */
export const variantHighlighter = (text, mode = "variant") =>
    buildVariantTokens(text, mode)
        .map(tokenHtml)
        .join("");

export const updateVariantStaticHighlight = (element, text, mode = "variant") => {
    if (!element) return;

    element.innerHTML = variantHighlighter(text, mode);
};

export const flagHighlighter = (text, mode = "variant") =>
    buildFlagTokens(text, mode)
        .map(tokenHtml)
        .join("");

export const updateFlagStaticHighlight = (element, text, mode = "variant") => {
    if (!element) return;

    element.innerHTML = flagHighlighter(text, mode);
};