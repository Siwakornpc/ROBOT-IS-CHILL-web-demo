"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
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
    ) {
        return;
    }

    event.preventDefault();

    const code = new URLSearchParams(window.location.search).get("code");
    const target = new URL(path, window.location.href);

    if (code !== null) {
        target.searchParams.set("code", code);
    }

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
                ?
                <div className={`screen-blur ${
                    isMenuOpen
                        ? "true"
                        : ""
                }`}
                    onClick={closeMenu}
                >
                
                </div>
                : ""
            }
            <div
                className={`sb-left ${
                    isFlexibleMenu
                        ? "sb-left-fxb"
                        : ""
                } ${
                    isMenuOpen
                        ? "opened"
                        : ""      
                }`}
            >
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
        <div className="sb-right">
            
        </div>
    );
}

export function RightBarSearch({ children }: { children?: ReactNode }) {
    return (
        <div className="sb-right search-details-panel ascroll-y">
            {children}
        </div>
    );
}