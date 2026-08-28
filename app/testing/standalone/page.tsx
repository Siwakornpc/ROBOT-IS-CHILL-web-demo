import { loadPalettes } from "@/data/palette_colors";

export default async function TestPage() {
    const palettes = await loadPalettes();

    return (
        <pre>
            {JSON.stringify(palettes, null, 2)}
        </pre>
    );
}