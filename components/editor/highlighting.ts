import type { WindowWithEditor } from "./types";

export function highlight(win: WindowWithEditor, text: string) {
    const isRenderMode = win.executionMode === "=t" || win.executionMode === "=r";

    if (!isRenderMode) {
        return win.macroHighlighter?.(text);
    }

    return win.combinedHighlighter?.(text);
}

export function updateCaretMatch(win: WindowWithEditor, editorArea: HTMLElement, start: number, end: number) {
    win.updateHighlightState?.(editorArea, start, end);
}
