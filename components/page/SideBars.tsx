export function LeftBar() {
    return (
        <div className="sb-left">
            <a href="../macrosia" className="nav-btn" aria-label="Macrosia">
                <i className="icon custom">macrosia</i>
            </a>
            <a href="../render" className="nav-btn" aria-label="Render">
                <i className="icon custom">render</i>
            </a>
            <a href="../search" className="nav-btn" aria-label="Search">
                <i className="icon">search</i>
            </a>
            <a href="../settings" className="nav-btn" aria-label="Settings">
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
