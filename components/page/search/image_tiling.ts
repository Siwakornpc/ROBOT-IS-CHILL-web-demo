const TILINGS = {
    none: [0],
    static: [0],
    animated: [0, 1, 2, 3],
    directional: [0, 8, 16, 24],
    animated_directional: [
        [ 0,  1,  2,  3],
        [ 8,  9, 10, 11],
        [16, 17, 18, 19],
        [24, 25, 26, 27],
    ],
    character: [
        [31,  0,  1,  2,  3],
        [ 7,  8,  9, 10, 11],
        [15, 16, 17, 18, 19],
        [23, 24, 25, 26, 27],
    ],
    tiling: [
        [ 0,  1,  5,  4],
        [ 8,  9, 13, 12],
        [10, 11, 15, 14],
        [ 2,  3,  7,  6],
    ],
    diagonal_tiling: [
        [ 0,  1,  5,  4, 23, 36, 27, 19, 25, 40, 43, ""],
        [ 8,  9, 13, 12, 35, 44, 45, 28, 34, 42, 26, 39],
        [10, 11, 15, 14, 18, 41, 33, 22, 38, 46, 31, 30],
        [ 2,  3,  7,  6, 29, 17, 21, 37, 16, 24, 20, 32],
    ],
} as const;

type TilingName = keyof typeof TILINGS;

export function mapTiling(name: string, tiling: string) {
    const mapped = TILINGS[tiling as TilingName] ?? TILINGS.none;
    const imageMap: string[][] = [];
    const encodedName = encodeURIComponent(name);

    if (Array.isArray(mapped[0])) {
        const groups = mapped as readonly (readonly (number | string)[])[];

        for (const group of groups) {
            const row: string[] = [];
            for (const map of group) {
                row.push(`https://ric-api.sno.mba/tiles/${encodedName}.gif${map !== 0 && map !== "" ? `?frame=${map}` : ""}`);
            }
            imageMap.push(row);
        }
    } else {
        const maps = mapped as readonly (number | string)[];
        const row: string[] = [];

        for (const map of maps) {
            row.push(`https://ric-api.sno.mba/tiles/${encodedName}.gif${map !== 0 && map !== "" ? `?frame=${map}` : ""}`);
        }
        imageMap.push(row);
    }

    return imageMap;
}