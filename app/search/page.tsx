"use client";

import Body, { FilterPanel } from "@/components/page/search/Body";
import { type SearchMode } from "@/components/page/search/SearchSelect";
import { type SelectedTile } from "@/components/page/search/SearchResultsGrid";
import { LeftBar, RightBarSearch } from "@/components/page/SideBars";
import TileDetails from "@/components/page/search/TileDetails";
import { useState, useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";

export default function Home() {
    const [mode, setMode] = useState<SearchMode>("tile");
    const [selectedTile, setSelectedTile] = useState<SelectedTile | null>(null);
    const showRightBar = mode === "tile" && selectedTile !== null;

    function handleModeChange(nextMode: SearchMode) {
        setMode(nextMode);
        if (nextMode !== "tile") {
            setSelectedTile(null);
        }
    }

    useEffect(() => {
        nav_btn_select("Search");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <FilterPanel mode={mode} onModeChange={handleModeChange} />
            <Body mode={mode} onTileSelect={setSelectedTile} />
            {showRightBar && (
                <RightBarSearch>
                    <TileDetails selectedTile={selectedTile!} />
                </RightBarSearch>
            )}
        </main>
    );
}
