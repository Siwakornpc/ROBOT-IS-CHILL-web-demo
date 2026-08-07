export function doCustomCaret(resetBlink = true) {
    const active = document.activeElement as HTMLElement | null;
    const isEditable = active?.matches("textarea") || active?.isContentEditable;

    const editor = document.getElementById("editor-code")

    let caretEl = document.querySelector(".caret") as HTMLElement | null;

    if (!caretEl) {
        caretEl = document.createElement("span");
        caretEl.className = "caret hidden";
        caretEl.style.position = "absolute";
        caretEl.style.pointerEvents = "none";
        document.body.appendChild(caretEl);
    }

    if (!isEditable || document.hidden || !document.hasFocus()) {
        caretEl.classList.add("hidden");
        return;
    }

    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).cloneRange();

        let rects = range.getClientRects();

        if (rects.length === 0 && range.startContainer) {
            const dummy = document.createTextNode("\u200b");
            range.insertNode(dummy);
            rects = range.getClientRects();
            dummy.parentNode?.removeChild(dummy);
        }

        if (rects.length > 0) {
            const rect = rects[0];

            let left = rect.left + window.scrollX;
            let top = rect.top + window.scrollY;

            /**
             * Handle scrollable textarea/contenteditable
             */
            if (active) {
                const style = window.getComputedStyle(active);

                const hasVerticalScroll =
                    active.scrollHeight > active.clientHeight;

                const hasHorizontalScroll =
                    active.scrollWidth > active.clientWidth;

                const overflowScrollable =
                    ["auto", "scroll"].includes(style.overflowY) ||
                    ["auto", "scroll"].includes(style.overflowX);

                if (
                    overflowScrollable &&
                    (hasVerticalScroll || hasHorizontalScroll)
                ) {
                    left -= active.scrollLeft;
                    top -= active.scrollTop;
                }
            }

            caretEl.style.top = `${top}px`;
            caretEl.style.left = `${left}px`;
            caretEl.style.height = `${rect.height}px`;

            if (resetBlink) {
                caretEl.classList.remove("caret-blink");
                void caretEl.offsetWidth;
                caretEl.classList.add("caret-blink");
            }

            setTimeout(() => {
                caretEl?.classList.remove("hidden");
            }, 10);

            return;
        }
    }

    caretEl.classList.add("hidden");
}