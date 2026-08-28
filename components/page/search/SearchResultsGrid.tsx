"use client";

import { useEffect, useRef, useState } from "react";
import { type SearchMode } from "./SearchSelect";
import stdlib_macros from "./stdlib_macros";
import JSONbig from "json-bigint";
import applyOverflowFade from "@/components/OverflowFade";
import {
    loadUpstream,
} from "@/data/ric_metadata";

const BATCH_SIZE = 32;

const IMAGE_SUCCESS_DELAY = 150;
const IMAGE_ERROR_DELAY = 2000;
const MAX_IMAGE_RETRIES = 4;

const {
    variants,
    flags,
} = await loadUpstream();

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

export type VariantRecord = {
    description: string;
    syntax?: string;
    applied: string;
}
export type FlagRecord = {
    syntax: string;
    description: string;
}

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

export type SelectedVariant = {
    name: string;
    variant: VariantRecord;
}
export type SelectedFlag = {
    name: string;
    flag: FlagRecord
}

export type SelectedSearchResult =
    SelectedTile
    | SelectedMacro
    | SelectedFilter
    | SelectedVariant
    | SelectedFlag;

const variantEntries: SearchEntry[] = Object.entries(variants);
const flagEntries: SearchEntry[] = Object.entries(flags);

type OverlayEntry = [string, VariantRecord] | [string, FlagRecord];

const overlayEntries: OverlayEntry[] = [
    ...Object.entries(variants),
    ...Object.entries(flags),
];

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

function isVariantRecord(value: unknown): value is VariantRecord {
    return typeof value === "object"
        && value !== null
        && "description" in value
        && "applied" in value;
}

