import { NextResponse } from "next/server";

export async function GET(
    _request: Request,
    { params }: { params: { name: string } }
) {
    const imageName = params.name;
    const extensions = ["png", "gif", "jpg", "webp"];

    let upstreamRes: Response | null = null;

    // check if it already has an extension
    if (imageName.includes(".")) {
        upstreamRes = await fetch(`https://ric-api.sno.mba/filters/${imageName}`);
    } else {
        for (const ext of extensions) {
            const res = await fetch(`https://ric-api.sno.mba/filters/${imageName}.${ext}`);
            if (res.ok) {
                upstreamRes = res;
                break;
            }
        }
    }

    if (!upstreamRes || !upstreamRes.ok) {
        return new NextResponse("Image not found", { status: 404 });
    }
    const imageBlob = await upstreamRes.blob();

    return new NextResponse(imageBlob, {
        headers: {
            // prevents CORB
            "Content-Type": upstreamRes.headers.get("content-type") || "image/png",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
}