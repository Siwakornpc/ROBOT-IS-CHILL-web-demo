import { useEffect, useState } from "react";
import SearchResults from "./SearchResultsGrid";
import { type SelectedSearchResult } from "./SearchResultsGrid";
import SearchSelect, { type SearchMode } from "./SearchSelect";
import MenuSelect from "@/components/MenuSelect";
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
    const filterOptions = {
        tile: [
            { value: "source", title: "Source" },
            { value: "color", title: "Active Color" },
            { value: "iacolor", title: "Inactive Color" },
            { value: "tiling", title: "Tiling" },
            { value: "tags", title: "Tags" },
        ],
        macro: [
            { value: "creator", title: "Creator ID" },
            { value: "desc", title: "Description" },
        ],
    } as const;

    const currentOptions = mode in filterOptions 
        ? filterOptions[mode as keyof typeof filterOptions] 
        : [];

    const activeFilterKeys = Object.keys(filters);

    const handleAddFilter = (filterType: string) => {
        if (!filters[filterType]) {
            onFiltersChange({ ...filters, [filterType]: [] });
        }
    };

    const handleRemoveFilter = (filterKey: string) => {
        const updated = { ...filters };
        delete updated[filterKey];
        onFiltersChange(updated);
    };

    return (
        <div className="filter-controls">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <p className="text-label">Search</p>
                <SearchSelect value={mode} onChange={onModeChange} />
            </div>
            <hr />
            
            {currentOptions.length > 0 && (
                <div className="filter-section">
                    <p className="text-label">Filters</p>
                    {activeFilterKeys.map((filterKey) => (
                        <div key={filterKey} className="filter-item">
                            <span>{filterKey}</span>
                            <input type="text" placeholder="Filter..." />
                            <button onClick={() => handleRemoveFilter(filterKey)}>
                                <i className="icon">remove</i>
                            </button>
                        </div>
                    ))}
                    
                    <MenuSelect
                        title="Add Filter"
                        value=""
                        options={currentOptions.filter(opt => !activeFilterKeys.includes(opt.value))}
                        onChange={handleAddFilter}
                        triggerValue={() => <i className="icon">add</i>}
                        className="btn ibtn small btn-filled"
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
    useRegex,
    onRegexChange,
}: {
    mode: SearchMode;
    onSelect: (selected: SelectedSearchResult) => void;
    filters?: Record<string, string[]>;
    useRegex: boolean;
    onRegexChange: (value: boolean) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="search">
                    <button className="btn ibtn small btn-text search-menu-btn">
                        <i className="icon">menu</i>
                    </button>
                    <input
                        className="searchbar"
                        placeholder="search for something..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    />
                    <label className="btn ibtn small btn-text search-btn">
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={useRegex}
                            onChange={(e) =>
                                onRegexChange(e.currentTarget.checked)
                            }
                        />
                        <i className="icon">regular_expression</i>
                    </label>
                </div>
                <hr />
                <SearchResults
                    key={mode}
                    mode={mode}
                    onSelect={onSelect}
                    searchQuery={searchQuery}
                    filters={filters}
                    useRegex={useRegex}
                />
            </div>
        </main>
    );
}
