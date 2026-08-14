import RecieveScreen from "./RecieveScreen";
import SearchTags from "./SearchButtons";

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="filter-controls">
                    <p className="text-label">Search</p>
                    <SearchTags/>
                </div>
                <hr />
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