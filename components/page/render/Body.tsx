"use client";

import { useState, useEffect } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import ExecutionModeSelect from "@/components/page/render/ExecutionModeSelect";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/render-screen/render/RenderScreen";
import { StatusBar } from "../../editor/statsbar/render/StatusBar";

export default function Body({ onCodeChange }: { onCodeChange?: (code: string) => void }) {
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => setIsSmallScreen(window.innerWidth < 640);
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <div className="flex flex-col gap-[8px]">
                    <div className="run-controls">
                        <p className="text-label">Execute</p>
                        <ExecutionModeSelect />
                        <button id="run" style={{display: "none"}} disabled>Run</button>
                        <StatusBar small={isSmallScreen} />
                    </div>
                    <hr />
                    <EditorScreen onCodeChange={onCodeChange} />
                    
                    <MacroInitializer />
                </div>

                <div className="flex flex-col gap-[8px]" style={{height: "stretch"}}>
                    <p className="text-label">Render</p>
                    <hr />
                    <RenderScreen />
                </div>
            </div>
        </main>
    );
}
