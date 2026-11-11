"use client";

import React, { useState, useEffect, useRef } from "react";
import { type SelectedSearchResult } from "./SearchResultsGrid";

import { updateMacroStaticHighlight } from "@/components/highlight/macro-highlight-static.js";
import { updateVariantStaticHighlight } from "@/components/highlight/metadata-hightlight.js";
import { updateFlagStaticHighlight } from "@/components/highlight/metadata-hightlight.js";

import { DiscordMarkdown } from "@/components/DiscordMarkdown";
import applyOverflowFade from "@/components/OverflowFade";
import { mapTiling } from "@/image_tiling";
import { DEFAULT_PALETTE } from "@/components/PaletteColorPicker";
import "@/types/string.extentions";
import { DiscordUser } from '../../DiscordUser';

type DetailsProps = {
    selected: SelectedSearchResult;
    allResults?: SelectedSearchResult[];
};

type PaletteColorData = {
    x: number;
    y: number;
    color: string | null;
};

const getImageSize = (url: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(`${img.naturalWidth} × ${img.naturalHeight}`);
        img.onerror = () => resolve("Error loading size");
    });
};

function getContrastColor(hex: string | null) {
    if (!hex) return;
    hex = hex.replace("#", "");

    const fullHex = hex.length === 3 
        ? hex.split('').map(char => char + char).join('') 
        : hex;

    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? "black" : "";
}

