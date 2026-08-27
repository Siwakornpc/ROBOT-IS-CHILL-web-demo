import { mkdir, writeFile } from "node:fs/promises";
import { loadUpstream } from "../data/ric_metadata";

async function main() {
    const metadata = await loadUpstream();

    await mkdir("public/data", { recursive: true });

    await Promise.all([
        writeFile(
            "public/data/variants.json",
            JSON.stringify(metadata.variants, null, 2) + "\n",
        ),
        writeFile(
            "public/data/flags.json",
            JSON.stringify(metadata.flags, null, 2) + "\n",
        ),
    ]);

    console.log("Generated public/data/variants.json");
    console.log("Generated public/data/flags.json");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});