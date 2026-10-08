export type RenderMode = "t" | "r";

const RENDER_ENDPOINT = "https://robot-is-chill-browser-compatible.onrender.com/render";

export async function getRender(
    mode: RenderMode,
    scene: string,
    signal?: AbortSignal,
): Promise<Blob> {
    const url = new URL(RENDER_ENDPOINT);
    url.searchParams.set("mode", mode);
    url.searchParams.set("scene", scene);

    const response = await fetch(url, { signal });
    if (!response.ok) {
        const body = await response.text();
        let message = body;

        try {
            const parsed = JSON.parse(body) as { error?: string };
            message = parsed.error ?? body;
        } catch {
            // Keep the response text when the server does not return JSON.
        }

        const retryAfter = response.headers.get("Retry-After");
        const retryMessage = retryAfter ? ` Retry after ${retryAfter} seconds.` : "";
        throw new Error(
            `${message || `Render request failed (${response.status}).`}${retryMessage}`,
        );
    }

    const image = await response.blob();
    if (!image.type.startsWith("image/")) {
        throw new Error(`Expected an image response but received "${image.type || "unknown"}".`);
    }

    return image;
}