export function RenderScreen({
    imageUrl,
    isRendering,
    error,
}: {
    imageUrl: string | null;
    isRendering: boolean;
    error: string | null;
}) {
    return (
        <div className="render-screen ascroll-y">
            <div id="render-output" aria-live="polite">
                {imageUrl && (
                    <img
                        className={`render-preview ${isRendering ? "render-loading" : ""}`}
                        src={imageUrl}
                        alt="Rendered scene"
                    />
                )}
            </div>
            <div className="display-text">
                {isRendering && (
                    <p className="">Rendering…</p>
                )}
                {error && <p role="alert">{error}</p>}
            </div>
        </div>
    );
}
