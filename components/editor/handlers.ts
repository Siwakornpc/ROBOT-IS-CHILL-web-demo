import type { EditorState } from "./types";
import { lineStartOf } from "./lineUtils";
import { getCaret } from "./caretUtils";
import { WindowWithEditor } from "./types";
import { offsetToLineColumn } from "./lineModel";
import { updateCurrentLineClass } from "./domUpdaters";
import { updateCaretMatch } from "./highlighting";
import { clearLeftBracketStatesFromKeyDirections } from "./beforeInputHandler";

export function createEditorClickHandler(editorArea: HTMLElement) {
    return function handleClick(e: MouseEvent) {
        if (e.target !== editorArea) return;

        const lastLine = editorArea.lastElementChild as HTMLElement | null;
        const textBottom = lastLine
            ? lastLine.getBoundingClientRect().bottom
            : editorArea.getBoundingClientRect().top + 10;

        if (e.clientY < textBottom) return;

        editorArea.focus({ preventScroll: true });
    };
}

type KeydownDeps = {
    editorArea: HTMLElement;
    state: EditorState;
    saveState: (start: number, end: number) => void;
    render: (start: number, end?: number) => void;
    undo: () => void;
    redo: () => void;
};

export function createKeydownHandler(deps: KeydownDeps) {
    const { editorArea, state, saveState, render, undo, redo } = deps;

    return function handleKeydown(e: KeyboardEvent) {
        if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown"
        ) {
            clearLeftBracketStatesFromKeyDirections();
        }

        if (e.key === "Tab") {
            e.preventDefault();

            const { start, end } = getCaret(editorArea, state.value.split("\n"));
            const indent = "    ";

            if (start === end) {
                if (e.shiftKey) {
                    const ls = lineStartOf(state.value, start);
                    const m = state.value.slice(ls, start).match(/[ \t]{1,4}$/);
                    if (!m) return;

                    state.value = state.value.slice(0, start - m[0].length) + state.value.slice(start);
                    const pos = start - m[0].length;
                    saveState(pos, pos);
                    render(pos, pos);
                    return;
                }

                state.value = state.value.slice(0, start) + indent + state.value.slice(end);
                saveState(start + indent.length, start + indent.length);
                render(start + indent.length, start + indent.length);
                return;
            }

            const lineStart = lineStartOf(state.value, start);
            let lineEnd = state.value.indexOf("\n", end);
            if (lineEnd === -1) lineEnd = state.value.length;

            const lines = state.value.slice(lineStart, lineEnd).split("\n");
            let firstLineDelta = 0;
            let totalDelta = 0;

            const newLines = lines.map((line, i) => {
                if (e.shiftKey) {
                    const m = line.match(/^( {1,4}|\t)/);
                    const cut = m ? m[0].length : 0;
                    if (i === 0) firstLineDelta = -cut;
                    totalDelta -= cut;
                    return cut ? line.slice(cut) : line;
                }

                if (i === 0) firstLineDelta = indent.length;
                totalDelta += indent.length;
                return indent + line;
            });

            state.value = state.value.slice(0, lineStart) + newLines.join("\n") + state.value.slice(lineEnd);

            const newStart = Math.max(lineStart, start + firstLineDelta);
            const newEnd = end + totalDelta;

            saveState(newStart, newEnd);
            render(newStart, newEnd);
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            redo();
        }
    };
}

type SelectionDeps = {
    win: WindowWithEditor;
    editorArea: HTMLElement;
    gutterEl: HTMLElement;
    state: EditorState;
};

export function createSelectionChangeHandler(deps: SelectionDeps) {
    const { win, editorArea, gutterEl, state } = deps;

    return function handleSelectionChange() {
        if (document.activeElement !== editorArea) return;

        const lines = state.value.split("\n");
        const { start, end } = getCaret(editorArea, lines);
        const { lineIndex } = offsetToLineColumn(lines, start);

        const lineEls = Array.from(editorArea.children) as HTMLElement[];
        updateCurrentLineClass(lineEls, lineIndex);

        Array.from(gutterEl.children).forEach((el, i) => {
            el.classList.toggle("active", i === lineIndex);
        });

        updateCaretMatch(win, editorArea, start, end);
    };
}