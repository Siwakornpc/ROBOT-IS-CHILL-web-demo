/* Rebuilds the gutter to match each line's *actual* rendered height (handles wrapped lines),
 * mirroring the reference implementation's per-line offsetHeight measurement. */
export function updateGutter(gutterEl: HTMLElement | null, lineEls: HTMLElement[], activeLine: number) {
    if (!gutterEl) return;

    let html = "";

    lineEls.forEach((lineEl, i) => {
        const height = lineEl.offsetHeight;
        html += `<div class="gutter-line${i === activeLine ? " active" : ""}" style="height:${height}px">${i + 1}</div>`;
    });

    gutterEl.innerHTML = html;
}

/* Toggles the "current" class directly on the active line element (replaces the old translateY overlay). */
export function updateCurrentLineClass(lineEls: HTMLElement[], activeLine: number) {
    lineEls.forEach((lineEl, i) => {
        lineEl.classList.toggle("current", i === activeLine);
    });
}

export function syncGutterScroll(gutterWrap: HTMLElement | null, scrollEl: HTMLElement | null) {
    if (!gutterWrap || !scrollEl) return;
    gutterWrap.scrollTop = scrollEl.scrollTop;
}
