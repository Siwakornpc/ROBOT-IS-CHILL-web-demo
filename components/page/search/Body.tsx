import SearchResults from "./SearchResultsGrid";
import { type SelectedTile } from "./SearchResultsGrid";
import SearchSelect, { type SearchMode } from "./SearchSelect";

export function FilterPanel({
    mode,
    onModeChange,
}: {
    mode: SearchMode;
    onModeChange: (mode: SearchMode) => void;
}) {
    return(
        <div className="filter-controls">
            <p className="text-label">Search</p>
            <SearchSelect value={mode} onChange={onModeChange} />
        </div>
    );
}

export default function Body({
    mode,
    onTileSelect,
}: {
    mode: SearchMode;
    onTileSelect: (selectedTile: SelectedTile) => void;
}) {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="search">
                    <button className="btn ibtn small btn-text search-menu-btn">
                        <span className="icon">menu</span>
                    </button>
                    <input
                        className="searchbar"
                        contentEditable="true"
                        placeholder="search for something..."
                    />
                    {/* <button className="btn ibtn small btn-text search-btn">
                        <span className="icon">search</span>
                    </button> */}
                </div>
                <hr />
                <SearchResults key={mode} mode={mode} onTileSelect={onTileSelect} />
            </div>
        </main>
    );
}
