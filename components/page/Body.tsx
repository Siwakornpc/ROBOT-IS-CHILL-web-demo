"use client";

import { EditorScreen } from "@/components/editor/EditorScreen";
import ExecutionModeSelect from "@/components/ExecutionModeSelect";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/RenderScreen";
import { doCustomCaret } from "./caret/caretHandle";
import { useEffect } from "react";

export default function Body() {
    useEffect(() => {
        doCustomCaret();

        const handleInteraction = () => {
            doCustomCaret();
        };

        document.addEventListener("focusin", handleInteraction);
        document.addEventListener("click", handleInteraction);
        document.addEventListener("keyup", handleInteraction);
        document.addEventListener("selectionchange", handleInteraction);

        return () => {
            document.removeEventListener("focusin", handleInteraction);
            document.removeEventListener("click", handleInteraction);
            document.removeEventListener("keyup", handleInteraction);
            document.removeEventListener("selectionchange", handleInteraction);
        };
    }, []);
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="run-controls">
                    <p className="text-label">Execute</p>
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
