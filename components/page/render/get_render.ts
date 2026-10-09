export type RenderMode = "t" | "r";

export type RenderResult = {
    image: Blob;
    startupMs?: number;
    renderMs?: number;
    totalMs: number;
};

export class RenderRequestError extends Error {
    constructor(message: string, public readonly totalMs: number) {
        super(message);
        this.name = "RenderRequestError";
    }
}

const RENDER_ENDPOINT =
    "https://robot-is-chill-browser-compatible.onrender.com/render";

export async function getRender(
    mode: RenderMode,
    scene: string,
    signal?: AbortSignal,
): Promise<RenderResult> {
    const started = performance.now();
    try {
        const url = new URL(RENDER_ENDPOINT);
        url.searchParams.set("mode", mode);
        url.searchParams.set("scene", scene);
        url.searchParams.set("fresh", "1");

        const response = await fetch(url, { signal, cache: "no-store" });
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

        const serverTiming = response.headers.get("Server-Timing") ?? "";
        const getDuration = (name: string): number | undefined => {
            const match = serverTiming.match(
                new RegExp(`(?:^|,\\s*)${name};dur=([\\d.]+)`),
            );
            return match ? Number(match[1]) : undefined;
        };

        return {
            image,
            startupMs: getDuration("startup"),
            renderMs: getDuration("render"),
            totalMs: performance.now() - started,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not render the scene.";
        throw new RenderRequestError(message, performance.now() - started);
    }
}