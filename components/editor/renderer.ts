import type { EditorState, WindowWithEditor } from "./types";
import { clamp } from "./lineUtils";
import { offsetToLineColumn } from "./lineModel";
import { setRange } from "./caretUtils";
import { updateGutter, updateCurrentLineClass, syncGutterScroll } from "./domUpdaters";
import { highlight, updateCaretMatch } from "./highlighting";

type RendererDeps = {
    win: WindowWithEditor;
    editorArea: HTMLElement;
    gutterEl: HTMLElement;
    gutterWrap: HTMLElement;
    scrollEl: HTMLElement;
    state: EditorState;
};

function escapeHtml(text: string) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// creates an innerHTML for one line: highlighted content, or a bare <br> for an empty line height.
function renderLineHtml(win: WindowWithEditor, lineText: string) {
    if (lineText.length === 0) {
        return "<br>";
    }

    const highlighted = highlight(win, lineText);
    return highlighted ?? escapeHtml(lineText);
}

export function createRenderer(deps: RendererDeps) {
    const { win, editorArea, gutterEl, gutterWrap, scrollEl, state } = deps;

    function render(start: number, end = start) {
        const gen = ++state.renderGen;

        const lines = state.value.split("\n");

        editorArea.innerHTML = lines
            .map((lineText) => `<div class="editor-line">${renderLineHtml(win, lineText)}</div>`)
            .join("");

        const s = clamp(start, 0, state.value.length);
        const e = clamp(end, 0, state.value.length);

        setRange(editorArea, lines, s, e);

        const { lineIndex } = offsetToLineColumn(lines, s);
        const lineEls = Array.from(editorArea.children) as HTMLElement[];

        updateGutter(gutterEl, lineEls, lineIndex);
        updateCurrentLineClass(lineEls, lineIndex);
        updateCaretMatch(win, editorArea, s, e);
        syncGutterScroll(gutterWrap, scrollEl);

        requestAnimationFrame(() => {
            if (gen !== state.renderGen) return;
            if (document.activeElement !== editorArea) return;
            setRange(editorArea, lines, s, e);
        });
    }

    return render;
}
