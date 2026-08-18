"use client";

import Body, { FilterPanel } from "@/components/page/search/Body";
import { type SearchMode } from "@/components/page/search/SearchSelect";
import { type SelectedSearchResult } from "@/components/page/search/SearchResultsGrid";
import { LeftBar, RightBarSearch } from "@/components/page/SideBars";
import { Details } from "@/components/page/search/TileDetails";
import { useState, useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";

export default function Home() {
    const [mode, setMode] = useState<SearchMode>("tile");
    const [selected, setSelected] = useState<SelectedSearchResult | null>(null);
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [showMenu, setShowMenu] = useState(false);
    const [useRegex, setUseRegex] = useState(false);

    const [modeFilters, setModeFilters] = useState<Record<SearchMode, Record<string, string[]>>>({
        tile: {},
        macro: {},
        filter: {},
        overlay: {},
    });

    useEffect(() => {
        nav_btn_select("Search");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            {showMenu && (
                <FilterPanel
                    mode={mode}
                    onModeChange={setMode}
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
                onSelect={setSelected}
                filters={filters} 
                useRegex={useRegex}
                onRegexChange={setUseRegex}
                onToggleFilter={() =>
                    setShowMenu((prev) => !prev)
                }
                showMenu={showMenu}
            />
            {selected !== null && (
                <RightBarSearch>
                    <button
                        className="btn ibtn small btn-text search-close-btn"
                        onClick={() => setSelected(null)}
                    >
                        <i className="icon">close</i>
                    </button>
                    <Details selected={selected} />
                </RightBarSearch>
            )}
        </main>
    );
}
