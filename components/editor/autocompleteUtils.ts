export type AutocompleteContext = {
    type: "macro" | "variant" | "flag" | "var";
    query: string;
    startIndex: number;
    triggerChar?: string;
};

function isEscaped(value: string, index: number): boolean {
    let slashCount = 0;

    for (let i = index - 1; i >= 0 && value[i] === "\\"; i--) {
        slashCount++;
    }

    return slashCount % 2 === 1;
}

function lastUnescapedIndex(value: string, character: string): number {
    for (let i = value.length - 1; i >= 0; i--) {
        if (value[i] === character && !isEscaped(value, i)) return i;
    }

    return -1;
}

export function getAutocompleteContext(
    value: string, 
    caretPos: number, 
    isRenderMode: boolean
): AutocompleteContext | null {
    const lineStart = value.lastIndexOf("\n", caretPos - 1) + 1;
    const textBeforeCaret = value.slice(lineStart, caretPos);
    
    // check if macro
    const lastOpenBracket = lastUnescapedIndex(textBeforeCaret, "[");
    const lastCloseBracket = lastUnescapedIndex(textBeforeCaret, "]");
    const lastSlash = lastUnescapedIndex(textBeforeCaret, "/");
    
    if (
        lastOpenBracket > lastCloseBracket &&
        lastOpenBracket > lastSlash
    ) {
        const macroStart = lastOpenBracket + 1;
        const query = textBeforeCaret.slice(macroStart);

        if (!query) return null;

        return {
            type: "macro",
            query,
            startIndex: lineStart + macroStart
        };
    }
    
    if (isRenderMode) {
        const wordMatch = textBeforeCaret.match(/\w+$/);
        if (!wordMatch) return null;

        // check if variant
        const colonIndex = textBeforeCaret.lastIndexOf(":");
        const semicolonIndex = textBeforeCaret.lastIndexOf(";");
        const variantIndex = Math.max(colonIndex, semicolonIndex);

        if (variantIndex !== -1) {
            const triggerChar = textBeforeCaret[variantIndex];
            const afterVariant = textBeforeCaret.slice(variantIndex);
            if (!/\s/.test(afterVariant)) {
                const query = textBeforeCaret.slice(variantIndex + 1);
                return {
                    type: "variant",
                    query,
                    startIndex: lineStart + variantIndex + 1,
                    triggerChar
                };
            }
        }
        
        // check if flag
        const lastDash = textBeforeCaret.lastIndexOf("-");
        if (lastDash !== -1) {
            const isDoubleDash = textBeforeCaret[lastDash - 1] === "-";
            const flagStartIndex = isDoubleDash ? lastDash + 2 : lastDash + 1;
                
            const afterDash = textBeforeCaret.slice(flagStartIndex);
            if (!/\s/.test(afterDash)) {
                return {
                    type: "flag",
                    query: afterDash,
                    startIndex: lineStart + flagStartIndex,
                };
            }
        }
    }
    
    return null;
}