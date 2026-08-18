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
            { value: "source", label: "Source" },
            { value: "color", label: "Active Color" },
            { value: "iacolor", label: "Inactive Color" },
            { value: "tiling", label: "Tiling" },
            { value: "tags", label: "Tags" },
        ],
        macro: [
            { value: "creator", label: "Creator ID" },
            { value: "desc", label: "Description" },
            { value: "builtin", label: "Builtin" },
        ],
    } as const;

    const currentOptions = mode in filterOptions 
        ? filterOptions[mode as keyof typeof filterOptions] 
        : [];

    const getFilterTitle = (filterType: string) => {
        const match = currentOptions.find((opt) => opt.value === filterType);
        return match ? match.label : filterType;
    };

    const handleAddFilter = (filterType: string) => {
        const existingList = filters[filterType] ?? [];
        onFiltersChange({
            ...filters,
            [filterType]: [...existingList, ""],
        });
    };

    const handleRemoveFilter = (filterType: string, indexToRemove: number) => {
        const updatedList = (filters[filterType] ?? []).filter((_, i) => i !== indexToRemove);
        const nextFilters = { ...filters };

        if (updatedList.length > 0) {
            nextFilters[filterType] = updatedList;
        } else {
            delete nextFilters[filterType];
        }

        onFiltersChange(nextFilters);
    };

    const handleValueChange = (filterType: string, indexToUpdate: number, newValue: string) => {
        const updatedList = [...(filters[filterType] ?? [])];
        updatedList[indexToUpdate] = newValue;

        onFiltersChange({
            ...filters,
            [filterType]: updatedList,
        });
    };

    const activeItems = Object.entries(filters).flatMap(([type, values]) =>
        values.map((value, index) => ({ type, value, index }))
    );

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

                    {activeItems.map(({ type, value, index }) => (
                        <div key={`${type}-${index}`} className="filter-item">
                            <div className="filter-item-controls">
                                <span className="filter-title">{getFilterTitle(type)}</span>
                                <label className="text-field small has-placeholder">
                                    <input
                                        type="text"
                                        placeholder="Filter..."
                                        value={value}
                                        onChange={(e) => handleValueChange(type, index, e.target.value)}
                                        autoComplete="off"
                                    />
                                </label>
                            </div>
                            <button
                                type="button"
                                className="btn ibtn xsmall btn-text"
                                onClick={() => handleRemoveFilter(type, index)}
                            >
                                <i className="icon">remove</i>
                            </button>
                        </div>
                    ))}
                    
                    <MenuSelect
                        id={"filter-select"}
                        title="Add Filter"
                        value=""
                        options={currentOptions}
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
    onToggleFilter,
    showMenu,
}: {
    mode: SearchMode;
    onSelect: (selected: SelectedSearchResult) => void;
    filters?: Record<string, string[]>;
    useRegex: boolean;
    onRegexChange: (value: boolean) => void;
    onToggleFilter: (value: boolean) => void;
    showMenu: boolean;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="search">
                    <label className="btn ibtn small btn-text search-menu-btn">
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={showMenu}
                            onChange={(e) =>
                                onToggleFilter(e.currentTarget.checked)
                            }
                        />
                        <i className="icon">menu</i>
                    </label>
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
