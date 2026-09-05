"use client";

import Body, { FilterPanel } from "@/components/page/search/Body";
import { type SearchMode } from "@/components/page/search/SearchSelect";
import { type SelectedSearchResult } from "@/components/page/search/SearchResultsGrid";
import { LeftBar, RightBarSearch } from "@/components/page/SideBars";
import { Details } from "@/components/page/search/TileDetails";
import { readSearchUrlState, writeSearchUrlState } from "@/components/url_state/searchUrlState";
import { useState, useEffect, useRef } from "react";
import { nav_btn_select } from "@/components/nav_select";

export default function Home() {
    const [mode, setMode] = useState<SearchMode>("tiles");
    const [searchQuery, setSearchQuery] = useState("");
    const [useRegex, setUseRegex] = useState(false);
    const [selected, setSelected] = useState<SelectedSearchResult | null>(null);
    const [detailsName, setDetailsName] = useState<string | null>(null);
    const [code, setCode] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [allResults, setAllResults] = useState<SelectedSearchResult[]>([]);
    const [modeFilters, setModeFilters] = useState<Record<SearchMode, Record<string, string[]>>>({
        tiles: {},
        macros: {},
        filters: {},
        variants: {},
        flags: {},
        levels: {},
        palettes: {},
        overlays: {},
    });

    const isInternalUpdate = useRef(false);
    const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        nav_btn_select("Search");

        const syncUrlState = () => {
            if (isInternalUpdate.current) {
                isInternalUpdate.current = false;
                return;
            }
            const nextState = readSearchUrlState();
            setMode(nextState.mode);
            setSearchQuery(nextState.query ?? "");
            setUseRegex(nextState.regex);
            setDetailsName(nextState.details);
            setCode(nextState.code);
            setSelected(null);
        };

        syncUrlState();
        window.addEventListener("hashchange", syncUrlState);
        window.addEventListener("popstate", syncUrlState);
        return () => {
            window.removeEventListener("hashchange", syncUrlState);
            window.removeEventListener("popstate", syncUrlState);
            if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
        };
    }, []);

    const updateUrl = (
        nextMode: SearchMode,
        nextSearchQuery: string,
        nextUseRegex: boolean,
        nextDetailsName: string | null,
    ) => {
        if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
        urlTimerRef.current = setTimeout(() => {
            isInternalUpdate.current = true;
            writeSearchUrlState({
                mode: nextMode,
                query: nextSearchQuery,
                regex: nextUseRegex,
                details: nextDetailsName,
                code,
            });
        }, 150);
    };

    const handleModeChange = (nextMode: SearchMode) => {
        setMode(nextMode);
        setSelected(null);
        setDetailsName(null);
        setAllResults([]);
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
                onToggleFilter={() => setShowMenu((prev) => !prev)}
                showMenu={showMenu}
            />
            <Body
                mode={mode}
                onSelect={handleSelect}
                detailsName={detailsName}
                searchQuery={searchQuery}
                onSearchQueryChange={handleSearchQueryChange}
                filters={modeFilters[mode] ?? {}} 
                useRegex={useRegex}
                onRegexChange={handleRegexChange}
                onToggleFilter={() => setShowMenu((prev) => !prev)}
                showMenu={showMenu}
                onResultsChange={setAllResults}
            />
            {selected !== null &&
                <RightBarSearch>
                    <button
                        className="btn ibtn small btn-text search-close-btn"
                        onClick={handleCloseDetails}
                    ><i className="icon">close</i>
                    </button>
                    <Details selected={selected} allResults={allResults} />
                </RightBarSearch>
            }
        </main>
    );
}