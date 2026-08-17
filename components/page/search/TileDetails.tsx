"use client";

import { useEffect, useRef } from "react";
import { type SelectedSearchResult } from "./SearchResultsGrid";
import "@/components/highlight/macro-highlight-static.js";

type DetailsProps = {
    selected: SelectedSearchResult;
};

export function Details({ selected }: DetailsProps) {
    const macroElementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!("macro" in selected)) return;

        const element = macroElementRef.current;

        if (!element) return;

        window.updateMacroStaticHighlight(element, selected.macro.value);
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

    console.log("macro" in selected ? selected.macro : "");

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
                            <td>Active color</td>
                            <td>{selected.tile.active_color.join(", ")}</td>
                        </tr>
                        <tr>
                            <td>Inactive color</td>
                            <td>
                                {selected.tile.inactive_color
                                    .map((value) => value ?? "none")
                                    .join(", ")}
                            </td>
                        </tr>
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
                                    : "None"}
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
        return (
            <>
                <p className="search-details-macro-name">
                        <span className="macro-brackets">[</span>
                        <span className="macro-name">
                            {displayMacroName(selected.name)}
                        </span>
                        <span className="macro-brackets">]</span>
                </p>

                <hr />

                <p className="search-details-label">{selected.macro.creator}</p>

                <p className="search-details-label">Description</p>
                <div className="search-details-detailbox" id="description">
                    {selected.macro.description}
                </div>

                <p className="search-details-label">Value</p>
                <div
                    ref={macroElementRef}
                    className="search-details-detailbox macro"
                >
                    {selected.macro.value}
                </div>
            </>
        );
    }
}
