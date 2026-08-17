import { useEffect, useState } from "react";
import SearchResults from "./SearchResultsGrid";
import { type SelectedSearchResult } from "./SearchResultsGrid";
import SearchSelect, { type SearchMode } from "./SearchSelect";
import MenuSelect, { MenuOption } from "@/components/MenuSelect";
import stdlib_macros from "./stdlib_macros.js";

console.log(stdlib_macros());

export function FilterPanel({
    mode,
    onModeChange,
    filters,
    onFiltersChange,
}: {
    mode: SearchMode;
    onModeChange: (mode: SearchMode) => void;
    filters: Record<string, string[]>;
    onFiltersChange: (filters: Record<string, string[]>) => void;
}) {
    const handleCreatorFilter = (creatorId: string) => {
        onFiltersChange({
            ...filters,
            creator: filters.creator?.includes(creatorId)
                ? filters.creator.filter(id => id !== creatorId)
                : [...(filters.creator || []), creatorId],
        });
    };

    const macroFilterOptions = [
    {
        value: "Creator ID",
        title: "Creator ID",
    },
    {
        value: "Description",
        title: "Description",
    },
    ] as const;
    type FilterType = (typeof macroFilterOptions)[number]["value"];
    
    const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

    const handleAddFilter = (filterType: FilterType) => {
        setActiveFilters([...activeFilters, filterType]);
    };

    const handleRemoveFilter = (index: number) => {
        setActiveFilters(activeFilters.filter((_, i) => i !== index));
    };

    return(
        <div className="filter-controls">
            <p className="text-label">Search</p>
            <hr />
            <SearchSelect value={mode} onChange={onModeChange} />
            {mode === "macro" && (
                <div className="filter-section">
                    <p className="text-label">Filters</p>
                    <hr />
                    {activeFilters.map((filterType, index) => (
                        <div key={index} className="filter-item">
                            <span>{filterType}</span>
                            <input type="text" placeholder="filter value..." />
                            <button
                                className="btn ibtn xsmall btn-text"
                                onClick={() => handleRemoveFilter(index)}
                            >
                                <i className="icon">remove</i>
                            </button>
                        </div>
                    ))}
                    <MenuSelect
                        id={"filter-select"}
                        title="Add Filter"
                        value={activeFilters[0] ?? "Creator ID"}
                        options={macroFilterOptions}
                        onChange={handleAddFilter}
                        className="btn ibtn small btn-filled"
                        triggerValue={() => <i className="icon">add</i>}
                    />
                </div>
            )}
        </div>
    );
}

export default function Body({
    mode,
    onSelect,
    filters = {},
}: {
    mode: SearchMode;
    onSelect: (selected: SelectedSearchResult) => void;
    filters?: Record<string, string[]>;
}) {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="search">
                    <button className="btn ibtn small btn-text search-menu-btn">
                        <span className="icon">menu</span>
                    </button>
                    <input
                        className="searchbar"
                        placeholder="search for something..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    />
                    {/* <button className="btn ibtn small btn-text search-btn">
                        <span className="icon">search</span>
                    </button> */}
                </div>
                <hr />
                <SearchResults key={mode} mode={mode} onSelect={onSelect} searchQuery={searchQuery} filters={filters} />
            </div>
        </main>
    );
}
