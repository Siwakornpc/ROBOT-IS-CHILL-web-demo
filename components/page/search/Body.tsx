import { useEffect, useState } from "react";
import SearchResults from "./SearchResultsGrid";
import { type SelectedSearchResult } from "./SearchResultsGrid";
import SearchSelect, { type SearchMode } from "./SearchSelect";
import MenuSelect from "@/components/MenuSelect";
import PaletteColorPicker from "@/components/PaletteColorPicker";
import { useMenu } from "@/components/MenuContext";

// --- FILTER INPUTS ---

function TilingFilterInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");

    const tilingOptions = [
        { value: "none", label: "None" },
        { value: "static", label: "Static" },
        { value: "animated", label: "Animated" },
        { value: "directional", label: "Directional" },
        { value: "animated_directional", label: " Animated Directional" },
        { value: "character", label: "Character" },
        { value: "tiling", label: "Tiling" },
        { value: "diagonal_tiling", label: "Diagonal Tiling" },
    ];

    return (
        <MenuSelect
            value={value}
            options={tilingOptions}
            onChange={(newValue) => {
                onChange(newValue);
                const matched = tilingOptions.find((opt) => opt.value === newValue);
                if (matched) setSearchQuery(matched.label);
            }}
            trigger={({ getInputProps }) => (
                <label className="text-field">
                    <span className="text-field-label">Tiling Mode</span>
                    <input
                        {...getInputProps({
                            type: "text",
                            value: searchQuery,
                            placeholder: " ",
                            required: true,
                            autoComplete: "off",
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                setSearchQuery(e.target.value);
                            },
                        })}
                    />
                </label>
            )}
            anchor="t"
        />
    );
}

function ModeFilterInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const isAbsolute = value === "true";

    return (
        <div className="cbtn-group small">
            <button
                type="button"
                className={`cbtn ${isAbsolute ? "selected" : ""}`}
                onClick={() => onChange("true")}
            >Absolute</button>
            <button
                type="button"
                className={`cbtn ${!isAbsolute ? "selected" : ""}`}
                onClick={() => onChange("false")}
            >Relative</button>
        </div>
    );
}

// cache sprite sources
const sourcesPromise: Promise<{ value: string; label: string }[]> = fetch(
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

// --- MAIN FILTER PANEL ---

export function FilterPanel({
    mode,
    onModeChange,
    filters,
    onFiltersChange,
    onToggleFilter,
}: {
    mode: SearchMode;
    onModeChange: (mode: SearchMode) => void;
    filters: Record<string, string[]>;
    onFiltersChange: (filters: Record<string, string[]>) => void;
    onToggleFilter: () => void;
}) {
    const [sourceOptions, setSourceOptions] = useState<{ value: string; label: string }[]>([]);
    const [sourceSearchQuery, setSourceSearchQuery] = useState("");
    const filteredSourceOptions = sourceOptions.filter((option) =>
        option.label.toLowerCase().includes(sourceSearchQuery.toLowerCase())
    );

    useEffect(() => {
        sourcesPromise.then(setSourceOptions);
    }, []);

    const filterOptions = {
        tiles: [
            { value: "source", label: "Source" },
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
            { value: "type", label: "Type" },
            { value: "anim", label: "Animatable" },
        ],
        filters: [
            { value: "creator", label: "Creator" },
            { value: "mode", label: "Mode" },
            { value: "date", label: "Upload Date" },
        ],
        levels: [],
        palettes: [],
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
            "";
        
        onFiltersChange({
            ...filters,
            [filterType]: [...existingList, defaultValue],
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

    const renderFilterInput = (type: string, value: string, index: number) => {
        switch (type) {
            case "color":
            case "iacolor": {
                const coords = value ? value.split(",").map(Number) : null;
                const selectedColor: [number, number] | null = 
                    coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])
                        ? [coords[0], coords[1]]
                        : null;

                return (
                    <PaletteColorPicker
                        selectedColor={selectedColor}
                        onChange={(newColor) => {
                            const formattedValue = newColor ? `${newColor[0]},${newColor[1]}` : "";
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
                            onChange={(e) =>
                                handleValueChange(type, index, e.target.checked ? "true" : "false")
                            }
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

            case "source":
                return (
                    <MenuSelect
                        id={`source-select-${index}`}
                        value={value}
                        options={filteredSourceOptions}
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
                        anchor="t"
                    />
                );

            case "tiling":
                return (
                    <TilingFilterInput
                        value={value}
                        onChange={(newValue) => handleValueChange(type, index, newValue)}
                    />
                );

            case "mode":
                return (
                    <ModeFilterInput
                        value={value}
                        onChange={(newValue) => handleValueChange(type, index, newValue)}
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
    
    const { isMenuOpen } = useMenu();
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
        <div className={`filter-controls ${isFlexibleMenu ? "fc-fxb" : ""}`}>
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

            {currentOptions.length > 0 && (
                <div className="filter-section">
                    <p className="text-label">Filters</p>

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
            )}
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
                />
            </div>
        </main>
    );
}