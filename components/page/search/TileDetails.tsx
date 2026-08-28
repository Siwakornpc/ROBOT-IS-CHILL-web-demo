"use client";

import React, { useState, useEffect, useRef } from "react";
import { type SelectedSearchResult } from "./SearchResultsGrid";

import { updateMacroStaticHighlight } from "@/components/highlight/macro-highlight-static.js";
import { updateVariantStaticHighlight } from "@/components/highlight/metadata-hightlight.js";
import { updateFlagStaticHighlight } from "@/components/highlight/metadata-hightlight.js";

import { DiscordMarkdown } from "@/components/DiscordMarkdown";
import applyOverflowFade from "@/components/OverflowFade";
import { mapTiling } from "@/image_tiling";
import "@/types/string.extentions";

type DetailsProps = {
    selected: SelectedSearchResult;
};

const getImageSize = (url: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(`${img.naturalWidth} × ${img.naturalHeight}`);
        img.onerror = () => resolve("Error loading size");
    });
};

export function Details({ selected }: DetailsProps) {
    const macroElementRef = useRef<HTMLDivElement>(null);
    const variantElementRef = useRef<HTMLDivElement>(null);
    const flagElementRef = useRef<HTMLDivElement>(null);
    const [tilingFrame, setTilingFrame] = useState(0);
    const [select, setSelect] = useState<string | null>("one_tile");
    console.log(selected);

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
        if (value !== undefined)  setSelect(value)
    }

    // Details for Tiles

    if ("tile" in selected) {
        const tiled = mapTiling(selected.name, selected.tile.tiling);
        const imageMap = tiled.imageMap.flat();
        const indexMap = tiled.indexMap.flat();

        const currentFrame = imageMap[tilingFrame];
        const currentIndex = indexMap[tilingFrame];
        return (<>
            <p className="text-label search-details-name">{selected.name}</p>

            {selected.tile.tiling !== "none"
                ? <><div
                        ref={(el) => applyOverflowFade(el, "x")}
                        className="search-details-image-wrapper ascroll-x"
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
                                                </div> : <span key={j} aria-hidden="true"/>
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
                            ? selected.tile.tags.join(", ").toTitleCase()
                            : "None"}
                        </td>
                    </tr>
                    <tr>
                        <td>Tiling</td>
                        <td>{selected.tile.tiling.toTitleCase()}</td>
                    </tr>
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
                    <span className="macro-name">{selected.name}</span>
                    <span className="macro-brackets">]</span>
                </p>
                {isBuiltin && <p className="search-details-macro-name-builtin-indicator">Built-in</p>}
            </div>

            <div className="search-details-contents-flexbox">
                <hr />

                {selected.macro.creator && <p className="search-details-label">{selected.macro.creator}</p>}

                <p className="search-details-label">Description</p>
                <div className="search-details-detailbox" id="description">
                    <DiscordMarkdown>{selected.macro.description}</DiscordMarkdown>
                </div>

                {!isBuiltin && (<>
                    <p className="search-details-label">Value</p>
                    <div
                        ref={macroElementRef}
                        className="search-details-detailbox macro"
                    >{selected.macro.value}
                    </div>
                </>)}
            </div>
        </>);
    }

    // Details for Filters

    if ("filter" in selected) {
        const [displaySize, setDisplaySize] = useState<string>("Loading...");

        useEffect(() => {
        if (selected?.name) getImageSize(`https://ric-api.sno.mba/filters/${encodeURIComponent(selected.name)}.png`).then(setDisplaySize);
        }, [selected?.name]);

        console.log (selected.filter.upload_time);
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

                {selected.filter.author && <p className="search-details-label">{selected.filter.author}</p>}

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
                <p className={`search-details-variant-name`}>
                    <span className="variant-name">:</span>
                    {selected.name !== "m_syntax_shim"
                        ? 
                        <span className="variant-name name">{selected.name}</span>
                        :
                        <s className="variant-name name">{selected.name}</s>
                    }
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
                    >
                        {selected.variant.syntax}
                    </div>
                </>)}
            </div>
        </>);
    }

    // Details for Variants

    if ("flag" in selected) {
        return (<>
            <div
                ref={(el) => applyOverflowFade(el, "y")}
                className="search-details-flag ascroll-y"
            >
                <p className={`search-details-flag-name`}>
                    <span className="flag-name">--</span>
                    <span className="flag-name name">{selected.name}</span>
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
                >
                    {selected.flag.syntax}
                </div>
            </div>
        </>);
    }
}
