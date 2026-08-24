export type OverflowDirection = "x" | "y" | "xy";

const activeElements = new WeakSet<HTMLElement>();

export default function applyOverflowFade(
    target: HTMLElement | HTMLElement[] | string | null,
    direction: OverflowDirection = "xy"
) {
    if (!target) return;

    if (Array.isArray(target)) {
        target.forEach((el) => setupOverflowTracking(el, direction));
        return;
    }

    if (typeof target === "string") {
        document.querySelectorAll<HTMLElement>(target).forEach((el) =>
            setupOverflowTracking(el, direction)
        );
        return;
    }

    setupOverflowTracking(target, direction);
}

function setupOverflowTracking(el: HTMLElement, direction: OverflowDirection) {
    el.dataset.overflowDirection = direction;

    checkElementOverflow(el);

    if (activeElements.has(el)) return;
    activeElements.add(el);

    // update on scroll
    el.addEventListener("scroll", () => checkElementOverflow(el), { passive: true });

    // update on size changes
    const resizeObserver = new ResizeObserver(() => {
        checkElementOverflow(el);
    });

    resizeObserver.observe(el);
    Array.from(el.children).forEach((child) => resizeObserver.observe(child));
}

function checkElementOverflow(el: HTMLElement) {
    const direction = (el.dataset.overflowDirection as OverflowDirection) || "xy";

    const checkY = direction === "y" || direction === "xy";
    const checkX = direction === "x" || direction === "xy";

    const hasTop = checkY && el.scrollTop > 0;
    const hasBottom = checkY && Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight;
    const hasLeft = checkX && el.scrollLeft > 0;
    const hasRight = checkX && Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;

    el.classList.add("can-overflow");
    el.classList.toggle("overflow-top", hasTop);
    el.classList.toggle("overflow-bottom", hasBottom);
    el.classList.toggle("overflow-left", hasLeft);
    el.classList.toggle("overflow-right", hasRight);
}