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
import { loadVariants, allv } from "./getVariantName";
import { getAutocompleteContext } from "./autocompleteUtils";
import { offsetToLineColumn } from "./lineModel";
import { updateCaretMatch } from "./highlighting";
import { updateCurrentLineClass } from "./domUpdaters";


type EditorRefs = {
    editorAreaRef: RefObject<HTMLDivElement | null>;
    gutterElRef: RefObject<HTMLDivElement | null>;
    gutterWrapRef: RefObject<HTMLDivElement | null>;
    scrollElRef: RefObject<HTMLDivElement | null>;
    onCodeChange?: (code: string) => void;
    onAutocompleteChange?: (state: AutocompleteState) => void;
    onInsertSuggestionRef?: React.RefObject<((startIndex: number, text: string) => void) | null>;
};

export type AutocompleteState = {
    isOpen: boolean;
    query: string;
    suggestions: Array<{ label: string; type: "macro" | "variant" | "tile" }>;
    position: { top: number; left: number };
    startIndex: number;
    type: "macro" | "variant" | "tile";
};

export function useEditorEngine({
    editorAreaRef,
    gutterElRef,
    gutterWrapRef,
    scrollElRef,
    onCodeChange,
    onAutocompleteChange,
    onInsertSuggestionRef,
}: EditorRefs) {
    useEffect(() => {
        const editorArea = editorAreaRef.current;
        const gutterEl = gutterElRef.current;
        const gutterWrap = gutterWrapRef.current;
        const scrollEl = scrollElRef.current;

        if (!editorArea || !gutterEl || !gutterWrap || !scrollEl) return;

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

        const { saveState, undo, redo } = createHistoryManager(state, render, onCodeChange);

        const handleBeforeInput = createBeforeInputHandler({
            editorArea,
            state,
            saveState,
            render,
            undo,
            redo,
            onCodeChange,
        });
        const handleKeydown = createKeydownHandler({
            editorArea,
            state,
            saveState,
            render,
            undo,
            redo,
            onCodeChange
        });
        const handleSelectionChange = createSelectionChangeHandler({
            win,
            editorArea,
            gutterEl,
            state
        });
        const handleClick = createEditorClickHandler(editorArea);

        const handleScroll = () => {
            gutterWrap.scrollTop = scrollEl.scrollTop;
        };

        const handleResize = () => {
            render(state.value.length, state.value.length);
        };

        let macroList: Array<{ label: string; detail?: string }> = [];

        async function fetchAutocompleteData() {
            try {
                await loadVariants();
                const res = await fetch("https://ric-api.sno.mba/macros.json");
                if (res.ok) {
                    const data = await res.json();
                    macroList = Object.keys(data).map(key => ({ label: key }));
                }
            } catch (err) {
                console.error("Failed to load autocomplete data:", err);
            }
        }
        fetchAutocompleteData();

        const handleACSelectionChange = () => {
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

            // Evaluate Autocomplete Context
            if (onAutocompleteChange) {
                const isRenderMode = win.executionMode === "=t" || win.executionMode === "=r";
                const context = getAutocompleteContext(state.value, start, isRenderMode);

                if (context) {
                    const suggestions = context.type === "macro"
                        ? macroList.map(m => ({ label: m.label, type: "macro" as const }))
                        : allv.map(v => ({ label: v, type: "variant" as const }));

                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        onAutocompleteChange({
                            isOpen: true,
                            query: context.query,
                            suggestions,
                            position: { top: rect.bottom + 4, left: rect.left },
                            startIndex: context.startIndex,
                            type: context.type,
                        });
                        return;
                    }
                }
                onAutocompleteChange({
                    isOpen: false,
                    query: "",
                    suggestions: [],
                    position: { top: 0, left: 0 },
                    startIndex: 0,
                    type: "macro",
                });
            }
        };
        
        const insertSuggestion = (startIndex: number, text: string) => {
            const lines = state.value.split("\n");
            const { start } = getCaret(editorArea, lines);

            const before = state.value.slice(0, startIndex);
            const after = state.value.slice(start);

            state.value = before + text + after;
            onCodeChange?.(state.value);

            const newPos = startIndex + text.length;
            saveState(newPos, newPos);
            render(newPos, newPos);
            editorArea.focus();
        };

        if (onInsertSuggestionRef) onInsertSuggestionRef.current = insertSuggestion;

        editorArea.addEventListener("beforeinput", handleBeforeInput as EventListener);
        editorArea.addEventListener("keydown", handleKeydown);
        document.addEventListener("selectionchange", handleACSelectionChange);
        scrollEl.addEventListener("scroll", handleScroll);
        editorArea.addEventListener("click", handleClick);
        window.addEventListener("resize", handleResize);

        const api: EditorApi = {
            get value() { return state.value },
            set value(v) {
                state.value = String(v ?? "");
                onCodeChange?.(state.value);
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
            document.removeEventListener("selectionchange", handleACSelectionChange);
            scrollEl.removeEventListener("scroll", handleScroll);
            editorArea.removeEventListener("click", handleClick);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("executionmodechange", refreshHighlighting);
            window.removeEventListener("rendersyntaxloaded", refreshHighlighting);
        };
    }, [editorAreaRef, gutterElRef, gutterWrapRef, scrollElRef]);
}