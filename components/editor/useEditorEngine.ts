import { useEffect, type RefObject, useRef, useState } from "react";
import type { EditorApi, EditorState, WindowWithEditor } from "./types";
import { ensureEditorReady, resolveEditorReady } from "./editorReady";
import { createHistoryManager } from "./historyManager";
import { createRenderer } from "./renderer";
import { createBeforeInputHandler } from "./beforeInputHandler";
import {
    createKeydownHandler,
    createSelectionChangeHandler,
    createEditorClickHandler
} from "./handlers";
import { getCaret } from "./caretUtils";
import { loadVariants, allv } from "./getVariantName";
import { getAutocompleteContext } from "./autocompleteUtils";
import { offsetToLineColumn } from "./lineModel";
import { updateCaretMatch } from "./highlighting";
import { updateCurrentLineClass } from "./domUpdaters";
import stdlib_macros from "../page/search/stdlib_macros";
import { loadFlags, flags } from "@/components/highlight/render-highlight";

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
    suggestions: Array<{ label: string; type: "macro" | "variant" | "flag" | "tile"; builtin?: boolean; detail?: string | null }>;
    position: { top: number; left: number };
    startIndex: number;
    type: "macro" | "variant" | "flag" | "tile";
    triggerChar?: string;
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
    const isLetterTypingRef = useRef(false);
    const autocompleteTypeRef = useRef<AutocompleteState["type"]>("macro");

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
        const handleClick = createEditorClickHandler(editorArea);
        const handleScroll = () => gutterWrap.scrollTop = scrollEl.scrollTop;
        const handleResize = () => render(state.value.length, state.value.length);

        const handleGlobalKeydown = (e: KeyboardEvent) => {
            if (
                e.key === "Backspace"
                || e.key === "ArrowLeft"
                || e.key === "ArrowRight"
                || e.key === "ArrowUp"
                || e.key === "ArrowDown"
                || e.key === "Enter"
            ) {
                isLetterTypingRef.current = false;
                return;
            }
            isLetterTypingRef.current = true;
        };

        const handleMouseDown = () => isLetterTypingRef.current = false;

        document.addEventListener("keydown", handleGlobalKeydown);
        document.addEventListener("mousedown", handleMouseDown);

        let macroList: Array<{ label: string; builtin?: boolean; creator: string }> = [];

        async function fetchAutocompleteData() {
            try {
                await loadVariants();
                const macroMap = new Map<string, { label: string; builtin?: boolean; creator: string }>();

                try {
                    const res = await fetch("https://ric-api.sno.mba/macros.json");
                    if (res.ok) {
                        const data = await res.json();
                        for (const [key, val] of Object.entries(data)) {
                            const isBuiltin = Boolean((val as any)?.builtin);

                            macroMap.set(key, {
                                label: key,
                                builtin: isBuiltin,
                                creator: isBuiltin ? "builtin" : `@${(val as any)?.creator}`,
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to load remote macros:", err);
                }

                try {
                    const stdMacros = await stdlib_macros();
                    for (const [name, info] of stdMacros) {
                        macroMap.set(name, { label: name, builtin: info.builtin, creator: "builtin" });
                    }
                } catch (err) {
                    console.error("Failed to load stdlib macros:", err);
                }

                macroList = Array.from(macroMap.values());
                handleACSelectionChange();
            } catch (err) {
                console.error("Failed to load autocomplete data:", err);
            }
        }
        fetchAutocompleteData();

        const handleACSelectionChange = () => {
            if (document.activeElement !== editorArea) return;
            if (!isLetterTypingRef.current) {
                if (!onAutocompleteChange) return;
                onAutocompleteChange({
                    isOpen: false,
                    query: "",
                    suggestions: [],
                    position: { top: 0, left: 0 },
                    startIndex: 0,
                    type: "macro",
                });
                return;
            }

            const lines = state.value.split("\n");
            const { start, end } = getCaret(editorArea, lines);
            const { lineIndex } = offsetToLineColumn(lines, start);

            const lineEls = Array.from(editorArea.children) as HTMLElement[];
            updateCurrentLineClass(lineEls, lineIndex);
            Array.from(gutterEl.children).forEach((el, i) => el.classList.toggle("active", i === lineIndex));
            updateCaretMatch(win, editorArea, start, end);

            if (onAutocompleteChange) {
                const isRenderMode = win.executionMode === "=t" || win.executionMode === "=r";
                const context = getAutocompleteContext(state.value, start, isRenderMode);

                if (context) {
                    let suggestions: Array<{ label: string; type: "macro" | "variant" | "flag" | "tile"; builtin?: boolean }> = [];

                    autocompleteTypeRef.current = context.type;

                    if (context.type === "macro") {
                        suggestions = macroList.map(m => ({ label: m.label, type: "macro" as const, builtin: m.builtin, detail: m.creator }));
                    } else if (context.type === "variant") {
                        suggestions = allv.map(v => ({ label: v, type: "variant" as const, builtin: false }));
                    } else if (context.type === "flag") {
                        suggestions = flags.map(f => ({ label: f, type: "flag" as const, builtin: false }));
                    }

                    suggestions.sort((a, b) => {
                        if (a.builtin && !b.builtin) return -1;
                        if (!a.builtin && b.builtin) return 1;

                        if (context.query) {
                            const queryLower = context.query.toLowerCase();
                            const aStarts = a.label.toLowerCase().startsWith(queryLower);
                            const bStarts = b.label.toLowerCase().startsWith(queryLower);

                            if (aStarts && !bStarts) return -1;
                            if (!aStarts && bStarts) return 1;
                        }
                        return a.label.localeCompare(b.label);
                    });

                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        const rect = range.getBoundingClientRect();

                        const dropdownHeight = 200;
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const spaceAbove = rect.top;

                        let top = rect.bottom + 4;
                        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight)
                            top = rect.top - dropdownHeight - 4;

                        const left = rect.left;

                        onAutocompleteChange({
                            isOpen: true,
                            query: context.query,
                            suggestions,
                            position: { top, left },
                            startIndex: context.startIndex,
                            type: context.type,
                            triggerChar: context.triggerChar,
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
            isLetterTypingRef.current = false;

            const lines = state.value.split("\n");
            const { start } = getCaret(editorArea, lines);

            let insertText = text;
            let before = state.value.slice(0, startIndex);

            if (autocompleteTypeRef.current === "flag") {
                const match = before.match(/(--?)$/);
                if (match) {
                    console.log("Length: ", match[0].length);
                    before = state.value.slice(0, startIndex - match[0].length - (match[0].length === 2 ? 1 : 0));
                    // it's very weird that it was for example "   -" 4 and "   --" is 6
                }
            }

            const after = state.value.slice(start);

            state.value = before + insertText + after;
            onCodeChange?.(state.value);

            const newPos = startIndex + insertText.length;
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
            document.removeEventListener("keydown", handleGlobalKeydown);
            document.removeEventListener("mousedown", handleMouseDown);
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