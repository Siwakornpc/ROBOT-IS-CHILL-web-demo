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
    onCodeChange?: (code: string) => void;
};

function escapeHtml(text: string) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// wraps one already-highlighted line's HTML, or a bare <br> for an empty line height.
function renderLineHtml(highlightedLine: string) {
    return highlightedLine.length === 0 ? "<br>" : highlightedLine;
}

// Highlights the whole document in a single pass (not line-by-line) so that
// bracket/escape state, and therefore data-pos/data-bid, stay correct across
// line breaks - a macro call (or anything else tracking state) that spans
// multiple lines only tokenizes correctly if the highlighter sees it as one
// continuous string. The highlighters guarantee no "\n" ever ends up inside a
// <span>, so splitting the result on "\n" is safe and gives us exactly one
// HTML chunk per source line, lining up 1:1 with `lines`.
function highlightLines(win: WindowWithEditor, lines: string[], value: string) {
    const highlighted = highlight(win, value) ?? escapeHtml(value);
    const highlightedLines = highlighted.split("\n");

    // Defensive fallback: if a highlighter ever produces a different number of
    // lines than the source (e.g. not yet loaded), fall back per-line so
    // rendering doesn't desync from the model.
    if (highlightedLines.length !== lines.length) {
        return lines.map((lineText) => (highlight(win, lineText) ?? escapeHtml(lineText)));
    }

    return highlightedLines;
}

// Gets all node elements of ".editor-line", and get the selection of the range
// if it has a node element. Then get the current line node closest to the
// caret. Identify the layout boundaries using the first and last children
// elements, which will then used in a condition to scroll all the way when the
// caret reaches the end of the text area.
function scrollCaretIntoView(scrollEl: HTMLElement) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let node: Node | null = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
    }

    const currentLine = (node as HTMLElement | null)?.closest?.(".editor-line") as HTMLElement | null;
    if (!currentLine) return;

    const firstLine = currentLine.parentElement?.firstElementChild;
    const lastLine = currentLine.parentElement?.lastElementChild;

    if (currentLine === firstLine) {
        scrollEl.scrollTop = 0;
    } else if (currentLine === lastLine) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
    } else {
        currentLine.scrollIntoView({
            block: "nearest",
        });
    }
}

export function createRenderer(deps: RendererDeps) {
    const {
        win,
        editorArea,
        gutterEl,
        gutterWrap,
        scrollEl,
        state,
        onCodeChange,
    } = deps;

    let lastNotifiedValue = state.value;

    function render(start: number, end = start) {
        const gen = ++state.renderGen;

        const lines = state.value.split("\n");

        if (state.value !== lastNotifiedValue) {
            lastNotifiedValue = state.value;
            onCodeChange?.(state.value);
        }

        const highlightedLines = highlightLines(win, lines, state.value);

        editorArea.innerHTML = highlightedLines
            .map((lineHtml) => `<div class="editor-line">${renderLineHtml(lineHtml)}</div>`)
            .join("");

        const s = clamp(start, 0, state.value.length);
        const e = clamp(end, 0, state.value.length);

        setRange(editorArea, lines, s, e);
        scrollCaretIntoView(scrollEl);

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
            scrollCaretIntoView(scrollEl);
        });
    }

    return render;
}
