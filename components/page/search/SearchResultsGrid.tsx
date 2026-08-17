"use client";

import { useEffect, useRef, useState } from "react";
import { type SearchMode } from "./SearchSelect";
import stdlib_macros from "./stdlib_macros";
import JSONbig from "json-bigint";

const BATCH_SIZE = 32;

const endpoints: Partial<Record<SearchMode, string>> = {
    tile: "tiles.json",
    macro: "macros.json",
    filter: "filters.json",
} as const;

export type TileRecord = {
    active_color: [number, number];
    inactive_color: [number | null, number | null];
    sprite: [string, string];
    tags: string[];
    tiling: string;
};

export type MacroRecord = {
    description: string;
    builtin: boolean;
    creator?: number;
    value?: string;
};

export type SelectedTile = {
    name: string;
    tile: TileRecord;
};

export type SelectedMacro = {
    name: string;
    macro: MacroRecord;
};

export type SelectedSearchResult = SelectedTile | SelectedMacro;

type SearchEntry = [string, unknown];
type SearchResults = Record<string, unknown> | SearchEntry[];
type LoadedResults = {
    endpoint: string;
    data: SearchResults;
};


const cachedResults = new Map<string, SearchResults>();

function isTileRecord(value: unknown): value is TileRecord {
    return typeof value === "object" && value !== null
        && "active_color" in value
        && "inactive_color" in value
        && "sprite" in value
        && "tags" in value
        && "tiling" in value;
}

function isMacroRecord(value: unknown): value is MacroRecord {
    return typeof value === "object"
        && value !== null
        && "description" in value
        && "builtin" in value;
}

