import { NextResponse } from "next/server";
import { loadPalettes } from "@/data/palette_colors";

export async function GET() {
    try {
        const palettes = await loadPalettes();
        return NextResponse.json(palettes);
    } catch (error) {
        console.error("Could not load palettes.", error);
        return NextResponse.json({ error: "Failed to load palettes" }, { status: 500 });
    }
}