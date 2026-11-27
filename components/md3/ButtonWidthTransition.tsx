"use client";

import { useEffect } from "react";

type SizeProperty = "width" | "height";

type TransitionConfig = {
    duration: number;
    delay: number;
    easing: string;
};

type SizeValues = Record<SizeProperty, number>;

const SIZE_PROPERTIES: SizeProperty[] = ["width", "height"];
const activeAnimations = new WeakMap<HTMLElement, Set<Animation>>();

function splitCssList(value: string) {
    const values: string[] = [];
    let depth = 0;
    let start = 0;

    for (let index = 0; index < value.length; index++) {
        if (value[index] === "(") depth++;
        if (value[index] === ")") depth--;
        if (value[index] === "," && depth === 0) {
            values.push(value.slice(start, index).trim());
            start = index + 1;
        }
    }

    values.push(value.slice(start).trim());
    return values;
}

function parseTime(value: string | undefined) {
    if (!value) return 0;
    const match = value.match(/^(-?\d*\.?\d+)(ms|s)$/);
    if (!match) return 0;
    return Number(match[1]) * (match[2] === "s" ? 1000 : 1);
}

function getTransitionConfig(element: HTMLElement, property: SizeProperty): TransitionConfig | undefined {
    const style = getComputedStyle(element);
    const properties = splitCssList(style.transitionProperty);
    const propertyIndex = properties.lastIndexOf(property);
    const transitionIndex = propertyIndex >= 0 ? propertyIndex : properties.lastIndexOf("all");
    if (transitionIndex < 0) return undefined;

    const durations = splitCssList(style.transitionDuration);
    const delays = splitCssList(style.transitionDelay);
    const easings = splitCssList(style.transitionTimingFunction);
    const duration = parseTime(durations[transitionIndex % durations.length]);
    if (duration <= 0) return undefined;

    return {
        duration,
        delay: parseTime(delays[transitionIndex % delays.length]),
        easing: easings[transitionIndex % easings.length] || "ease",
    };
}

function getDimension(element: HTMLElement, property: SizeProperty) {
    const value = Number.parseFloat(getComputedStyle(element)[property]);
    return Number.isFinite(value) ? value : 0;
}

function measureTargetSizes(element: HTMLElement, properties: SizeProperty[]) {
    const inlineTransition = element.style.getPropertyValue("transition");
    const inlinePriority = element.style.getPropertyPriority("transition");

    element.style.setProperty("transition", "none", "important");
    void element.offsetWidth;

    const sizes = {} as SizeValues;
    for (const property of properties) {
        sizes[property] = getDimension(element, property);
    }

    if (inlineTransition) {
        element.style.setProperty("transition", inlineTransition, inlinePriority);
    } else {
        element.style.removeProperty("transition");
    }

    return sizes;
}

function parseRequestedProperties(value: string | null): SizeProperty[] {
    if (value === null || !value.trim() || value === "auto") return SIZE_PROPERTIES;

    const properties = value
        .split(/\s+/)
        .filter((property): property is SizeProperty => property === "width" || property === "height");
    return properties.length ? properties : SIZE_PROPERTIES;
}

function clearAnimations(element: HTMLElement) {
    const animations = activeAnimations.get(element);
    if (!animations) return;

    activeAnimations.delete(element);
    animations.forEach((animation) => animation.cancel());
}

function animateSizeChange(
    element: HTMLElement,
    fromSizes: SizeValues,
    toSizes: SizeValues,
    configs: Partial<Record<SizeProperty, TransitionConfig>>,
    properties: SizeProperty[],
    onFinish?: () => void,
) {
    clearAnimations(element);

    const animations = new Set<Animation>();
    for (const property of properties) {
        const config = configs[property];
        if (!config || Math.abs(toSizes[property] - fromSizes[property]) < 0.5) continue;

        animations.add(element.animate(
            [{ [property]: `${fromSizes[property]}px` }, { [property]: `${toSizes[property]}px` }],
            {
                duration: config.duration,
                delay: config.delay,
                easing: config.easing,
            },
        ));
    }

    if (!animations.size) {
        onFinish?.();
        return;
    }

    activeAnimations.set(element, animations);
    const finishIfComplete = () => {
        if (activeAnimations.get(element) !== animations) return;
        if (Array.from(animations).some((animation) => animation.playState !== "finished")) return;

        activeAnimations.delete(element);
        animations.forEach((animation) => animation.cancel());
        onFinish?.();
    };

    animations.forEach((animation) => {
        animation.finished.then(finishIfComplete, finishIfComplete);
    });
}

