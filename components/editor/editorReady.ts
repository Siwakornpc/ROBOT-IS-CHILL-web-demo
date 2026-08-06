import type { EditorApi, WindowWithEditor } from "./types";

export let resolveEditorReady: ((api: EditorApi) => void) | null = null;

export function setResolveEditorReady(fn: (api: EditorApi) => void) {
    resolveEditorReady = fn;
}

export function ensureEditorReady() {
    if (typeof window === "undefined") {
        return null;
    }

    const win = window as WindowWithEditor;
    if (!win.editorReady) {
        win.editorReady = new Promise<EditorApi>((resolve) => {
            resolveEditorReady = resolve;
        });
    }

    return win.editorReady;
}

if (typeof window !== "undefined") {
    ensureEditorReady();
}
