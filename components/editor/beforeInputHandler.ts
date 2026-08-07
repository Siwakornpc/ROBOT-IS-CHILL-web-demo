import type { EditorState } from "./types";
import { lineStartOf } from "./lineUtils";
import { getCaret } from "./caretUtils";

type BeforeInputDeps = {
    editorArea: HTMLElement;
    state: EditorState;
    saveState: (start: number, end: number) => void;
    render: (start: number, end?: number) => void;
    undo: () => void;
    redo: () => void;
};

let isLeftBracketPressed = false;
let leftBracketPressedCount = 0;

export function clearLeftBracketStatesFromKeyDirections() {
    isLeftBracketPressed = false;
    leftBracketPressedCount = 0;
}

export function createBeforeInputHandler(deps: BeforeInputDeps) {
    const { editorArea, state, saveState, render, undo, redo } = deps;

    return function handleBeforeInput(e: InputEvent) {
        e.preventDefault();

        const value = state.value;
        const { start, end } = getCaret(editorArea, value.split("\n"));
        let newValue = value;
        let newStart = start;
        let newEnd = start;

        switch (e.inputType) {
            case "insertText":
            case "insertCompositionText": {
                const text = e.data ?? "";

                if (text === "[") {
                    isLeftBracketPressed = true;
                    leftBracketPressedCount++;
                    if (start !== end) {
                        newValue = value.slice(0, start) + "[" + value.slice(start, end) + "]" + value.slice(end);
                        newStart = start + 1;
                        newEnd = end + 1;
                    } else if (start === end) {
                        const nextChar = value[start];

                        if (/[^\]]/.test(nextChar) && nextChar !== undefined) {
                            newValue = value.slice(0, start) + "[" + value.slice(end);
                            newStart = newEnd = start + 1;
                        } else {
                            newValue = value.slice(0, start) + "[]" + value.slice(end);
                            newStart = newEnd = start + 1;
                        }
                    }
                } else if (text === "]") {
                    const shouldSkipClosingBracket =
                        start === end &&
                        value[start] === "]" &&
                        leftBracketPressedCount > 0;

                    if (shouldSkipClosingBracket) {
                        newValue = value;
                        newStart = newEnd = start + 1;
                    } else {
                        newValue = value.slice(0, start) + text + value.slice(end);
                        newStart = newEnd = start + text.length;
                    }

                    leftBracketPressedCount = Math.max(0, leftBracketPressedCount - 1);
                    isLeftBracketPressed = leftBracketPressedCount > 0;
                } else {
                    newValue = value.slice(0, start) + text + value.slice(end);
                    newStart = newEnd = start + text.length;
                    leftBracketPressedCount = 0;
                    isLeftBracketPressed = false;
                }
                console.log(isLeftBracketPressed, leftBracketPressedCount);
                break;
            }

            case "insertParagraph":
            case "insertLineBreak": {
                const ls = lineStartOf(value, start);
                const leading = value.slice(ls, start).match(/^[ \t]*/)?.[0] ?? "";
                const insert = "\n" + leading;

                newValue = value.slice(0, start) + insert + value.slice(end);
                newStart = newEnd = start + insert.length;
                break;
            }

            case "deleteContentBackward": {
                if (start !== end) {
                    newValue = value.slice(0, start) + value.slice(end);
                    newStart = newEnd = start;
                } else if (start > 0) {
                    const pairDelete = value[start - 1] === "[" && value[start] === "]";
                    const from = start - 1;
                    const to = pairDelete ? start + 1 : start;

                    newValue = value.slice(0, from) + value.slice(to);
                    newStart = newEnd = from;
                }
                break;
            }

            case "deleteContentForward": {
                if (start !== end) {
                    newValue = value.slice(0, start) + value.slice(end);
                    newStart = newEnd = start;
                } else if (start < value.length) {
                    const pairDelete = value[start] === "[" && value[start + 1] === "]";
                    newValue = value.slice(0, start) + value.slice(start + (pairDelete ? 2 : 1));
                    newStart = newEnd = start;
                }
                break;
            }

            case "deleteWordBackward": {
                const before = value.slice(0, start);
                const match = before.match(/[\w]*[^\w]*$/);
                const cut = match ? match[0].length : 0;
                const from = Math.max(0, start - Math.max(cut, 1));

                newValue = value.slice(0, from) + value.slice(end === start ? start : end);
                newStart = newEnd = from;
                break;
            }

            case "deleteWordForward": {
                if (start !== end) {
                    newValue = value.slice(0, start) + value.slice(end);
                    newStart = newEnd = start;
                    break;
                }

                const after = value.slice(start);
                const match = after.match(/^[^\w]*[\w]*/);
                const cut = match ? match[0].length : 0;
                const to = Math.min(value.length, start + Math.max(cut, 1));

                newValue = value.slice(0, start) + value.slice(to);
                newStart = newEnd = start;
                break;
            }

            case "deleteByCut": {
                if (start !== end) {
                    newValue = value.slice(0, start) + value.slice(end);
                }
                newStart = newEnd = start;
                break;
            }

            case "insertFromPaste":
            case "insertFromDrop": {
                const text = (e.dataTransfer && e.dataTransfer.getData("text/plain")) || e.data || "";
                newValue = value.slice(0, start) + text + value.slice(end);
                newStart = newEnd = start + text.length;
                break;
            }

            case "historyUndo":
                undo();
                return;

            case "historyRedo":
                redo();
                return;

            default: {
                if (e.data) {
                    newValue = value.slice(0, start) + e.data + value.slice(end);
                    newStart = newEnd = start + e.data.length;
                } else {
                    return;
                }
            }
        }

        state.value = newValue;
        saveState(newStart, newEnd);
        render(newStart, newEnd);
    };
}
