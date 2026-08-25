"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState, useRef } from "react";
import { useMenu } from "@/components/MenuContext";

function navigateWithCode(
    event: React.MouseEvent<HTMLAnchorElement>,
    path: string
) {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) {return}

    event.preventDefault();

    const code = new URLSearchParams(window.location.search).get("code");
    const target = new URL(path, window.location.href);

    if (code !== null) target.searchParams.set("code", code);

    window.location.href = target.toString();
}

export function LeftBar() {
    const { isMenuOpen, closeMenu } = useMenu();
    const [isFlexibleMenu, setIsFlexibleMenu] = useState(false);

    useEffect(() => {
        function handleResize() {
            setIsFlexibleMenu(window.innerWidth < 700);
        }

        // Set initial state
        handleResize();

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <>
            {isFlexibleMenu
                ? <div className={`screen-blur ${isMenuOpen ? "true" : ""}`} onClick={closeMenu}></div>
                : ""
            }
            <div className={`sb-left ${isFlexibleMenu ? "sb-left-fxb" : ""} ${isMenuOpen ? "opened" : ""}`}>
                <Link
                    href="../macrosia"
                    className="nav-btn has-tooltip"
                    aria-label="Macrosia"
                    onClick={(e) => navigateWithCode(e, "/macrosia")}
                >
                    <i className="icon custom">macrosia</i>
                    <span className="nav-btn-label">Macrosia</span>
                </Link>

                <Link
                    href="../render"
                    className="nav-btn has-tooltip"
                    aria-label="Render"
                    onClick={(e) => navigateWithCode(e, "/render")}
                >
                    <i className="icon custom">render</i>
                    <span className="nav-btn-label">Render</span>
                </Link>

                <Link
                    href="../search"
                    className="nav-btn has-tooltip"
                    aria-label="Search"
                    onClick={(e) => navigateWithCode(e, "/search")}
                >
                    <i className="icon">search</i>
                    <span className="nav-btn-label">Search</span>
                </Link>

                <Link
                    href="../settings"
                    className="nav-btn has-tooltip"
                    aria-label="Settings"
                    onClick={(e) => navigateWithCode(e, "/settings")}
                >
                    <i className="icon">settings</i>
                    <span className="nav-btn-label">Settings</span>
                </Link>
            </div>
        </>
    );
}

export function RightBar() {
    return (
        <div className="sb-right"></div>
    );
}

export function RightBarSearch({children}: {children?: ReactNode}) {
    const panelRef = useRef<HTMLDivElement>(null);

    const [isFlexibleMenu, setIsFlexibleMenu] = useState(false);
    const height = window.innerHeight - 56 - 120;

    const [sheetOffset, setSheetOffset] = useState(height);
    const [viewHeight, setViewHeight] = useState(height);

    const dragStartY = useRef(0);
    const dragStartOffset = useRef(0);
    const isDragging = useRef(false);

    useEffect(() => {
        function handleResize() {
            setIsFlexibleMenu(window.innerWidth <= 1096);

            if (viewHeight < height) setViewHeight(height);
            if (sheetOffset > height) setSheetOffset(height);
        }

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (!isFlexibleMenu) return;

        dragStartY.current = event.clientY;
        dragStartOffset.current = sheetOffset;
        isDragging.current = true;

        event.currentTarget.setPointerCapture(event.pointerId);

        if (panelRef.current) panelRef.current.style.transition = "border-radius 0.2s ease";
    }

    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (!isDragging.current) return;

        const deltaY = event.clientY - dragStartY.current;
        const newOffset = dragStartOffset.current + deltaY;
        const clampedOffset = Math.min(viewHeight, Math.max(0, newOffset));

        setSheetOffset(clampedOffset);
    }

    function handlePointerUp() {
        if (!isDragging.current) return;

        isDragging.current = false;

        const upMidpoint = viewHeight * 0.75;
        const downMidpoint = viewHeight * 0.25;

        const draggedUp = sheetOffset < dragStartOffset.current;

        const draggedDown = sheetOffset > dragStartOffset.current;

        let target;

        if (draggedUp) target = sheetOffset < upMidpoint ? 0 : viewHeight;
        else if (draggedDown) target = sheetOffset > downMidpoint ? viewHeight : 0;
        else target = dragStartOffset.current;

        if (panelRef.current) panelRef.current.style.transition = "transform 0.2s ease, border-radius 0.2s ease";

        setSheetOffset(target);
    }

    return (
        <div
            ref={panelRef}
            className={`sb-right ${isFlexibleMenu ? "sb-right-fxb" : ""} search-details-panel ascroll-y ${sheetOffset === 0 ? "to-top" : ""}`}
            style={{"--sheet-offset": `${sheetOffset}px`} as React.CSSProperties}
        >
            {isFlexibleMenu && (
                <div
                    className="search-details-drag-handle"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <div className="drag-handle-hitbox">
                        <div className="drag-handle" />
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}