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
    const output = document.getElementById("output-screen");
    const button = document.getElementById("run");
    const shareButton = document.getElementById("share"); // optional

    let running = false;
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

        button.disabled = false;
        output.textContent = "";

        const tilesRes = await fetch("https://ric-api.sno.mba/tiles.json", {
            mode: "cors"
        });

        tiles = await tilesRes.json();
    }
    catch (err) {
        initialize_executor({});

        button.disabled = false;

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

    output.classList.add("complete");
    output.textContent =
    `Loaded ${Object.keys(stdMacros).length + Object.keys(data).length} macros.

[Built-in macros]:
${Object.keys(stdMacros).length} macros.

[Custom macros]:
${Object.keys(data).length} macros.
    `;

    /*
        Big Giant Run button
    */

    button.addEventListener("click", async () => {
        if (running) {
            cancel_running_macro();
            return;
        }

        running = true;

        button.classList.add("stop");
        button.textContent = "Stop";

        output.textContent = "Running...";
        output.classList.remove("complete");
        output.classList.remove("error");

        try {
            const start = performance.now();
            const mode = window.executionMode ?? "=m";
            const result = await evaluate(`${editor.value}`);

            output.classList.remove("error");

            if (result.includes("[MACRO ERROR]")) {
                output.classList.add("error");
            }

            const executionTime = (performance.now() - start).toFixed(3);
            output.textContent = `Took ${executionTime}ms:\n` + result;
        }
        catch (err) {
            output.classList.add("error");
            output.textContent = `[JAVASCRIPT ERROR]\n${err}`;
        }
        finally {
            running = false;
            button.classList.remove("stop");
            button.textContent = "Run";
        }
    });
}
