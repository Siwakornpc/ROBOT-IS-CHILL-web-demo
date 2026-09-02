"use client";

// WIP slider component

import { useRef, useState, useCallback, CSSProperties } from "react";

interface SliderProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
    className?: string;
    style?: CSSProperties;
}

export default function Slider({
    value,
    min = 0,
    max = 100,
    step,
    onChange,
    className = "",
    style,
}: SliderProps) {
    const [isPressed, setIsPressed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef(false);

    const clampedValue = Math.min(Math.max(value, min), max);
    const ratio = (clampedValue - min) / (max - min);

    const hasZero = min <= 0 && max >= 0;
    const zeroRatio = hasZero ? (0 - min) / (max - min) : 0;

    const updateValueFromPosition = useCallback(
        (clientX: number) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const rawRatio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
            let rawValue = min + rawRatio * (max - min);

            if (step && step > 0) {
                const steppedValue = Math.round((rawValue - min) / step) * step + min;
                rawValue = Math.min(max, Math.max(min, steppedValue));
            }

            onChange(rawValue);
        },
        [min, max, step, onChange]
    );

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = true;
        setIsPressed(true);
        updateValueFromPosition(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        updateValueFromPosition(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        dragRef.current = false;
        setIsPressed(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // Calculate active fill zones between zero (or edge) and current thumb ratio
    const activeStart = hasZero ? Math.min(zeroRatio, ratio) : 0;
    const activeEnd = Math.max(hasZero ? zeroRatio : 0, ratio);

    const leftTrackWidth = activeStart * 100;
    const middleTrackWidth = Math.abs(activeEnd - activeStart) * 100;
    const rightTrackWidth = (1 - activeEnd) * 100;

    // Thumb width: 4px default, 2px when pressed
    const thumbWidth = isPressed ? 2 : 4;

    return (
        <div
            ref={containerRef}
            className={`slider-container ${isPressed ? "pressed" : ""} ${className}`}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                position: "relative",
                touchAction: "none",
                cursor: "pointer",
                width: "100%",
                height: "24px",
                ...style,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                dragRef.current = false;
                setIsPressed(false);
            }}
        >
            <div
                className="slider-track slider-start-track"
                style={{
                    flex: `0 0 calc(${leftTrackWidth}% - 4px)`,
                    height: "16px",
                    backgroundColor: "rgb(var(--md-color-secondary-container))",
                    borderRadius: "4px",
                }}
            />
            <div
                className="slider-track slider-mid-track"
                style={{
                    flex: `0 0 calc(${middleTrackWidth}% - 4px)`,
                    height: "16px",
                    backgroundColor: "rgb(var(--md-color-primary))",
                    borderRadius: "4px",
                }}
            />
            <div
                className="slider-thumb"
                style={{
                    position: "absolute",
                    left: `${ratio * 100}%`,
                    width: `${thumbWidth}px`,
                    height: "44px",
                    marginInline: "2px",
                    backgroundColor: "rgb(var(--md-color-primary))",
                    borderRadius: "2px",
                    transform: "translateX(-50%)",
                    transition: "width 0.1s ease",
                    pointerEvents: "none",
                }}
            />

            {/* Right Track Part */}
            <div
                className="slider-track slider-end-track"
                style={{
                    flex: `0 0 calc(${rightTrackWidth}% - 4px)`,
                    height: "16px",
                    backgroundColor: "rgb(var(--md-color-secondary-container))",
                    borderRadius: "4px",
                }}
            />
        </div>
    );
}