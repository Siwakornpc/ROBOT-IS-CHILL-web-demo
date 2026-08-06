import { useEffect, type RefObject } from "react";
import type { EditorApi, EditorState, WindowWithEditor } from "./types";
import { ensureEditorReady, resolveEditorReady } from "./editorReady";
import { createHistoryManager } from "./historyManager";
import { createRenderer } from "./renderer";
import { createBeforeInputHandler } from "./beforeInputHandler";
import {
    createKeydownHandler,
    createSelectionChangeHandler,
    createEditorClickHandler }
from "./handlers";
import { getCaret } from "./caretUtils";

type EditorRefs = {
    editorAreaRef: RefObject<HTMLDivElement | null>;
    gutterElRef: RefObject<HTMLDivElement | null>;
    gutterWrapRef: RefObject<HTMLDivElement | null>;
    scrollElRef: RefObject<HTMLDivElement | null>;
};

export function useEditorEngine({
    editorAreaRef,
    gutterElRef,
    gutterWrapRef,
    scrollElRef,
}: EditorRefs) {
    useEffect(() => {
        const editorArea = editorAreaRef.current;
        const gutterEl = gutterElRef.current;
        const gutterWrap = gutterWrapRef.current;
        const scrollEl = scrollElRef.current;

        if (!editorArea || !gutterEl || !gutterWrap || !scrollEl) {
            return;
        }

        const win = window as WindowWithEditor;
        ensureEditorReady();

        const state: EditorState = {
            value: "",
            history: [],
            historyIndex: -1,
            renderGen: 0,
        };

        const render = createRenderer({
            win,
            editorArea,
            gutterEl,
            gutterWrap,
            scrollEl,
            state,
        });

        const { saveState, undo, redo } = createHistoryManager(state, render);

        const handleBeforeInput = createBeforeInputHandler({ editorArea, state, saveState, render, undo, redo });
        const handleKeydown = createKeydownHandler({ editorArea, state, saveState, render, undo, redo });
        const handleSelectionChange = createSelectionChangeHandler({ win, editorArea, gutterEl, state });
        const handleClick = createEditorClickHandler(editorArea);

        const handleScroll = () => {
            gutterWrap.scrollTop = scrollEl.scrollTop;
        };

        editorArea.addEventListener("beforeinput", handleBeforeInput as EventListener);
        editorArea.addEventListener("keydown", handleKeydown);
        document.addEventListener("selectionchange", handleSelectionChange);
        scrollEl.addEventListener("scroll", handleScroll);
        editorArea.addEventListener("click", handleClick);

        const api: EditorApi = {
            get value() {
                return state.value;
            },
            set value(v) {
                state.value = String(v ?? "");
                saveState(0, 0);
                render(0, 0);
            },
            focus() {
                editorArea.focus();
                render(state.value.length, state.value.length);
            }
        };

        const refreshHighlighting = () => {
            const { start, end } = getCaret(editorArea, state.value.split("\n"));
            render(start, end);
        };

        window.addEventListener("executionmodechange", refreshHighlighting);
        window.addEventListener("rendersyntaxloaded", refreshHighlighting);

        state.value = "";
        saveState(0, 0);
        render(0, 0);

        resolveEditorReady?.(api);

        return () => {
            editorArea.removeEventListener("beforeinput", handleBeforeInput as EventListener);
            editorArea.removeEventListener("keydown", handleKeydown);
            document.removeEventListener("selectionchange", handleSelectionChange);
            scrollEl.removeEventListener("scroll", handleScroll);
            editorArea.removeEventListener("click", handleClick);
            window.removeEventListener("executionmodechange", refreshHighlighting);
            window.removeEventListener("rendersyntaxloaded", refreshHighlighting);
        };
    }, [editorAreaRef, gutterElRef, gutterWrapRef, scrollElRef]);
}
