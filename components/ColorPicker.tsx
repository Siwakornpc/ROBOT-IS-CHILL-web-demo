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
        "#" +
        [r, g, b]
            .map((channel) =>
                Math.round((channel + m) * 255)
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("")
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

export default function ColorPicker({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (color: string | null) => void;
}) {
    const [color, setColor] = useState(value ?? "#ffffff");

    const [position, setPosition] =
        useState<[number, number]>([1, 0]);

    const [thumbPosition, setThumbPosition] =
        useState<[number, number]>([1, 0]);

    const [hue, setHue] = useState(0);
    const [hueThumbPosition, setHueThumbPosition] =
        useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const hueSliderRef = useRef<HTMLDivElement>(null);

    const hexInputRef = useRef<HTMLInputElement>(null);
    const hexValueRef = useRef(value === null ? "None" : color);

    const dragRef = useRef(false);
    const hueDragRef = useRef(false);

    /*
     * Keep the latest local values in refs so pointer handlers
     * never have to wait for React state to update.
     */
    const colorRef = useRef(color);
    const positionRef = useRef(position);
    const hueRef = useRef(hue);

    /*
     * The color that should be committed to the parent when
     * the current interaction finishes.
     */
    const pendingColorRef = useRef<string | null>(null);

    const frameRef = useRef<number | null>(null);
    const pendingPointRef =
        useRef<[number, number] | null>(null);

    const updateLocalColor = (
        newColor: string,
        newPosition: [number, number],
        newHue: number
    ) => {
        colorRef.current = newColor;
        positionRef.current = newPosition;
        hueRef.current = newHue;

        setColor(newColor);
        setPosition(newPosition);
        setThumbPosition(newPosition);
        setHue(newHue);
    };

    /*
     * Parent → picker synchronization.
     *
     * This also synchronizes the HEX input through its ref.
     */
    useEffect(() => {
        if (value === null) {
            hexValueRef.current = "None";

            if (hexInputRef.current) {
                hexInputRef.current.value = "None";
            }

            return;
        }

        const newColor = value || "#ffffff";

        hexValueRef.current = newColor;

        if (hexInputRef.current) {
            hexInputRef.current.value = newColor;
        }

        if (dragRef.current || hueDragRef.current) {
            return;
        }

        const hsv = hexToHsv(newColor);

        if (!hsv) return;

        const [incomingHue, saturation, brightness] = hsv;

        /*
         * Grayscale has no meaningful hue.
         * Keep the currently selected hue.
         */
        const nextHue =
            saturation === 0
                ? hueRef.current
                : incomingHue;

        const newPosition: [number, number] = [
            saturation,
            1 - brightness,
        ];

        if (colorRef.current !== newColor) {
            colorRef.current = newColor;
            setColor(newColor);
        }

        positionRef.current = newPosition;
        setPosition(newPosition);
        setThumbPosition(newPosition);

        hueRef.current = nextHue;
        setHue(nextHue);

        if (saturation !== 0) {
            setHueThumbPosition(nextHue / 360);
        }
    }, [value]);

    const commitColor = () => {
        const pendingColor = pendingColorRef.current;

        if (pendingColor !== null) {
            pendingColorRef.current = null;
            onChange(pendingColor);
        }
    };

    const updateColorFromHex = (newColor: string) => {
        hexValueRef.current = newColor;

        setColor(newColor);
        colorRef.current = newColor;

        const hsv = hexToHsv(newColor);

        if (!hsv) {
            onChange(newColor);
            return;
        }

        const [incomingHue, saturation, brightness] = hsv;

        const nextHue =
            saturation === 0
                ? hueRef.current
                : incomingHue;

        const newPosition: [number, number] = [
            saturation,
            1 - brightness,
        ];

        positionRef.current = newPosition;
        hueRef.current = nextHue;

        setPosition(newPosition);
        setThumbPosition(newPosition);
        setHue(nextHue);

        onChange(newColor);

        if (saturation !== 0) {
            setHueThumbPosition(nextHue / 360);
        }
    };

    const updateColorFromRgb = (
        channel: 0 | 1 | 2,
        inputValue: string
    ) => {
        if (inputValue === "") return;

        const currentRgb =
            hexToRgb(colorRef.current) ?? [
                255,
                255,
                255,
            ];

        const channelValue = Math.min(
            255,
            Math.max(0, Number(inputValue))
        );

        if (!Number.isFinite(channelValue)) return;

        const newRgb: [number, number, number] = [...currentRgb];

        newRgb[channel] = channelValue;

        const newColor = "#" + newRgb
            .map((channel) =>
                channel
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("");

        const hsv = hexToHsv(newColor);

        if (!hsv) return;

        const [incomingHue, saturation, brightness] = hsv;

        const nextHue =
            saturation === 0
                ? hueRef.current
                : incomingHue;

        const newPosition: [number, number] = [
            saturation,
            1 - brightness,
        ];

        colorRef.current = newColor;
        positionRef.current = newPosition;
        hueRef.current = nextHue;
        hexValueRef.current = newColor;

        setColor(newColor);
        setPosition(newPosition);
        setThumbPosition(newPosition);
        setHue(nextHue);

        if (hexInputRef.current) {
            hexInputRef.current.value = newColor;
        }

        onChange(newColor);

        if (saturation !== 0) {
            setHueThumbPosition(nextHue / 360);
        }
    };

    const updateColorFromPosition = (
        clientX: number,
        clientY: number
    ) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();

        const x = Math.min(
            1,
            Math.max(
                0,
                (clientX - rect.left) / rect.width
            )
        );

        const y = Math.min(
            1,
            Math.max(
                0,
                (clientY - rect.top) / rect.height
            )
        );

        pendingPointRef.current = [x, y];

        if (frameRef.current !== null) return;

        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;

            const point = pendingPointRef.current;
            if (!point) return;

            const [x, y] = point;

            const saturation = x;
            const brightness = 1 - y;

            const newColor = hsvToHex(
                hueRef.current,
                saturation,
                brightness
            );

            const newPosition: [number, number] = [x, y];

            colorRef.current = newColor;
            positionRef.current = newPosition;
            hexValueRef.current = newColor;

            setColor(newColor);
            setPosition(newPosition);
            setThumbPosition(newPosition);

            if (hexInputRef.current) {
                hexInputRef.current.value = newColor;
            }

            pendingColorRef.current = newColor;
        });
    };

    const updateHueFromPosition = (clientX: number) => {
        const slider = hueSliderRef.current;
        if (!slider) return;

        const rect = slider.getBoundingClientRect();

        const x = Math.min(
            1,
            Math.max(
                0,
                (clientX - rect.left) / rect.width
            )
        );

        const newHue = x * 360;

        const [saturation, y] =
            positionRef.current;

        const brightness = 1 - y;

        const newColor = hsvToHex(
            newHue,
            saturation,
            brightness
        );

        hueRef.current = newHue;
        colorRef.current = newColor;
        hexValueRef.current = newColor;

        setHueThumbPosition(x);
        setHue(newHue);
        setColor(newColor);

        if (hexInputRef.current) {
            hexInputRef.current.value = newColor;
        }

        pendingColorRef.current = newColor;
    };

    const handleColorPointerUp = (
        e: React.PointerEvent<HTMLDivElement>
    ) => {
        dragRef.current = false;

        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(
                e.pointerId
            );
        }

        commitColor();
    };

    const handleHuePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        hueDragRef.current = false;

        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        commitColor();
    };

    const rgb = hexToRgb(color);

    const handleNone = () => {
        /*
         * Local input state.
         */
        hexValueRef.current = "None";

        /*
         * Update the actual input immediately.
         */
        if (hexInputRef.current) {
            hexInputRef.current.value = "None";
        }

        /*
         * Parent state.
         */
        onChange(null);
    };

    return (
        <div className="color-picker">
            <div
                ref={containerRef}
                className="color-picker-container"
                style={
                    {
                        "--color-picker-hue": hue,
                        "--color-picker-alpha": 1,
                        "--color-picker-primary": color,
                    } as React.CSSProperties
                }
                onPointerDown={(e) => {
                    if (e.button !== 0) return;

                    e.currentTarget.setPointerCapture(e.pointerId);

                    dragRef.current = true;

                    updateColorFromPosition(
                        e.clientX,
                        e.clientY
                    );
                }}
                onPointerMove={(e) => {
                    if (!dragRef.current) return;

                    updateColorFromPosition(
                        e.clientX,
                        e.clientY
                    );
                }}
                onPointerUp={handleColorPointerUp}
                onPointerCancel={() => {
                    dragRef.current = false;
                    pendingColorRef.current = null;
                }}
            >
                <div
                    className="color-picker-thumb"
                    style={{
                        left: `${thumbPosition[0] * 100}%`,
                        top: `${thumbPosition[1] * 100}%`,
                        background: color,
                    }}
                />
            </div>

            <div className="color-picker-panel">
                <div
                    ref={hueSliderRef}
                    className="color-picker-hue-slider"
                    onPointerDown={(e) => {
                        if (e.button !== 0) return;

                        e.currentTarget.setPointerCapture(e.pointerId);

                        hueDragRef.current = true;

                        updateHueFromPosition(e.clientX);
                    }}
                    onPointerMove={(e) => {
                        if (!hueDragRef.current) return;

                        updateHueFromPosition( e.clientX);
                    }}
                    onPointerUp={handleHuePointerUp}
                    onPointerCancel={() => {
                        hueDragRef.current = false;
                        pendingColorRef.current = null;
                    }}
                >
                    <div
                        className="color-picker-hue-slider-thumb"
                        style={{
                            left: `calc(${hueThumbPosition * 100}% - 1px)`,
                        }}
                    />
                </div>

                <label className="text-field small has-placeholder">
                    <input
                        ref={hexInputRef}
                        type="text"
                        defaultValue={
                            value === null
                                ? "None"
                                : color
                        }
                        onFocus={(e) => {
                            if (value === null) {
                                hexValueRef.current = "#000000";
                                e.currentTarget.value = "#000000";

                                updateColorFromHex("#000000");
                                requestAnimationFrame(() => e.currentTarget.select());
                                return;
                            }

                            e.currentTarget.select();
                        }}
                        onBlur={() => {
                            /*
                             * Parent remains the source of truth.
                             * If the current value is None, restore it.
                             */
                            if (value === null) {
                                hexValueRef.current = "None";

                                if (hexInputRef.current) {
                                    hexInputRef.current.value =
                                        "None";
                                }
                            }
                        }}
                        onChange={(e) => {
                            const input = e.currentTarget;
                            const newValue = input.value;

                            hexValueRef.current = newValue;

                            if (newValue === "") {
                                updateColorFromHex("#000000");

                                requestAnimationFrame(() => {
                                    input.setSelectionRange(
                                        input.value.length,
                                        input.value.length
                                    );
                                });

                                return;
                            }

                            updateColorFromHex(newValue);
                        }}
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
                            onChange={(e) =>
                                updateColorFromRgb(0, e.target.value)
                            }
                        />
                    </label>

                    <label className="text-field small has-placeholder">
                        <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb?.[1] ?? ""}
                            placeholder="255"
                            onChange={(e) =>
                                updateColorFromRgb(1, e.target.value)
                            }
                        />
                    </label>

                    <label className="text-field small has-placeholder">
                        <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb?.[2] ?? ""}
                            placeholder="255"
                            onChange={(e) =>
                                updateColorFromRgb(2, e.target.value)
                            }
                        />
                    </label>
                </div>

                <button
                    type="button"
                    className={`btn small btn-filled !w-full !justify-center${
                        value === null ? " active" : ""
                    }`}
                    onClick={handleNone}
                >
                    None
                </button>
            </div>
        </div>
    );
}