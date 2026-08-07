export function doCustomCaret() {
    const active = document.activeElement as HTMLElement | null;
    const isEditable = active?.matches('textarea') || active?.isContentEditable;

    let caretEl = document.querySelector(".caret") as HTMLElement | null;

    if (!caretEl) {
        caretEl = document.createElement("span");
        caretEl.className = "caret hidden";
        caretEl.style.position = "absolute"; 
        caretEl.style.pointerEvents = "none";
        document.body.appendChild(caretEl);
    }

    // UPDATED: Added !document.hasFocus() to instantly hide the caret if the window loses focus
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
                
                caretEl.classList.remove("caret-blink");
                void caretEl.offsetWidth;
                caretEl.classList.add("caret-blink");

        if (rects.length > 0) {
            const rect = rects[0];
            
            caretEl.style.top = `${rect.top + window.scrollY}px`;
            caretEl.style.left = `${rect.left + window.scrollX}px`;
            caretEl.style.height = `${rect.height}px`;
            
            setTimeout(() => {
                caretEl.classList.remove("hidden");
            }, 10);
            return;
        }
    }

    caretEl.classList.add("hidden");
}
