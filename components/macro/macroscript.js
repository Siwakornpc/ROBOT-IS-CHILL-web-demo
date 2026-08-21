import { flags, variants } from "../highlight/render-highlight";

// Delay (ms) between clicking Run and actually invoking the macro engine.
const EXECUTION_DELAY_MS = 800;
let hasCodeInEditor = true;

export async function initMacro() {
    const dynamicImport = new Function(
        "url",
        "return import(url)"
    );

    const mod = await dynamicImport(
        "https://robot-is-chill.github.io/macrosia/pkg/glue.js"
    );

    const response = await fetch(
        "https://robot-is-chill.github.io/macrosia/pkg/glue_bg.wasm"
    );

    const bytes = await response.arrayBuffer();
    const module = await WebAssembly.compile(bytes);

    console.log(WebAssembly.Module.exports(module));
    console.log(WebAssembly.Module.imports(module));

    const {
        default: init,
        evaluate,
        get_stdlib_macro_names,
        initialize_executor,
        cancel_running_macro,
    } = mod;

    const editor = await window.editorReady;
    const editorArea = document.getElementById("editor-area");
    const output = document.getElementById("render-output");
    const button = document.getElementById("stop");
    const statusTime = document.getElementById("status-time");
    const statusSteps = document.getElementById("status-steps");

    if (!editor.value) {
        hasCodeInEditor = false;
    }

    let running = false;
    let delaying = false;
    let cancelledDuringDelay = false;
    let tiles = {};

    output.textContent = "Getting database macros...";

    await init();

    /*
        Load database macros from API
    */
    let dbMacros = {};

    try {
        const res = await fetch("https://ric-api.sno.mba/macros.json", {
            mode: "cors"
        });

        const dbMacrosf = await res.json();
        initialize_executor(dbMacrosf);

        dbMacros = dbMacrosf;

        output.textContent = "Fetching...";

        const tilesRes = await fetch("https://ric-api.sno.mba/tiles.json", {
            mode: "cors"
        });

        tiles = await tilesRes.json();
    }
    catch (err) {
        initialize_executor({});
        dbMacros = {};

        output.textContent =
    `Failed to get macros from the RIC database!

You can still use builtins, but you'll have to refresh to try again.

The [tiles] macro will also be non-functional.

Error:
${err}`;
    }

    window.getTiles = () => tiles;

    /*
        Load macros
    */

    const stdMacros = {};

    for (const entry of get_stdlib_macro_names()) {
        const lines = entry.split(/\n/);
        const name = lines.shift();
        stdMacros[name] = lines.join("\n");
    }

    const flagsData = flags;
    const variantsData = variants;

    output.classList.add("complete");
    output.textContent =
    `Loaded ${Object.keys(stdMacros).length + Object.keys(dbMacros).length} macros, ${flagsData.length} flags, ${Object.keys(variantsData).length} varaints.

[Built-in macros]:
${Object.keys(stdMacros).length} macros.

[Custom macros]:
${Object.keys(dbMacros).length} macros.`;
    /*
        Auto execution (good bye big and intimidating run button, you will be MISSED...)
    */

    let delayTimer = null; 

    function macroRunner() {
        if (delayTimer) {
            clearTimeout(delayTimer);
            delayTimer = null;
        }

        if (running) {
            cancel_running_macro();
            running = false;
        }

        output.textContent = "Waiting for pause...";
        output.classList.remove("complete");
        output.classList.remove("error");

        delayTimer = setTimeout(async () => {
            running = true; 

            output.textContent = "Evaluating...";

            try {
                const start = performance.now();
                const result = await evaluate(`${editor.value}`);
                const executionTime = (performance.now() - start).toFixed(3);

                const steps = await evaluate(`[add/[step]/-2]-->[/${editor.value}]`);

                if (statusTime) {
                    statusTime.textContent = `${executionTime}ms`;
                }

                if (statusSteps) {
                    if (steps.includes("[MACRO ERROR]")) {
                        statusSteps.classList.add("error");
                        statusSteps.textContent = "Error"
                    } else {
                        statusSteps.classList.remove("error");
                        statusSteps.textContent = steps.replace(/^(\d+)-->/, "$1");
                    }
                }

                output.classList.remove("error");

                if (result.includes("[MACRO ERROR]")) {
                    output.classList.add("error");
                }

                output.textContent = result;
            }
            catch (err) {
                output.classList.add("error");
                output.textContent = `[JAVASCRIPT ERROR]\n${err}`;
            }
            finally {
                running = false;
                delayTimer = null; 
            }
        }, EXECUTION_DELAY_MS);
    }

    editorArea.addEventListener("input", async () => {
        macroRunner();
    });

    editorArea.addEventListener("keydown", async (e) => {
        if (
            ((e.ctrlKey || e.metaKey) && e.code.toLowerCase() === "keyz") ||
            ((e.ctrlKey || e.metaKey) && e.code.toLowerCase() === "keyy")
        )
        macroRunner();
    });

    if (hasCodeInEditor) {
        macroRunner();
    }
}
