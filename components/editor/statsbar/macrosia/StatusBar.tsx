export function StatusBar({ small = false }: { small?: boolean }) {
    return (
        <div className="status-bar">
            <div className="status">
                {small
                    ? <span className="status-label icon emph">directions_walk</span>
                    : <span className="status-label emph">Steps</span>
                }
                <span className="status-value" id="status-steps">0</span>
            </div>
            <div className="status">
                {small
                    ? <span className="status-label icon emph">speed</span>
                    : <span className="status-label emph">Time</span>
                }
                <span className="status-value" id="status-time">0ms</span>
            </div>
            <button
                id="run-button"
                className="status status-btn"
            ><i className="icon">play_arrow</i>
            </button>
        </div>
    );
}