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

// Builds the raw token list (same tokens macroHighlighter used to build
// inline). Kept separate so both macroHighlighter (joined string) and
// macroHighlightSegments (positioned pieces, for combined-highlight.js)
// can share one tokenizing pass.
const buildMacroTokens = (text, storedVariables = new Set()) => {
    const { validPairs } = findBracketPairsInternal(text);

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

        if (["store", "get", "is_stored", "drop"].includes(curr.currentMacroName))
            resolvedClassName = "macro-variable";
        else if (["load", "byte.set", "byte.get"].includes(curr.currentMacroName))
            resolvedClassName = storedVariables.has(trimmed) ? "macro-variable" : "error";

        for (const item of curr.arg1Buffer) {
            appendText(item.ch, resolvedClassName, item.pos);
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
            if (curr.currentMacroName === "store" && curr.currentArgText.trim())
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
            if (curr.argIndex === 0) {
                curr.currentMacroName += ch;
                appendText(ch, curr.empty ? "macro-empty" : "macro-name", i);
            } else if (curr.argIndex === 1) {
                curr.currentArgText += ch;
                curr.arg1Buffer.push({ ch, pos: i, empty: curr.empty });
            } else {
                let className = curr.empty ? "macro-empty" : "macro-value";
                appendText(ch, className, i);
            }
        }
        else {
            appendText(ch, "", i);
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

// Same output as macroHighlighter, but as {start, end, html} pieces
// instead of one joined string, so combined-highlight.js can pick out
// just the pieces that fall inside a given [...] range and drop the rest.
export const macroHighlightSegments = (text) =>
    buildMacroTokens(text).map((token) => ({
        start: token.pos,
        end: token.pos + (token.type === "bracket" ? token.length : token.text.length),
        html: tokenHtml(token),
    }));

// Top-level (depth 0) [start, end] bracket ranges (inclusive), e.g. for
// "[/any[thing]]" this returns [[0, 12]] — the outer pair only.
export const findTopLevelBrackets = (text) => findBracketPairsInternal(text).topLevel;

export const updateHighlightState = (editorArea, start, end) => {
    editorArea
        .querySelectorAll(".macro-bracket-match")
        .forEach(el => el.classList.remove("macro-bracket-match"));

    editorArea
        .querySelectorAll(".selection")
        .forEach(el => el.classList.remove("selection"));

    const syntaxTokens = Array.from(editorArea.querySelectorAll(
        ".macro-name, .macro-value, .macro-empty, .escape, .macro-value-escape, .macro-variable, .error"
    ));

    if (start !== end) {
        syntaxTokens.forEach(el => {
            const tokenStart = el.dataset.pos;
            if (tokenStart === undefined) return;

            const from = Number(tokenStart);
            const to = from + el.textContent.length;
            if (from < end && to > start) {
                el.classList.add("selection");
            }
        });
    }
    else {
        const activeToken = syntaxTokens.find(el => {
            const from = Number(el.dataset.pos);
            const to = from + el.textContent.length;
            return start > from && start <= to;
        }) ?? syntaxTokens.find(el => Number(el.dataset.pos) === start);

        if (activeToken) {
            const tokenText = activeToken.textContent.trim();

            // If clicking a value, variable, or error token, match all instances with the same text name
            if (
                activeToken.classList.contains("macro-value") ||
                activeToken.classList.contains("macro-variable") ||
                activeToken.classList.contains("error")
            ) {
                syntaxTokens
                    .filter(el => 
                        (el.classList.contains("macro-value") ||
                         el.classList.contains("macro-variable") ||
                         el.classList.contains("error")) &&
                        el.textContent.trim() === tokenText &&
                        tokenText !== ""
                    )
                    .forEach(el => el.classList.add("selection"));
            } 
            else if (activeToken.classList.contains("macro-name")) {
                syntaxTokens
                    .filter(el => el.classList.contains("macro-name") && el.textContent === activeToken.textContent)
                    .forEach(el => el.classList.add("selection"));
            }
        }
    }

    const pairs = new Map();
    editorArea
        .querySelectorAll(".open-bracket, .close-bracket")
        .forEach(el => {
            const id = el.dataset.bid;
            const pos = Number(el.dataset.pos);
            if (!pairs.has(id)) pairs.set(id, []);
            pairs.get(id).push({ pos, el });
        });

    let bestPair = null;
    let bestWidth = Infinity;

    for (const pair of pairs.values()) {
        if (pair.length !== 2) continue;

        const left = Math.min(pair[0].pos, pair[1].pos);
        const right = Math.max(pair[0].pos, pair[1].pos);

        if (start >= left && start <= right) {
            if (right - left < bestWidth) {
                bestWidth = right - left;
                bestPair = pair;
            }
        }
    }

    if (!bestPair) {
        const pairStartingAtCaret = [...pairs.values()].find(pair =>
            pair.length === 2 &&
            pair.some(item => item.pos === start)
        );

        if (pairStartingAtCaret) bestPair = pairStartingAtCaret;
        else {
            for (const pair of pairs.values()) {
                if (pair.length !== 2) continue;

                const right = Math.max(pair[0].pos, pair[1].pos);

                if (right === start - 1) {
                    if (!bestPair || right - Math.min(pair[0].pos, pair[1].pos) < bestWidth) {
                        bestPair = pair;
                        bestWidth = right - Math.min(pair[0].pos, pair[1].pos);
                    }
                }
            }
        }
    }

    bestPair?.forEach(item => item.el.classList.add("macro-bracket-match"));
};