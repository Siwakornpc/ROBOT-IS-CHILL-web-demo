"use client";

import { useRef, useState, useCallback, CSSProperties } from "react";

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
}: SliderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef(false);
    const clampedValue = Math.min(Math.max(value, min), max);
    const ratio = (clampedValue - min) / (max - min);
    const hasZero = min < 0 && max > 0;
    const zeroRatio = hasZero ? (0 - min) / (max - min) : 0;

    const updateValueFromPosition = useCallback(
        (clientX: number) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const rawRatio = Math.min(1, Math.max(0, (clientX - rect.left - 6) / (rect.width - 12)));
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
        updateValueFromPosition(e.clientX);
    };
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        updateValueFromPosition(e.clientX);
    };
    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        dragRef.current = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
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
            className={`slider-container ${size} ${className}`}
            style={{...style}}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => dragRef.current = false}
        >{hasZero
            ? clampedValue >= 0
                ? <>
                    <div className="slider-track slider-start-track" style={{ flexGrow: zeroRatio }} />
                    <div className="slider-track slider-mid-track slider-track-filled" style={{ flexGrow: ratio - zeroRatio }} />
                    <div className="slider-thumb" />
                    <div className="slider-track slider-end-track" style={{ flexGrow: 1 - ratio }} />
                </>
                : <>
                    <div className="slider-track slider-start-track" style={{ flexGrow: ratio }} />
                    <div className="slider-thumb" />
                    <div className="slider-track slider-mid-track slider-track-filled" style={{ flexGrow: zeroRatio - ratio }} />
                    <div className="slider-track slider-end-track" style={{ flexGrow: zeroRatio }} />
                </>
            : min >= 0
                ? <>
                    <div className="slider-track slider-start-track slider-track-filled" style={{ flexGrow: ratio }} />
                    <div className="slider-thumb" />
                    <div className="slider-track slider-end-track" style={{ flexGrow: 1 - ratio }} />
                </>
                : <>
                    <div className="slider-track slider-start-track" style={{ flexGrow: ratio }} />
                    <div className="slider-thumb" />
                    <div className="slider-track slider-end-track slider-track-filled" style={{ flexGrow: 1 - ratio }} />
                </>
        }

        {showTicks && ticks.map((tickVal) => {
            const tickRatio = (tickVal - min) / (max - min);
            return (
                <div
                    key={tickVal}
                    className={`slider-tick ${isTickFilled(tickVal) ? "slider-tick-filled" : ""}`}
                    style={{
                        insetInlineStart: `calc(6px + ${tickRatio} * (100% - 12px))`
                    }}
                />
            );
        })}</div>
    );
}