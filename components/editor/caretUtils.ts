import type { CaretPosition } from "./types";
import { offsetToLineColumn, lineColumnToOffset } from "./lineModel";

/** Finds the ".editor-line" element that owns `node`. If `node` is editorArea itself
 * (e.g. clicking in the gap between lines), falls back to the line at `nodeOffset`. */
function closestLineElement(editorArea: HTMLElement, node: Node, nodeOffset: number): HTMLElement | null {
    if (node === editorArea) {
        const children = Array.from(editorArea.children) as HTMLElement[];
        if (children.length === 0) return null;
        const idx = Math.max(0, Math.min(nodeOffset, children.length - 1));
        return children[idx] ?? null;
    }

    let cur: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (cur && cur !== editorArea) {
        if (cur instanceof HTMLElement && cur.classList.contains("editor-line")) {
            return cur;
        }
        cur = cur.parentNode;
    }
    return null;
}

function lineElementIndex(editorArea: HTMLElement, lineEl: HTMLElement) {
    return Array.from(editorArea.children).indexOf(lineEl);
}

function textLength(fragment: DocumentFragment) {
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
    let length = 0;
    let node = walker.nextNode();

    while (node) {
        length += (node as Text).length;
        node = walker.nextNode();
    }

    return length;
}

/** Counts characters from the start of `lineEl` up to (container, containerOffset). */
function intraLineOffset(lineEl: HTMLElement, container: Node, containerOffset: number) {
    const range = document.createRange();
    range.selectNodeContents(lineEl);
    range.setEnd(container, containerOffset);
    return textLength(range.cloneContents());
}

function pointToOffset(editorArea: HTMLElement, lines: string[], container: Node, containerOffset: number) {
    const lineEl = closestLineElement(editorArea, container, containerOffset);
    if (!lineEl) return 0;

    const lineIndex = Math.max(lineElementIndex(editorArea, lineEl), 0);
    const column = intraLineOffset(lineEl, container, containerOffset);
    return lineColumnToOffset(lines, lineIndex, column);
}

/** Reads the current DOM selection and converts it into a global model offset pair. */
export function getCaret(editorArea: HTMLElement | null, lines: string[]): CaretPosition {
    const totalLength = lines.reduce((sum, l) => sum + l.length, 0) + Math.max(lines.length - 1, 0);

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
        return { start: totalLength, end: totalLength };
    }

    const range = sel.getRangeAt(0);
    if (!editorArea || !editorArea.contains(range.commonAncestorContainer)) {
        return { start: totalLength, end: totalLength };
    }

    const start = pointToOffset(editorArea, lines, range.startContainer, range.startOffset);
    const end = pointToOffset(editorArea, lines, range.endContainer, range.endOffset);

    return { start: Math.min(start, end), end: Math.max(start, end) };
}

/** Walks the text nodes of a single line element to find the node+offset for a column. */
function locateWithinLine(lineEl: HTMLElement, column: number) {
    const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT);
    let remaining = column;
    let lastNode: Node | null = null;
    let node = walker.nextNode();

    while (node) {
        lastNode = node;
        if (node instanceof Text && remaining <= node.length) {
            return { node: node as Node, offset: remaining };
        }
        if (node instanceof Text) {
            remaining -= node.length;
        }
        node = walker.nextNode();
    }

    if (lastNode) {
        return { node: lastNode, offset: lastNode instanceof Text ? lastNode.length : 0 };
    }

    // Empty line (just a <br>, or nothing) - place the caret in the line container itself.
    return { node: lineEl as Node, offset: 0 };
}

/** Finds the DOM node + offset that corresponds to a global model offset. */
export function locate(editorArea: HTMLElement | null, lines: string[], offset: number) {
    if (!editorArea) {
        return { node: null as Node | null, offset: 0 };
    }

    const { lineIndex, column } = offsetToLineColumn(lines, offset);
    const lineEl = editorArea.children[lineIndex] as HTMLElement | undefined;

    if (!lineEl) {
        return { node: editorArea as Node, offset: 0 };
    }

    return locateWithinLine(lineEl, column);
}

/** Applies global model offsets to the live DOM selection. */
export function setRange(editorArea: HTMLElement | null, lines: string[], start: number, end: number) {
    const sel = window.getSelection();
    const range = document.createRange();
    const s = locate(editorArea, lines, start);
    const e = start === end ? s : locate(editorArea, lines, end);

    if (!sel || !s.node || !e.node) {
        return;
    }

    range.setStart(s.node, s.offset);
    range.setEnd(e.node, e.offset);
    sel.removeAllRanges();
    sel.addRange(range);
}
