export function RenderScreen({
    imageUrl,
    isRendering,
    isWaitingForPause,
    error,
    showReady,
}: {
    imageUrl: string | null;
    isRendering: boolean;
    isWaitingForPause: boolean;
    error: string | null;
    showReady: boolean;
}) {
    const statusText = isWaitingForPause
        ? "Waiting for pause..."
        : isRendering
            ? "Rendering…"
            : error
                ? error
                : showReady && !imageUrl
                    ? "Ready to render!"
                    : null;

    return (
        <div className="render-screen ascroll-x ascroll-y">
            <div id="render-output" aria-live="polite">
                <div className="w-max">
                    {imageUrl && (
                        <img
                            className={`render-preview ${isRendering ? "render-loading" : ""}`}
                            src={imageUrl}
                            alt="Rendered scene"
                        />
                    )}
                </div>
            </div>
            <div className="display-text">
                {statusText && <p role={error && !isWaitingForPause && !isRendering ? "alert" : undefined}>{statusText}</p>}
            </div>
        </div>
    );
}
