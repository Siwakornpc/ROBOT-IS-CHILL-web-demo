// OverflowFade.ts
export function applyOverflowFade(target: HTMLElement | HTMLElement[] | string | null) {
    if (!target) return;

    // array case
    if (Array.isArray(target)) {
        target.forEach((el) => checkElementOverflow(el));
        return;
    }

    // selector case
    if (typeof target === "string") {
        document.querySelectorAll<HTMLElement>(target).forEach((el) => checkElementOverflow(el));
        return;
    }

    // single element case
    checkElementOverflow(target);
}

function checkElementOverflow(el: HTMLElement) {
    const hasTop = el.scrollTop > 0;
    const hasBottom = Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight;

    el.classList.add("can-overflow");
    el.classList.toggle("overflow-top", hasTop);
    el.classList.toggle("overflow-bottom", hasBottom);
}