"use client";

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
    xsmall: { thumbHeight: "44px", trackHeight: "16px", trackRadius: "8px" },
    small: { thumbHeight: "44px", trackHeight: "24px", trackRadius: "8px" },
    medium: { trackHeight: "40px", thumbHeight: "52px", trackRadius: "12px" },
    large: { trackHeight: "56px", thumbHeight: "68px", trackRadius: "16px" },
    xlarge: { trackHeight: "96px", thumbHeight: "108px", trackRadius: "28px" },
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

    const hasZero = min < 0 && max > 0;
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

    // Thumb width: 4px default, 2px when pressed
    const thumbWidth = isPressed ? 2 : 4;

    return (
        <div
            ref={containerRef}
            className={`slider-container ${size} ${isPressed ? "pressed" : ""} ${className}`}
            style={{...style}}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                dragRef.current = false;
                setIsPressed(false);
            }}
        >{
            hasZero ?
                ratio >= zeroRatio
                ? <>
                    {/* POSITIVE OR ZERO: [Track 1: min->0] [Track 2: 0->thumb] [Thumb] [Track 3: thumb->max] */}
                    <div
                        className="slider-track slider-start-track"
                        style={{
                            flex: `${zeroRatio} 1 0%`,
                            background: "rgb(var(--md-color-primary))",
                        }}
                    />
                    <div
                        className="slider-track slider-mid-track"
                        style={{
                            flex: `${ratio - zeroRatio} 1 0%`,
                        }}
                    />
                    <div
                        className="slider-thumb"
                        style={{
                            flex: `0 0 ${thumbWidth}px`,
                            width: `${thumbWidth}px`,
                        }}
                    />
                    <div
                        className="slider-track slider-end-track"
                        style={{
                            flex: `${1 - ratio} 1 0%`,
                        }}
                    />
                </>
                : <>
                    {/* NEGATIVE: [Track 1: min->thumb] [Thumb] [Track 2: thumb->0] [Track 3: 0->max] */}
                    <div
                        className="slider-track slider-start-track"
                        style={{
                            flex: `${ratio} 1 0%`,
                        }}
                    />
                    <div
                        className="slider-thumb"
                        style={{
                            flex: `0 0 ${thumbWidth}px`,
                            width: `${thumbWidth}px`,
                        }}
                    />
                    <div
                        className="slider-track slider-mid-track"
                        style={{
                            flex: `${zeroRatio - ratio} 1 0%`,
                            background: "rgb(var(--md-color-primary))",
                        }}
                    />
                    <div
                        className="slider-track slider-end-track"
                        style={{
                            flex: `${1 - zeroRatio} 1 0%`,
                        }}
                    />
                </>
            : <>
                {/* NO ZERO: [Track 1: min->thumb] [Thumb] [Track 2: thumb->max] */}
                <div
                    className="slider-track slider-start-track"
                    style={{
                        flex: `${ratio} 1 0%`,
                        background: "rgb(var(--md-color-primary))",
                    }}
                />
                <div
                    className="slider-thumb"
                    style={{
                        flex: `0 0 ${thumbWidth}px`,
                        width: `${thumbWidth}px`,
                    }}
                />
                <div
                    className="slider-track slider-end-track"
                    style={{
                        flex: `${1 - ratio} 1 0%`,
                    }}
                />
            </>
        }</div>
    );
}