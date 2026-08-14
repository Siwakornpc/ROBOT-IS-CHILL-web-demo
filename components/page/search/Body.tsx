import RecieveScreen from "./RecieveScreen";
import SearchTags from "./SearchButtons";

export default function Body() {
    return (
        <div className="filter-controls">
            <p className="text-label">Search</p>
            <SearchTags/>
        </div>
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <input
                    className="searchbar"
                    contentEditable="true"
                    placeholder="search for something..."
                />
                <p className="text-label">---</p>
                <hr />
                <RecieveScreen/>
            </div>
        </main>
    );
}