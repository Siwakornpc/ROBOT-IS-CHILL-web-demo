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

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="search">
                    <button className="btn ibtn small text search-menu-btn">
                        <span className="icon">menu</span>
                    </button>
                    <input
                        className="searchbar"
                        contentEditable="true"
                        placeholder="search for something..."
                    />
                    <button className="btn ibtn small text search-btn">
                        <span className="icon">search</span>
                    </button>
                </div>
                <hr />
                <SearchResults />
            </div>
        </main>
    );
}