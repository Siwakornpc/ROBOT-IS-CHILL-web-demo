export type HistoryEntry = {
    value: string;
    start: number;
    end: number;
};

export type EditorApi = {
    value: string;
    focus(): void;
};

export type WindowWithEditor = Window & typeof globalThis & {
    editorReady?: Promise<EditorApi>;
    executionMode?: string;
    macroHighlighter?: (value: string) => string;
    renderHighlighter?: (value: string) => string;
    combinedHighlighter?: (value: string) => string;
    updateHighlightState?: (editorArea: HTMLElement, start: number, end: number) => void;
};

/*
    Mutable, shared-by-reference state for a single editor instance.
    Passed into the various handler/renderer factories so they all
    read and write the same live value instead of stale closures.
*/
export type EditorState = {
    value: string;
    history: HistoryEntry[];
    historyIndex: number;
    renderGen: number;
};

export type CaretPosition = {
    start: number;
    end: number;
};
