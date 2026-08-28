import { PNG } from "pngjs";

const GITHUB_BASE =
    "https://github.com/ROBOT-IS-CHILL/robot-is-chill/tree/main/data/palettes";

const RAW_BASE =
    "https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/data/palettes";

const PALETTES_PAGE =
    "https://github.com/ROBOT-IS-CHILL/robot-is-chill/tree/main/data/palettes";

type PaletteFile = {
    name: string;
    colors: (string | null)[][];
};

export type Palette = {
    source: string;
    colors: (string | null)[][];
};

export type PaletteRecord = Record<string, Palette>;

function trimPNG(buffer: Buffer): Buffer {
    let offset = 8;

    while (offset + 8 <= buffer.length) {
        const length = buffer.readUInt32BE(offset);

        const type = buffer
            .subarray(offset + 4, offset + 8)
            .toString("ascii");

        const chunkEnd = offset + 12 + length;

        if (chunkEnd > buffer.length) {
            throw new Error("Invalid PNG chunk length");
        }

        if (type === "IEND") {
            return buffer.subarray(0, chunkEnd);
        }

        offset = chunkEnd;
    }

    throw new Error("PNG does not contain an IEND chunk");
}

async function extractColors(
    url: string
): Promise<(string | null)[][]> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch palette image: ${response.status}\n${url}`
        );
    }

    const buffer = Buffer.from(
        await response.arrayBuffer()
    );

    const pngBuffer = trimPNG(buffer);

    try {
        const png = PNG.sync.read(pngBuffer);

        const colors: (string | null)[][] = [];

        for (let y = 0; y < png.height; y++) {
            const row: (string | null)[] = [];

            for (let x = 0; x < png.width; x++) {
                const index = (png.width * y + x) * 4;
                const a = png.data[index + 3];

                if (a === 0) {
                    row.push(null);
                    continue;
                }

                const r = png.data[index];
                const g = png.data[index + 1];
                const b = png.data[index + 2];

                const hex =
                    `#${r.toString(16).padStart(2, "0")}` +
                    `${g.toString(16).padStart(2, "0")}` +
                    `${b.toString(16).padStart(2, "0")}`;

                row.push(hex);
            }

            colors.push(row);
        }

        return colors;
    } catch (error) {
        throw new Error(
            `Failed to decode PNG:\n${url}\n\n${error}`
        );
    }
}

async function loadPaletteNames(): Promise<string[]> {
    const response = await fetch(PALETTES_PAGE);

    if (!response.ok) {
        throw new Error(
            `Failed to load palette directory: ${response.status}`
        );
    }

    const html = await response.text();

    const folders = [
        ...html.matchAll(
            /href="\/ROBOT-IS-CHILL\/robot-is-chill\/tree\/main\/data\/palettes\/([^"]+)"/gi
        ),
    ];

    return [
        ...new Set(
            folders.map(match =>
                decodeURIComponent(match[1])
            )
        ),
    ];
}

export async function loadPaletteFiles(
    paletteName: string
): Promise<PaletteFile[]> {
    const url =
        `${GITHUB_BASE}/${encodeURIComponent(paletteName)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to load palette "${paletteName}": ${response.status}`
        );
    }

    const html = await response.text();

    const files = [
        ...html.matchAll(
            /href="\/ROBOT-IS-CHILL\/robot-is-chill\/blob\/main\/data\/palettes\/[^"]+\/([^"]+\.png)"/gi
        ),
    ];

    const uniqueNames = new Set(
        files.map(match => match[1])
    );

    return Promise.all(
        [...uniqueNames].map(async name => {
            try {
                return {
                    name: name.replace(/\.png$/i, ""),

                    colors: await extractColors(
                        `${RAW_BASE}/${encodeURIComponent(paletteName)}/${encodeURIComponent(name)}`
                    ),
                };
            } catch (error) {
                throw new Error(
                    `Palette: ${paletteName}\nFile: ${name}\n\n${error}`
                );
            }
        })
    );
}

export async function loadPalettes(): Promise<PaletteRecord> {
    const paletteNames = await loadPaletteNames();

    const palettes: PaletteRecord = {};

    for (const paletteName of paletteNames) {
        const files = await loadPaletteFiles(paletteName);

        for (const file of files) {
            palettes[file.name] = {
                source: paletteName,
                colors: file.colors,
            };
        }
    }

    return palettes;
}