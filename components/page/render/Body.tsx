"use client";

import { useState, useEffect, useRef } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import ExecutionModeSelect from "@/components/page/render/ExecutionModeSelect";
import { RenderScreen } from "@/components/render-screen/render/RenderScreen";
import { StatusBar } from "../../editor/statsbar/render/StatusBar";
import { getRender, RenderRequestError, type RenderMode } from "./get_render";
import type { WindowWithEditor } from "@/components/editor/types";

const EXECUTION_DELAY_MS = 800;

function getRenderFilename(image: Blob): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const timestamp = `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;
    const format = image.type.slice("image/".length).split("+")[0] || "png";

    return `render_${timestamp}.${format}`;
}

export default function Body({
    onCodeChange,
    renderMode,
    onRenderModeChange,
    scene = "",
}: {
    onCodeChange?: (code: string) => void;
    renderMode: RenderMode;
    onRenderModeChange: (mode: RenderMode) => void;
    scene?: string;
}) {
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [isSmallLeftSplitScreen, setIsSmallLeftSplitScreen] = useState(false);
    const [sLSSWidthSize, setSLSSWidthSize] = useState(0);
    const [isSideBySideSupported, setIsSideBySideSupported] = useState(false);
    const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);
    const [renderedImageDownloadName, setRenderedImageDownloadName] = useState<string | null>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [isWaitingForPause, setIsWaitingForPause] = useState(false);
    const [manualRenderVersion, setManualRenderVersion] = useState(0);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [hasEditedCode, setHasEditedCode] = useState(false);

    const [isMounted, setIsMounted] = useState(false);

    const min_size = 200;

    const [splitPosition, setSplitPosition] = useState(min_size);
    const mainBodyRef = useRef<HTMLDivElement>(null);
    const renderedImageUrlRef = useRef<string | null>(null);
    const waitingTimeoutRef = useRef<number | null>(null);
    const renderTimeoutRef = useRef<number | null>(null);
    const renderControllerRef = useRef<AbortController | null>(null);
    const runImmediatelyRef = useRef(false);
    const skipNextRenderRef = useRef(false);

    const [splitscreen, setSplitscreen] = useState("top-bottom");

    const thisSRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        const editorReady = (window as WindowWithEditor).editorReady;

        editorReady?.then(() => {
            if (active) setIsEditorReady(true);
        });

        return () => {
            active = false;
        };
    }, []);

    const [renderTimings, setRenderTimings] = useState<{
        startupMs?: number;
        renderMs?: number;
    } | null>(null);

    useEffect(() => {
        if (!scene.trim()) {
            skipNextRenderRef.current = false;
            if (renderedImageUrlRef.current) {
                URL.revokeObjectURL(renderedImageUrlRef.current);
                renderedImageUrlRef.current = null;
            }

            return;
        }

        if (skipNextRenderRef.current) {
            skipNextRenderRef.current = false;
            return;
        }

        const controller = new AbortController();
        renderControllerRef.current = controller;

        runImmediatelyRef.current = false;
        waitingTimeoutRef.current = window.setTimeout(() => {
                waitingTimeoutRef.current = null;
                setIsWaitingForPause(true);
                setIsRendering(true);
            }, 0);
        const timeout = window.setTimeout(async () => {
            renderTimeoutRef.current = null;
            setIsWaitingForPause(false);
            setIsRendering(true);
            setRenderError(null);

            try {
                const {
                    image,
                    startupMs,
                    renderMs,
                } = await getRender(renderMode, scene, controller.signal);
                if (controller.signal.aborted) return;

                const nextImageUrl = URL.createObjectURL(image);
                if (renderedImageUrlRef.current) {
                    URL.revokeObjectURL(renderedImageUrlRef.current);
                }
                renderedImageUrlRef.current = nextImageUrl;
                setRenderedImageUrl(nextImageUrl);
                setRenderedImageDownloadName(getRenderFilename(image));
                setIsRendering(false);

                setRenderTimings({ startupMs, renderMs });
            } catch (error) {
                if (controller.signal.aborted) return;
                const message = error instanceof Error ? error.message : "Could not render the scene.";
                const duration = error instanceof RenderRequestError
                    ? ` · ${Math.round(error.totalMs)} ms`
                    : "";
                setRenderError(`${message}${duration}`);
                setIsRendering(false);
            } finally {
                if (renderControllerRef.current === controller) {
                    renderControllerRef.current = null;
                }
            }
        }, EXECUTION_DELAY_MS);
        renderTimeoutRef.current = timeout;

        return () => {
            if (waitingTimeoutRef.current !== null) {
                window.clearTimeout(waitingTimeoutRef.current);
                waitingTimeoutRef.current = null;
            }
            window.clearTimeout(timeout);
            if (renderTimeoutRef.current === timeout) {
                renderTimeoutRef.current = null;
            }
            controller.abort();
            if (renderControllerRef.current === controller) {
                renderControllerRef.current = null;
            }
        };
    }, [renderMode, scene, manualRenderVersion]);

    useEffect(() => () => {
        if (renderedImageUrlRef.current) {
            URL.revokeObjectURL(renderedImageUrlRef.current);
        }
    }, []);

    const handleCodeChange = (code: string) => {
        setHasEditedCode(true);
        setRenderError(null);
        setIsWaitingForPause(Boolean(code.trim()));
        setIsRendering(Boolean(code.trim()));
        if (!code.trim()) {
            setRenderedImageUrl(null);
            setRenderedImageDownloadName(null);
            if (renderedImageUrlRef.current) {
                URL.revokeObjectURL(renderedImageUrlRef.current);
                renderedImageUrlRef.current = null;
            }
        }
        onCodeChange?.(code);
    };

    const handleRun = () => {
        if (!scene.trim()) return;

        if (isRendering) {
            const hasPendingRequest = renderTimeoutRef.current !== null || renderControllerRef.current !== null;
            if (waitingTimeoutRef.current !== null) {
                window.clearTimeout(waitingTimeoutRef.current);
                waitingTimeoutRef.current = null;
            }
            if (renderTimeoutRef.current !== null) {
                window.clearTimeout(renderTimeoutRef.current);
                renderTimeoutRef.current = null;
            }
            renderControllerRef.current?.abort();
            renderControllerRef.current = null;
            if (!hasPendingRequest) {
                skipNextRenderRef.current = true;
            }
            setIsWaitingForPause(false);
            setIsRendering(false);
            return;
        }

        runImmediatelyRef.current = true;
        setIsWaitingForPause(false);
        setIsRendering(true);
        setManualRenderVersion((version) => version + 1);
    };

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
            setIsSideBySideSupported(window.innerHeight < 580
                ? window.innerWidth >= 380
                : window.innerWidth >= 820
            );
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
                activeSplitscreen === "left-right" && width < 480
            );

            setSLSSWidthSize(width);
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
                        <div className="flex gap-[8px] items-center">
                            <p className="text-label">Execute</p>
                            <ExecutionModeSelect mode={renderMode} onModeChange={onRenderModeChange} />
                        </div>

                        <div className="flex gap-[8px]">
                            <StatusBar
                                startupMs={renderTimings?.startupMs}
                                renderMs={renderTimings?.renderMs}
                                small={isSmallScreen || isSmallLeftSplitScreen}
                                collapse={activeSplitscreen && sLSSWidthSize < 340 || window.innerWidth < 340}
                                isRunning={isRendering}
                                onRun={handleRun}
                            />
                            
                            {isMounted && isSideBySideSupported && activeSplitscreen === "top-bottom" && (
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
                    <EditorScreen onCodeChange={handleCodeChange} />
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

                        <div className="flex gap-[4px]">
                            {isMounted && isSideBySideSupported && activeSplitscreen === "left-right" && (
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
                            {scene.trim() && renderedImageUrl && renderedImageDownloadName && (
                                <div className="status-bar">
                                    <a
                                        className="status status-btn"
                                        href={renderedImageUrl}
                                        download={renderedImageDownloadName}
                                        title={`Download ${renderedImageDownloadName}`}
                                        aria-label={`Download ${renderedImageDownloadName}`}
                                    >
                                        <i className="icon">download</i>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <hr />
                    <RenderScreen
                        imageUrl={scene.trim() ? renderedImageUrl : null}
                        isRendering={!!scene.trim() && isRendering}
                        isWaitingForPause={!!scene.trim() && isWaitingForPause}
                        error={scene.trim() ? renderError : null}
                        showReady={!hasEditedCode && isEditorReady}
                    />
                </div>
            </div>
        </main>
    );
}
