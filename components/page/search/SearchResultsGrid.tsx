"use client";

import { useEffect, useRef, useState } from "react";
import { type SearchMode } from "./SearchSelect";

const BATCH_SIZE = 32;
const MAX_IMAGE_RETRIES = 5;
const IMAGE_RETRY_DELAY_MS = 200;

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
    creator: number;
    description: string;
    value: string;
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

type SearchResults = Record<string, unknown>;
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
    return typeof value === "object" && value !== null
        && "creator" in value
        && "description" in value
        && "value" in value;
}

function RetryImage({
    name,
    batch,
    src,
    onSettled,
}: {
    name: string;
    batch: number;
    src: string;
    onSettled: (name: string, batch: number) => void;
}) {
    const [retry, setRetry] = useState(0);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setRetry(0);
        setFailed(false);
    }, [name, batch]);

    useEffect(() => {
        return () => {
            // Any pending retry timeout is cancelled by the effect
            // below because its cleanup runs before the next effect.
        };
    }, []);

    function handleLoad() {
        onSettled(name, batch);
    }

    function handleError() {
        if (retry >= MAX_IMAGE_RETRIES) {
            setFailed(true);
            onSettled(name, batch);
            return;
        }

        const delay = IMAGE_RETRY_DELAY_MS * 2 ** retry;

        const timeout = window.setTimeout(() => {
            setRetry((current) => current + 1);
        }, delay);

        // This doesn't actually clean up the timeout yet.
        // See the version below.
        void timeout;
    }

    if (failed) {
        return (
            <img
                className="search-item-tile"
                src={`${src}`}
            />
        );
    }

    return (
        <img
            className="search-item-tile"
            src={`${src}?retry=${retry}`}
            alt=""
            onLoad={handleLoad}
            onError={handleError}
        />
    );
}

export default function SearchResults({
    mode,
    onSelect,
    searchQuery = "",
    filters = {},
}: {
    mode: SearchMode;
    onSelect: (selected: SelectedSearchResult) => void;
    searchQuery?: string;
    filters?: Record<string, string[]>;
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
    const activeBatchRef = useRef(0);
    const settledImagesRef = useRef(new Set<string>());
    const retryingImagesRef = useRef(new Set<string>());
    const imageRetryCountsRef = useRef(new Map<string, number>());
    const [activeBatch, setActiveBatch] = useState(0);
    const [settledImageCount, setSettledImageCount] = useState(0);
    const [imageRetries, setImageRetries] = useState<Record<string, number>>({});

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
            setLoadedResults({
                endpoint: endpointToLoad,
                data: cached,
            });
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

                const data: SearchResults = await response.json();
                cachedResults.set(endpointToLoad, data);
                setLoadedResults({
                    endpoint: endpointToLoad,
                    data,
                });
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

    const allEntries = results ? Object.entries(results) : [];
    const filteredEntries = allEntries.filter(([name, data]) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();

            if (mode === "macro") {
                try {
                    const regex = new RegExp(query, "i");
                    if (!regex.test(name)) {
                        return false;
                    }
                } catch (err) {}
            } else {
                const nameMatch = name.toLowerCase().includes(query);
                if (!nameMatch) {
                    return false;
                }
            }
        }

        // apply filters
        for (const [filterKey, filterValues] of Object.entries(filters)) {
            if (filterValues.length === 0) continue;
            if (filterKey === "creator" && isMacroRecord(data)) {
                if (!filterValues.includes(data.creator.toString())) {
                    return false;
                }
            }
        }

        return true;
    });

    const entries = filteredEntries.slice(0, visibleCount);
    const totalEntries = filteredEntries.length;
    const hasMore = visibleCount < totalEntries;
    const currentBatchStart = Math.max(0, visibleCount - BATCH_SIZE);
    const currentBatchSize = entries.length - currentBatchStart;
    const canLoadMore = hasMore
        && currentBatchSize > 0
        && (
            mode === "macro"
            || mode === "filter"
            || settledImageCount >= currentBatchSize
        );

    function markImageSettled(name: string, imageBatch: number) {
        if (imageBatch !== activeBatchRef.current || settledImagesRef.current.has(name)) {
            return;
        }

        settledImagesRef.current.add(name);
        setSettledImageCount((count) => count + 1);
    }

    async function retryFailedImage(name: string, imageBatch: number) {
        if (imageBatch !== activeBatchRef.current || retryingImagesRef.current.has(name)) {
            return;
        }

        retryingImagesRef.current.add(name);

        try {
            const response = await fetch(`/api/tiles/${encodeURIComponent(name)}`, {
                method: "HEAD",
                cache: "no-store",
            });

            if (response.status === 404 || response.status === 405) {
                markImageSettled(name, imageBatch);
                return;
            }

            const retryCount = imageRetryCountsRef.current.get(name) ?? 0;
            if (retryCount >= MAX_IMAGE_RETRIES) {
                markImageSettled(name, imageBatch);
                return;
            }

            await new Promise((resolve) => setTimeout(resolve, IMAGE_RETRY_DELAY_MS));
            if (imageBatch !== activeBatchRef.current) return;

            imageRetryCountsRef.current.set(name, retryCount + 1);
            setImageRetries((current) => ({
                ...current,
                [name]: retryCount + 1,
            }));
        } catch {
            const retryCount = imageRetryCountsRef.current.get(name) ?? 0;
            if (retryCount >= MAX_IMAGE_RETRIES) {
                markImageSettled(name, imageBatch);
                return;
            }

            await new Promise((resolve) => setTimeout(resolve, IMAGE_RETRY_DELAY_MS));
            if (imageBatch !== activeBatchRef.current) return;

            imageRetryCountsRef.current.set(name, retryCount + 1);
            setImageRetries((current) => ({
                ...current,
                [name]: retryCount + 1,
            }));
        } finally {
            retryingImagesRef.current.delete(name);
        }
    }

    const loadingMoreRef = useRef(false);

    useEffect(() => {
        const sentinel = loadMoreRef.current;
        const scrollArea = gridRef.current;

        if (!sentinel || !scrollArea || !canLoadMore) {
            return;
        }

        loadingMoreRef.current = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || loadingMoreRef.current) {
                    return;
                }

                loadingMoreRef.current = true;
                activeBatchRef.current += 1;
                settledImagesRef.current.clear();
                retryingImagesRef.current.clear();
                imageRetryCountsRef.current.clear();

                setActiveBatch(activeBatchRef.current);
                setSettledImageCount(0);
                setImageRetries({});
                setVisibleCount((count) => count + BATCH_SIZE);

                observer.disconnect();
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
    }, [canLoadMore, visibleCount]);

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
                    const imageBatch = index >= currentBatchStart ? activeBatch : -1;
                    let imageUrl = `https://ric-api.sno.mba/tiles/${encodeURIComponent(name)}.gif`;

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
                        <RetryImage
                            name={name}
                            batch={imageBatch}
                            src={imageUrl}
                            onSettled={markImageSettled}
                        />
                        <span className="search-item-name">{name}</span>
                    </button>
                    );
                })
            )}

            {mode === "macro" && (
                entries.map(([name, macro]) => (
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
                        <span className="search-item-macro">
                            <span className="macro-brackets">[</span>
                            <span className="macro-name">
                                {displayMacroName(name)}
                            </span>
                            <span className="macro-brackets">]</span>
                        </span>
                    </button>
                ))
            )}

            {hasMore && <div ref={loadMoreRef} />}
        </div>
    );
}
