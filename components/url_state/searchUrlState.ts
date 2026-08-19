import { type SearchMode } from "@/components/page/search/SearchSelect";

export type SearchUrlState = {
    mode: SearchMode;
    query: string;
    regex: boolean;
    details: string | null;
    code: string | null;
};

const modeHashes: Record<SearchMode, string> = {
    tiles: "tiles",
    macros: "macros",
    variants: "variants",
    filters: "filters",
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
    const legacySearchParams = new URLSearchParams(window.location.search);

    return {
        mode: hashModes[hashName.toLowerCase()] ?? "tiles",
        query: hashParams.get("query") ?? "",
        regex: hashParams.get("regex")?.toLowerCase() === "true",
        details: hashParams.get("details") ?? legacySearchParams.get("details"),
        code: hashParams.get("code") ?? legacySearchParams.get("code"),
    };
}

export function writeSearchUrlState(state: SearchUrlState) {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams();

    if (state.query) hashParams.set("query", state.query);
    if (state.regex) hashParams.set("regex", "true");
    if (state.details !== null) hashParams.set("details", state.details);
    if (state.code !== null) hashParams.set("code", state.code);

    url.hash = state.mode
        ? `${modeHashes[state.mode]}${hashParams.toString()
            ? `?${hashParams}`
            : ""}`
        : `${hashParams.toString()
            ? `?${hashParams}`
            : ""}`;
    url.searchParams.delete("details");
    url.searchParams.delete("code");

    window.history.replaceState(null, "", url);
}