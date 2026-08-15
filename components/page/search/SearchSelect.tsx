"use client";

import { useEffect, useState } from "react";
import MenuSelect from "@/components/MenuSelect";

const options = [
    {
        value: "tile",
        title: "Tiles",
    },
    {
        value: "macro",
        title: "Macros",
    },
    {
        value: "filter",
        title: "Filters",
    },
    {
        value: "overlay",
        title: "Overlays",
    },
] as const;

type Selects = (typeof options)[number]["value"];

export default function SearchSelect() {
    const [mode, setMode] = useState<Selects>("tile");

    //useEffect(() => {
    //    (window as any).executionMode = mode;
    //    window.dispatchEvent(new Event("executionmodechange"));
    //}, [mode]);

    return (
        <MenuSelect
            title="Search Filters"
            value={mode}
            options={options}
            onChange={setMode}
            className="menu-select"
        />
    );
}