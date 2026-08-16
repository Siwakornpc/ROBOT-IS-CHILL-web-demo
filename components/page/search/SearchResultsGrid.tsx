export default function SearchResults() {
    return (
        <div className="search-results ascroll-y">
            {Array.from({ length: 24 }, (_, index) => (
                <div className="search-item" key={index}>
                    <img className="search-item-tile" src="https://ric-api.sno.mba/tiles/debug.gif"/>
                    <span className="search-item-name">debug</span>
                </div>
            ))}
        </div>
    );
}