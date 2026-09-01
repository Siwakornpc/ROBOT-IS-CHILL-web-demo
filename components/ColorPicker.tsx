"use client";

import { useEffect, useRef, useState } from "react";


function hsvToHex(h: number, s: number, v: number): string {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
        r = c;
        g = x;
    } else if (h < 120) {
        r = x;
        g = c;
    } else if (h < 180) {
        g = c;
        b = x;
    } else if (h < 240) {
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    return (
        "#" + [r, g, b].map((channel) =>
            Math.round((channel + m) * 255)
                .toString(16)
                .padStart(2, "0")
        ).join("")
    );
}

function hexToHsv(hex: string): [number, number, number] | null {
    const match = hex.match(/^#([0-9a-f]{6})$/i);
    if (!match) return null;

    const r = parseInt(match[1].slice(0, 2), 16) / 255;
    const g = parseInt(match[1].slice(2, 4), 16) / 255;
    const b = parseInt(match[1].slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;

    if (delta !== 0) {
        if (max === r) {
            h = 60 * (((g - b) / delta) % 6);
        } else if (max === g) {
            h = 60 * ((b - r) / delta + 2);
        } else {
            h = 60 * ((r - g) / delta + 4);
        }
    }

    if (h < 0) h += 360;

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return [h, s, v];
}

function hexToRgb(hex: string): [number, number, number] | null {
    const match = hex.match(/^#([0-9a-f]{6})$/i);
    if (!match) return null;

    return [
        parseInt(match[1].slice(0, 2), 16),
        parseInt(match[1].slice(2, 4), 16),
        parseInt(match[1].slice(4, 6), 16),
    ];
}

export function ColorPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (color: string) => void;
}) {
    const [color, setColor] = useState(value || "#ffffff");
    const [position, setPosition] = useState<[number, number]>([1, 0]);
    const [hue, setHue] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);

    const updateColorFromHex = (newColor: string) => {
        setColor(newColor);
        onChange(newColor);

        const hsv = hexToHsv(newColor);
        if (!hsv) return;

        const [h, s, v] = hsv;
        setHue(h);
        setPosition([s, 1 - v]);
    };

    const rgb = hexToRgb(color);

    useEffect(() => {
        const newColor = value || "#ffffff";
        setColor(newColor);
        if (newColor.toLowerCase() === "null") return;

        const hsv = hexToHsv(newColor);
        if (!hsv) return;

        const [h, s, v] = hsv;
        setHue(h);
        setPosition([s, 1 - v]);
    }, [value]);

    const updateColorFromPosition = (clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
        setPosition([x, y]);

        const saturation = x;
        const brightness = 1 - y;

        const newColor = hsvToHex(
            hue,
            saturation,
            brightness
        );

        setColor(newColor);
        onChange(newColor);
    };

    return (
        <div className="color-picker">
            <div
                ref={containerRef}
                className="color-picker-container"
                style={{
                    "--color-picker-hue": hue,
                    "--color-picker-alpha": 1,
                } as React.CSSProperties}
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    updateColorFromPosition(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        updateColorFromPosition(e.clientX, e.clientY);
                    }
                }}
            >
                <div
                    className="color-picker-thumb"
                    style={{
                        left: `${position[0] * 100}%`,
                        top: `${position[1] * 100}%`,
                        background: `${color}`,
                    }}
                />
            </div>

            <div className="color-picker-panel">
                <label className="text-field small has-placeholder">
                    <input
                        type="text"
                        value={color}
                        onChange={(e) => updateColorFromHex(e.target.value)}
                        autoComplete="off"
                        className="text-center"
                        placeholder="#ffffff"
                    />
                </label>

                <div className="color-picker-rgb">
                    <label className="text-field small has-placeholder">
                        <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb?.[0] ?? ""}
                            placeholder="255"
                        />
                    </label>

                    <label className="text-field small has-placeholder">
                        <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb?.[1] ?? ""}
                            placeholder="255"
                        />
                    </label>

                    <label className="text-field small has-placeholder">
                        <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb?.[2] ?? ""}
                            placeholder="255"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}

export default ColorPicker;