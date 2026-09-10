import { type SearchMode } from "@/components/page/search/SearchSelect";

export type SearchUrlState = {
    mode: SearchMode;
    query: string;
    regex: boolean;
    details: string | null;
    code: string | null;
};

export type WriteSearchUrlState = Omit<SearchUrlState, "mode"> & {
    mode?: SearchMode | null;
};

const CODE_STORAGE_PREFIX = "ric_url_code_";

const modeHashes: Record<SearchMode, string> = {
    tiles: "tiles",
    macros: "macros",
    variants: "variants",
    flags: "flags",
    filters: "filters",
    palettes: "palettes",
    levels: "levels",
    overlays: "overlays",
};

const hashModes: Record<string, SearchMode> = Object.fromEntries(
    Object.entries(modeHashes).map(([mode, hash]) => [hash, mode]),
) as Record<string, SearchMode>;

function hashString(input: string): string {
    let hash = 2166136261;

    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
}

export function encodeCodeForUrl(code: string): string {
    const token = hashString(code);

    if (typeof window !== "undefined" && "localStorage" in window) {
        try {
            window.localStorage.setItem(`${CODE_STORAGE_PREFIX}${token}`, code);
            return token;
        } catch {
            // Fall back to the raw value if storage is unavailable.
        }
    }

    return code;
}

export function readCodeFromUrlParam(codeParam: string | null): string | null {
    if (codeParam === null || codeParam === "") {
        return null;
    }

    if (typeof window === "undefined" || !("localStorage" in window)) {
        return codeParam;
    }

    try {
        const storedCode = window.localStorage.getItem(`${CODE_STORAGE_PREFIX}${codeParam}`);
        return storedCode ?? codeParam;
    } catch {
        return codeParam;
    }
}

export function clearCodeFromUrlStorage(codeParam: string | null) {
    if (typeof window === "undefined" || !("localStorage" in window) || codeParam === null) {
        return;
    }

    try {
        window.localStorage.removeItem(`${CODE_STORAGE_PREFIX}${codeParam}`);
    } catch {
        // Ignore storage errors.
    }
}

export function readSearchUrlState(): SearchUrlState {
    if (typeof window === "undefined") {
        return {
            mode: "tiles",
            query: "",
            regex: false,
            details: null,
            code: null,
        };
    }

    const [hashName, hashQuery = ""] = window.location.hash.slice(1).split("?", 2);
    const hashParams = new URLSearchParams(hashQuery);
    const searchParams = new URLSearchParams(window.location.search);
    const searchCode = readCodeFromUrlParam(searchParams.get("code"));
    const hashCode = readCodeFromUrlParam(hashParams.get("code"));

    return {
        mode: hashModes[hashName.toLowerCase()] ?? "tiles",
        query: hashParams.get("query") ?? "",
        regex: hashParams.get("regex")?.toLowerCase() === "true",
        details: hashParams.get("details") ?? searchParams.get("details"),
        code: searchCode ?? hashCode,
    };
}

export function writeSearchUrlState(state: WriteSearchUrlState) {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams();

    if (state.query) hashParams.set("query", state.query);
    if (state.regex) hashParams.set("regex", "true");
    if (state.details !== null) hashParams.set("details", state.details);

    const paramString = hashParams.toString();
    const modeSegment = state.mode ? modeHashes[state.mode] : "";

    url.hash = modeSegment || paramString
        ? `${modeSegment}${paramString ? `?${paramString}` : ""}`
        : "";

    url.searchParams.delete("details");

    if (state.code !== null) {
        const encodedCode = encodeCodeForUrl(state.code);
        url.searchParams.set("code", encodedCode);
    } else {
        url.searchParams.delete("code");
    }

    window.history.replaceState(null, "", url);
}