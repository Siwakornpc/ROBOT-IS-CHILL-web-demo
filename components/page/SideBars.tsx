"use client";

function navigateWithCode(event: React.MouseEvent<HTMLAnchorElement>, path: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
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
    return (
        <div className="sb-left">
            <a
                href="../macrosia"
                className="nav-btn"
                aria-label="Macrosia"
                onClick={(e) => navigateWithCode(e, "/macrosia")}
            >
                <i className="icon custom">macrosia</i>
            </a>
            <a
                href="../render"
                className="nav-btn"
                aria-label="Render"
                onClick={(e) => navigateWithCode(e, "/render")}
            >
                <i className="icon custom">render</i>
            </a>
            <a
                href="../search"
                className="nav-btn"
                aria-label="Search"
                onClick={(e) => navigateWithCode(e, "/search")}
            >
                <i className="icon">search</i>
            </a>
            <a
                href="../settings"
                className="nav-btn"
                aria-label="Settings"
                onClick={(e) => navigateWithCode(e, "/settings")}
            >
                <i className="icon">settings</i>
            </a>
        </div>
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

import { type ReactNode } from "react";