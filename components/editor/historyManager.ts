import type { EditorState } from "./types";

export function createHistoryManager(
    state: EditorState,
    render: (start: number, end: number) => void,
    onCodeChange?: (code: string) => void
) {
    function saveState(start: number, end: number) {
        const entry = { value: state.value, start, end };
        const cur = state.history[state.historyIndex];

        if (cur && cur.value === entry.value && cur.start === start && cur.end === end) {
            return;
        }

        state.history.splice(state.historyIndex + 1);
        state.history.push(entry);
        state.historyIndex++;
    }

    function undo() {
        if (state.historyIndex <= 0) return;
        state.historyIndex--;
        const entry = state.history[state.historyIndex];
        state.value = entry.value;
        onCodeChange?.(state.value);
        render(entry.start, entry.end);
    }

    function redo() {
        if (state.historyIndex >= state.history.length - 1) return;
        state.historyIndex++;
        const entry = state.history[state.historyIndex];
        state.value = entry.value;
        onCodeChange?.(state.value);
        render(entry.start, entry.end);
    }

    return { saveState, undo, redo };
}
