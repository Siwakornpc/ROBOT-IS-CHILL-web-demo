import { flags, variants } from "../highlight/render-highlight";

// Delay (ms) between clicking Run and actually invoking the macro engine.
const EXECUTION_DELAY_MS = 800;

export async function initMacro() {
    const { 
        default: init, 
        evaluate, 
        get_stdlib_macro_names, 
        initialize_executor, 
        cancel_running_macro 
    } = await eval('import("https://robot-is-chill.github.io/macrosia/pkg/glue.js")');

    if (!RegExp.escape) {
        RegExp.escape = str => str.replace(/[\\^$.*+?()[\]{}|\-]/g, "\\$&");
    }

    const editor = await window.editorReady;
    const editorArea = document.getElementById("editor-area");
    const output = document.getElementById("render-output");
    const outputSc = document.querySelector(".render-screen");
    const button = document.getElementById("stop");
    const statusTime = document.getElementById("status-time");
    const statusSteps = document.getElementById("status-steps");

    let running = false;
    let delaying = false;
    let cancelledDuringDelay = false;
    let tiles = {};

    output.textContent = "Getting database macros...";

    await init();

    /*
        Load database macros from API
    */

    try {
        const res = await fetch("https://ric-api.sno.mba/macros.json", {
            mode: "cors"
        });

        const dbMacros = await res.json();
        initialize_executor(dbMacros);

        output.textContent = "Fetching...";

        const tilesRes = await fetch("https://ric-api.sno.mba/tiles.json", {
            mode: "cors"
        });

        tiles = await tilesRes.json();
    }
    catch (err) {
        initialize_executor({});

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

    const data = await fetch("https://ric-api.sno.mba/macros.json")
    .then(res => res.json());

    const flagsData = flags;
    const variantsData = variants;

    output.classList.add("complete");
    output.textContent =
    `Loaded ${Object.keys(stdMacros).length + Object.keys(data).length} macros, ${flagsData.length} flags, ${Object.keys(variantsData).length} varaints.

[Built-in macros]:
${Object.keys(stdMacros).length} macros.

[Custom macros]:
${Object.keys(data).length} macros.`;
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

        const mode = window.executionMode ?? "=m";
        const isMacroExecution = mode === "=m";

        if (isMacroExecution) {
            output.textContent = "Waiting for pause...";
            outputSc.classList.remove("vignette");
            output.classList.remove("complete");
            output.classList.remove("error");
        }

        delayTimer = setTimeout(async () => {
            running = true; 

            if (isMacroExecution) {
                output.textContent = "Evaluating...";
            }

            try {
                const start = performance.now();
                const result = await evaluate(`${editor.value}`);
                const executionTime = (performance.now() - start).toFixed(3);

                if (statusTime) {
                    statusTime.textContent = `${executionTime}ms`;
                }

                if (isMacroExecution) {
                    output.classList.remove("error");
                    outputSc.classList.add("vignette");

                    if (result.includes("[MACRO ERROR]")) {
                        output.classList.add("error");
                    }

                    output.textContent = result;
                }
            }
            catch (err) {
                if (isMacroExecution) {
                    output.classList.add("error");
                    output.textContent = `[JAVASCRIPT ERROR]\n${err}`;
                }
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
}
