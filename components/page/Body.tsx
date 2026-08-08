"use client";

import { EditorScreen } from "@/components/editor/EditorScreen";
import ExecutionModeSelect from "@/components/ExecutionModeSelect";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/RenderScreen";
import { StatusBar } from "../editor/statsbar/StatusBar";
import { useEffect } from "react";

export default function Body() {
    useEffect(() => {
        // mount macroscript.js
    }, []);
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="run-controls">
                    <p className="text-label">Execute</p>
                    <ExecutionModeSelect />
                    <button id="run" style={{display: "none"}} disabled>Run</button>
                    <StatusBar />
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
