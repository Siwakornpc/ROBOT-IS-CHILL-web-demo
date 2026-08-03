if (typeof window !== "undefined") {
    window.macroHighlighter = (text) => {
        const escapeHtml = (str) => str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const span = (className, textValue, kind = "", id = -1, depth = 0, pos = -1) => {
            if (kind === "open" || kind === "close") {
                return `<span class="${className} ${kind}-bracket bracket-level-${depth % 3}" data-bid="${id}" data-pos="${pos}">${escapeHtml(textValue)}</span>`;
            }

            const position = pos >= 0 ? ` data-pos="${pos}"` : "";
            return `<span class="${className}"${position}>${escapeHtml(textValue)}</span>`;
        };

        const validPairs = new Map();
        const pairStack = [];

        for (let i = 0; i < text.length; i++) {
            if (text[i] === "\\") {
                i++;
            }
            else if (text[i] === "[") {
                pairStack.push(i);
            }
            else if (text[i] === "]" && pairStack.length) {
                validPairs.set(pairStack.pop(), i);
            }
        }

        const tokens = [];
        const appendText = (textValue, className = "", pos = -1) => {
            const previous = tokens.at(-1);

            if (
                previous
                && previous.type === "text"
                && previous.className === className
                && previous.pos + previous.text.length === pos
            ) {
                previous.text += textValue;
                return;
            }

            tokens.push({ type: "text", text: textValue, className, pos });
        };

        let bracketId = 0;
        const stateStack = [];
        const bracketStack = [];
        const escapable = new Set(["[", "]", "/", "\\", "$"]);

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = text[i + 1];

            if (ch === "\\" && next && escapable.has(next)) {
                const state = stateStack.at(-1);
                appendText(ch + next, state === "value" ? "macro-value-escape" : "escape", i);
                i++;
            }
            else if (ch === "[" && validPairs.has(i)) {
                const id = bracketId++;
                const empty = validPairs.get(i) === i + 1 || next === "/";
                bracketStack.push({ id, close: validPairs.get(i), empty });
                stateStack.push("name");
                tokens.push({
                    type: "bracket",
                    html: span(empty ? "macro-empty" : "macro-brackets", "[", "open", id, bracketStack.length - 1, i),
                });
            }
            else if (ch === "]" && bracketStack.length && bracketStack.at(-1).close === i) {
                const item = bracketStack.pop();
                stateStack.pop();
                tokens.push({
                    type: "bracket",
                    html: span(item.empty ? "macro-empty" : "macro-brackets", "]", "close", item.id, bracketStack.length, i),
                });
            }
            else if (stateStack.length && ch === "/") {
                stateStack[stateStack.length - 1] = "value";
                appendText(ch, bracketStack.at(-1).empty ? "macro-empty" : "macro-arg-separator", i);
            }
            else if (stateStack.length) {
                const current = bracketStack.at(-1);
                appendText(
                    ch,
                    current.empty ? "macro-empty" : (stateStack.at(-1) === "name" ? "macro-name" : "macro-value"),
                    i,
                );
            }
            else {
                appendText(ch, "", i);
            }
        }

        return tokens.map((token) => {
            if (token.type === "bracket") return token.html;
            if (!token.className) return escapeHtml(token.text);
            return span(token.className, token.text, "", -1, 0, token.pos);
        }).join("");
    };

    window.updateHighlightState = (editorArea, start, end) => {
        editorArea
            .querySelectorAll(".macro-bracket-match")
            .forEach(el => el.classList.remove("macro-bracket-match"));

        editorArea
            .querySelectorAll(".selection")
            .forEach(el => el.classList.remove("selection"));

        const syntaxTokens = Array.from(editorArea.querySelectorAll(
            ".macro-name, .macro-value, .macro-empty, .escape, .macro-value-escape"
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

            if (activeToken?.classList.contains("macro-name") || activeToken?.classList.contains("macro-value")) {
                const tokenText = activeToken.textContent;
                const tokenClass = activeToken.classList.contains("macro-name") ? "macro-name" : "macro-value";

                syntaxTokens
                    .filter(el => el.classList.contains(tokenClass) && el.textContent === tokenText)
                    .forEach(el => el.classList.add("selection"));
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
            if (start >= left && start <= right + 1 && right - left < bestWidth) {
                bestWidth = right - left;
                bestPair = pair;
            }
        }

        bestPair?.forEach(item => item.el.classList.add("macro-bracket-match"));
    };
}
