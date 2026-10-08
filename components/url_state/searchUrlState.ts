import { type SearchMode } from "@/components/page/search/SearchSelect";
import { type RenderMode } from "@/components/page/render/get_render";

export type SearchUrlState = {
    mode: SearchMode;
    query: string;
    regex: boolean;
    filters: Record<SearchMode, Record<string, string[]>>;
    details: string | null;
    code: string | null;
    renderMode: RenderMode | null;
};

export type WriteSearchUrlState = Partial<Omit<SearchUrlState, "mode" | "renderMode">> & {
    mode?: SearchMode | null;
    renderMode?: RenderMode | null;
};

const searchModes: SearchMode[] = [
    "tiles", "macros", "variants", "flags", "filters", "palettes", "levels", "overlays",
];

function emptyFilters(): Record<SearchMode, Record<string, string[]>> {
    return {
        tiles: {}, macros: {}, filters: {}, variants: {}, flags: {},
        levels: {}, palettes: {}, overlays: {},
    };
}

function parseFilters(value: string | null) {
    if (!value) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        if (!parsed || typeof parsed !== "object") return null;
        const payload = parsed as { query?: unknown; regex?: unknown; values?: unknown };
        const values = emptyFilters();
        if (payload.values && typeof payload.values === "object") {
            for (const mode of searchModes) {
                const modeFilters = (payload.values as Record<string, unknown>)[mode];
                if (!modeFilters || typeof modeFilters !== "object") continue;
                for (const [key, entries] of Object.entries(modeFilters)) {
                    if (Array.isArray(entries) && entries.every((entry) => typeof entry === "string")) {
                        values[mode][key] = entries;
                    }
                }
            }
        }
        return {
            query: typeof payload.query === "string" ? payload.query : null,
            regex: typeof payload.regex === "boolean" ? payload.regex : null,
            values,
        };
    } catch {
        return null;
    }
}

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
            filters: emptyFilters(),
            details: null,
            code: null,
            renderMode: null,
        };
    }

    const [hashName, hashQuery = ""] = window.location.hash
        .slice(1)
        .split("?", 2);

    const hashParams = new URLSearchParams(hashQuery);
    const searchParams = new URLSearchParams(window.location.search);
    const parsedFilters = parseFilters(hashParams.get("filters"));

    const searchCode = readCodeFromUrlParam(searchParams.get("code"));
    const hashCode = readCodeFromUrlParam(hashParams.get("code"));
    const renderModeParam = hashParams.get("mode");

    return {
        mode: hashModes[hashName.toLowerCase()] ?? "tiles",
        query: parsedFilters?.query ?? hashParams.get("query") ?? "",
        regex: parsedFilters?.regex ?? hashParams.get("regex")?.toLowerCase() === "true",
        filters: parsedFilters?.values ?? emptyFilters(),
        details: hashParams.get("details") ?? searchParams.get("details"),
        code: searchCode ?? hashCode,
        renderMode: renderModeParam === "r" || renderModeParam === "t"
            ? renderModeParam
            : null,
    };
}

export function buildSearchUrlHash(
    state: SearchUrlState,
    pathname: string,
    includeDetails = true,
): string {
    const hashParams = new URLSearchParams();
    const isRenderPage = pathname.replace(/\/$/, "") === "/render";
    const hasSearchState = Boolean(state.query || state.regex || Object.values(state.filters ?? {}).some(
        (modeFilters) => Object.values(modeFilters).some((values) => values.length > 0),
    ));

    if (hasSearchState) {
        hashParams.set("filters", JSON.stringify({
            query: state.query,
            regex: state.regex,
            values: state.filters,
        }));
    }

    if (includeDetails && state.details != null) {
        hashParams.set("details", state.details);
    }

    if (state.renderMode !== null || isRenderPage) {
        hashParams.set("mode", state.renderMode ?? "t");
    }

    if (state.code != null) {
        hashParams.set("code", encodeCodeForUrl(state.code));
    }

    const paramString = hashParams.toString();
    const modeSegment = modeHashes[state.mode];
    return modeSegment || paramString
        ? `${modeSegment}${paramString ? `?${paramString}` : ""}`
        : "";
}

export function writeSearchUrlState(state: WriteSearchUrlState) {
    const url = new URL(window.location.href);
    const current = readSearchUrlState();
    const nextState: SearchUrlState = {
        mode: state.mode ?? current.mode,
        query: state.query ?? current.query,
        regex: state.regex ?? current.regex,
        filters: state.filters ?? current.filters,
        details: state.details === undefined ? current.details : state.details,
        code: state.code === undefined ? current.code : state.code,
        renderMode: state.renderMode ?? current.renderMode,
    };

    url.hash = buildSearchUrlHash(nextState, url.pathname);

    url.searchParams.delete("details");
    url.searchParams.delete("code");

    window.history.replaceState(null, "", url);
}
