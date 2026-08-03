import { EditorScreen } from "@/components/editor/EditorScreen";
import ExecutionModeSelect from "@/components/ExecutionModeSelect";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/RenderScreen";

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <p className="text-label">Execute</p>
                <div className="run-controls">
                    <ExecutionModeSelect />
                    <button id="run" disabled>Run</button>
                </div>
                <EditorScreen />
                <MacroInitializer />
                
                <hr />

                <p className="text-label">Render</p>
                <RenderScreen />
            </div>
        </main>
    );
}
