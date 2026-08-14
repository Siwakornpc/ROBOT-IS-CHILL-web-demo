import RecieveScreen from "./RecieveScreen";
import SearchTags from "./SearchButtons";

export default function FilterPanel() {
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
                <input
                    className="searchbar"
                    contentEditable="true"
                    placeholder="search for something..."
                />
                <hr />
                <RecieveScreen/>
            </div>
        </main>
    );
}