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

const modeHashes: Record<SearchMode, string> = {
    tiles: "tiles",
    macros: "macros",
    variants: "variants",
    filters: "filters",
    palettes: "palettes",
    levels: "levels",
    overlays: "overlays",
};

const hashModes: Record<string, SearchMode> = Object.fromEntries(
    Object.entries(modeHashes).map(([mode, hash]) => [hash, mode]),
) as Record<string, SearchMode>;

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

    return {
        mode: hashModes[hashName.toLowerCase()] ?? "tiles",
        query: hashParams.get("query") ?? "",
        regex: hashParams.get("regex")?.toLowerCase() === "true",
        details: hashParams.get("details") ?? searchParams.get("details"),
        code: searchParams.get("code") ?? hashParams.get("code"),
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
        url.searchParams.set("code", state.code);
    } else {
        url.searchParams.delete("code");
    }

    window.history.replaceState(null, "", url);
}