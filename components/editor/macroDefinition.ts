"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function buildMacroDefinitionUrl(name: string): string {
    const macroName = String(name ?? "").trim();
    if (!macroName) return "/search";

    const [codeParam, setCodeParam] = useState<string>("");

    useEffect(() => {
        const match = window.location.search.match(/(?:\?|&)(code=[^&]*)/)
        if (match) setCodeParam(`?${match[1]}`);
    }, []);

    return `/search#macros?details=${encodeURIComponent(macroName)}${codeParam}`;
}

export function getMacroDefinitionNameFromElement(target: EventTarget | null): string | null {
    const element = target instanceof Element
        ? target.closest(".macro-name")
        : target instanceof Node
        ? target.parentElement?.closest(".macro-name")
        : null;
    if (!element) return null;

    const macroName = element.getAttribute("data-macro-name") ?? element.textContent ?? "";
    const trimmed = macroName.trim();
    return trimmed || null;
}
