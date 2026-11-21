/* Rebuilds the gutter to match each line's actual fractional rendered height. */
export function updateGutter(gutterEl: HTMLElement | null, lineEls: HTMLElement[], activeLine: number) {
    if (!gutterEl) return;

    let html = "";

    lineEls.forEach((lineEl, i) => {
        const height = lineEl.getBoundingClientRect().height;
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

export function syncGutterScroll(gutterWrap: HTMLElement | null, editorArea: HTMLElement | null) {
    if (!gutterWrap || !editorArea) return;

    const contentHeight = editorArea.offsetHeight;
    gutterWrap.style.height = `${contentHeight}px`;
}
