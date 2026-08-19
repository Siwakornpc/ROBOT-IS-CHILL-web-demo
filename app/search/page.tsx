"use client";

import Body, { FilterPanel } from "@/components/page/search/Body";
import { type SearchMode } from "@/components/page/search/SearchSelect";
import { type SelectedSearchResult } from "@/components/page/search/SearchResultsGrid";
import { LeftBar, RightBarSearch } from "@/components/page/SideBars";
import { Details } from "@/components/page/search/TileDetails";
import {
    readSearchUrlState,
    writeSearchUrlState,
} from "@/components/url_state/searchUrlState";
import { useState, useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";

export default function Home() {
    const [mode, setMode] = useState<SearchMode>("tiles");
    const [searchQuery, setSearchQuery] = useState("");
    const [useRegex, setUseRegex] = useState(false);
    const [selected, setSelected] = useState<SelectedSearchResult | null>(null);
    const [detailsName, setDetailsName] = useState<string | null>(null);
    const [isin, setIsin] = useState<string | null>(null);
    const [value, setValue] = useState<string | null>(null);
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
            const nextState = readSearchUrlState();
            setMode(nextState.mode);
            setSearchQuery(nextState.query);
            setUseRegex(nextState.regex);
            setDetailsName(nextState.details);
            setIsin(nextState.isin);
            setValue(nextState.value);
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
        writeSearchUrlState({
            mode: nextMode,
            query: nextSearchQuery,
            regex: nextUseRegex,
            details: nextDetailsName,
            isin,
            value,
        });
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