function isFlagRecord(value: unknown): value is FlagRecord {
    return typeof value === "object"
        && value !== null
        && "syntax" in value
        && "description" in value;
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
        : mode === "variants"
            ? variantEntries
            : mode === "flags"
                ? flagEntries
                : null;

    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

    const [imageRetries, setImageRetries] = useState<Map<string, number>>(new Map());
    const [imageAttempt, setImageAttempt] = useState(0);
    const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

                    const macroMap = new Map<string, SearchEntry>();

                    // Standard-library macros win over API macros.
                    for (const [name, macro] of stdMacros) {
                        const safeName = String(name ?? "").trim();

                        if (!safeName) continue;

                        const key = safeName.toLowerCase();

                        macroMap.set(key, [
                            safeName,
                            {
                                ...(macro as Record<string, unknown>),
                                builtin: true,
                            },
                        ]);
                    }

                    // Add API macros only if they aren't already present.
                    for (const [name, macro] of Object.entries(data)) {
                        const safeName = String(name ?? "").trim();

                        if (!safeName) continue;

                        const key = safeName.toLowerCase();

                        if (macroMap.has(key)) continue;

                        macroMap.set(key, [
                            safeName,
                            {
                                ...(macro as Record<string, unknown>),
                                builtin: false,
                            },
                        ]);
                    }

                    const combinedMacros = Array.from(macroMap.values());

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

        if (!normalizedName) return false;

        if (searchQuery) {
            const searchableText =
                (mode === "variants" && isVariantRecord(data))
                    ? `${normalizedName} ${data.syntax ?? ""}`
                    : (mode === "flags" && isFlagRecord(data))
                        ? `${normalizedName} ${data.syntax ?? ""}`
                        : normalizedName;

            if (useRegex) {
                try {
                    const regex = new RegExp(searchQuery, "i");
                    if (!regex.test(searchableText)) return false;
                } catch {
                    return false;
                }
            } else {
                const query = searchQuery.toLowerCase();
                if (!searchableText.toLowerCase().includes(query)) return false;
            }
        }

        // apply active filters
        for (const [filterKey, filterValues] of Object.entries(filters)) {
            // ignore empty values
            const validValues = filterValues.filter((v) => v !== "" && v !== undefined && v !== null);
            if (validValues.length === 0) continue;

            // --- TILE FILTERS ---
            if (mode === "tiles" && isTileRecord(data)) {
                if (filterKey === "color") {
                    const [x, y] = data.active_color;
                    const tileColor = `${x},${y}`;
                    const selectedColors = validValues.flatMap((val) => val.split(";"));

                    if (!selectedColors.includes(tileColor)) return false;
                }

                if (filterKey === "iacolor") {
                    const [x, y] = data.inactive_color;
                    const tileIaColor = `${x},${y}`;
                    const selectedColors = validValues.flatMap((val) => val.split(";"));

                    if (!selectedColors.includes(tileIaColor)) return false;
                }

                if (filterKey === "tiling") {
                    if (!validValues.includes(data.tiling)) return false;
                }

                if (filterKey === "tags") {
                    const hasTag = validValues.some((val) => data.tags.some((tag) => tag.toLowerCase().includes(val.toLowerCase())));
                    if (!hasTag) return false;
                }

                if (filterKey === "source") {
                    const [sourceDir] = data.sprite;
                    if (!validValues.some((val) => sourceDir.toLowerCase().includes(val.toLowerCase()))) return false;
                }
            }

            // --- MACRO FILTERS ---
            if (mode === "macros" && isMacroRecord(data)) {
                if (filterKey === "creator") {
                    if (!data.creator || !validValues.includes(data.creator.toString())) return false;
                }

                if (filterKey === "builtin") {
                    const wantBuiltin = validValues.includes("true");
                    if (Boolean(data.builtin) !== wantBuiltin) return false;
                }

                if (filterKey === "desc") {
                    const matchesDesc = validValues.some((val) =>
                        data.description.toLowerCase().includes(val.toLowerCase())
                    );
                    if (!matchesDesc) return false;
                }
            }

            // --- FILTERIMAGE FILTERS ---
            if (mode === "filters" && isFilterRecord(data)) {
                if (filterKey === "creator") {
                    if (!validValues.includes(data.author)) return false;
                }

                if (filterKey === "mode") {
                    if (data.absolute !== (filters.mode[0] === "true")) return false;
                }
            }

            // --- VARIANT FILTERS ---
            if (mode === "variants" && isVariantRecord(data)) {
                if (filterKey === "desc") {
                    const matches = validValues.some((val) =>
                        data.description.toLowerCase().includes(val.toLowerCase())
                    );
                    if (!matches) return false;
                }
            }

            // --- FLAG FILTERS ---
            if (mode === "flags" && isFlagRecord(data)) {
                if (filterKey === "desc") {
                    const matches = validValues.some((val) =>
                        data.description.toLowerCase().includes(val.toLowerCase())
                    );
                    if (!matches) return false;
                }
            }
        }

        return true;
    });

    useEffect(() => {
        if (!detailsName ||
            !["tiles", "macros", "filters", "variants", "flags"]
            .includes(mode)
        ) {
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
        } else if (mode === "variants" && isVariantRecord(data)) {
            onSelect({ name: safeName, variant: data });
            restoredDetailsRef.current = detailsKey;
        } else if (mode === "flags" && isFlagRecord(data)) {
            onSelect({ name: safeName, flag: data });
            restoredDetailsRef.current = detailsKey;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detailsName, mode, results]);

    const entries = filteredEntries.slice(0, visibleCount);

    const nextImageName = entries
        .map(([name]) => String(name ?? "").trim())
        .find(
            (name) =>
                name &&
                !settledImages.has(name) &&
                !brokenImages.has(name),
        );


    function scheduleNextImage(delay: number) {
        if (imageTimerRef.current) {
            clearTimeout(imageTimerRef.current);
        }

        imageTimerRef.current = setTimeout(() => {
            setImageAttempt((attempt) => attempt + 1);
        }, delay);
    }

    function handleImageLoad(name: string) {
        setImageRetries((current) => {
            if (!current.has(name)) return current;

            const next = new Map(current);
            next.delete(name);
            return next;
        });

        settleImage(name);
        scheduleNextImage(IMAGE_SUCCESS_DELAY);
    }

    function handleImageError(name: string) {
        setImageRetries((current) => {
            const retries = current.get(name) ?? 0;

            if (retries >= MAX_IMAGE_RETRIES) {
                const next = new Map(current);
                next.delete(name);

                setBrokenImages((broken) => {
                    if (broken.has(name)) return broken;

                    const nextBroken = new Set(broken);
                    nextBroken.add(name);
                    return nextBroken;
                });

                return next;
            }

            const next = new Map(current);
            next.set(name, retries + 1);
            return next;
        });

        // Do NOT settle the image here.
        // It may have failed because of a 429.
        scheduleNextImage(IMAGE_ERROR_DELAY);
    }

    const totalEntries = filteredEntries.length;
    const hasMore = visibleCount < totalEntries;

    const loadingMoreRef = useRef(false);

    useEffect(() => {
        return () => {
            if (imageTimerRef.current) {
                clearTimeout(imageTimerRef.current);
            }
        };
    }, []);

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

    // returning states

    return (
        <div
            ref={(el) => {
                gridRef.current = el;
                applyOverflowFade(el, "y");
            }}
            className={`search-results ${mode} ascroll-y`}
            data-loaded={Boolean(results)}
        >

            {
                // Tiles
            }

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
                                    <div/><div/>
                                </div>
                            ) : canLoad ? (
                                <img
                                    key={`${safeName}-${imageAttempt}`}
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

            {
                // Macros
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

            {
                // Filters
            }

            {mode === "filters" &&
                entries.map(([name, filter], index) => {
                    const safeName = String(name ?? "").trim();
                    const imageUrl = `https://ric-api.sno.mba/filters/${encodeURIComponent(safeName)}.png`;
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
                                    key={`${safeName}-${imageAttempt}`}
                                    className="search-item-tile"
                                    src={imageUrl}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    onLoad={() => handleImageLoad(safeName)}
                                    onError={() => handleImageError(safeName)}
                                />
                            ) : (
                                <span className="search-item-tile pending" aria-hidden="true" />
                            )}
                            <span className="search-item-name">{safeName}</span>
                        </button>
                    );
                })
            }

            {
                // Variant
            }

            {mode === "variants" &&
                entries.map(([name, variant], index) => {
                    const safeName = (name ?? "").trim();

                    return (
                        <button
                            type="button"
                            className="kill-styling search-item"
                            key={safeName || `value-${index}`}
                            onClick={() => {
                                if (isVariantRecord(variant)) {
                                    onSelect({ name: safeName, variant });
                                }
                            }}
                        >
                            <span
                                ref={(el) => applyOverflowFade(el, "y")}
                                className={`search-item-variant`}
                            >
                                <span className="variant-name">:</span>
                                <span className="variant-name name">{name}</span>
                            </span>
                        </button>
                    );
                })
            }

            {
                // Flags
            }

            {mode === "flags" &&
                entries.map(([name, flag], index) => {
                    const safeName = (name ?? "").trim();

                    return (
                        <button
                            type="button"
                            className="kill-styling search-item"
                            key={safeName || `flag-${index}`}
                            onClick={() => {
                                if (isFlagRecord(flag)) {
                                    onSelect({ name: safeName, flag });
                                }
                            }}
                        >
                            <span
                                ref={(el) => applyOverflowFade(el, "y")}
                                className={`search-item-flag`}
                            >
                                <span className="flag-name">--</span>
                                <span className="flag-name name">{name}</span>
                            </span>
                        </button>
                    );
                })
            }
            {hasMore && <div ref={loadMoreRef} />}
        </div>
    );
}