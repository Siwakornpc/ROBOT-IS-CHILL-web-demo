export type AutocompleteContext = {
    type: "macro" | "variant" | "flag" | "tile";
    query: string;
    startIndex: number;
    triggerChar?: string;
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
        return {
            type: "macro",
            query,
            startIndex: lineStart + lastOpenBracket + 1 
        };
    }
    
    if (isRenderMode) {
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