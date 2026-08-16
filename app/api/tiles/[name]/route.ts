export const dynamic = "force-dynamic";

export async function HEAD(
    _request: Request,
    { params }: { params: Promise<{ name: string }> },
) {
    const { name } = await params;
    const tileUrl = `https://ric-api.sno.mba/tiles/${encodeURIComponent(name)}.gif`;

    try {
        const response = await fetch(tileUrl, {
            method: "HEAD",
            cache: "no-store",
        });

        return new Response(null, {
            status: response.status,
            headers: { "Cache-Control": "no-store" },
        });
    } catch {
        return new Response(null, { status: 502 });
    }
}
