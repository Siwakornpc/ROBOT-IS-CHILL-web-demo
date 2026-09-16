"use client";

import { useState, useEffect, useRef } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/render-screen/macrosia/RenderScreen";
import { StatusBar } from "../../editor/statsbar/macrosia/StatusBar";
import type { WindowWithEditor } from "../../editor/types";

export default function Body({ onCodeChange }: { onCodeChange?: (code: string) => void }) {
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    const start_lim = 40;
    const end_lim = 70;

    const [splitPosition, setSplitPosition] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = Number(localStorage.getItem("split-position"));
            return saved >= start_lim && saved <= end_lim ? saved : 40;
        }
        return 50;
    });
    const mainBodyRef = useRef<HTMLDivElement>(null);

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

            const savedPosition = Number(localStorage.getItem("split-position"));
            if (savedPosition >= start_lim && savedPosition <= end_lim) {
                setSplitPosition(savedPosition);
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

    useEffect(() => {
        if (!isMounted) return;

        try {
            localStorage.setItem("split-position", String(splitPosition));
        } catch {
            // localStorage unavailable/full
        }
    }, [splitPosition, isMounted]);
    
    const handleOnClick = async () => {
        setSplitscreen((prev) =>
            (prev === "top-bottom"
                ? "left-right"
                : "top-bottom"
            )
        );
    };

    const handleSplitPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

        const bounds = mainBodyRef.current?.getBoundingClientRect();
        if (!bounds) return;

        const position = splitscreen === "left-right"
            ? ((event.clientX - bounds.left) / bounds.width) * 100
            : ((event.clientY - bounds.top) / bounds.height) * 100;

        setSplitPosition(Math.min(end_lim, Math.max(start_lim, position)));
    };

    return (
        <main style={{ width: "stretch" }}>
            <div
                ref={mainBodyRef}
                className={`main-body ${isMounted ? splitscreen : "top-bottom"}`}
                style={{ "--split-position": `${splitPosition}%` } as React.CSSProperties}
            >
                <div className="flex flex-col gap-[8px] this-s">
                    <div className="run-controls">
                        <p className="text-label">Execute</p>

                        <div className="flex gap-[8px]">
                            <StatusBar small={isSmallScreen} />
                            
                            {isMounted && splitscreen === "top-bottom" && (
                                <div className="status-bar splitscreen">
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

                <div
                    className="split-handle"
                    role="separator"
                    aria-orientation={splitscreen === "left-right" ? "vertical" : "horizontal"}
                    aria-valuemin={start_lim}
                    aria-valuemax={end_lim}
                    aria-valuenow={Math.round(splitPosition)}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={handleSplitPointerMove}
                />

                <div className="flex flex-col gap-[8px] h-full min-h-0 this-e">
                    <div className="run-controls">
                        <p className="text-label">Output</p>

                        {isMounted && splitscreen === "left-right" && (
                            <div className="status-bar splitscreen">
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
