"use client";

import { useState, useEffect } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/render-screen/macrosia/RenderScreen";
import { StatusBar } from "../../editor/statsbar/macrosia/StatusBar";
import type { WindowWithEditor } from "../../editor/types";

export default function Body({ onCodeChange }: { onCodeChange?: (code: string) => void }) {
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    const [splitscreen, setSplitscreen] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("splitscreen");
            return saved || "top-bottom";
        }
        return "top-bottom";
    });

    useEffect(() => {
        setIsMounted(true);

        try {
            const saved = localStorage.getItem("splitscreen");
            if (saved === "top-bottom" || saved === "left-right") {
                setSplitscreen(saved);
            }
        } catch {
            // localStorage unavailable/full
        }

        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 640);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);

        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        try {
            localStorage.setItem("splitscreen", splitscreen);
        } catch (error) {
            console.warn("Could not save splitscreen preference:", error);
        }
    }, [splitscreen, isMounted]);
    
    const handleOnClick = async () => {
        const editorReady = (window as WindowWithEditor).editorReady;
        if (editorReady) {
            const editor = await editorReady;
            onCodeChange?.(editor.value);
        }

        setSplitscreen((prev) =>
            (prev === "top-bottom"
                ? "left-right"
                : "top-bottom"
            )
        );
    };

    return (
        <main style={{ width: "stretch" }}>
            <div className={`main-body ${isMounted ? splitscreen : "top-bottom"}`}>
                <div className="flex flex-col gap-[8px] this-s">
                    <div className="run-controls">
                        <p className="text-label">Execute</p>

                        <div className="flex gap-[8px]">
                            <StatusBar small={isSmallScreen} />
                            
                            {isMounted && splitscreen === "top-bottom" && (
                                <div className="status-bar">
                                    <button
                                        type="button"
                                        className="status status-btn"
                                        onClick={handleOnClick}
                                    >
                                        <span className="icon">
                                            splitscreen_right
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <hr />
                    <EditorScreen onCodeChange={onCodeChange} />
                    
                    <MacroInitializer />
                </div>

                <div className="flex flex-col gap-[8px] h-full min-h-0 this-e">
                    <div className="run-controls">
                        <p className="text-label">Output</p>

                        {isMounted && splitscreen === "left-right" && (
                            <div className="status-bar">
                                <button
                                    type="button"
                                    className="status status-btn"
                                    onClick={handleOnClick}
                                >
                                    <span className="icon">
                                        splitscreen_bottom
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                    <hr />
                    <RenderScreen />
                </div>
            </div>
        </main>
    );
}
