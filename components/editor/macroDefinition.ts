import { buildSearchUrlHash, readSearchUrlState } from "@/components/url_state/searchUrlState";

export function buildMacroDefinitionUrl(name: string): string {
    const macroName = String(name ?? "").trim();
    if (!macroName) return "/search";

    const state = readSearchUrlState();
    return `/search#${buildSearchUrlHash({ ...state, mode: "macros", details: macroName }, "/search")}`;
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

export function buildVariableDefinitionUrl(name: string): string {
    const variableName = String(name ?? "").trim();
    if (!variableName) return "/search";

    const state = readSearchUrlState();
    return `/search#${buildSearchUrlHash({ ...state, mode: "macros", details: variableName }, "/search")}`;
}

export function getVariableDefinitionNameFromElement(target: EventTarget | null): string | null {
    const element = target instanceof Element
        ? target.closest(".macro-variable")
        : target instanceof Node
        ? target.parentElement?.closest(".macro-variable")
        : null;
    if (!element) return null;

    const macroVariable = element.getAttribute("data-macro-variable") ?? element.textContent ?? "";
    return macroVariable.trim() || null;
}