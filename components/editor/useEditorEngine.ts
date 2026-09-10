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
import stdlib_macros from "../page/search/stdlib_macros";
import { loadFlags, flags } from "@/components/highlight/render-highlight";
import { buildMacroDefinitionUrl, getMacroDefinitionNameFromElement } from "./macroDefinition";

import JSONbig from "json-bigint";

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
    const isACLetterTypingRef = useRef(false);
    const isAutocompleteOpenRef = useRef(false);
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

        const handleCurrentLineScroll = () => {
            if (!scrollEl) return;
            const currentLine = editorArea.querySelector(".editor-line.current");

            if (!currentLine) return;

            const padding = 8;

            const scroll_rect = scrollEl.getBoundingClientRect();
            const currentLine_rect = currentLine.getBoundingClientRect();

            if (currentLine_rect.top < scroll_rect.top)
                scrollEl.scrollTop -= padding;
            else if (currentLine_rect.bottom > scroll_rect.bottom)
                scrollEl.scrollTop += padding;
        };

        const handleSelectionChange = createSelectionChangeHandler({ win, editorArea, gutterEl, state });

        let isMacroReferenceActive = false;

        const updateMacroReferenceState = (active: boolean) => {
            isMacroReferenceActive = active;
            editorArea.querySelectorAll(".macro-name").forEach((el) => {
                el.classList.toggle("macro-ref", active);
            });
        };

        const handleMacroReferenceKeydown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && !(e.altKey || e.shiftKey))
                updateMacroReferenceState(true);
        };

        const handleMacroReferenceKeyup = (e: KeyboardEvent) => {
            if (e.key === "Control" || e.key === "Meta")
                updateMacroReferenceState(false);
        };

        const handleMacroReferenceBlur = () => updateMacroReferenceState(false);

        const handleMacroReferencePageshowPersisted = (e: React.SyntheticEvent) => {
            if (e.persisted)
                updateMacroReferenceState(false);
        }

        const handleMacroHover = (e: MouseEvent) => {
            if (!isMacroReferenceActive) return;

            const macroName = getMacroDefinitionNameFromElement(e.target);
            if (!macroName) return;

            const target = e.target instanceof Element ? e.target.closest(".macro-name") as HTMLElement | null : null;
            if (target) target.classList.add("macro-ref");
        };

        const handleMacroDefinition = (e: MouseEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;

            const macroName = getMacroDefinitionNameFromElement(e.target);
            if (!macroName) return;

            e.preventDefault();
            e.stopPropagation();
            window.location.assign(buildMacroDefinitionUrl(macroName));
        };

        const handleSelectionChangeWithScroll = () => {
            handleSelectionChange();
            requestAnimationFrame(handleCurrentLineScroll);
        };

        const handleScroll = () => gutterWrap.scrollTop = scrollEl.scrollTop;
        const handleResize = () => {
            render(state.value.length, state.value.length);
            handleACSelectionChange();
        };

        const handleGlobalKeydown = (e: KeyboardEvent) => {
            isLetterTypingRef.current = e.key.length === 1
                && !e.ctrlKey
                && !e.metaKey
                && !e.altKey;
        };
        const handleACKeydown = (e: KeyboardEvent) => {
            isACLetterTypingRef.current = e.key.length === 1
                && !e.ctrlKey
                && !e.metaKey
                && !e.altKey;

            if (e.key === "Escape")
                isAutocompleteOpenRef.current = false;
        };

        const handleMouseDown = (e: MouseEvent) => {
            isLetterTypingRef.current = false;
            const clickedInEditor = editorArea.contains(e.target as Node);
            if (!clickedInEditor)
                isAutocompleteOpenRef.current = false;

            if (!isAutocompleteOpenRef.current)
                isACLetterTypingRef.current = false;
        };

        document.addEventListener("keydown", handleGlobalKeydown);
        document.addEventListener("keydown", handleACKeydown);
        document.addEventListener("keydown", handleMacroReferenceKeydown);
        document.addEventListener("keyup", handleMacroReferenceKeyup);
        document.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("blur", handleMacroReferenceBlur);
        window.addEventListener("pageshow", handleMacroReferencePageshowPersisted);

        let macroList: Array<{ label: string; builtin?: boolean; creator: string }> = [];

        async function fetchAutocompleteData() {
            try {
                await loadVariants();
                const macroMap = new Map<string, { label: string; builtin?: boolean; creator: string }>();

                try {
                    const res = await fetch("https://ric-api.sno.mba/macros.json");
                    if (res.ok) {
                        const json = await res.text();
                        const data = JSONbig({ storeAsString: true }).parse(json);
                        for (const [key, val] of Object.entries(data)) {
                            const isBuiltin = Boolean((val as any)?.builtin);

                            macroMap.set(key, {
                                label: key,
                                builtin: isBuiltin,
                                creator: isBuiltin ? "builtin" : (val as any)?.creator,
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

        const getAutocompletePosition = (rect: DOMRect) => {
            const dropdownHeight = 200;
            const dropdownWidth = 400;
            const gap = 4;
            const fitsBelow = window.innerHeight - rect.bottom >= dropdownHeight + gap;
            const fitsAbove = rect.top >= dropdownHeight + gap;

            let top = fitsBelow || !fitsAbove
                ? rect.bottom + gap
                : rect.top - dropdownHeight - gap;
            let left = rect.left;

            top = Math.min(top, window.innerHeight - dropdownHeight - gap);
            top = Math.max(gap, top);
            left = Math.min(left, window.innerWidth - dropdownWidth - gap);
            left = Math.max(gap, left);

            return { top, left };
        };

        const handleACSelectionChange = () => {
            if (document.activeElement !== editorArea) return;
            if (!isACLetterTypingRef.current && !isAutocompleteOpenRef.current) {
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
            const { start } = getCaret(editorArea, lines);

            if (onAutocompleteChange) {
                const isRenderMode = win.executionMode === "=t" || win.executionMode === "=r";
                const context = getAutocompleteContext(state.value, start, isRenderMode);

                if (context) {
                    let suggestions: Array<{ label: string; type: "macro" | "variant" | "flag" | "tile"; builtin?: boolean, detail?: string }> = [];

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
                        const position = getAutocompletePosition(rect);

                        isAutocompleteOpenRef.current = true;
                        onAutocompleteChange({
                            isOpen: true,
                            query: context.query,
                            suggestions,
                            position,
                            startIndex: context.startIndex,
                            type: context.type,
                            triggerChar: context.triggerChar,
                        });
                        return;
                    }
                }
                isAutocompleteOpenRef.current = false;
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

        const layoutResizeObserver = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => handleACSelectionChange())
            : null;
        layoutResizeObserver?.observe(editorArea);
        layoutResizeObserver?.observe(scrollEl);

        const visualViewport = window.visualViewport;
        visualViewport?.addEventListener("resize", handleACSelectionChange);
        scrollEl.addEventListener("scroll", handleACSelectionChange);
        
        const insertSuggestion = (startIndex: number, text: string) => {
            isACLetterTypingRef.current = false;
            isAutocompleteOpenRef.current = false;

            const lines = state.value.split("\n");
            const { start } = getCaret(editorArea, lines);

            let insertText = text;
            let before = state.value.slice(0, startIndex);

            if (autocompleteTypeRef.current === "flag") {
                const match = before.match(/(--?)$/);
                if (match) {
                    console.log("Length: ", match[0].length);
                    before = state.value.slice(0, startIndex - match[0].length - (match[0].length === 2 ? 1 : 0));
                }
            }

            const after = state.value.slice(start);

            state.value = before + insertText + after;
            onCodeChange?.(state.value);

            const newPos = startIndex + insertText.length;
            saveState(newPos, newPos);
            render(newPos, newPos);
            editorArea.focus();
            editorArea.dispatchEvent(new Event("input", { bubbles: true }));
        };

        if (onInsertSuggestionRef) onInsertSuggestionRef.current = insertSuggestion;

        editorArea.addEventListener("beforeinput", handleBeforeInput as EventListener);
        editorArea.addEventListener("keydown", handleKeydown);
        document.addEventListener("selectionchange", handleSelectionChangeWithScroll);
        document.addEventListener("selectionchange", handleACSelectionChange);
        scrollEl.addEventListener("scroll", handleScroll);
        editorArea.addEventListener("mouseover", handleMacroHover);
        editorArea.addEventListener("click", handleClick);
        editorArea.addEventListener("click", handleMacroDefinition);
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
            const {start, end} = getCaret(editorArea, state.value.split("\n"));
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
            document.removeEventListener("keydown", handleACKeydown);
            document.removeEventListener("keydown", handleMacroReferenceKeydown);
            document.removeEventListener("keyup", handleMacroReferenceKeyup);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("selectionchange", handleSelectionChangeWithScroll);
            document.removeEventListener("selectionchange", handleACSelectionChange);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("blur", handleMacroReferenceBlur);
            window.removeEventListener("pageshow", handleMacroReferencePageshowPersisted);
            window.removeEventListener("executionmodechange", refreshHighlighting);
            window.removeEventListener("rendersyntaxloaded", refreshHighlighting);
            editorArea.removeEventListener("beforeinput", handleBeforeInput as EventListener);
            editorArea.removeEventListener("keydown", handleKeydown);
            editorArea.removeEventListener("mouseover", handleMacroHover);
            editorArea.removeEventListener("click", handleClick);
            editorArea.removeEventListener("click", handleMacroDefinition);
            scrollEl.removeEventListener("scroll", handleScroll);
            scrollEl.removeEventListener("scroll", handleACSelectionChange);
            layoutResizeObserver?.disconnect();
            visualViewport?.removeEventListener("resize", handleACSelectionChange);
        };
    }, [editorAreaRef, gutterElRef, gutterWrapRef, scrollElRef]);
}
