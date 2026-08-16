export function LeftBar() {
    return (
        <div className="sb-left">
            <a href="../macrosia" className="nav-btn" aria-label="Macrosia">
                <div className="icon custom">macrosia</div>
            </a>
            <a href="../render" className="nav-btn" aria-label="Render">
                <div className="icon custom">render</div>
            </a>
            <a href="../search" className="nav-btn" aria-label="Search">
                <div className="icon">search</div>
            </a>
            <a href="../settings" className="nav-btn" aria-label="Settings">
                <div className="icon">settings</div>
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
        <div className="sb-right search-details-panel">
            {children}
        </div>
    );
}
import { type ReactNode } from "react";
