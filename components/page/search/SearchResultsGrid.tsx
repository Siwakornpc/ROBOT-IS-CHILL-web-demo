export default function SearchResults() {
    return (
        <div className="search-results">
            {Array.from({ length: 24 }, (_, index) => (
                <div className="search-item" key={index}>
                    <div className="search-item-tile">
                        <img className="search-item-tile-frame" src="https://github.com/ROBOT-IS-CHILL/robot-is-chill/blob/main/data/sprites/balt-sprites/debug_0_1.png?raw=true"/>
                        <img className="search-item-tile-frame" src="https://github.com/ROBOT-IS-CHILL/robot-is-chill/blob/main/data/sprites/balt-sprites/debug_0_2.png?raw=true"/>
                        <img className="search-item-tile-frame" src="https://github.com/ROBOT-IS-CHILL/robot-is-chill/blob/main/data/sprites/balt-sprites/debug_0_3.png?raw=true"/>
                    </div>
                    <span className="search-item-name">debug</span>
                </div>
            ))}
        </div>
    );
}