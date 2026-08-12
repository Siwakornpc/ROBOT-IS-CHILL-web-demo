"use client";

import { EditorScreen } from "@/components/editor/EditorScreen";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/render-screen/macrosia/RenderScreen";
import { StatusBar } from "../../editor/statsbar/macrosia/StatusBar";

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <MacroInitializer />

                <div className="run-controls">
                    <p className="text-label">Output</p>
                    <button id="run" style={{display: "none"}} disabled>Run</button>
                    <StatusBar />
                </div>
                <hr />
                <RenderScreen />

                <p className="text-label">Execute</p>
                <hr />
                <EditorScreen />
            </div>
        </main>
    );
}