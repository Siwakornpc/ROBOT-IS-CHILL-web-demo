export function StatusBar() {
    return (
        <div className="status-bar">
            <div className="status-bar-label">
                <span>Time</span>
                <span>·</span>
                <span id="status-time">0ms</span>
            </div>
            <div className="status-bar-label">
                <span>Steps</span>
                <span>·</span>
                <span id="status-steps">0</span>
            </div>
        </div>
    );
}