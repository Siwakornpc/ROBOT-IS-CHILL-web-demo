let abstractv = [];
let skeletonv = [];
let signv = [];
let tilev = [];
let spritev = [];
let postv = [];
let constantsv = [
    "r",        "l",        "u",         "d",
    "right",    "left",     "up",        "down"].sort();
let miscv = [
    "maroon",
    "red",
    "orange",
    "yellow",
    "gold",
    "brown",
    "green",
    "lime",
    "blue",
    "cyan",
    "teal",
    "purple",
    "pink",
    "rosy",
    "black",
    "grey",
    "silver",
    "white",
    "sleep",
    "s"
];
export let allv = [];

const RAW_GITHUB_URL = 'https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/refs/heads/main/src/cogs/variants.py';

export async function loadVariants() {
    const factoryMap = {
        'AbstractVariantFactory': abstractv,
        'SkeletonVariantFactory': skeletonv,
        'SignVariantFactory': signv,
        'TileVariantFactory': tilev,
        'SpriteVariantFactory': spritev,
        'PostVariantFactory': postv
    };

    try {
        console.log('Fetching file from GitHub...');
        const response = await fetch(RAW_GITHUB_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();

        const regex = /@(\w+VariantFactory)\.define_variant\(\s*names\s*=\s*\[([\s\S]*?)\]/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const factoryClassName = match[1];
            const rawNames = match[2];

            if (factoryMap[factoryClassName]) {
                const cleanedNames = rawNames
                    .split(',')
                    .map(name => name.replace(/['"\s]/g, ''))
                    .filter(name => name.length > 0);

                factoryMap[factoryClassName].push(...cleanedNames);
            }
        }

        abstractv = [...new Set(abstractv)].sort();
        skeletonv = [...new Set(skeletonv)].sort();
        signv = [...new Set(signv)].sort();
        tilev = [...new Set(tilev)].sort();
        spritev = [...new Set(spritev)].sort();
        postv = [...new Set(postv)].sort();
        allv = [...abstractv, ...skeletonv, ...signv, ...tilev, ...spritev, ...postv, ...constantsv, ...miscv];

        return allv;
    } catch (error) {
        console.error('Error fetching or processing data:', error.message);
        return [];
    }
}