function transitionToCurrentSize(element: HTMLElement, fromSizes: SizeValues, properties: SizeProperty[]) {
    const configs: Partial<Record<SizeProperty, TransitionConfig>> = {};
    for (const property of properties) {
        const config = getTransitionConfig(element, property);
        if (config) configs[property] = config;
    }
    const toSizes = measureTargetSizes(element, properties);
    animateSizeChange(element, fromSizes, toSizes, configs, properties);
}

/**
 * Observe every CSS size change for a ref-backed element.
 */
export function observeElementSizeTransition(
    element: HTMLElement | null,
    properties: SizeProperty[] = SIZE_PROPERTIES,
) {
    if (!element) return () => undefined;

    let lastSizes = measureTargetSizes(element, properties);
    let disposed = false;

    const processSizeChange = () => {
        if (disposed || activeAnimations.get(element)?.size) return;

        const configs: Partial<Record<SizeProperty, TransitionConfig>> = {};
        for (const property of properties) {
            const config = getTransitionConfig(element, property);
            if (config) configs[property] = config;
        }

        const toSizes = measureTargetSizes(element, properties);
        const changedProperties = properties.filter(
            (property) => Math.abs(toSizes[property] - lastSizes[property]) >= 0.5,
        );
        if (!changedProperties.length) {
            lastSizes = toSizes;
            return;
        }

        const fromSizes = lastSizes;
        lastSizes = toSizes;
        animateSizeChange(element, fromSizes, toSizes, configs, changedProperties, processSizeChange);
    };

    const resizeObserver = new ResizeObserver(processSizeChange);
    resizeObserver.observe(element);

    return () => {
        disposed = true;
        resizeObserver.disconnect();
        clearAnimations(element);
    };
}

/**
 * Animate a ref-backed element's size around a synchronous DOM or React update.
 */
export function transitionElementSize(
    element: HTMLElement | null,
    update: () => void,
    properties: SizeProperty[] = SIZE_PROPERTIES,
) {
    if (!element) {
        update();
        return;
    }

    const fromSizes = measureTargetSizes(element, properties);
    update();
    requestAnimationFrame(() => transitionToCurrentSize(element, fromSizes, properties));
}

function getLegacyToggleButton(target: EventTarget | null) {
    if (!(target instanceof Element)) return null;

    const button = target.closest<HTMLElement>(".btn");
    const checkbox = button?.querySelector<HTMLInputElement>(":scope > input[type='checkbox']");
    if (
        !button ||
        !checkbox ||
        button.style.width ||
        !button.querySelector(":scope > .btn-false") ||
        !button.querySelector(":scope > .btn-true")
    ) {
        return null;
    }

    return button;
}

export default function ButtonWidthTransition() {
    useEffect(() => {
        const observedElements = new Map<HTMLElement, { value: string; dispose: () => void }>();

        const syncElement = (element: HTMLElement) => {
            const value = element.getAttribute("data-auto-size-transition");
            const current = observedElements.get(element);
            if (value === null) {
                current?.dispose();
                observedElements.delete(element);
                return;
            }
            if (current?.value === value) return;

            current?.dispose();
            observedElements.set(element, {
                value,
                dispose: observeElementSizeTransition(element, parseRequestedProperties(value)),
            });
        };

        const syncTree = (node: Node) => {
            if (node instanceof HTMLElement && node.matches("[data-auto-size-transition]")) {
                syncElement(node);
            }
            if (node instanceof Element || node instanceof DocumentFragment) {
                node.querySelectorAll<HTMLElement>("[data-auto-size-transition]").forEach(syncElement);
            }
        };

        const removeTree = (node: Node) => {
            if (!(node instanceof Element || node instanceof DocumentFragment)) return;
            const elements = [
                ...(node instanceof HTMLElement && node.hasAttribute("data-auto-size-transition") ? [node] : []),
                ...node.querySelectorAll<HTMLElement>("[data-auto-size-transition]"),
            ];
            elements.forEach((element) => {
                observedElements.get(element)?.dispose();
                observedElements.delete(element);
            });
        };

        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
                    syncElement(mutation.target);
                } else if (mutation.type === "childList") {
                    mutation.addedNodes.forEach(syncTree);
                    mutation.removedNodes.forEach(removeTree);
                }
            });
        });

        syncTree(document.documentElement);
        mutationObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-auto-size-transition"],
            childList: true,
            subtree: true,
        });

        const handleClick = (event: MouseEvent) => {
            const button = getLegacyToggleButton(event.target);
            if (!button) return;

            const properties: SizeProperty[] = ["width"];
            const fromSizes = measureTargetSizes(button, properties);
            requestAnimationFrame(() => transitionToCurrentSize(button, fromSizes, properties));
        };
        document.addEventListener("click", handleClick, true);

        return () => {
            mutationObserver.disconnect();
            document.removeEventListener("click", handleClick, true);
            observedElements.forEach(({ dispose }) => dispose());
            observedElements.clear();
        };
    }, []);

    return null;
}
