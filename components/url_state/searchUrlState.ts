import { type SearchMode } from "@/components/page/search/SearchSelect";

export type SearchUrlState = {
    mode: SearchMode;
    query: string;
    regex: boolean;
    details: string | null;
    isin: string | null;
    value: string | null;
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
            isin: null,
            value: null,
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
        isin: hashParams.get("isin") ?? legacySearchParams.get("isin"),
        value: hashParams.get("value") ?? legacySearchParams.get("value"),
    };
}

export function writeSearchUrlState(state: SearchUrlState) {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams();

    if (state.query) hashParams.set("query", state.query);
    if (state.regex) hashParams.set("regex", "true");
    if (state.details !== null) hashParams.set("details", state.details);
    if (state.isin !== null) hashParams.set("isin", state.isin);
    if (state.value !== null) hashParams.set("value", state.value);

    url.hash = `${modeHashes[state.mode]}${hashParams.toString() ? `?${hashParams}` : ""}`;
    url.searchParams.delete("details");
    url.searchParams.delete("isin");
    url.searchParams.delete("value");

    window.history.replaceState(null, "", url);
}
