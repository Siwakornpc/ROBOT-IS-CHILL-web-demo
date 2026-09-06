export type AutocompleteContext = {
    type: "macro" | "variant" | "tile";
    query: string;
    startIndex: number;
};

export function getAutocompleteContext(
    value: string, 
    caretPos: number, 
    isRenderMode: boolean
): AutocompleteContext | null {
    const lineStart = value.lastIndexOf("\n", caretPos - 1) + 1;
    const textBeforeCaret = value.slice(lineStart, caretPos);
    
    // check if macro
    const lastOpenBracket = textBeforeCaret.lastIndexOf("[");
    const lastCloseBracket = textBeforeCaret.lastIndexOf("]");
    
    if (lastOpenBracket > lastCloseBracket) {
        const query = textBeforeCaret.slice(lastOpenBracket + 1);
        return { type: "macro", query, startIndex: lineStart + lastOpenBracket + 1 };
    }
    
    // check if variant
    if (isRenderMode) {
        const colonIndex = textBeforeCaret.lastIndexOf(":");
        if (colonIndex !== -1) {
            const afterColon = textBeforeCaret.slice(colonIndex);
            if (!/\s/.test(afterColon)) {
                const query = textBeforeCaret.slice(colonIndex + 1);
                return { type: "variant", query, startIndex: lineStart + colonIndex + 1 };
            }
        }
    }
    
    return null;
}