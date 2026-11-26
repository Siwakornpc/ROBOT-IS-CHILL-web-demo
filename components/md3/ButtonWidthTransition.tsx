"use client";

import { useEffect } from "react";

export default function ButtonWidthTransition() {
    useEffect(() => {
        const startWidths = new WeakMap<HTMLInputElement, number>();
        const animatingButtons = new WeakSet<HTMLElement>();

        const getToggleButton = (target: EventTarget | null) => {
            if (!(target instanceof Element)) return null;

            const button = target.closest<HTMLElement>(".btn");
            const checkbox = button?.querySelector<HTMLInputElement>(
                ":scope > input[type='checkbox']"
            );

            if (
                !button ||
                !checkbox ||
                button.style.width ||
                !button.querySelector(":scope > .btn-false") ||
                !button.querySelector(":scope > .btn-true")
            ) {
                return null;
            }

            return { button, checkbox };
        };

        const handleClick = (event: MouseEvent) => {
            const toggle = getToggleButton(event.target);
            if (!toggle) return;

            startWidths.set(
                toggle.checkbox,
                toggle.button.getBoundingClientRect().width
            );
        };

        const handleChange = (event: Event) => {
            const checkbox = event.target;
            if (!(checkbox instanceof HTMLInputElement)) return;

            const button = checkbox.parentElement;
            const startWidth = startWidths.get(checkbox);
            startWidths.delete(checkbox);

            if (!button?.matches(".btn") || startWidth === undefined) return;

            button.style.width = `${startWidth}px`;

            requestAnimationFrame(() => {
                button.style.width = "";
                const endWidth = button.getBoundingClientRect().width;

                button.style.width = `${startWidth}px`;
                button.getBoundingClientRect();
                button.style.width = `${endWidth}px`;

                if (Math.abs(endWidth - startWidth) < 0.5) {
                    button.style.width = "";
                    return;
                }

                animatingButtons.add(button);
            });
        };

        const handleTransitionEnd = (event: TransitionEvent) => {
            if (
                event.target instanceof HTMLElement &&
                animatingButtons.has(event.target) &&
                event.propertyName === "width"
            ) {
                event.target.style.width = "";
                animatingButtons.delete(event.target);
            }
        };

        document.addEventListener("click", handleClick, true);
        document.addEventListener("change", handleChange, true);
        document.addEventListener("transitionend", handleTransitionEnd, true);

        return () => {
            document.removeEventListener("click", handleClick, true);
            document.removeEventListener("change", handleChange, true);
            document.removeEventListener("transitionend", handleTransitionEnd, true);
        };
    }, []);

    return null;
}
