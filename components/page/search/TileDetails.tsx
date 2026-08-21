"use client";

import React, { useState, useEffect, useRef } from "react";
import { type SelectedSearchResult } from "./SearchResultsGrid";
import { updateMacroStaticHighlight } from "@/components/highlight/macro-highlight-static.js";
import { DiscordMarkdown } from "@/components/DiscordMarkdown";
import { applyOverflowFade } from "@/components/OverflowFade";
import { mapTiling } from "@/components/page/search/image_tiling";

type DetailsProps = {
    selected: SelectedSearchResult;
};

export function Details({ selected }: DetailsProps) {
    const macroElementRef = useRef<HTMLDivElement>(null);
    const [tilingFrame, setTilingFrame] = useState(0);
    const [select, setSelect] = useState<string | null>("one_tile");

    // macroElementRef
    useEffect(() => {
        if (!("macro" in selected)) return;

        const element = macroElementRef.current;

        if (!element) return;

        updateMacroStaticHighlight(element, selected.macro.value ? selected.macro.value : "");
    }, [selected]);

    // [tilingFrame, setTilingFrame]
    useEffect(() => {
        if (!("tile" in selected)) return;

        setTilingFrame(0);

        const tiled = mapTiling(selected.name, selected.tile.tiling);
        const imageMap = tiled.imageMap.flat().filter(item => item !== "");

        if (imageMap.length <= 1) return;

        const interval = setInterval(() => {
            setTilingFrame((frame) => (frame + 1) % imageMap.length);
        }, 1200);

        return () => clearInterval(interval);
    }, [selected]);

    // [showTiled, setShowTiled]
    function handleSelect(e: React.MouseEvent<HTMLButtonElement>) {
        const value = e.currentTarget.dataset.tab_action;

        if (value !== undefined) {
            setSelect(value)
        }
    }

    function displayMacroName(name: string): string {
        return Array.from(name)
            .map((char) => {
                const code = char.charCodeAt(0);

                if (code === 0) return "\\0";
                if (code < 0x20 || code === 0x7f) {
                    return `\\x${code.toString(16).padStart(2, "0")}`;
                }

                return char;
            })
            .join("");
    }

    // Details for Tiles

    if ("tile" in selected) {
        const tiled = mapTiling(selected.name, selected.tile.tiling);
        const imageMap = tiled.imageMap.flat();
        const indexMap = tiled.indexMap.flat();

        const currentFrame = imageMap[tilingFrame];
        const currentIndex = indexMap[tilingFrame];

        return (
            <>
                <p className="text-label search-details-name">
                    {selected.name}
                </p>

                {selected.tile.tiling !== "none"
                    ?
                    <>
                        <div
                            ref={(el) => applyOverflowFade(el, "x")}
                            className="search-details-image-wrapper ascroll-x"
                        >
                            {select === "one_tile"
                                ?
                                <div
                                    className="search-details-image-asize"
                                    data-frame={currentIndex}
                                >
                                    <img
                                        alt={selected.name}
                                        className="search-details-image"
                                        src={currentFrame}
                                    />
                                </div>
                                : select === "full_tiling"
                                    ?
                                    <div
                                        className="search-details-image-asize-tiled"
                                    >
                                        <div className="search-details-image-tiled">
                                            {
                                                tiled.imageMap.map((img, i) => (
                                                    <div
                                                        key={i}
                                                        className="search-details-image-row"
                                                    >
                                                        {tiled.indexMap[i].map((index, j) =>
                                                            typeof index === "number" ? (
                                                                <div
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
                                                            ) : (
                                                                <span
                                                                    key={j}
                                                                    aria-hidden="true"
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    : ""
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
                            >
                                One Tile
                            </button>

                            <button
                                type="button"
                                className={`cbtn ${select === "full_tiling" ? "selected" : ""}`}
                                data-tab_action="full_tiling"
                                onClick={handleSelect}
                            >
                                Full Tiling
                            </button>

                        </div>
                    </>
                    :
                    <div className="search-details-image-wrapper">
                        <div
                            className="search-details-image-asize"
                        >
                            <img
                                alt={selected.name}
                                className="search-details-image"
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
                            <td>{selected.name.startsWith("text_") ? (
                                <>Active color</>
                            ) : (
                                <>Color</>
                            )}</td>
                            <td>{selected.tile.active_color.join(", ")}</td>
                        </tr>
                        {selected.name.startsWith("text_") &&
                            selected.tile.inactive_color?.some((value) => value !== null) && (
                                <tr>
                                    <td>Inactive color</td>
                                    <td>
                                        {selected.tile.inactive_color
                                            .filter((value): value is number => value !== null)
                                            .join(", ")}
                                    </td>
                                </tr>
                            )
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
                                    ? selected.tile.tags.join(", ")
                                    : "none"}
                            </td>
                        </tr>
                        <tr>
                            <td>Tiling</td>
                            <td>{selected.tile.tiling}</td>
                        </tr>
                    </tbody>
                </table>
            </>
        );
    }

    // Details for Macros

    if ("macro" in selected) {
        const isBuiltin = selected.macro.builtin ? "builtin" : "";

        return (
            <>
                <div
                    ref={(el) => applyOverflowFade(el, "y")}
                    className="search-details-macro ascroll-y"
                >
                    <p
                        className={`search-details-macro-name ${isBuiltin}`}
                    >
                            <span className="macro-brackets">[</span>
                            <span className="macro-name">
                                {displayMacroName(selected.name)}
                            </span>
                            <span className="macro-brackets">]</span>
                    </p>
                    {isBuiltin && (
                        <p className="search-details-macro-name-builtin-indicator">Built-in</p>
                    )}
                </div>

                <div className="search-details-contents-flexbox">
                    <hr />

                    {selected.macro.creator && (
                        <p className="search-details-label">{selected.macro.creator}</p>
                    )}

                    <p className="search-details-label">Description</p>

                    <div className="search-details-detailbox" id="description">
                        <DiscordMarkdown>
                            {selected.macro.description}
                        </DiscordMarkdown>
                    </div>

                    {!isBuiltin && (
                        <>
                            <p className="search-details-label">Value</p>
                            <div
                                ref={macroElementRef}
                                className="search-details-detailbox macro"
                            >
                                {selected.macro.value}
                            </div>
                        </>
                    )}
                </div>
            </>
        );
    }
}
