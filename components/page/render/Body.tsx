"use client";

import { EditorScreen } from "@/components/editor/EditorScreen";
import ExecutionModeSelect from "@/components/page/render/ExecutionModeSelect";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/render-screen/render/RenderScreen";
import { StatusBar } from "../../editor/statsbar/render/StatusBar";

export default function Body({ onCodeChange }: { onCodeChange?: (code: string) => void }) {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="run-controls">
                    <p className="text-label">Execute</p>
                    <ExecutionModeSelect />
                    <button id="run" style={{display: "none"}} disabled>Run</button>
                    <StatusBar />
                </div>
                <hr />
                <EditorScreen onCodeChange={onCodeChange} />
                
                <MacroInitializer />

                <p className="text-label">Render</p>
                <hr />
                <RenderScreen />
            </div>
        </main>
    );
}
