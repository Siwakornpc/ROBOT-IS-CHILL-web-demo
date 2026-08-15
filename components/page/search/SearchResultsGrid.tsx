export default function SearchResults() {
    return (
        <div className="search-results">
            {Array.from({ length: 24 }, (_, index) => (
                <div className="search-item" key={index}>
                    <img className="search-item-tile" src="https://github.com/ROBOT-IS-CHILL/robot-is-chill/blob/main/data/sprites/balt-sprites/debug_0_1.png?raw=true"/>
                    <span className="search-item-name">debug</span>
                </div>
            ))}
        </div>
    );
}