export default function SearchResults({
    mode,
    onSelect,
    searchQuery = "",
    filters = {},
    useRegex = false,
}: {
    mode: SearchMode;
    onSelect: (selected: SelectedSearchResult) => void;
    searchQuery?: string;
    filters?: Record<string, string[]>;
    useRegex?: boolean;
}) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [loadedResults, setLoadedResults] = useState<LoadedResults | null>(null);
    const endpoint = endpoints[mode];
    const results = endpoint
        ? loadedResults?.endpoint === endpoint
            ? loadedResults.data
            : cachedResults.get(endpoint) ?? null
        : null;

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

    // Images load one at a time (rather than all-at-once per batch) to avoid
    // hammering the API and tripping its rate limit. `readyCount` is how many
    // tile images are allowed to have a real `src` right now; the next one
    // is unlocked once the current one settles (loads or errors).
    const [readyCount, setReadyCount] = useState(1);

    useEffect(() => {
        setReadyCount(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, searchQuery, JSON.stringify(filters)]);

    function advanceReady(index: number) {
        setReadyCount((count) => Math.max(count, index + 2));
    }

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        });

        observer.observe(grid);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const currentEndpoint = endpoint;
        if (!isVisible || !currentEndpoint) return;
        const endpointToLoad = currentEndpoint;

        const cached = cachedResults.get(endpointToLoad);
        if (cached) {
            return;
        }

        const controller = new AbortController();

        async function loadResults() {
            try {
                const response = await fetch(
                    `https://ric-api.sno.mba/${endpointToLoad}`,
                    {
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error(
                        `RIC API returned ${response.status}`,
                    );
                }

                const json = await response.text();
                const data: SearchResults = JSONbig({
                    storeAsString: true,
                }).parse(json);

                if (endpointToLoad === "macros.json") {
                    const stdMacros = await stdlib_macros();

                    const apiMacroEntries: SearchEntry[] = Object.entries(data).map(
                        ([name, macro]) => [
                            name,
                            {
                                ...(macro as Record<string, unknown>),
                                builtin: false,
                            },
                        ],
                    );

                    const combinedMacros: SearchEntry[] = [
                        ...stdMacros,
                        ...apiMacroEntries,
                    ];

                    cachedResults.set(endpointToLoad, combinedMacros);

                    setLoadedResults({
                        endpoint: endpointToLoad,
                        data: combinedMacros,
                    });
                } else {
                    cachedResults.set(endpointToLoad, data);
                    setLoadedResults({
                        endpoint: endpointToLoad,
                        data,
                    });
                }
            } catch (error: unknown) {
                if ((error as Error).name !== "AbortError") {
                    console.error(
                        "Could not load RIC search results.",
                        error,
                    );
                }
            }
        }

        loadResults();
        return () => controller.abort();
    }, [endpoint, isVisible]);

    const allEntries: SearchEntry[] = results
        ? Array.isArray(results)
            ? results
            : Object.entries(results)
        : [];
    const filteredEntries = allEntries.filter(([name, data]) => {
        if (searchQuery) {
            if (useRegex) {
                // Use regex search
                try {
                    const regex = new RegExp(searchQuery, "i");
                    if (!regex.test(name)) {
                        return false;
                    }
                } catch {
                    return false;
                }
            } else {
                const query = searchQuery.toLowerCase();

                if (!name.toLowerCase().includes(query)) {
                    return false;
                }
            }
        }

        // apply filters
        for (const [filterKey, filterValues] of Object.entries(filters)) {
            if (filterValues.length === 0) continue;

            if (filterKey === "creator" && isMacroRecord(data)) {
                if (
                    data.creator === undefined
                    || !filterValues.includes(data.creator.toString())
                ) {
                    return false;
                }
            }
        }

        return true;
    });

    const entries = filteredEntries.slice(0, visibleCount);
    const totalEntries = filteredEntries.length;
    const hasMore = visibleCount < totalEntries;

    function handleImageError(name: string) {
        setBrokenImages((current) => {
            if (current.has(name)) return current;
            const next = new Set(current);
            next.add(name);
            return next;
        });
    }

    const loadingMoreRef = useRef(false);

    useEffect(() => {
        const sentinel = loadMoreRef.current;
        const scrollArea = gridRef.current;

        if (!sentinel || !scrollArea || !hasMore) {
            return;
        }

        loadingMoreRef.current = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || loadingMoreRef.current) {
                    return;
                }

                loadingMoreRef.current = true;
                setVisibleCount((count) => count + BATCH_SIZE);
            },
            {
                root: scrollArea,
                rootMargin: "200px 0px",
            },
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, visibleCount]);

    useEffect(() => {
        loadingMoreRef.current = false;
    }, [visibleCount]);

    function displayMacroName(name: string): string {
        return Array.from(name)
            .map((char) => {
                const code = char.charCodeAt(0);

                if (code === 0) return "\\0";
                if (code < 0x20 || code === 0x7f) {
                    return `\\x${code.toString(16).padStart(2, "0")}`;
                }

                return char;
            })
            .join("");
    }

    return (
        <div
            ref={gridRef}
            className={`search-results ${mode} ascroll-y`}
            data-loaded={Boolean(results)}
        >
            {mode === "tile" && (
                entries.map(([name, tile], index) => {
                    const imageUrl = `https://ric-api.sno.mba/tiles/${encodeURIComponent(name)}.gif`;
                    const isBroken = brokenImages.has(name);
                    const canLoad = index < readyCount;

                    return (
                    <button
                        type="button"
                        className="kill-styling search-item"
                        key={name}
                        onClick={() => {
                            if (isTileRecord(tile)) {
                                onSelect({ name, tile });
                            }
                        }}
                    >
                        {isBroken ? (
                            <span className="search-item-tile search-item-tile-broken" aria-hidden="true" />
                        ) : canLoad ? (
                            <img
                                className="search-item-tile"
                                src={imageUrl}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                onLoad={() => advanceReady(index)}
                                onError={() => {
                                    handleImageError(name);
                                    advanceReady(index);
                                }}
                            />
                        ) : (
                            <span className="search-item-tile search-item-tile-pending" aria-hidden="true" />
                        )}
                        <span className="search-item-name">{name}</span>
                    </button>
                    );
                })
            )}

            {mode === "macro" && (
                entries.map(([name, macro]) => {
                    const isBuiltin = isMacroRecord(macro) && macro.builtin ? "builtin" : "";

                    return (
                        <button
                            type="button"
                            className="kill-styling search-item"
                            key={name}
                            onClick={() => {
                                if (isMacroRecord(macro)) {
                                    onSelect({ name, macro });
                                }
                            }}
                        >
                            <span className={`search-item-macro ${isBuiltin}`}>
                                <span className="macro-brackets">[</span>
                                <span
                                    className="macro-name"
                                >
                                    {displayMacroName(name)}
                                </span>
                                <span className="macro-brackets">]</span>
                            </span>
                        </button>
                    );
                })
            )}

            {hasMore && <div ref={loadMoreRef} />}
        </div>
    );
}
