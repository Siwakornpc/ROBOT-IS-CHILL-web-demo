"use client";

import { useEffect, useRef } from "react";
import "@/components/highight/macro-highlight.js";
import "@/components/highight/render-highlight.js";
import "@/components/highight/combined-highlight.js";

type HistoryEntry = {
    value: string;
    start: number;
    end: number;
};

type EditorApi = {
    value: string;
    focus(): void;
};

type WindowWithEditor = Window & typeof globalThis & {
    editorReady?: Promise<EditorApi>;
    executionMode?: string;
    macroHighlighter?: (value: string) => string;
    renderHighlighter?: (value: string) => string;
    combinedHighlighter?: (value: string) => string;
    updateHighlightState?: (editorArea: HTMLElement, start: number, end: number) => void;
};

let resolveEditorReady: ((api: EditorApi) => void) | null = null;

function ensureEditorReady() {
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

export function EditorScreen() {
    const editorAreaRef = useRef<HTMLDivElement | null>(null);
    const gutterElRef = useRef<HTMLDivElement | null>(null);
    const gutterWrapRef = useRef<HTMLDivElement | null>(null);
    const currentLineElRef = useRef<HTMLDivElement | null>(null);
    const scrollElRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const editorArea = editorAreaRef.current;
        const gutterEl = gutterElRef.current;
        const gutterWrap = gutterWrapRef.current;
        const currentLineEl = currentLineElRef.current;
        const scrollEl = scrollElRef.current;

        if (!editorArea || !gutterEl || !gutterWrap || !currentLineEl || !scrollEl) {
            return;
        }

        const win = window as WindowWithEditor;
        ensureEditorReady();
        const lineHeight = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--editor-line-height")
        ) || 21;

        let value = "";
        const history: HistoryEntry[] = [];
        let historyIndex = -1;

        function saveState(start: number, end: number) {
            const state: HistoryEntry = { value, start, end };
            const cur = history[historyIndex];

            if (cur && cur.value === state.value && cur.start === start && cur.end === end) {
                return;
            }

            history.splice(historyIndex + 1);
            history.push(state);
            historyIndex++;
        }

        function undo() {
            if (historyIndex <= 0) return;
            historyIndex--;
            const state = history[historyIndex];
            value = state.value;
            render(state.start, state.end);
        }

        function redo() {
            if (historyIndex >= history.length - 1) return;
            historyIndex++;
            const state = history[historyIndex];
            value = state.value;
            render(state.start, state.end);
        }

        const highlighter = (text: string) => {
            const isRenderMode = win.executionMode === "=t" || win.executionMode === "=r";

            if (!isRenderMode) {
                return win.macroHighlighter?.(text);
            }

            return win.combinedHighlighter?.(text);
        };
        
        const updateCaretMatch = (start: number, end: number) => {
            win.updateHighlightState?.(editorArea, start, end);
        };

        function getCaret() {
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) {
                return { start: value.length, end: value.length };
            }

            const range = sel.getRangeAt(0);
            if (!editorArea || !editorArea.contains(range.commonAncestorContainer)) {
                return { start: value.length, end: value.length };
            }

            const preStart = document.createRange();
            preStart.selectNodeContents(editorArea);
            preStart.setEnd(range.startContainer, range.startOffset);
            const start = modelLength(preStart);

            const preEnd = document.createRange();
            preEnd.selectNodeContents(editorArea);
            preEnd.setEnd(range.endContainer, range.endOffset);
            const end = modelLength(preEnd);

            return { start: Math.min(start, end), end: Math.max(start, end) };
        }

        function modelLength(range: Range) {
            const fragment = range.cloneContents();
            const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
            let length = 0;
            let node = walker.nextNode();

            while (node) {
                if (node instanceof Text && !node.parentElement?.classList.contains("editor-caret-anchor")) {
                    length += node.length;
                }
                node = walker.nextNode();
            }

            return length;
        }

        function locate(offset: number) {
            if (!editorArea) {
                return { node: editorArea, offset: 0 };
            }

            const anchor = editorArea.querySelector(".editor-caret-anchor");
            if (offset === value.length && anchor?.firstChild) {
                return { node: anchor.firstChild, offset: 0 };
            }

            const walker = document.createTreeWalker(editorArea, NodeFilter.SHOW_TEXT);
            let remaining = offset;
            let lastNode: Node | null = null;
            let node = walker.nextNode();

            while (node) {
                lastNode = node;
                if (node instanceof Text && remaining <= node.length) {
                    return { node, offset: remaining };
                }

                if (node instanceof Text) {
                    remaining -= node.length;
                }
                node = walker.nextNode();
            }

            if (lastNode) {
                return { node: lastNode, offset: lastNode instanceof Text ? lastNode.length : 0 };
            }

            return { node: editorArea, offset: 0 };
        }

        function setRange(start: number, end: number) {
            const sel = window.getSelection();
            const range = document.createRange();
            const s = locate(start);
            const e = start === end ? s : locate(end);

            if (!sel || !s.node || !e.node) {
                return;
            }

            range.setStart(s.node, s.offset);
            range.setEnd(e.node, e.offset);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        function clamp(n: number, lo: number, hi: number) {
            return Math.max(lo, Math.min(hi, n));
        }

        function countLineIndex(str: string, pos: number) {
            let n = 0;
            for (let i = 0; i < pos; i++) {
                if (str[i] === "\n") n++;
            }
            return n;
        }

        function countTotalLines(str: string) {
            return str.length === 0 ? 1 : str.split("\n").length;
        }

        function updateGutter(activeLine: number) {
            if (!gutterEl) {
                return;
            }

            const total = countTotalLines(value);
            let html = "";

            for (let i = 0; i < total; i++) {
                html += `<div class="gutter-line${i === activeLine ? " active" : ""}">${i + 1}</div>`;
            }

            gutterEl.innerHTML = html;
        }

        function updateCurrentLine(activeLine: number) {
            if (!currentLineEl) {
                return;
            }

            currentLineEl.style.transform = `translateY(${activeLine * lineHeight}px)`;
        }

        function syncGutterScroll() {
            if (!gutterWrap || !scrollEl) {
                return;
            }

            gutterWrap.scrollTop = scrollEl.scrollTop;
        }

        let renderGen = 0;

        function render(start: number, end = start) {
            const gen = ++renderGen;

            if (!editorArea) {
                return;
            }

            editorArea.innerHTML = highlighter(value) + (value.endsWith("\n") ? '<span class="editor-caret-anchor" aria-hidden="true">\u200B</span>' : "");

            const s = clamp(start, 0, value.length);
            const e = clamp(end, 0, value.length);

            setRange(s, e);

            const lineIndex = countLineIndex(value, s);
            updateGutter(lineIndex);
            updateCurrentLine(lineIndex);
            updateCaretMatch(s, e);
            syncGutterScroll();

            requestAnimationFrame(() => {
                if (gen !== renderGen) return;
                if (document.activeElement !== editorArea) return;
                setRange(s, e);
            });
        }

        function lineStartOf(pos: number) {
            return value.lastIndexOf("\n", pos - 1) + 1;
        }

        editorArea.addEventListener("beforeinput", (e) => {
            e.preventDefault();

            const { start, end } = getCaret();
            let newValue = value;
            let newStart = start;
            let newEnd = start;

            switch (e.inputType) {
                case "insertText":
                case "insertCompositionText": {
                    const text = e.data ?? "";

                    if (text === "[" && start !== end) {
                        newValue = value.slice(0, start) + "[" + value.slice(start, end) + "]" + value.slice(end);
                        newStart = start + 1;
                        newEnd = end + 1;
                    } else if (text === "[" && start === end) {
                        newValue = value.slice(0, start) + "[]" + value.slice(end);
                        newStart = newEnd = start + 1;
                    } else if (text === "]" && start === end && value[start] === "]") {
                        newValue = value;
                        newStart = newEnd = start + 1;
                    } else {
                        newValue = value.slice(0, start) + text + value.slice(end);
                        newStart = newEnd = start + text.length;
                    }
                    break;
                }

                case "insertParagraph":
                case "insertLineBreak": {
                    const ls = lineStartOf(start);
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

            value = newValue;
            saveState(newStart, newEnd);
            render(newStart, newEnd);
        });

        editorArea.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();

                const { start, end } = getCaret();
                const indent = "    ";

                if (start === end) {
                    if (e.shiftKey) {
                        const ls = lineStartOf(start);
                        const m = value.slice(ls, start).match(/[ \t]{1,4}$/);
                        if (!m) return;

                        value = value.slice(0, start - m[0].length) + value.slice(start);
                        const pos = start - m[0].length;
                        saveState(pos, pos);
                        render(pos, pos);
                        return;
                    }

                    value = value.slice(0, start) + indent + value.slice(end);
                    saveState(start + indent.length, start + indent.length);
                    render(start + indent.length, start + indent.length);
                    return;
                }

                const lineStart = lineStartOf(start);
                let lineEnd = value.indexOf("\n", end);
                if (lineEnd === -1) lineEnd = value.length;

                const lines = value.slice(lineStart, lineEnd).split("\n");
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

                value = value.slice(0, lineStart) + newLines.join("\n") + value.slice(lineEnd);

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
        });

        document.addEventListener("selectionchange", () => {
            if (document.activeElement !== editorArea) return;

            const { start, end } = getCaret();
            const lineIndex = countLineIndex(value, start);

            updateCurrentLine(lineIndex);

            Array.from(gutterEl.children).forEach((el, i) => {
                el.classList.toggle("active", i === lineIndex);
            });

            updateCaretMatch(start, end);
        });

        scrollEl.addEventListener("scroll", syncGutterScroll);

        editorArea.addEventListener("click", (e) => {
            if (e.target !== editorArea) return;

            const editorTop = editorArea.getBoundingClientRect().top;
            const textBottom = editorTop + 10 + countTotalLines(value) * lineHeight;
            if (e.clientY < textBottom) return;

            editorArea.focus({ preventScroll: true });
        });

        const api: EditorApi = {
            get value() {
                return value;
            },
            set value(v) {
                value = String(v ?? "");
                saveState(0, 0);
                render(0, 0);
            },
            focus() {
                editorArea.focus();
                render(value.length, value.length);
            }
        };

        const refreshHighlighting = () => {
            const { start, end } = getCaret();
            render(start, end);
        };

        window.addEventListener("executionmodechange", refreshHighlighting);
        window.addEventListener("rendersyntaxloaded", refreshHighlighting);

        value = "";
        saveState(0, 0);
        render(0, 0);

        resolveEditorReady?.(api);

        return () => {
            window.removeEventListener("executionmodechange", refreshHighlighting);
            window.removeEventListener("rendersyntaxloaded", refreshHighlighting);
        };
    }, []);

    return (
        <div className="editor-container">
            <div className="editor-code">
                <div className="editor-body-row">
                    <div className="editor-gutter-wrap" id="editor-gutter-wrap" ref={gutterWrapRef}>
                        <div className="editor-gutter" id="editor-gutter" ref={gutterElRef}></div>
                    </div>
                    <div className="editor-text-scroll" id="editor-text-scroll" ref={scrollElRef}>
                        <div className="editor-current-line" id="editor-current-line" ref={currentLineElRef}></div>
                        <div
                            id="editor-area"
                            className="editor-input"
                            contentEditable="true"
                            spellCheck="false"
                            autoCapitalize="off"
                            autoCorrect="off"
                            translate="no"
                            role="textbox"
                            aria-multiline="true"
                            ref={editorAreaRef}
                        ></div>
                    </div>
                </div>
            </div>
            <div className="output-panel">
                <div id="output-screen"></div>
            </div>
        </div>
    );
}

export default EditorScreen;
