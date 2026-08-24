export function StatusBar() {
    return (
        <div className="status-bar">
            <div className="status">
                <span className="status-label emph">Steps</span>
                <span className="status-separator">·</span>
                <span className="status-value" id="status-steps">0</span>
            </div>
            <div className="status">
                <span className="status-label">Time</span>
                <span className="status-separator">·</span>
                <span className="status-value" id="status-time">0ms</span>
            </div>
            <button
                id="run-button"
                className="status status-icon"
            >
                <span className="icon">play_arrow</span>
            </button>
        </div>
    );
}