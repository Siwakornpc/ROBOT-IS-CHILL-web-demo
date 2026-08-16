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
                <label className="search">
                    <button className="btn ibtn small text">
                        <span className="icon">menu</span>
                    </button>
                    <input
                        className="searchbar"
                        contentEditable="true"
                        placeholder="search for something..."
                    />
                    <i className="icon">search</i>
                </label>
                <hr />
                <SearchResults />
            </div>
        </main>
    );
}