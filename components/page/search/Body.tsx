import { CSSProperties, useEffect, useState } from "react";
import SearchResults from "./SearchResultsGrid";
import { type SelectedSearchResult } from "./SearchResultsGrid";
import SearchSelect, { type SearchMode } from "./SearchSelect";
import MenuSelect from "@/components/MenuSelect";
import ColorPicker from "@/components/ColorPicker";
import PaletteColorPicker from "@/components/PaletteColorPicker";
import { useMenu } from "@/components/MenuContext";
import applyOverflowFade from "@/components/OverflowFade";

// cache sprite sources
const tilesSourcePromise: Promise<{ value: string; label: string }[]> = fetch(
    "https://ric-api.sno.mba/tiles.json"
)
    .then((res) => (res.ok ? res.json() : {}))
    .then((data: Record<string, { sprite?: [string, string] }>) => {
        const uniqueSources = new Set<string>();

        Object.values(data).forEach((tile) => {
            if (tile.sprite && tile.sprite[0]) {
                uniqueSources.add(tile.sprite[0]);
            }
        });

        return Array.from(uniqueSources)
            .sort()
            .map((source) => ({ value: source, label: source }));
    })
    .catch((err) => {
        console.error("Failed to load tile sources from API:", err);
        return [];
    });

const paletteSourcePromise: Promise<{ value: string; label: string }[]> = fetch(
    "/api/palettes"
)
    .then((res) => (res.ok ? res.json() : {}))
    .then((data: Record<string, { source?: string; colors?: (string | null)[][] }>) => {
        const uniqueSources = new Set<string>();

        Object.values(data).forEach((palette) => {
            if (palette.source) {
                uniqueSources.add(palette.source);
            }
        });

        return Array.from(uniqueSources)
            .sort()
            .map((source) => ({
                value: source,
                label: source,
            }));
    })
    .catch((err) => {
        console.error("Failed to load palette sources from API:", err);
        return [];
    });

// --- MAIN FILTER PANEL ---

