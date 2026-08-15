import SearchResults from "./SearchResultsGrid";
import SearchTags from "./SearchSelect";

export function FilterPanel() {
    return(
        <div className="filter-controls">
            <p className="text-label">Search</p>
            <SearchTags/>
        </div>
    );
}

export function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <input
                    className="searchbar"
                    contentEditable="true"
                    placeholder="search for something..."
                />
                <hr />
                <SearchResults />
            </div>
        </main>
    );
}