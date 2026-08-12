"use client";

import { EditorScreen } from "@/components/editor/EditorScreen";
import ExecutionModeSelect from "@/components/ExecutionModeSelect";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/render-screen/render/RenderScreen";
import { StatusBar } from "../../editor/statsbar/render/StatusBar";

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <MacroInitializer />

                <div className="run-controls">
                    <p className="text-label">Render</p>
                    <StatusBar />
                </div>
                <hr />
                <RenderScreen />
                
                <div className="run-controls">
                    <p className="text-label">Execute</p>
                    <ExecutionModeSelect />
                    <button id="run" style={{display: "none"}} disabled>Run</button>
                </div>
                <hr />
                <EditorScreen />
            </div>
        </main>
    );
}
