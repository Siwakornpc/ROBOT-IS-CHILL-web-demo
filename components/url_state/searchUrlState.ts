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

const URL_CODE_PREFIX = "h1_";

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

function encodeUrlSafeBase64(input: string): string {
    const bytes = new TextEncoder().encode(input);
    let binary = "";

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function decodeUrlSafeBase64(input: string): string | null {
    try {
        const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
        const padded =
            normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

        return new TextDecoder().decode(bytes);
    } catch {
        return null;
    }
}

export function encodeCodeForUrl(code: string): string {
    return `${URL_CODE_PREFIX}${encodeUrlSafeBase64(code)}`;
}

export function readCodeFromUrlParam(codeParam: string | null): string | null {
    if (!codeParam) {
        return null;
    }

    if (codeParam.startsWith(URL_CODE_PREFIX)) {
        return decodeUrlSafeBase64(
            codeParam.slice(URL_CODE_PREFIX.length),
        );
    }

    return codeParam;
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

    const [hashName, hashQuery = ""] = window.location.hash
        .slice(1)
        .split("?", 2);

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

    if (state.query) {
        hashParams.set("query", state.query);
    }

    if (state.regex) {
        hashParams.set("regex", "true");
    }

    if (state.details !== null) {
        hashParams.set("details", state.details);
    }

    const paramString = hashParams.toString();
    const modeSegment = state.mode ? modeHashes[state.mode] : "";

    url.hash =
        modeSegment || paramString
            ? `${modeSegment}${paramString ? `?${paramString}` : ""}`
            : "";

    url.searchParams.delete("details");

    if (state.code !== null) {
        url.searchParams.set("code", encodeCodeForUrl(state.code));
    } else {
        url.searchParams.delete("code");
    }

    window.history.replaceState(null, "", url);
}