export function FilterPanel({
    mode,
    onModeChange,
    filters,
    onFiltersChange,
    onToggleFilter,
    showMenu,
}: {
    mode: SearchMode;
    onModeChange: (mode: SearchMode) => void;
    filters: Record<string, string[]>;
    onFiltersChange: (filters: Record<string, string[]>) => void;
    onToggleFilter: () => void;
    showMenu: boolean;
}) {
    const [tileSourceOptions, setTileSourceOptions] = useState<{ value: string; label: string }[]>([]);
    const [paletteSourceOptions, setPaletteSourceOptions] = useState<{ value: string; label: string }[]>([]);
    const [sourceSearchQuery, setSourceSearchQuery] = useState("");
    const filteredTileSourceOptions = tileSourceOptions.filter((option) =>
        option.label.toLowerCase().includes(sourceSearchQuery.toLowerCase())
    );
    const filteredPaletteSourceOptions = paletteSourceOptions.filter((option) =>
        option.label.toLowerCase().includes(sourceSearchQuery.toLowerCase())
    );
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        tilesSourcePromise.then(setTileSourceOptions);
        paletteSourcePromise.then(setPaletteSourceOptions);
    }, []);
    
    const filterOptions = {
        tiles: [
            { value: "tile:source", label: "Source" },
            { value: "color", label: "Active Color" },
            { value: "iacolor", label: "Inactive Color" },
            { value: "tiling", label: "Tiling" },
            { value: "tags", label: "Tags" },
        ],
        macros: [
            { value: "creator", label: "Creator" },
            { value: "desc", label: "Description" },
            { value: "builtin", label: "Builtin" },
        ],
        variants: [
            { value: "desc", label: "Description" },
            { value: "syntax", label: "Syntax" },
            { value: "applied", label: "Applied" },
            { value: "type", label: "Type" },
            { value: "anim", label: "Animatable" },
        ],
        filters: [
            { value: "creator", label: "Creator" },
            { value: "mode", label: "Mode" },
            { value: "date", label: "Upload Date" },
        ],
        levels: [],
        palettes: [
            { value: "palette:source", label: "Source" },
            { value: "hascolor", label: "Has Color" },
        ],
        overlays: [],
    } as const;

    const currentOptions =
        mode in filterOptions
            ? filterOptions[mode as keyof typeof filterOptions]
            : [];

    const getFilterTitle = (filterType: string) => {
        const match = currentOptions.find((opt) => opt.value === filterType);
        return match ? match.label : filterType;
    };

    const handleAddFilter = (filterType: string) => {
        const existingList = filters[filterType] ?? [];
        const defaultValue =
            filterType === "mode" ? "true" :
            filterType === "builtin" ? "true" :
            filterType === "tiling" ? "none" :
            "";
        
        const updatedFilters = {
            ...filters,
            [filterType]: [...existingList, defaultValue],
        };
        onFiltersChange(updatedFilters);
    };

    const handleRemoveFilter = (filterType: string, indexToRemove: number) => {
        const updatedList = (filters[filterType] ?? []).filter((_, i) => i !== indexToRemove);
        const updatedFilters = { ...filters };

        if (updatedList.length > 0) updatedFilters[filterType] = updatedList;
        else delete updatedFilters[filterType];

        onFiltersChange(updatedFilters);
    };

    const handleValueChange = (
        filterType: string,
        indexToUpdate: number,
        newValue: string
    ) => {
        const updatedList = [...(filters[filterType] ?? [])];

        updatedList[indexToUpdate] = newValue;

        const updatedFilters = {
            ...filters,
            [filterType]: updatedList,
        };

        onFiltersChange(updatedFilters);
    };

    const activeItems = Object.entries(filters).flatMap(([type, values]) =>
        values.map((value, index) => ({ type, value, index }))
    );

    const renderFilterInput = (type: string, value: string, index: number) => {
        switch (type) {
            case "color":
            case "iacolor": {
                const selectedColors: [number, number][] = value
                    ? value
                        .split(";")
                        .map((pair) => pair.split(",").map(Number))
                        .filter((coords): coords is [number, number] =>
                            coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])
                        )
                    : [];

                return (
                    <PaletteColorPicker
                        multiple={true}
                        selectedColor={selectedColors}
                        onChange={(newColors) => {
                            const formattedValue = newColors.map((c) => `${c[0]},${c[1]}`).join(";");
                            handleValueChange(type, index, formattedValue);
                        }}
                    />
                );
            }

            case "builtin":
                return (
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={value === "true"}
                            onChange={(e) => handleValueChange(type, index, e.target.checked ? "true" : "false")}
                        />
                        <span>Is Builtin</span>
                    </label>
                );

            case "desc":
                return (
                    <label className="text-field">
                        <span className="text-field-label">Description</span>
                        <textarea
                            placeholder=" "
                            value={value}
                            onChange={(e) => handleValueChange(type, index, e.target.value)}
                            rows={2}
                        />
                    </label>
                );

            case "tile:source":
                return (
                    <MenuSelect
                        id={`tile-source-select-${index}`}
                        value={value}
                        options={filteredTileSourceOptions}
                        onChange={(newValue) => handleValueChange(type, index, newValue)}
                        trigger={({ getInputProps }) => (
                            <label className="text-field small has-placeholder">
                                <input
                                    {...getInputProps({
                                        type: "text",
                                        placeholder: "Search source...",
                                        value: value,
                                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                            setSourceSearchQuery(e.target.value);
                                            handleValueChange(type, index, e.target.value);
                                        },
                                        autoComplete: "off",
                                    })}
                                />
                            </label>
                        )}
                    />
                );

            case "palette:source":
                return (
                    <MenuSelect
                        id={`palette-source-select-${index}`}
                        value={value}
                        options={filteredPaletteSourceOptions}
                        onChange={(newValue) => handleValueChange(type, index, newValue)}
                        trigger={({ getInputProps }) => (
                            <label className="text-field small has-placeholder">
                                <input
                                    {...getInputProps({
                                        type: "text",
                                        placeholder: "Search source...",
                                        value: value,
                                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                            setSourceSearchQuery(e.target.value);
                                            handleValueChange(type, index, e.target.value);
                                        },
                                        autoComplete: "off",
                                    })}
                                />
                            </label>
                        )}
                    />
                );

            case "tiling":
                return (
                    <MenuSelect
                        value={value}
                        options={[
                            { value: "none", label: "None" },
                            { value: "static", label: "Static" },
                            { value: "animated", label: "Animated" },
                            { value: "directional", label: "Directional" },
                            { value: "animated_directional", label: " Animated Directional" },
                            { value: "character", label: "Character" },
                            { value: "tiling", label: "Tiling" },
                            { value: "diagonal_tiling", label: "Diagonal Tiling" },
                        ]}
                        onChange={(newValue) => handleValueChange(type, index, newValue)}
                    />
                );

            case "mode":
                return (
                    <div className="cbtn-group small">
                        <button
                            type="button"
                            className={`cbtn ${value === "true" ? "selected" : ""}`}
                            onClick={() => handleValueChange(type, index, "true")}
                        >Absolute
                        </button>
                        
                        <button
                            type="button"
                            className={`cbtn ${value === "false" ? "selected" : ""}`}
                            onClick={() => handleValueChange(type, index, "false")}
                        >Relative
                        </button>
                    </div>
                );

            case "date":
                return (
                    <div style={{display: "flex", gap: "4px"}}>
                        <MenuSelect
                            id={`date-mode-select-${index}`}
                            value={value.split(";")[0]}
                            options={[
                                { value: "before", label: "Before" },
                                { value: "on", label: "On" },
                                { value: "after", label: "After" },
                            ]}
                            onChange={(newValue) => handleValueChange(type, index, `${newValue};${value[1]}`)}
                        />
                        <label className="text-field">
                            <span className="text-field-label">Date</span>
                            <input
                                type="text"
                                placeholder=" "
                                value={value.split(";")[1]}
                                onChange={(e) => handleValueChange(type, index, `${value[0]};${e.target.value}`)}
                                autoComplete="off"
                            />
                        </label>
                    </div>
                )
            
            case "hascolor":
                return (
                    <ColorPicker
                        value={value}
                        onChange={(color) => handleValueChange(type, index, color ?? "None")}
                        hasNone={true}
                    />
                );

            default:
                return (
                    <label className="text-field small has-placeholder">
                        <input
                            type="text"
                            placeholder="Filter..."
                            value={value}
                            onChange={(e) => handleValueChange(type, index, e.target.value)}
                            autoComplete="off"
                        />
                    </label>
                );
        }
    };
    
    const [isFlexibleMenu, setIsFlexibleMenu] = useState(false);
    
    useEffect(() => {
        function handleResize() {
            setIsFlexibleMenu(window.innerWidth <= 790);
        }
    
        // Set initial state
        handleResize();
    
        window.addEventListener("resize", handleResize);
    
        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className={`filter-controls ${isFlexibleMenu ? "fc-fxb" : ""} ${showMenu ? "opened" : ""}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <button
                    type="button"
                    className="btn ibtn small btn-text"
                    onClick={onToggleFilter}
                >
                    <span className="icon">arrow_back</span>
                </button>
                <p className="text-label">Search</p>
                <SearchSelect value={mode} onChange={onModeChange} />
            </div>

            <hr />

            {currentOptions.length > 0 && (<>
                <p className="text-label">Filters</p>
                <div ref={(el) => applyOverflowFade(el, "y")} className="filter-section ascroll-y">

                    {activeItems.map(({ type, value, index }) => (
                        <div key={`${type}-${index}`} className="filter-item">
                            <div className="filter-item-title">
                                <span className="filter-title">{getFilterTitle(type)}</span>
                                <button
                                    type="button"
                                    className="btn ibtn xsmall btn-text"
                                    onClick={() => handleRemoveFilter(type, index)}
                                >
                                    <i className="icon">remove</i>
                                </button>
                            </div>
                            {renderFilterInput(type, value, index)}
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
            </>)}
        </div>
    );
}

export default function Body({
    mode,
    onSelect,
    detailsName,
    searchQuery,
    onSearchQueryChange,
    filters = {},
    useRegex,
    onRegexChange,
    onToggleFilter,
    showMenu,
    onResultsChange,
}: {
    mode: SearchMode;
    onSelect: (selected: SelectedSearchResult) => void;
    detailsName: string | null;
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    filters?: Record<string, string[]>;
    useRegex: boolean;
    onRegexChange: (value: boolean) => void;
    onToggleFilter: (value: boolean) => void;
    showMenu: boolean;
    onResultsChange?: (results: SelectedSearchResult[]) => void;
}) {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="search">
                    <label className="btn ibtn small btn-text search-menu-btn">
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={showMenu}
                            onChange={(e) => onToggleFilter(e.currentTarget.checked)}
                        />
                        <i className="icon">menu</i>
                    </label>
                    <input
                        className="searchbar"
                        placeholder="search for something..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.currentTarget.value)}
                    />
                    <label className="btn ibtn small btn-text search-btn">
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={useRegex}
                            onChange={(e) => onRegexChange(e.currentTarget.checked)}
                        />
                        <i className="icon">regular_expression</i>
                    </label>
                </div>
                <hr />
                <SearchResults
                    key={mode}
                    mode={mode}
                    onSelect={onSelect}
                    detailsName={detailsName}
                    searchQuery={searchQuery}
                    filters={filters}
                    useRegex={useRegex}
                    onResultsChange={onResultsChange}
                />
            </div>
        </main>
    );
}