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
    const [useRegex, setUseRegex] = useState(false);

    function handleModeChange(nextMode: SearchMode) {
        setMode(nextMode);
        if (nextMode !== "tile") {
            setSelected(null);
        }
    }

    useEffect(() => {
        nav_btn_select("Search");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <FilterPanel
                mode={mode}
                onModeChange={handleModeChange}
                filters={filters}
                onFiltersChange={setFilters}
            />
            <Body
                mode={mode}
                onSelect={setSelected} filters={filters} 
                useRegex={useRegex}
                onRegexChange={setUseRegex}
            />
            {selected !== null && (
                <RightBarSearch>
                    <Details selected={selected!} />
                </RightBarSearch>
            )}
        </main>
    );
}
