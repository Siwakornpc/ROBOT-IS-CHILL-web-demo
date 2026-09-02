"use client";

// WIP slider component

import { useRef, useState, useCallback, CSSProperties } from "react";

interface SliderProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    size?: "xsmall" | "small" | "medium" | "large" | "xlarge";
    onChange: (value: number) => void;
    className?: string;
    style?: CSSProperties;
}

const SIZES = {
    xsmall: { trackHeight: "16px", thumbHeight: "44px" },
    small: { trackHeight: "24px", thumbHeight: "44px" },
    medium: { trackHeight: "40px", thumbHeight: "52px" },
    large: { trackHeight: "56px", thumbHeight: "68px" },
    xlarge: { trackHeight: "96px", thumbHeight: "108px" },
};

export default function Slider({
    value,
    min = 0,
    max = 100,
    step,
    size = "xsmall",
    onChange,
    className = "",
    style,
}: SliderProps) {
    const [isPressed, setIsPressed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef(false);

    const currentSize = SIZES[size] || SIZES.xsmall;

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

    // Calculate proportions for the 3 track segments relative to zero and thumb ratio
    let leftRatio = 0;
    let midRatio = 0;
    let rightRatio = 0;
    let leftColor = "rgb(var(--md-color-secondary-container))";
    let midColor = "rgb(var(--md-color-primary))";
    let rightColor = "rgb(var(--md-color-secondary-container))";

    if (hasZero) {
        if (ratio >= zeroRatio) {
            leftRatio = zeroRatio;
            leftColor = "rgb(var(--md-color-secondary-container))";
            midRatio = ratio - zeroRatio;
            midColor = "rgb(var(--md-color-primary))";
            rightRatio = 1 - ratio;
            rightColor = "rgb(var(--md-color-secondary-container))";
        } else {
            leftRatio = ratio;
            leftColor = "rgb(var(--md-color-secondary-container))";
            midRatio = zeroRatio - ratio;
            midColor = "rgb(var(--md-color-primary))";
            rightRatio = 1 - zeroRatio;
            rightColor = "rgb(var(--md-color-secondary-container))";
        }
    } else {
        leftRatio = ratio;
        leftColor = "rgb(var(--md-color-primary))";
        midRatio = 0;
        rightRatio = 1 - ratio;
        rightColor = "rgb(var(--md-color-secondary-container))";
    }

    // Thumb width: 4px default, 2px when pressed
    const thumbWidth = isPressed ? 2 : 4;

    return (
        <div
            ref={containerRef}
            className={`slider-container ${size} ${isPressed ? "pressed" : ""} ${className}`}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                position: "relative",
                touchAction: "none",
                cursor: "pointer",
                width: "100%",
                height: currentSize.trackHeight,
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
                    display: leftRatio === 0 ? "none" : undefined,
                    flex: `${leftRatio} 1 0%`,
                    height: currentSize.trackHeight,
                    backgroundColor: leftColor,
                    borderRadius: "2px",
                }}
            />
            <div
                className="slider-track slider-mid-track"
                style={{
                    display: midRatio === 0 ? "none" : undefined,
                    flex: `${midRatio} 1 0%`,
                    height: currentSize.trackHeight,
                    backgroundColor: midColor,
                    borderRadius: "2px",
                }}
            />

            <div
                className="slider-thumb"
                style={{
                    flex: `0 0 ${thumbWidth}px`,
                    width: `${thumbWidth}px`,
                    height: currentSize.thumbHeight,
                    marginInline: "2px",
                    backgroundColor: "rgb(var(--md-color-primary))",
                    borderRadius: "2px",
                    transition: "width 0.1s ease",
                    pointerEvents: "none",
                    alignSelf: "center",
                }}
            />

            <div
                className="slider-track slider-end-track"
                style={{
                    display: rightRatio === 0 ? "none" : undefined,
                    flex: `${rightRatio} 1 0%`,
                    height: currentSize.trackHeight,
                    backgroundColor: rightColor,
                    borderRadius: "2px",
                }}
            />
        </div>
    );
}