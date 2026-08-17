export default async function stdlib_macros() {
    const { 
        default: init,
        get_stdlib_macro_names,
    } = await eval('import("https://robot-is-chill.github.io/macrosia/pkg/glue.js")');

    await init();

    const stdMacros = {};

    for (const entry of get_stdlib_macro_names()) {
        const [name, ...descriptionLines] = entry.split(/\r?\n/);

        let descriptionLinesNID = descriptionLines.map(
            line => line.trim()
            .replace(/#\s*(\w+)/, "__$1__")
            .replace(/(\d+|n)\.{3}/, "$1. [Variadic]")
            .replace(/(\d+|n)\?/, "$1. [Optional]")
        );

        stdMacros[name] = {
            description: descriptionLinesNID.join("\n"),
        };
    }

    console.log(stdMacros);

    return stdMacros;
}