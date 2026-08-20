"use client";

import { useEffect, useRef } from "react";
import { type SelectedSearchResult } from "./SearchResultsGrid";
import "@/components/highlight/macro-highlight-static.js";
import { DiscordMarkdown } from "@/components/DiscordMarkdown";
import { applyOverflowFade } from "@/components/OverflowFade";

type DetailsProps = {
    selected: SelectedSearchResult;
};

export function Details({ selected }: DetailsProps) {
    const macroElementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!("macro" in selected)) return;

        const element = macroElementRef.current;

        if (!element) return;

        window.updateMacroStaticHighlight(element, selected.macro.value ? selected.macro.value : "");
    }, [selected]);

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
    
    const TILINGS = {
        none: [0],
        directional: [0, 8, 16, 24],
        tiling: [
            [ 0,  1,  5,  4],
            [ 8,  9, 13, 12],
            [10, 11, 15, 14],
            [ 2,  3,  7,  6],
        ],
        diagonal_tiling: [
            [ 0,  1,  5,  4, 23, 36, 27, 19, 25, 40, 43, ""],
            [ 8,  9, 13, 12, 35, 44, 45, 28, 34, 42, 26, 39],
            [10, 11, 15, 14, 18, 41, 33, 22, 38, 46, 31, 30],
            [ 2,  3,  7,  6, 29, 17, 21, 37, 16, 24, 20, 32],
        ],
        character: [
            [ 0,  1,  2,  3,  7],
            [ 8,  9, 10, 11, 15],
            [16, 17, 18, 19, 23],
            [24, 25, 26, 27, 31],
        ]
    } as const;

    type TilingName = keyof typeof TILINGS;

    function mapTiling(
        name: string,
        tiling: TilingName | TilingName[]
    ): string[] | string[][] {
        if (Array.isArray(tiling)) {
            return tiling.map((item) => mapTiling(name, item)) as string[] | string[][];
        }

        const mapped = TILINGS[tiling];

        return mapped.map(
            (map) => `https://ric-api.sno.mba/tiles/${name}.gif${map !== 0 ? `?frame=${map}` : ""}`
        );
    }

    if ("tile" in selected) {
        return (
            <>
                <p className="text-label search-details-name">
                    {selected.name}
                </p>

                <div className="search-details-image-wrapper">
                    <img
                        alt={selected.name}
                        className="search-details-image"
                        src={`https://ric-api.sno.mba/tiles/${encodeURIComponent(selected.name)}.gif`}
                    />
                </div>

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
