import type { WindowWithEditor } from "./types";
import { macroHighlighter, updateHighlightState as updateMacroHighlightState } from "@/components/highlight/macro-highlight.js";
import { combinedHighlighter } from "@/components/highlight/combined-highlight.js";

export function highlight(win: WindowWithEditor, text: string) {
    const isRenderMode = win.executionMode === "=t" || win.executionMode === "=r";

    if (!isRenderMode) {
        return macroHighlighter(text);
    }

    return combinedHighlighter(text);
}

export function updateCaretMatch(win: WindowWithEditor, editorArea: HTMLElement, start: number, end: number) {
    updateMacroHighlightState(editorArea, start, end);
}
