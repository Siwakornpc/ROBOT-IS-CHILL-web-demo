"use client";

import { useEffect, useRef, useState } from "react";
import { type SearchMode } from "./SearchSelect";

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

export type SelectedTile = {
    name: string;
    tile: TileRecord;
};

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

export default function SearchResults({
    mode,
    onTileSelect,
}: {
    mode: SearchMode;
    onTileSelect: (selectedTile: SelectedTile) => void;
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
    const [activeBatch, setActiveBatch] = useState(0);
    const [settledImageCount, setSettledImageCount] = useState(0);

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
        const endpointToLoad: string = currentEndpoint;

        const cached = cachedResults.get(endpointToLoad);
        if (cached) {
            return;
        }

        const controller = new AbortController();

        async function loadResults() {
            const response = await fetch(`https://ric-api.sno.mba/${endpointToLoad}`, {
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`RIC API returned ${response.status}`);
            }

            const data: SearchResults = await response.json();
            cachedResults.set(endpointToLoad, data);
            setLoadedResults({ endpoint: endpointToLoad, data });
        }

        loadResults().catch((error: unknown) => {
            if ((error as Error).name !== "AbortError") {
                console.error("Could not load RIC search results.", error);
            }
        });

        return () => controller.abort();
    }, [endpoint, isVisible]);

    const entries = results
        ? Object.entries(results).slice(0, visibleCount)
        : [];

    const totalEntries = results ? Object.keys(results).length : 0;
    const hasMore = visibleCount < totalEntries;
    const currentBatchStart = Math.max(0, visibleCount - BATCH_SIZE);
    const currentBatchSize = entries.length - currentBatchStart;
    const canLoadMore = hasMore
        && currentBatchSize > 0
        && settledImageCount >= currentBatchSize;

    function markImageSettled(name: string, imageBatch: number) {
        if (imageBatch !== activeBatchRef.current || settledImagesRef.current.has(name)) {
            return;
        }

        settledImagesRef.current.add(name);
        setSettledImageCount((count) => count + 1);
    }

    useEffect(() => {
        const sentinel = loadMoreRef.current;
        const scrollArea = gridRef.current;

        if (!sentinel || !scrollArea || !canLoadMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    activeBatchRef.current += 1;
                    settledImagesRef.current.clear();
                    setActiveBatch(activeBatchRef.current);
                    setSettledImageCount(0);
                    setVisibleCount((count) => count + BATCH_SIZE);
                }
            },
            { root: scrollArea },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [canLoadMore]);

    return (
        <div ref={gridRef} className="search-results ascroll-y" data-loaded={Boolean(results)}>
            {entries.map(([name, tile], index) => {
                const imageBatch = index >= currentBatchStart ? activeBatch : -1;

                return (
                <button
                    type="button"
                    className="kill-styling search-item"
                    key={name}
                    onClick={() => {
                        if (mode === "tile" && isTileRecord(tile)) {
                            onTileSelect({ name, tile });
                        }
                    }}
                >
                    <img
                        className="search-item-tile"
                        src={`https://ric-api.sno.mba/tiles/${encodeURIComponent(name)}.gif`}
                        alt=""
                        onLoad={() => markImageSettled(name, imageBatch)}
                        onError={() => markImageSettled(name, imageBatch)}
                    />
                    <span className="search-item-name">{name}</span>
                </button>
                );
            })}

            {hasMore && <div ref={loadMoreRef} />}
        </div>
    );
}
