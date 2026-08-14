"use client";

import { useEffect, useRef, useState } from "react";

const modes = [
    {
        value: "=t",
        label: "=t",
        title: "Render Tiles",
        description: "Render as Tiles"
    },
    {
        value: "=r",
        label: "=r",
        title: "Render Texts",
        description: "Render as Texts"
    },
] as const;

export default function ExecutionModeSelect() {
    const [mode, setMode] = useState("=t");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.executionMode = mode;
        window.dispatchEvent(new Event("executionmodechange"));
    }, [mode]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedMode = modes.find((item) => item.value === mode) ?? modes[0];

    return (
        <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
            <button
                type="button"
                className={`kill-styling execution-mode-select ${isOpen ? "clicked" : ""}`}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                =<span className="emph">{(selectedMode.label).replace(/^=(.*)/, "$1")}</span>
            </button>

            <div className={`menu execution-mode-select-options ${isOpen ? "visible" : ""}`}>
                <div className="menu-title">
                    Execution Mode
                </div>
                {modes.map((item) => (
                    <div
                        key={item.value}
                        onClick={() => {
                            setMode(item.value);
                            setIsOpen(false);
                        }}
                        className="menu-option"
                    >
                        <div className="menu-option-icon">
                            =<span className="emph">{(item.label).replace(/^=(.*)/, "$1")}</span>
                        </div>
                        <div>
                            <div className="menu-option-label">{item.title}</div>
                            <div className="menu-option-desc">{item.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
