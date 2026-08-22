"use client";

import { useEffect, useRef, useState } from "react";
import { type SearchMode } from "./SearchSelect";
import stdlib_macros from "./stdlib_macros";
import JSONbig from "json-bigint";
import { applyOverflowFade } from "@/components/OverflowFade";

const BATCH_SIZE = 32;

const endpoints: Partial<Record<SearchMode, string>> = {
    tiles: "tiles.json",
    macros: "macros.json",
    filters: "filters.json",
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
    creator?: string;
    value?: string;
};
export type FilterRecord = {
    absolute: boolean;
    author: string;
    upload_time: number | null;
};

export type SelectedTile = {
    name: string;
    tile: TileRecord;
};
export type SelectedMacro = {
    name: string;
    macro: MacroRecord;
};
export type SelectedFilter = {
    name: string;
    filter: FilterRecord;
};

export type SelectedSearchResult = SelectedTile | SelectedMacro | SelectedFilter;

type SearchEntry = [string, unknown];
type SearchResults = Record<string, unknown> | SearchEntry[];
type LoadedResults = {
    endpoint: string;
    data: SearchResults;
};

const cachedResults = new Map<string, SearchResults>();

function isTileRecord(value: unknown): value is TileRecord {
    return typeof value === "object"
        && value !== null
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
function isFilterRecord(value: unknown): value is FilterRecord {
    return typeof value === "object"
        && value !== null
        && "absolute" in value
        && "author" in value
        && "upload_time" in value;
}

export default function SearchResults({
    mode,
    onSelect,
    detailsName = null,
    searchQuery = "",
    filters = {},
    useRegex = false,
}: {
    mode: SearchMode;
    onSelect: (selected: SelectedSearchResult) => void;
    detailsName?: string | null;
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
    const restoredDetailsRef = useRef<string | null>(null);

    // Images load one at a time (rather than all-at-once per batch) to avoid
    // hammering the API and tripping its rate limit. Keep settled names so
    // filtering does not replace already-loaded images with placeholders.
    const [settledImages, setSettledImages] = useState<Set<string>>(new Set());

    function settleImage(name: string) {
        setSettledImages((settled) => {
            if (settled.has(name)) return settled;
            return new Set(settled).add(name);
        });
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

                    const apiMacroEntries: SearchEntry[] = Object.entries(data)
                        .map(([name, macro]): SearchEntry => [
                            name.trim(),
                            {
                                ...(macro as Record<string, unknown>),
                                builtin: false,
                            },
                        ])
                        .filter(([name]) => Boolean(name));

                    const stdMacroNames = new Set(
                        stdMacros.map(([name]) => String(name ?? "").trim()),
                    );

                    const combinedMacros: SearchEntry[] = [
                        ...stdMacros,
                        ...apiMacroEntries.filter(([name]) => !stdMacroNames.has(name)),
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
        const normalizedName = String(name ?? "").trim();

        if (!normalizedName) {
            return false;
        }

        if (searchQuery) {
            if (useRegex) {
                // Use regex search
                try {
                    const regex = new RegExp(searchQuery, "i");
                    if (!regex.test(normalizedName)) {
                        return false;
                    }
                } catch {
                    return false;
                }
            } else {
                const query = searchQuery.toLowerCase();

                if (!normalizedName.toLowerCase().includes(query)) {
                    return false;
                }
            }
        }

        // apply filters
        for (const [filterKey, filterValues] of Object.entries(filters)) {
            if (filterValues.length === 0) continue;

            if (filterKey === "creator" && isMacroRecord(data)) {
                if (
                    data.creator === undefined || !filterValues.includes(data.creator.toString())
                ) {
                    return false;
                }
            }
        }

        return true;
    });

    useEffect(() => {
        if (!detailsName || (mode !== "tiles" && mode !== "macros" && mode !== "filters")) {
            restoredDetailsRef.current = null;
            return;
        }

        const detailsKey = `${mode}:${detailsName}`;
        if (restoredDetailsRef.current === detailsKey) {
            return;
        }

        const matchingEntry = allEntries.find(([name]) => String(name ?? "").trim() === detailsName);
        if (!matchingEntry) {
            return;
        }

        const [name, data] = matchingEntry;
        const safeName = String(name ?? "").trim();
        if (mode === "tiles" && isTileRecord(data)) {
            onSelect({ name: safeName, tile: data });
            restoredDetailsRef.current = detailsKey;
        } else if (mode === "macros" && isMacroRecord(data)) {
            onSelect({ name: safeName, macro: data });
            restoredDetailsRef.current = detailsKey;
        } else if (mode === "filters" && isFilterRecord(data)) {
            onSelect({ name: safeName, filter: data });
            restoredDetailsRef.current = detailsKey;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailsName, mode, results]);

    const entries = filteredEntries.slice(0, visibleCount);
    const nextImageName = entries
        .map(([name]) => String(name ?? "").trim())
        .find((name) => name && !settledImages.has(name));
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

    return (
        <div
            ref={(el) => {
                gridRef.current = el;
                applyOverflowFade(el, "y");
            }}
            className={`search-results ${mode} ascroll-y`}
            data-loaded={Boolean(results)}
        >
            {mode === "tiles" &&
                entries.map(([name, tile], index) => {
                    const safeName = String(name ?? "").trim();
                    const imageUrl = `https://ric-api.sno.mba/tiles/${encodeURIComponent(safeName)}.gif`;
                    const isBroken = brokenImages.has(safeName);
                    const canLoad = settledImages.has(safeName) || safeName === nextImageName;

                    return (
                        <button
                            type="button"
                            className="kill-styling search-item"
                            key={safeName || `tile-${index}`}
                            onClick={() => {
                                if (isTileRecord(tile)) {
                                    onSelect({ name: safeName, tile });
                                }
                            }}
                        >
                            {isBroken ? (
                                <div className="search-item-tile search-item-tile-broken">
                                    <div></div><div></div>
                                </div>
                            ) : canLoad ? (
                                <img
                                    className="search-item-tile"
                                    src={imageUrl}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    onLoad={() => settleImage(safeName)}
                                    onError={() => {
                                        handleImageError(safeName);
                                        settleImage(safeName);
                                    }}
                                />
                            ) : (
                                <span className="search-item-tile pending" aria-hidden="true" />
                            )}
                            <span className="search-item-name">{safeName}</span>
                        </button>
                    );
                })
            }

            {mode === "macros" &&
                entries.map(([name, macro], index) => {
                    const safeName = (name ?? "").trim();
                    const isBuiltin = isMacroRecord(macro) && macro.builtin ? "builtin" : "";

                    return (
                        <button
                            type="button"
                            className="kill-styling search-item"
                            key={safeName || `macro-${index}`}
                            onClick={() => {
                                if (isMacroRecord(macro)) {
                                    onSelect({ name: safeName, macro });
                                }
                            }}
                        >
                            <span
                                ref={(el) => applyOverflowFade(el, "y")}
                                className={`search-item-macro ${isBuiltin}`}
                            >
                                <span className="macro-brackets">[</span>
                                <span className="macro-name">{name}</span>
                                <span className="macro-brackets">]</span>
                            </span>
                        </button>
                    );
                })
            }

            {mode === "filters" &&
                entries.map(([name, filter], index) => {
                    const safeName = String(name ?? "").trim();
                    const imageUrl = `/api/filters/${encodeURIComponent(safeName)}`;
                    const isBroken = brokenImages.has(safeName);
                    const canLoad = settledImages.has(safeName) || safeName === nextImageName;

                    return (
                        <button
                            type="button"
                            className="kill-styling search-item"
                            key={safeName || `filter-${index}`}
                            onClick={() => {
                                console.log(filter);
                                if (isFilterRecord(filter)) {
                                    onSelect({ name: safeName, filter });
                                }
                            }}
                        >
                            {isBroken ? (
                                <div className="search-item-tile search-item-tile-broken">
                                    <div></div><div></div>
                                </div>
                            ) : canLoad ? (
                                <img
                                    className="search-item-tile"
                                    src={imageUrl}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    crossOrigin="anonymous"
                                    onLoad={() => settleImage(safeName)}
                                    onError={() => {
                                        handleImageError(safeName);
                                        settleImage(safeName);
                                    }}
                                />
                            ) : (
                                <span className="search-item-tile pending" aria-hidden="true" />
                            )}
                            <span className="search-item-name">{safeName}</span>
                        </button>
                    );
                })
            }

            {hasMore && <div ref={loadMoreRef} />}
        </div>
    );
}