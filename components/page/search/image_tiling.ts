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
        [ 0,  1,  2,  3, 31],
        [ 8,  9, 10, 11,  7],
        [16, 17, 18, 19, 15],
        [24, 25, 26, 27, 23],
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
    const indexMap: number[][] = [];

    const createUrl = (map: number) =>
        `https://ric-api.sno.mba/tiles/${typeof map === "number" ? name : "hide"}.gif${map !== 0 && typeof map === "number" ? `?frame=${map}` : ""}`;

    if (Array.isArray(mapped[0])) {
        const groups = mapped as readonly (readonly number[])[];

        for (const group of groups) {
            const images: string[] = [];
            const indexes: number[] = [];

            for (const map of group) {
                // if (typeof map !== "number") continue;

                images.push(createUrl(map));
                indexes.push(map);
            }

            imageMap.push(images);
            indexMap.push(indexes);
        }
    } else {
        const maps = mapped as readonly number[];

        const images: string[] = [];
        const indexes: number[] = [];

        for (const map of maps) {
            images.push(createUrl(map));
            indexes.push(map);
        }

        imageMap.push(images);
        indexMap.push(indexes);
    }

    return {
        imageMap,
        indexMap,
    };
}