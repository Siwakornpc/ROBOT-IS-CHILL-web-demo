export function buildMacroDefinitionUrl(name: string): string {
    const macroName = String(name ?? "").trim();

    if (!macroName) return "/search";

    return `/search#macros?details=${encodeURIComponent(macroName)}`;
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
