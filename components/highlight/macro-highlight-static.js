const escapeHtml = (str) => str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const span = (className, textValue, kind = "", id = -1, depth = 0, pos = -1, macroName = "") => {
    if (kind === "open" || kind === "close")
        return `<span class="${className} ${kind}-bracket bracket-level-${depth % 3}" data-bid="${id}" data-pos="${pos}">${escapeHtml(textValue)}</span>`;

    const position = pos >= 0 ? ` data-pos="${pos}"` : "";
    const macroAttribute = macroName ? ` data-macro-name="${escapeHtml(macroName)}"` : "";
    return `<span class="${className}"${position}${macroAttribute}>${escapeHtml(textValue)}</span>`;
};

// Shared escape-aware bracket pairing. Used both to know which "]" closes
// which "[" (validPairs) and to find the top-level (depth 0) [...] ranges,
// which is what combined-highlight.js needs to know where macro syntax
// "takes over" from render syntax.
const findBracketPairsInternal = (text) => {
    const validPairs = new Map();
    const pairStack = [];
    const topLevel = [];

    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\\") i++;
        else if (text[i] === "[") {
            pairStack.push(i);
        }
        else if (text[i] === "]" && pairStack.length) {
            const open = pairStack.pop();
            validPairs.set(open, i);
            if (pairStack.length === 0)
                topLevel.push([open, i]);
        }
    }

    return { validPairs, topLevel };
};

const specialTokens = [
    { regex: /^\$-?\d+/, className: "macro-custom-argument" },
    { regex: /^\$!/, className: "macro-custom-executor-mode" },
    { regex: /^\$#/, className: "macro-custom-argument-count" },
];

const matchSpecial = (text, i) => {
    if (text[i] !== "$") return null;
    const rest = text.slice(i);

    for (const { regex, className } of specialTokens) {
        const match = rest.match(regex);
        if (match) return { value: match[0], className };
    }

    return null;
};

// Builds the raw token list (same tokens macroHighlighter used to build
// inline). Kept separate so both macroHighlighter (joined string) and
// macroHighlightSegments (positioned pieces, for combined-highlight.js)
// can share one tokenizing pass.
const collectStoredVariables = (text) => {
    const { validPairs } = findBracketPairsInternal(text);
    const storedVariables = new Set();
    const bracketStack = [];

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];
        const curr = bracketStack.at(-1);

        if (ch === "[" && validPairs.has(i)) {
            bracketStack.push({
                close: validPairs.get(i),
                currentMacroName: "",
                currentArgText: "",
                argIndex: 0,
            });
        }
        else if (curr && ch === "]" && curr.close === i) {
            if (["store", "byte.set"].includes(curr.currentMacroName.trim()) && curr.currentArgText.trim()) {
                storedVariables.add(curr.currentArgText.trim());
            }
            bracketStack.pop();
        }
        else if (curr && ch === "/") {
            curr.argIndex++;
        }
        else if (curr) {
            if (curr.argIndex === 0) {
                curr.currentMacroName += ch;
            } else if (curr.argIndex === 1) {
                curr.currentArgText += ch;
            }
        }
        else if (ch === "\\" && next) {
            i++;
        }
    }

    return storedVariables;
};

