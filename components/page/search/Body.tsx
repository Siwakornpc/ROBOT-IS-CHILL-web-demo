import SearchTags from "./SearchTags";

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="filter-controls">
                    <p className="text-label">Search</p>
                    <SearchTags/>
                    <hr />
                </div>
                <input
                    className="searchbar"
                    contentEditable="true"
                    placeholder="search for something..."
                />
            </div>
        </main>
    );
}