import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/discord";

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { error: "Missing user ID" },
            { status: 400 }
        );
    }

    try {
        const user = await getUser(id);

        return NextResponse.json(user);
    } catch (error) {
        console.error("Discord API error:", error);

        return NextResponse.json(
            {
                error: error instanceof Error
                    ? error.message
                    : "Failed to fetch user"
            },
            { status: 500 }
        );
    }
}