export function Details({ selected, allResults }: DetailsProps) {
    const macroElementRef = useRef<HTMLDivElement>(null);
    const variantElementRef = useRef<HTMLDivElement>(null);
    const flagElementRef = useRef<HTMLDivElement>(null);
    const [tilingFrame, setTilingFrame] = useState(0);
    const [customFrames, setCustomFrames] = useState<number[]>([]);
    const [select, setSelect] = useState<string | null>("one_tile");
    const [displaySize, setDisplaySize] = useState<string>("Loading...");

    const [getPaletteColorData, setPaletteColorData] = useState<PaletteColorData | null>();
    const [copiedPalette, setCopiedPalette] = useState<{ x: number; y: number } | null>(null);
    const paletteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isCopiedMobileRef = useRef(false);
    const isThisPaletteColorStillOnTouch = useRef(false);

    const [copiedValue, setCopiedValue] = useState<string | null>(null);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isCopiedValueRef = useRef(false);
    const [paletteColorSelectionValue, setPaletteColorSelectionValue] = useState("hex");

    const thisColorElementRef = useRef<HTMLDivElement | null>(null);
    const thisColorPositionRef = useRef({
        x: 0,
        y: 0,
    });

    const thisColorPointerPositionRef = useRef({
        x: 0,
        y: 0,
    });

    const [longPressedColor, setLongPressedColor] = useState<{ x: number; y: number } | null>(null);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdStartRef = useRef<{ x: number; y: number } | null>(null);
    const isPaletteHoldActiveRef = useRef(false);

    const handleCopyPalette = async (text: string, x: number, y: number) => {
        try {
            await navigator.clipboard.writeText(text);
            if (paletteTimeoutRef.current) clearTimeout(paletteTimeoutRef.current);
            setCopiedPalette({ x, y });

            paletteTimeoutRef.current = setTimeout(() => {
                setCopiedPalette(null);
                paletteTimeoutRef.current = null;
            }, 1500);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const handleCopyPaletteMobileOnPointerDown = (event: React.PointerEvent<HTMLDivElement>, i: number, j: number, color: string | null) => {
        if (!thisColorElementRef.current || thisColorElementRef.current !== event.currentTarget) {
            thisColorElementRef.current = event.currentTarget;
        }

        if (!event.currentTarget) return;

        isCopiedMobileRef.current = false;
        isThisPaletteColorStillOnTouch.current = false;
        isPaletteHoldActiveRef.current = false;
        setPaletteColorSelectionValue("hex");

        if (color == null) {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            if (paletteTimeoutRef.current) clearTimeout(paletteTimeoutRef.current);
            holdTimerRef.current = null;
            paletteTimeoutRef.current = null;
            holdStartRef.current = null;
            setLongPressedColor(null);
            return;
        }

        if (paletteTimeoutRef.current) clearTimeout(paletteTimeoutRef.current);
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

        const tcp_rect = event.currentTarget.getBoundingClientRect();

        thisColorPointerPositionRef.current = {
            x: event.clientX,
            y: event.clientY,
        };
        thisColorPositionRef.current = {
            x: tcp_rect.left + tcp_rect.width / 2,
            y: tcp_rect.top + tcp_rect.height / 2,
        };
        holdStartRef.current = {
            x: event.clientX,
            y: event.clientY,
        };

        paletteTimeoutRef.current = setTimeout(() => {
            isThisPaletteColorStillOnTouch.current = true;
            isPaletteHoldActiveRef.current = true;
            setLongPressedColor({ x: j, y: i });
        }, 1000);

        holdTimerRef.current = setTimeout(() => {
            if (holdStartRef.current) {
                setLongPressedColor({ x: j, y: i });
            }
        }, 1000);

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleCopyPaletteMobileOnPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const start = holdStartRef.current;
        if (!start) return;

        if (!isPaletteHoldActiveRef.current) {
            const dx = Math.abs(event.clientX - start.x);
            const dy = Math.abs(event.clientY - start.y);

            if (dx > 12 || dy > 12) {
                if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                if (paletteTimeoutRef.current) clearTimeout(paletteTimeoutRef.current);
                holdTimerRef.current = null;
                paletteTimeoutRef.current = null;
                holdStartRef.current = null;
                isPaletteHoldActiveRef.current = false;
                setLongPressedColor(null);
                setPaletteColorSelectionValue("hex");
                return;
            }

            return;
        }

        thisColorPointerPositionRef.current = {
            x: event.clientX,
            y: event.clientY,
        };

        setPaletteColorSelectionValue(
            thisColorPointerPositionRef.current.y >= thisColorPositionRef.current.y + 40 ? "rgb" : "hex"
        );
    };

    const handleCopyPaletteMobileOnPointerUp = async (text: string | null, x: number, y: number) => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (paletteTimeoutRef.current) {
            clearTimeout(paletteTimeoutRef.current);
            paletteTimeoutRef.current = null;
        }

        setCopiedPalette(null);
        setLongPressedColor(null);
        holdStartRef.current = null;
        isPaletteHoldActiveRef.current = false;

        if (isThisPaletteColorStillOnTouch.current) {
            try {
                if (text) {
                    await navigator.clipboard.writeText(text);
                    isCopiedMobileRef.current = true;
                    setCopiedPalette({ x, y });
                }
            } catch (err) {
                console.error("Failed to copy text: ", err);
            } finally {
                paletteTimeoutRef.current = setTimeout(() => {
                    setCopiedPalette(null);
                    paletteTimeoutRef.current = null;
                }, 1500);

                isThisPaletteColorStillOnTouch.current = false;
                setPaletteColorSelectionValue("hex");
            }
        }
    };

    const handleCopyValue = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            setCopiedValue(text);

            copyTimeoutRef.current = setTimeout(() => {
                setCopiedValue(null);
                copyTimeoutRef.current = null;
            }, 1500);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
        
    }

    // syntaxes
    useEffect(() => {
        if (!("macro" in selected)) return;

        const element = macroElementRef.current;
        if (!element) return;

        updateMacroStaticHighlight(element, selected.macro.value ? selected.macro.value : "");
    }, [selected]);

    useEffect(() => {
        if (!("variant" in selected)) return;

        const element = variantElementRef.current;
        if (!element) return;

        updateVariantStaticHighlight(
            element,
            selected.variant.syntax ?? ""
        );
    }, [selected]);

    useEffect(() => {
        if (!("flag" in selected)) return;

        const element = flagElementRef.current;
        if (!element) return;

        updateFlagStaticHighlight(
            element,
            selected.flag.syntax ?? ""
        );
    }, [selected]);

    // [customFrames, setCustomFrames]
    useEffect(() => {
        setCustomFrames([]);
        if (!("tile" in selected) || selected.tile.tiling !== "custom") return;

        const spriteName = selected.tile.sprite[0];
        const tomlUrl = `https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/data/custom/${spriteName}.toml`;
        let cancelled = false;

        async function loadCustomFrames() {
            const response = await fetch(tomlUrl);
            if (!response.ok) throw new Error(`TOML fetch failed: ${response.status}`);

            const tomlText = await response.text();

            if (!cancelled) {
                const spriteKey = selected.name; // Replace if the TOML key uses a different field.
                const escapeRegExp = (value: string) =>
                    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                const regexp = new RegExp(
                    `^\\s*${escapeRegExp(spriteKey)}\\s*=\\s*\\{[^}]*?\\bextra_frames\\s*=\\s*\\[([^\\]]*)\\]`,
                    "m"
                );

                const frameList = tomlText.match(regexp)?.[1];
                const frames = frameList
                    ? frameList.split(",").map(value => Number(value.trim())).filter(Number.isInteger)
                    : [];

                setCustomFrames(frames);
            }
        }

        void loadCustomFrames().catch(console.error);

        return () => {
            cancelled = true;
        };
    }, [selected]);

    // [tilingFrame, setTilingFrame]
    useEffect(() => {
        if (!("tile" in selected)) return;
        setTilingFrame(0);

        const tiled = mapTiling(selected.name, selected.tile.tiling, customFrames);
        const imageMap = tiled.imageMap.flat().filter(item => item !== "");
        if (imageMap.length <= 1) return;

        const interval = setInterval(() => setTilingFrame((frame) => (frame + 1) % imageMap.length), 1200);
        return () => clearInterval(interval);
    }, [selected, customFrames]);

    // [showTiled, setShowTiled]
    function handleSelect(e: React.MouseEvent<HTMLButtonElement>) {
        const value = e.currentTarget.dataset.tab_action;
        if (value !== undefined)  setSelect(value)
    }

    // [isPaletteColorHover, setPaletteColorHover]
    function handlePaletteOnHover(data: PaletteColorData | null = null) {
        setPaletteColorData(data);
    }

    function hexToRgb(hex: string | null) {
        if (!hex) return;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : null;
    }

    // [displaySize, setDisplaySize]
    useEffect(() => {
        if ("filter" in selected) {
            getImageSize(
                `https://ric-api.sno.mba/filters/${encodeURIComponent(selected.name)}.png`
            ).then(setDisplaySize);
        } else if ("overlay" in selected) {
            getImageSize(
                `https://raw.githubusercontent.com/ROBOT-IS-CHILL/robot-is-chill/main/data/overlays/${selected.name}.png`
            ).then(setDisplaySize);
        } else {
            setDisplaySize("Loading...");
        }
    }, [selected]);

    // Discord Emojis

    const resolveDiscordEmojis = (text: string) => {
        const parts = text.split(/(<a?:\w+:\d+>)/g);

        return parts.map((part, index) => {
            const match = part.match(/^<(a?):(\w+):(\d+)>$/);

            if (!match) {
                return part;
            }

            const [, animated, name, id] = match;

            return (
                <span key={id} className="discord-markdown">
                    <img
                        key={index}
                        src={`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`}
                        alt={`:${name}:`}
                        draggable={false}
                        className="discord-emoji discord-custom-emoji"
                    />
                </span>
            );
        });
    };


    // Details for Tiles

    if ("tile" in selected) {
        const tiled = mapTiling(selected.name, selected.tile.tiling, customFrames);
        const imageMap = tiled.imageMap.flat().filter(item => item !== "");
        const indexMap = tiled.indexMap.flat().filter((item): item is number => typeof item === "number");

        const currentFrame = imageMap[tilingFrame];
        const currentIndex = indexMap[tilingFrame];

        function getColorByValue(targetValue: [number | null, number | null]): string | undefined {
            const match = DEFAULT_PALETTE.find(
                (item) => item.value[0] === targetValue[0] && item.value[1] === targetValue[1]
            );
            return match?.color;
        }

        const aliases = (allResults || [])
            .filter(
                (item): item is SelectedSearchResult & { tile: typeof selected.tile } =>
                    "tile" in item &&
                    item.name !== selected.name &&
                    item.tile.sprite[0] === selected.tile.sprite[0] &&
                    item.tile.sprite[1] === selected.tile.sprite[1]
            )
            .map((item) => item.name);

        return (<>
            <p className="text-label search-details-name">{selected.name}</p>

            {selected.tile.tiling !== "none"
                ? <>
                    <div
                        // ref={(el) => applyOverflowFade(el, "x")}
                        className="search-details-image-wrapper ascroll-x ascroll-y"
                    >
                        {select === "one_tile"
                            ? <div className="search-details-image-asize" data-frame={currentIndex}>
                                <img
                                    alt={selected.name}
                                    className="search-details-image"
                                    src={currentFrame}
                                />
                            </div>
                            : select === "full_tiling"
                            ? <div className="search-details-image-asize-tiled">
                                <div className="search-details-image-tiled">
                                    {tiled.imageMap.map((img, i) => (
                                        <div key={i} className="search-details-image-row">
                                            {tiled.indexMap[i].map((index, j) =>
                                                typeof index === "number"
                                                ? <div
                                                    key={j}
                                                    className="tiling-index-label"
                                                    data-frame-tiled={index}
                                                >
                                                    <img
                                                        key={j}
                                                        alt={`${selected.name}-frame-${index}`}
                                                        src={img[j]}
                                                    />
                                                </div>
                                                : <span key={j} aria-hidden="true"/>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div> : ""
                        }
                    </div>
                    <div
                        className="cbtn-group small"
                        style={{marginBottom: "12px"}}
                    >
                        <button
                            type="button"
                            className={`cbtn ${select === "one_tile" ? "selected" : ""}`}
                            data-tab_action="one_tile"
                            onClick={handleSelect}
                        >One Tile
                        </button>

                        <button
                            type="button"
                            className={`cbtn ${select === "full_tiling" ? "selected" : ""}`}
                            data-tab_action="full_tiling"
                            onClick={handleSelect}
                        >Full Tiling
                        </button>
                    </div>
                </>
                : <div className="search-details-image-wrapper">
                    <div className="search-details-image-asize">
                        <img
                            alt={selected.name}
                            className={`search-details-image${selected.name === "bab_therealbabdictator" ? "-e" : ""}`}
                            src={`https://ric-api.sno.mba/tiles/${selected.name}.gif`}
                        />
                    </div>
                </div>
            }

            <hr />

            <table>
                <tbody>
                    <tr>
                        <th className="table-description">Description</th>
                        <th>Label</th>
                    </tr>
                    <tr>
                        <td>{selected.name.startsWith("text_") ? "Active color" : "Color"}</td>
                        <td>
                            <div>
                                <div
                                    className="palette-color-display"
                                    style={{ "--this-palette-color": getColorByValue(selected.tile.active_color) } as React.CSSProperties}    
                                />
                                {selected.tile.active_color.join(", ")}
                            </div>
                        </td>
                    </tr>
                    {selected.name.startsWith("text_") &&
                    selected.tile.inactive_color?.some((value) => value !== null) &&
                        <tr>
                            <td>Inactive color</td>
                            <td>
                                <div>
                                    <div
                                        className="palette-color-display"
                                        style={{ "--this-palette-color": getColorByValue(selected.tile.inactive_color) } as React.CSSProperties}    
                                    />
                                    {selected.tile.inactive_color
                                        .filter((value): value is number => value !== null)
                                        .join(", ")}
                                </div>
                            </td>
                        </tr>
                    }
                    <tr>
                        <td>Source</td>
                        <td>{selected.tile.sprite[0]}</td>
                    </tr>
                    <tr>
                        <td>Sprite</td>
                        <td>{selected.tile.sprite[1]}</td>
                    </tr>
                    <tr>
                        <td>Tags</td>
                        <td>
                            {selected.tile.tags.length
                                ? selected.tile.tags.map(tag => tag.split("_").map(word => word.toTitleCase()).join(" ")).join(", ")
                                : "None"}
                        </td>
                    </tr>
                    <tr>
                        <td>Tiling</td>
                        <td>{selected.tile.tiling.split("_").map(word => word.toTitleCase()).join(" ")}</td>
                    </tr>
                    {aliases.length > 0 &&
                        <tr>
                            <td>Aliases</td>
                            <td>{aliases.join(", ")}</td>
                        </tr>
                    }
                    {selected.tile.tiling === "custom" && (
                        <tr>
                            <td>Extra Frames</td>
                            <td>{customFrames.join(", ")}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>);
    }

    // Details for Macros

    if ("macro" in selected) {
        const isBuiltin = selected.macro.builtin ? "builtin" : "";

        return (<>
            <div
                ref={(el) => applyOverflowFade(el, "y")}
                className="search-details-macro ascroll-y"
            >
                <p className={`search-details-macro-name ${isBuiltin}`}>
                    <span className="macro-brackets">[</span>
                    <span className="macro-name">{resolveDiscordEmojis(selected.name)}</span>
                    <span className="macro-brackets">]</span>
                </p>
                {isBuiltin && <p className="search-details-macro-name-builtin-indicator">Built-in</p>}
            </div>

            <div className="search-details-contents-flexbox">
                <hr />

                {selected.macro.creator && <DiscordUser id={selected.macro.creator} />}

                <div className="flex justify-between">
                    <p className="search-details-label">Description</p>
                    <button
                        className="btn ibtn xsmall btn-tonal wide"
                        onClick={() => {
                            if (selected.macro.description) {
                                void handleCopyValue(selected.macro.description);
                            }
                        }}
                    ><i className="icon">{copiedValue !== selected.macro.description ? "content_copy" : "check"}</i>
                    </button>
                </div>

                <div className="search-details-detailbox" id="description">
                    <DiscordMarkdown>{selected.macro.description}</DiscordMarkdown>
                </div>

                {!isBuiltin
                    ? <>
                        <div className="flex justify-between">
                            <p className="search-details-label">Value</p>
                            <button
                                className="btn ibtn xsmall btn-tonal wide"
                                onClick={() => {
                                    if (selected.macro.value) {
                                        void handleCopyValue(selected.macro.value);
                                    }
                                }}
                            ><i className="icon">{copiedValue !== selected.macro.value ? "content_copy" : "check"}</i>
                            </button>
                        </div>
                        <div
                            ref={macroElementRef}
                            className="search-details-detailbox macro"
                        >{selected.macro.value}
                        </div>
                    </>
                    : <span className="discord-markdown">
                        <a href="" target="_blank" rel="noopener noreferrer">
                            <span className="discord-text-part">Learn More</span>{/*they don't do anything yet*/}
                        </a>
                    </span>
                }
            </div>
        </>);
    }

    // Details for Filters

    if ("filter" in selected) {
        return (<>
            <p className="text-label search-details-name">{selected.name}</p>
            
            <div className="search-details-image-wrapper">
                <div className="search-details-image-asize">
                    <img
                        alt={selected.name}
                        className="search-details-image"
                        src={`https://ric-api.sno.mba/filters/${encodeURIComponent(selected.name)}.png`}
                    />
                </div>
            </div>

            <div className="search-details-contents-flexbox">
                <hr />

                {selected.filter.author && <DiscordUser id={selected.filter.author} />}

                <table>
                    <tbody>
                        <tr>
                            <th className="table-description">Description</th>
                            <th>Label</th>
                        </tr>
                        <tr>
                            <td>Target Mode</td>
                            <td>{selected.filter.absolute ? "Absolute" : "Relative"}</td>
                        </tr>
                        <tr>
                            <td>Upload Time</td>
                            <td>{selected.filter.upload_time
                                ? new Date(selected.filter.upload_time).toLocaleString()
                                : "Date not recorded"
                            }</td>
                        </tr>
                        <tr>
                            <td>Size</td>
                            <td>{displaySize}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>);
    }

    // Details for Variants

    if ("variant" in selected) {
        return (<>
            <div
                ref={(el) => applyOverflowFade(el, "y")}
                className="search-details-variant ascroll-y"
            >
                <p className="search-details-variant-name variant-name">
                    :{selected.name !== "m_syntax_shim" ? <span>{selected.name}</span> : <s>{selected.name}</s>}
                </p>
            </div>

            <div className="search-details-contents-flexbox">
                <hr />

                <p className="search-details-label">Description</p>
                <div className="search-details-detailbox" id="description">
                    <DiscordMarkdown>{selected.variant.description}</DiscordMarkdown>
                </div>
            
                <p className="search-details-label">Applied</p>
                <div className="search-details-detailbox" id="description">
                    <DiscordMarkdown>{selected.variant.applied}</DiscordMarkdown>
                </div>

                {selected.variant.syntax && (<>
                    <p className="search-details-label">Syntax</p>
                    <div
                        ref={variantElementRef}
                        className="search-details-detailbox variant" id="description"
                    >{selected.variant.syntax}
                    </div>
                </>)}
            </div>
        </>);
    }

    // Details for Flags

    if ("flag" in selected) {
        return (<>
            <div
                ref={(el) => applyOverflowFade(el, "y")}
                className="search-details-flag ascroll-y"
            >
                <p className="search-details-flag-name flag-name">
                    --<span>{selected.name}</span>
                </p>
            </div>

            <div className="search-details-contents-flexbox">
                <hr />

                <p className="search-details-label">Description</p>
                <div className="search-details-detailbox" id="description">
                    <DiscordMarkdown>{selected.flag.description}</DiscordMarkdown>
                </div>
            
                <p className="search-details-label">Syntax</p>
                <div
                    ref={flagElementRef}
                    className="search-details-detailbox flag" id="description"
                >{selected.flag.syntax}
                </div>
            </div>
        </>);
    }

    // Details for Palettes

    if ("palette" in selected) {
        const normalizedName = selected.name.replace(/^[^:]+:/, "");
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const getRgbPaletteColorData = getPaletteColorData ? hexToRgb(getPaletteColorData.color) : null;

        return (<>
            <p className="text-label search-details-name">
                {normalizedName}
                <span className="search-details-subname">{` (${selected.palette.source})`}</span>
            </p>

            <div className="search-details-palette-wrapper ascroll-x ascroll-y">
                <div className="search-details-palette-wrapper-asize">
                    <div className="search-details-palette-element">
                        {selected.palette.colors.map((row, i) =>
                            <div
                                key={`palette-${selected.name}-row-${i}`}
                                className="search-details-palette-these-colors-row"
                            > 
                                {row.map((color, j) => <>
                                    <div
                                        key={`palette-${selected.name}-row-${i}-column-${j}-color-${color}`}
                                        className="search-details-palette-this-color"
                                        {...!isMobile
                                            ? {
                                                onClick: (event: React.MouseEvent<HTMLDivElement>) => {
                                                    if (!color) return;

                                                    const rgb = hexToRgb(color);
                                                    const text = event.ctrlKey && rgb
                                                        ? `${rgb.r}, ${rgb.g}, ${rgb.b}`
                                                        : color;

                                                    void handleCopyPalette(text, j, i);
                                                },
                                            }
                                            : {
                                                onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
                                                    handleCopyPaletteMobileOnPointerDown(event, i, j, color)
                                                },
                                                onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
                                                    handleCopyPaletteMobileOnPointerMove(event)
                                                },
                                                onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
                                                    const rgb = hexToRgb(color);
                                                    const text = color && paletteColorSelectionValue === "rgb" && rgb
                                                        ? `${rgb.r}, ${rgb.g}, ${rgb.b}`
                                                        : color;

                                                    void handleCopyPaletteMobileOnPointerUp(text ?? null, j, i);
                                                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                                        event.currentTarget.releasePointerCapture(event.pointerId);
                                                    }
                                                },
                                            }
                                        }
                                    >
                                        {isMobile &&
                                            <div
                                                className={`${color ?? "hidden"} search-details-palette-this-color-switch ${
                                                    longPressedColor?.x === j && longPressedColor.y === i ? "ison" : ""
                                                } ${paletteColorSelectionValue}`}
                                                style={{
                                                    "--this-palette-color": color,
                                                    position: "absolute",
                                                    inset: 0,
                                                    zIndex: 0,
                                                    "--switch-contrast": getContrastColor(color)
                                                } as React.CSSProperties}
                                            >
                                                <span className="palette-index-label">rgb</span>
                                            </div>
                                        }
                                        <div className="this-color"
                                            style={{ "--this-palette-color": color } as React.CSSProperties}
                                        >
                                            <span
                                                className={`palette-index-label ${copiedPalette?.x === j && copiedPalette?.y === i ? "copied" : ""}`}
                                                style={{ "--contrast": getContrastColor(color), marginTop: (i >= 10) || (j >= 10) ? "0" : "" } as React.CSSProperties}
                                                {...!isMobile
                                                    ? {
                                                        onMouseEnter: () => handlePaletteOnHover({ x: j, y: i, color }),
                                                        onMouseLeave: () => handlePaletteOnHover(),
                                                    }
                                                    : {
                                                        onPointerDown: () => handlePaletteOnHover({ x: j, y: i, color }),
                                                    }
                                                }
                                            >
                                                {longPressedColor?.x === j && longPressedColor.y === i
                                                    ? "hex"
                                                    : !color
                                                        ? ""
                                                        : copiedPalette?.x === j && copiedPalette?.y === i
                                                        ? ""
                                                        : (i >= 10) || (j >= 10)
                                                        ? <>
                                                            <span className="index-x">{j}</span>
                                                            <div className="index-sep" />
                                                            <span className="index-y">{i}</span>
                                                        </>
                                                        : `${j},${i}`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </>)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <hr />

            <table>
                <tbody>
                    <tr>
                        <th className="table-description">Description</th>
                        <th colSpan={2}>Label</th>
                    </tr>
                    <tr>
                        <td>Source</td>
                        <td colSpan={2}>{selected.palette.source}</td>
                    </tr>
                    <tr>
                        <td rowSpan={selected.palette.colors.flat().length + 2}>Colors</td>
                        <td>Index</td>
                        <td>Hex Code</td>
                    </tr>
                    {
                        <tr>
                            {getPaletteColorData
                                ? <>
                                    <td className="before">
                                        <div>
                                            <div
                                                className="palette-color-display"
                                                style={{ "--this-palette-color": getPaletteColorData.color } as React.CSSProperties}    
                                            />
                                            {`${getPaletteColorData.x}, ${getPaletteColorData.y}`}
                                        </div>
                                    </td>
                                    <td className="discord-markdown before">
                                        <code className="discord-inline-code">{getPaletteColorData.color?.toUpperCase() ?? "None"}</code><br/>
                                        { getRgbPaletteColorData
                                            ? <>
                                                <code className="discord-inline-code inline-block! w-[2.4rem]! text-center">{getRgbPaletteColorData.r}</code>
                                                <code className="discord-inline-code inline-block! w-[2.4rem]! text-center">{getRgbPaletteColorData.g}</code>
                                                <code className="discord-inline-code inline-block! w-[2.4rem]! text-center">{getRgbPaletteColorData.b}</code>
                                            </> : "None"
                                        }
                                    </td>
                                </>
                                : <td
                                    colSpan={2}
                                    className="placeholder"
                                > {!isMobile
                                    ? <>Hover to see the current color.<br/>
                                        Click to copy the Hex of the current color,<br/>
                                        Ctrl + Click to copy the RGB of the current color.</>
                                    : <>Tap on the color to see the current color.<br/>
                                        Tap and hold on the color to copy the current color.</>
                                }
                                </td>
                            }
                        </tr>
                    }
                    {selected.palette.colors.map((row, index) =>
                        row.map((color, jndex) => 
                            <tr key={`palette-${selected.name}-color-${jndex}-${index}`}>
                                <td>
                                    <div>
                                        <div
                                            className="palette-color-display"
                                            style={{ "--this-palette-color": color } as React.CSSProperties}    
                                        />
                                        {`${jndex}, ${index}`}
                                    </div>
                                </td>
                                <td className="discord-markdown">
                                    <code className="discord-inline-code">{color?.toUpperCase() ?? "None"}</code>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </>);
    }

    if ("overlay" in selected) {
        return (<>
            <p className="text-label search-details-name">{selected.name}</p>

            <div className="search-details-overlay-wrapper">
                <div className="search-details-image-asize">
                    <img
                        alt={selected.name}
                        className="search-details-image"
                        src={selected.overlay.url}
                    />
                </div>
            </div>

            <hr />

            <table>
                <tbody>
                    <tr>
                        <th className="table-description">Description</th>
                        <th>Label</th>
                    </tr>
                    <tr>
                        <td>Size</td>
                        <td>{displaySize}</td>
                    </tr>
                </tbody>
            </table>

            <div className="search-details-contents-flexbox">
                <div className="search-details-detailbox placeholder" id="description">
                    <p>This is an overlay called "{selected.name}", which do not have any author or date recorded in the actual source.</p>
                    <p>The only source that has been converted into a data in a form of JSON Object is:</p>
                    <span className="discord-markdown">
                        <pre className="discord-code-block">
                            <code>{
`{
    "${selected.name}": {
        "url": ${selected.overlay.url}
    }
}`
                            }</code>
                        </pre>
                    </span>
                </div>
            </div>
        </>);
    }
}
