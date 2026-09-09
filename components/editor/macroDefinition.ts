export function buildMacroDefinitionUrl(name: string): string {
    const macroName = String(name ?? "").trim();
    if (!macroName) return "/search";

    const codeParam = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("code");
    const codeQuery = codeParam === null ? "" : `&code=${encodeURIComponent(codeParam)}`;

    return `/search#macros?details=${encodeURIComponent(macroName)}${codeQuery}`;
}

export function getMacroDefinitionNameFromElement(target: EventTarget | null): string | null {
    const element = target instanceof Element
        ? target.closest(".macro-name")
        : target instanceof Node
        ? target.parentElement?.closest(".macro-name")
        : null;
    if (!element) return null;

    const macroName = element.getAttribute("data-macro-name") ?? element.textContent ?? "";
    return macroName.trim() || null;
}