const buildMacroTokens = (text, storedVariables = new Set()) => {
    const { validPairs } = findBracketPairsInternal(text);
    const knownStoredVariables = new Set(storedVariables);
    for (const storedVariable of collectStoredVariables(text)) {
        knownStoredVariables.add(storedVariable);
    }

    let bracketId = 0;
    const bracketStack = [];
    const escapable = new Set(["[", "]", "/", "\\", "$"]);
    const tokens = [];
    const current = () => bracketStack.at(-1);

    const appendText = (ch, className, pos) => {
        const last = tokens.at(-1);
        const resolvedClass = className || "";
        if (
            last &&
            last.type === "text" &&
            last.className === resolvedClass &&
            last.pos + last.text.length === pos
        )
            last.text += ch;
        else
            tokens.push({
                type: "text",
                text: ch,
                className: resolvedClass,
                pos: pos
            });
    };

    const flushArg1 = () => {
        const curr = current();
        if (!curr || curr.arg1Buffer.length === 0) return;
        const trimmed = curr.currentArgText.trim();
        let resolvedClassName = curr.arg1Buffer[0].empty ? "macro-empty" : "macro-value";

        if (
            ["store", "get", "is_stored", "drop", "load", "byte.set", "byte.get", "byte.splice"].includes(curr.currentMacroName)
            || knownStoredVariables.has(trimmed)
        ) {
            resolvedClassName = "macro-variable";
        }

        for (const item of curr.arg1Buffer) {
            appendText(item.ch, item.className || resolvedClassName, item.pos);
        }
        curr.arg1Buffer = [];
    };

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];
        const curr = current();

        if (ch === "\n") {
            if (curr && curr.argIndex === 1) flushArg1();
            appendText(ch, "", i);
        }
        else if (ch === "\\" && next && escapable.has(next)) {
            const state = curr ? (curr.argIndex > 0 ? "value" : "name") : "";
            const escapeClass = state === "value" ? "macro-value-escape" : "escape";
            if (curr && state === "value" && curr.argIndex === 1) {
                curr.arg1Buffer.push({ ch: ch + next, pos: i, empty: curr.empty });
                curr.currentArgText += ch + next;
            } else {
                if (curr && curr.argIndex === 1) flushArg1();
                appendText(ch + next, escapeClass, i);
            }
            i++;
        }
        else if (ch === "[" && validPairs.has(i)) {
            if (curr && curr.argIndex === 1) flushArg1();
            const id = bracketId++;
            const empty = validPairs.get(i) === i + 1 || next === "/";

            bracketStack.push({
                id,
                close: validPairs.get(i),
                empty,
                state: "name",
                currentMacroName: "",
                argIndex: 0,
                currentArgText: "",
                arg1Buffer: []
            });

            tokens.push({
                type: "bracket",
                pos: i,
                length: 1,
                html: span(empty ? "macro-empty" : "macro-brackets", "[", "open", id, bracketStack.length - 1, i),
            });
        }
        else if (curr && ch === "]" && curr.close === i) {
            if (curr.argIndex === 1) flushArg1();
            if (["store", "byte.set"].includes(curr.currentMacroName.trim()) && curr.currentArgText.trim())
                storedVariables.add(curr.currentArgText.trim());

            const item = bracketStack.pop();

            tokens.push({
                type: "bracket",
                pos: i,
                length: 1,
                html: span(item.empty ? "macro-empty" : "macro-brackets", "]", "close", item.id, bracketStack.length, i),
            });
        }
        else if (curr && ch === "/") {
            if (curr.argIndex === 1) flushArg1();
            curr.argIndex++;
            curr.state = "value";
            appendText(ch, curr.empty ? "macro-empty" : "macro-arg-separator", i);
        }
        else if (curr) {
            // Specials only apply in value state (after the first "/")
            const special = curr.argIndex > 0 ? matchSpecial(text, i) : null;

            if (special) {
                if (curr.argIndex === 1) {
                    curr.currentArgText += special.value;
                    curr.arg1Buffer.push({
                        ch: special.value,
                        pos: i,
                        empty: curr.empty,
                        className: special.className,
                    });
                } else {
                    appendText(special.value, special.className, i);
                }
                i += special.value.length - 1;
            }
            else if (curr.argIndex === 0) {
                curr.currentMacroName += ch;
                appendText(ch, curr.empty ? "macro-empty" : "macro-name", i);
            } else if (curr.argIndex === 1) {
                curr.currentArgText += ch;
                curr.arg1Buffer.push({ ch, pos: i, empty: curr.empty });
            } else {
                appendText(ch, curr.empty ? "macro-empty" : "macro-value", i);
            }
        }
        else {
            const special = matchSpecial(text, i);

            if (special) {
                appendText(special.value, special.className, i);
                i += special.value.length - 1;
            } else {
                appendText(ch, "", i);
            }
        }
    }

    return tokens;
};

const tokenHtml = (token) => {
    if (token.type === "bracket") return token.html;
    if (!token.className) return escapeHtml(token.text);
    return span(token.className, token.text, "", -1, 0, token.pos, token.className === "macro-name" ? token.text : "");
};

export const macroHighlighter = (text) => buildMacroTokens(text).map(tokenHtml).join("");

export const getStoredVariables = (text) => {
    const storedVariables = new Set();
    buildMacroTokens(text, storedVariables);
    return [...storedVariables];
};

export const updateMacroStaticHighlight = (element, text) => {
    if (!element) return;

    element.innerHTML = macroHighlighter(text);
};
