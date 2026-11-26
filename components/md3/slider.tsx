"use client";

import { useRef, useCallback, useEffect, useState, CSSProperties } from "react";

type PrecisionFormat = `${"<" | ">" | ""}${number}${"d" | "f"}` | number | null | undefined;

function formatPrecision(value: number, precision: PrecisionFormat): string {
    if (precision == null) return value.toString();
    if (typeof precision === "number") return value.toPrecision(precision);

    const match = precision.match(/^([<>])?(\d+)([df])$/);
    if (!match) {
        const parsed = Number(precision);
        return isNaN(parsed) ? value.toString() : value.toPrecision(parsed);
    }

    const direction = match[1] as "<" | ">" | undefined;
    const count = parseInt(match[2], 10);
    const type = match[3];

    if (type === "d") {
        const fixed = value.toFixed(count);
        if (direction === "<") return Number(fixed).toString();
        return fixed;
    } 
    
    if (type === "f") {
        const precise = value.toPrecision(count);
        if (direction === "<") return Number(precise).toString();
        return precise;
    }

    return value.toString();
}

interface SliderProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    size?: "xsmall" | "small" | "medium" | "large" | "xlarge";
    showTicks?: boolean;
    onChange: (value: number) => void;
    className?: string;
    style?: CSSProperties;
    thumbLabel?: any;
    precision?: PrecisionFormat;
}

export default function Slider({
    value,
    min = 0,
    max = 100,
    step,
    size = "xsmall",
    showTicks = false,
    onChange,
    className = "",
    style,
    precision = "<2d",
    thumbLabel = formatPrecision(value, precision),
}: SliderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.target.getBoundingClientRect().width);
        });
        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    const clampedValue = Math.min(Math.max(value, min), max);
    const range = max - min;
    const ratio = range === 0 ? 0 : (clampedValue - min) / range;
    const sliderWidth = Math.max(0, containerWidth - 12);
    const position = sliderWidth * ratio;
    const zeroPosition = range === 0 ? 0 : -sliderWidth * min / range;
    const thumbGapOffset = isPressed ? 7 : 8;
    const hasZero = min < 0 && max > 0;
    const zeroAtStart = zeroPosition <= 0;
    const zeroAtEnd = zeroPosition >= sliderWidth;
    const leftTrackEnd = Math.max(-6, Math.min(zeroPosition - 2, position - thumbGapOffset));
    const leftFillStart = Math.max(-6, position - thumbGapOffset);
    const leftFillEnd = Math.max(
        -6,
        Math.min(zeroPosition + 2, position - thumbGapOffset)
    );
    const rightFillStart = Math.min(
        6 + sliderWidth,
        Math.max(zeroPosition - 2, position + thumbGapOffset)
    );
    const rightFillEnd = Math.min(6 + sliderWidth, position + thumbGapOffset);
    const rightTrackEnd = Math.min(
        6 + sliderWidth,
        Math.max(zeroPosition + 2, position + thumbGapOffset)
    );

    const trackSegments = [
        ...(zeroAtStart
            ? []
            : [{
                key: "start",
                className: "slider-track slider-start-track",
                start: 0,
                end: leftTrackEnd + 6,
            }]),
        {
            key: "start-fill",
            className: `slider-track ${zeroAtStart ? "slider-start-track" : "slider-mid-track"} slider-track-filled`,
            start: zeroAtStart ? 0 : leftFillStart + 6,
            end: zeroAtStart
                ? Math.max(leftFillStart + 6, leftFillEnd + 6)
                : leftFillEnd + 6,
        },
        {
            key: "end-fill",
            className: `slider-track ${zeroAtEnd ? "slider-end-track" : "slider-mid-track"} slider-track-filled`,
            start: zeroAtEnd
                ? Math.min(rightFillStart + 6, rightFillEnd + 6)
                : rightFillStart + 6,
            end: zeroAtEnd ? containerWidth : rightFillEnd + 6,
        },
        ...(zeroAtEnd
            ? []
            : [{
                key: "end",
                className: "slider-track slider-end-track",
                start: containerWidth,
                end: rightTrackEnd + 6,
            }]),
    ];

    const trackSegmentStyle = (start: number, end: number): CSSProperties => ({
        position: "absolute",
        insetInlineStart: start,
        insetBlockStart: "50%",
        transform: "translateY(-50%)",
        flex: "none",
        width: Math.abs(end - start),
        marginInlineStart: Math.min(0, end - start),
    });

    const updateValueFromPosition = useCallback(
        (clientX: number) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const isRtl = window.getComputedStyle(container).direction === "rtl";

            let rawRatio = rect.width <= 12
                ? 0
                : (clientX - rect.left - 6) / (rect.width - 12);
            if (isRtl) rawRatio = 1 - rawRatio;

            rawRatio = Math.min(1, Math.max(0, rawRatio));
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

    const handlePointerCancel = () => {
        dragRef.current = false;
        setIsPressed(false);
    };

    const ticks: number[] = [];
    if (showTicks && step && step > 0) {
        const count = Math.round((max - min) / step);
        for (let i = 0; i <= count; i++) {
            const val = Number((min + i * step).toFixed(10));
            if (val <= max) ticks.push(val);
        }
    }

    const isTickFilled = (tickVal: number) => {
        if (hasZero) {
            if (clampedValue >= 0)
                return tickVal >= 0 && tickVal <= clampedValue;
            else
                return tickVal >= clampedValue && tickVal <= 0;
        } else if (min >= 0) {
            return tickVal <= clampedValue;
        } else {
            return tickVal >= clampedValue;
        }
    };

    return (
        <div
            ref={containerRef}
            className={`slider-container ${size} ${isPressed ? "is-pressed" : ""} ${className}`}
            style={{
                display: "flex",
                alignItems: "center", 
                position: "relative",
                "--slider-thumb-label": `"${thumbLabel}"`,
                ...style
            } as CSSProperties}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handlePointerCancel}
        >
            {trackSegments.map(({ key, className: segmentClassName, start, end }) => (
                <div
                    key={key}
                    className={segmentClassName}
                    style={trackSegmentStyle(start, end)}
                />
            ))}
            <div
                className="slider-handle"
                style={{
                    position: "absolute",
                    insetInlineStart: position + 6,
                    insetBlockStart: 0,
                    height: "100%",
                    flex: "none",
                }}
            />

            {showTicks && ticks.map((tickVal) => {
                const tickRatio = range === 0 ? 0 : (tickVal - min) / range;
                const tickPosition = sliderWidth * tickRatio;
                if (
                    Math.abs(tickPosition - position) < 10 ||
                    Math.abs(tickPosition - zeroPosition) < 4
                ) return null;

                const filled = isTickFilled(tickVal);
                return (
                    <div
                        key={tickVal}
                        style={{
                            position: "absolute",
                            insetInlineStart: `calc(6px + ${tickRatio} * (100% - 12px))`,
                            zIndex: 2,
                            pointerEvents: "none",
                        }}
                    ><div className={`slider-tick ${filled ? "slider-tick-filled" : ""}`} />
                    </div>
                );
            })}
        </div>
    );
}