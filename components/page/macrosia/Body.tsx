"use client";

import { useState, useEffect, useRef } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import MacroInitializer from "@/components/macro/MacroInitializer";
import { RenderScreen } from "@/components/render-screen/macrosia/RenderScreen";
import { StatusBar } from "../../editor/statsbar/macrosia/StatusBar";
import type { WindowWithEditor } from "../../editor/types";

export default function Body({ onCodeChange }: { onCodeChange?: (code: string) => void }) {
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [isSmallLeftSplitScreen, setIsSmallLeftSplitScreen] = useState(false);
    const [isSideBySideSupported, setIsSideBySideSupported] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    const min_size = 200;

    const [splitPosition, setSplitPosition] = useState(min_size);
    const mainBodyRef = useRef<HTMLDivElement>(null);

    const [splitscreen, setSplitscreen] = useState("top-bottom");

    const thisSRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);

        try {
            const saved = localStorage.getItem("splitscreen");
            if (saved === "top-bottom" || saved === "left-right") {
                setSplitscreen(saved);
            }

            const savedPosition = Number(localStorage.getItem("split-position"));
            if (savedPosition >= min_size) {
                setSplitPosition(savedPosition);
            }
        } catch {
            // localStorage unavailable/full
        }

        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 640);
            setIsSideBySideSupported(window.innerWidth >= 1000);
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

    const activeSplitscreen = isMounted && isSideBySideSupported
        ? splitscreen
        : "top-bottom";
    
    const clampSplitPosition = (position: number, axisSize: number) => {
        const endLimit = axisSize - min_size;

        if (endLimit < min_size) {
            return axisSize / 2;
        }

        return Math.min(endLimit, Math.max(min_size, position));
    };

    const getSplitAxisMetrics = (orientation: string, bounds: DOMRect) => {
        const mainBody = mainBodyRef.current;
        if (!mainBody) return null;

        const styles = window.getComputedStyle(mainBody);
        const isLeftRight = orientation === "left-right";
        const startInset = parseFloat(isLeftRight ? styles.paddingLeft : styles.paddingTop);
        const endInset = parseFloat(isLeftRight ? styles.paddingRight : styles.paddingBottom);
        const axisSize = (isLeftRight ? bounds.width : bounds.height) - startInset - endInset;
        const axisStart = (isLeftRight ? bounds.left : bounds.top) + startInset;

        return { axisSize, axisStart };
    };

    useEffect(() => {
        if (!isMounted) return;

        const mainBody = mainBodyRef.current;
        const thisS = thisSRef.current;

        if (!mainBody || !thisS) return;

        const updateLayout = () => {
            const axis = getSplitAxisMetrics(
                activeSplitscreen,
                mainBody.getBoundingClientRect()
            );

            if (axis) {
                setSplitPosition((currentPosition) =>
                    clampSplitPosition(currentPosition, axis.axisSize)
                );
            }

            const width = thisS.getBoundingClientRect().width;

            setIsSmallLeftSplitScreen(
                activeSplitscreen === "left-right" && width < 400
            );
        };

        const animationFrame = window.requestAnimationFrame(updateLayout);

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(updateLayout)
                : null;

        resizeObserver?.observe(mainBody);
        resizeObserver?.observe(thisS);

        if (!resizeObserver) {
            window.addEventListener("resize", updateLayout);
        }

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();

            if (!resizeObserver) {
                window.removeEventListener("resize", updateLayout);
            }
        };
    }, [activeSplitscreen, isMounted]);


    const handleOnClick = () => {
        const nextSplitscreen = activeSplitscreen === "top-bottom" ? "left-right" : "top-bottom";
        const bounds = mainBodyRef.current?.getBoundingClientRect();

        if (bounds) {
            const currentAxis = getSplitAxisMetrics(activeSplitscreen, bounds);
            const nextAxis = getSplitAxisMetrics(nextSplitscreen, bounds);
            if (currentAxis && nextAxis) {
                const relativePosition = currentAxis.axisSize > 0
                    ? splitPosition / currentAxis.axisSize
                    : 0.5;

                setSplitPosition(clampSplitPosition(relativePosition * nextAxis.axisSize, nextAxis.axisSize));
            }
        }

        setSplitscreen(nextSplitscreen);
    };

    const handleSplitPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

        const bounds = mainBodyRef.current?.getBoundingClientRect();
        if (!bounds) return;

        const axis = getSplitAxisMetrics(activeSplitscreen, bounds);
        if (!axis) return;

        const position = activeSplitscreen === "left-right"
            ? event.clientX - axis.axisStart
            : event.clientY - axis.axisStart;

        setSplitPosition(clampSplitPosition(position, axis.axisSize));
    };

    return (
        <main style={{ width: "stretch" }}>
            <div
                ref={mainBodyRef}
                className={`main-body ${activeSplitscreen} is-o`}
                style={{ "--split-position": `${splitPosition}px` } as React.CSSProperties}
            >
                <div ref={thisSRef} className="flex flex-col gap-[8px] this-s">
                    <div className="run-controls">
                        <p className="text-label">Execute</p>

                        <div className="flex gap-[8px]">
                            <StatusBar small={isSmallScreen || isSmallLeftSplitScreen} />
                            
                            {isMounted && activeSplitscreen === "top-bottom" && (
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
                    aria-orientation={activeSplitscreen === "left-right" ? "vertical" : "horizontal"}
                    aria-valuemin={min_size}
                    aria-valuenow={Math.round(splitPosition)}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={handleSplitPointerMove}
                />

                <div className="flex flex-col gap-[8px] h-full min-h-0 this-e">
                    <div className="run-controls">
                        <p className="text-label">Output</p>

                        {isMounted && activeSplitscreen === "left-right" && (
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
