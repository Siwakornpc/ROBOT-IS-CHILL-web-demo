import { NextRequest } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ name: string }> },
) {
    const { name } = await params;
    const upstreamUrl = `https://ric-api.sno.mba/filters/${encodeURIComponent(name)}.png`;

    try {
        const response = await fetch(upstreamUrl, {cache: "force-cache"});
        if (!response.ok) return new Response("Filter image not found", {status: response.status});

        const contentType = response.headers.get("content-type") ?? "image/png";
        const image = await response.arrayBuffer();

        return new Response(image, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, immutable",
            },
        });
    } catch (error) {
        console.error("Failed to proxy filter image:", error);

        return new Response("Failed to fetch filter image", { status: 502 });
    }
}