"use client";

import { useEffect, useRef, useState } from "react";

const modes = [
    { value: "=m", label: "=m x" },
    { value: "=t", label: "=t" },
    { value: "=r", label: "=r" },
] as const;

export default function ExecutionModeSelect() {
    const [mode, setMode] = useState("=m");
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
                {selectedMode.label}
            </button>

            <div
                className={`execution-mode-select-options ${
                    isOpen ? "visible" : ""
                }`}
            >
                {modes.map((item) => (
                    <div
                        key={item.value}
                        onClick={() => {
                            setMode(item.value);
                            setIsOpen(false);
                        }}
                        className="execution-mode-select-options-labels"
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
