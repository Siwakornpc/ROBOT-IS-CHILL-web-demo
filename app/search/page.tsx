"use client";

import Body, { FilterPanel } from "@/components/page/search/Body";
import { type SearchMode } from "@/components/page/search/SearchSelect";
import { type SelectedSearchResult } from "@/components/page/search/SearchResultsGrid";
import { LeftBar, RightBarSearch } from "@/components/page/SideBars";
import { Details } from "@/components/page/search/TileDetails";
import { useState, useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";

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

function readUrlState() {
    if (typeof window === "undefined") {
        return {
            mode: "tile" as SearchMode,
            searchQuery: "",
            useRegex: false,
            detailsName: null as string | null,
        };
    }

    const [hashName, hashQuery = ""] = window.location.hash.slice(1).split("?", 2);
    const hashParams = new URLSearchParams(hashQuery);
    const legacySearchParams = new URLSearchParams(window.location.search);
    return {
        mode: hashModes[hashName.toLowerCase()] ?? "tile",
        searchQuery: hashParams.get("query") ?? "",
        useRegex: hashParams.get("regex")?.toLowerCase() === "true",
        detailsName: hashParams.get("details") ?? legacySearchParams.get("details"),
    };
}

export default function Home() {
    const [mode, setMode] = useState<SearchMode>("tiles");
    const [searchQuery, setSearchQuery] = useState("");
    const [useRegex, setUseRegex] = useState(false);
    const [selected, setSelected] = useState<SelectedSearchResult | null>(null);
    const [detailsName, setDetailsName] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [modeFilters, setModeFilters] = useState<Record<SearchMode, Record<string, string[]>>>({
        tiles: {},
        macros: {},
        variants: {},
        filters: {},
        overlays: {},
    });

    useEffect(() => {
        nav_btn_select("Search");

        const syncUrlState = () => {
            const nextState = readUrlState();
            setMode(nextState.mode);
            setSearchQuery(nextState.searchQuery);
            setUseRegex(nextState.useRegex);
            setDetailsName(nextState.detailsName);
            setSelected(null);
        };

        syncUrlState();
        window.addEventListener("hashchange", syncUrlState);
        window.addEventListener("popstate", syncUrlState);
        return () => {
            window.removeEventListener("hashchange", syncUrlState);
            window.removeEventListener("popstate", syncUrlState);
        };
    }, []);

    const updateUrl = (
        nextMode: SearchMode,
        nextSearchQuery: string,
        nextUseRegex: boolean,
        nextDetailsName: string | null,
    ) => {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams();
        if (nextSearchQuery) {
            hashParams.set("query", nextSearchQuery);
        }
        if (nextUseRegex) {
            hashParams.set("regex", "true");
        }
        if (nextDetailsName !== null) {
            hashParams.set("details", nextDetailsName);
        }
        url.hash = `${modeHashes[nextMode]}${hashParams.toString() ? `?${hashParams}` : ""}`;
        url.searchParams.delete("details");

        window.history.replaceState(null, "", url);
    };

    const handleModeChange = (nextMode: SearchMode) => {
        setMode(nextMode);
        setSelected(null);
        setDetailsName(null);
        updateUrl(nextMode, searchQuery, useRegex, null);
    };

    const handleSearchQueryChange = (nextSearchQuery: string) => {
        setSearchQuery(nextSearchQuery);
        updateUrl(mode, nextSearchQuery, useRegex, detailsName);
    };

    const handleRegexChange = (nextUseRegex: boolean) => {
        setUseRegex(nextUseRegex);
        updateUrl(mode, searchQuery, nextUseRegex, detailsName);
    };

    const handleSelect = (nextSelected: SelectedSearchResult) => {
        setSelected(nextSelected);
        setDetailsName(nextSelected.name);
        updateUrl(mode, searchQuery, useRegex, nextSelected.name);
    };

    const handleCloseDetails = () => {
        setSelected(null);
        setDetailsName(null);
        updateUrl(mode, searchQuery, useRegex, null);
    };

    return (
        <main className="align-layout">
            <LeftBar />
            {showMenu && (
                <FilterPanel
                    mode={mode}
                    onModeChange={handleModeChange}
                    filters={modeFilters[mode] ?? {}}
                    onFiltersChange={(updatedFilters) => {
                        setModeFilters((prev) => ({
                            ...prev,
                            [mode]: updatedFilters,
                        }));
                    }}
                />
            )}
            <Body
                mode={mode}
                onSelect={handleSelect}
                detailsName={detailsName}
                searchQuery={searchQuery}
                onSearchQueryChange={handleSearchQueryChange}
                filters={modeFilters[mode] ?? {}} 
                useRegex={useRegex}
                onRegexChange={handleRegexChange}
                onToggleFilter={() =>
                    setShowMenu((prev) => !prev)
                }
                showMenu={showMenu}
            />
            {selected !== null && (
                <RightBarSearch>
                    <button
                        className="btn ibtn small btn-text search-close-btn"
                        onClick={handleCloseDetails}
                    >
                        <i className="icon">close</i>
                    </button>
                    <Details selected={selected} />
                </RightBarSearch>
            )}
        </main>
    );
}
