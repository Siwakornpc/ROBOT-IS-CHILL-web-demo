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
                {isWaitingForPause && <p>Waiting for pause...</p>}
                {!isWaitingForPause && isRendering && (
                    <p className="">Rendering…</p>
                )}
                {error && <p role="alert">{error}</p>}
                {showReady && !imageUrl && !isWaitingForPause && !isRendering && !error && (
                    <p>Ready to render!</p>
                )}
            </div>
        </div>
    );
}
