import type { EditorState } from "./types";
import { lineStartOf } from "./lineUtils";
import { getCaret } from "./caretUtils";
import { WindowWithEditor } from "./types";
import { offsetToLineColumn } from "./lineModel";
import { updateCurrentLineClass } from "./domUpdaters";
import { updateCaretMatch } from "./highlighting";
import { clearLeftBracketStatesFromKeyDirections } from "./beforeInputHandler";

export function createEditorClickHandler(editorArea: HTMLElement, onFocusToEnd?: () => void) {
    return function handleClick(e: MouseEvent) {
        if (e.target !== editorArea) return;

        const lastLine = editorArea.lastElementChild as HTMLElement | null;
        const textBottom = lastLine
            ? lastLine.getBoundingClientRect().bottom
            : editorArea.getBoundingClientRect().top + 10;

        if (e.clientY < textBottom) return;

        editorArea.focus({ preventScroll: true });
        onFocusToEnd?.();
    };
}

type KeydownDeps = {
    editorArea: HTMLElement;
    state: EditorState;
    saveState: (start: number, end: number) => void;
    render: (start: number, end?: number) => void;
    undo: () => void;
    redo: () => void;
    onCodeChange?: (code: string) => void;
};

const INDENT = "    ";
const INDENT_SIZE = 4;

function getLineStart(value: string, offset: number): number {
    const i = value.lastIndexOf("\n", offset - 1);
    return i === -1 ? 0 : i + 1;
}

function getLineEnd(value: string, offset: number): number {
    const i = value.indexOf("\n", offset);
    return i === -1 ? value.length : i;
}

function getLineIndent(line: string): string {
    const match = line.match(/^[ \t]*/);
    return match?.[0] ?? "";
}

function indentationColumns(indent: string): number {
    let columns = 0;

    for (const ch of indent) {
        if (ch === "\t") {
            columns += INDENT_SIZE - (columns % INDENT_SIZE);
        } else {
            columns++;
        }
    }

    return columns;
}

function removeOneIndentLevel(indent: string): string {
    if (!indent) return indent;

    let columns = 0;
    let removeChars = 0;

    for (const ch of indent) {
        const width = ch === "\t"
            ? INDENT_SIZE - (columns % INDENT_SIZE)
            : 1;

        if (columns + width > INDENT_SIZE) {
            break;
        }

        columns += width;
        removeChars++;
    }

    return indent.slice(removeChars);
}

function spacesToNextTabStop(column: number): number {
    return INDENT_SIZE - (column % INDENT_SIZE);
}

function indentAtCaret(
    value: string,
    position: number,
): { value: string; position: number } {
    const lineStart = getLineStart(value, position);
    const beforeCaret = value.slice(lineStart, position);

    const leadingWhitespace = getLineIndent(beforeCaret);

    const column = indentationColumns(leadingWhitespace);
    const visualColumn = leadingWhitespace.length === beforeCaret.length
        ? column
        : column + (beforeCaret.length - leadingWhitespace.length);

    const spaces = spacesToNextTabStop(visualColumn);
    const newValue = value.slice(0, position) + " ".repeat(spaces) + value.slice(position);

    return {
        value: newValue,
        position: position + spaces,
    };
}

/**
 * Unindents one line and returns the new caret position.
 */
function unindentLine(
    value: string,
    position: number,
): { value: string; position: number } {
    const lineStart = getLineStart(value, position);
    const lineEnd = getLineEnd(value, position);
    const line = value.slice(lineStart, lineEnd);

    const oldIndent = getLineIndent(line);

    if (!oldIndent) {
        return { value, position };
    }

    const newIndent = removeOneIndentLevel(oldIndent);
    const removed = oldIndent.length - newIndent.length;

    const newValue = value.slice(0, lineStart) + newIndent + value.slice(lineStart + oldIndent.length);

    return {
        value: newValue,
        position: Math.max(lineStart, position - removed),
    };
}


export function createKeydownHandler(deps: KeydownDeps) {
    const { editorArea, state, saveState, render, undo, redo, onCodeChange } = deps;

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

            const lines = state.value.split("\n");
            const { start, end } = getCaret(editorArea, lines);

            if (start === end) {
                if (e.shiftKey) {
                    const { value, position } = unindentLine(state.value, start);

                    if (value === state.value) return;

                    state.value = value;

                    onCodeChange?.(state.value);
                    saveState(position, position);
                    render(position, position);
                    return;
                }

                const result = indentAtCaret(state.value, start);

                state.value = result.value;

                onCodeChange?.(state.value);
                saveState(result.position, result.position);
                render(result.position, result.position);
                return;
            }

            const firstLineStart = getLineStart(state.value, start);

            let lastLineEnd = getLineEnd(
                state.value,
                end,
            );

            if (
                end > start &&
                end === getLineStart(state.value, end) &&
                end > firstLineStart
            ) lastLineEnd = end - 1;

            const selectedText = state.value.slice(firstLineStart, lastLineEnd);
            const selectedLines = selectedText.split("\n");

            let totalDelta = 0;
            let firstLineDelta = 0;

            const newLines = selectedLines.map((line, index) => {
                if (e.shiftKey) {
                    const oldIndent = getLineIndent(line);
                    const newIndent = removeOneIndentLevel(oldIndent);
                    const delta = newIndent.length - oldIndent.length;

                    if (index === 0) {
                        firstLineDelta = delta;
                    }

                    totalDelta += delta;

                    return (newIndent + line.slice(oldIndent.length));
                }

                if (index === 0) {
                    firstLineDelta = INDENT.length;
                }

                totalDelta += INDENT.length;
                return INDENT + line;
            });

            const replacement = newLines.join("\n");

            state.value = state.value.slice(0, firstLineStart) + replacement + state.value.slice(lastLineEnd);

            onCodeChange?.(state.value);

            const newStart = Math.max(firstLineStart, start + firstLineDelta);
            const newEnd = Math.max(newStart, end + totalDelta);

            saveState(newStart, newEnd);
            render(newStart, newEnd);

            return;
        }

        if (e.key === "Backspace") {
            const lines = state.value.split("\n");
            const { start, end } = getCaret(editorArea, lines);

            if (start !== end) return;
            if (start === 0) return;

            const lineStart = getLineStart(state.value, start);
            const beforeCaret = state.value.slice(lineStart, start);

            const indent = getLineIndent(beforeCaret);

            if (beforeCaret === indent && indent.length > 0) {
                e.preventDefault();

                const { value, position } = unindentLine(state.value, start);

                state.value = value;

                onCodeChange?.(state.value);
                saveState(position, position);
                render(position, position);
                return;
            }

            if (beforeCaret.length === 0) {
                e.preventDefault();

                const deleteAt = start - 1;

                state.value = state.value.slice(0, deleteAt) + state.value.slice(start);

                const position = deleteAt;

                onCodeChange?.(state.value);
                saveState(position, position);
                render(position, position);
                return;
            }

            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.code.toLowerCase() === "keyz") {
            e.preventDefault();
            if (e.shiftKey) redo(); else undo();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.code.toLowerCase() === "keyy") {
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