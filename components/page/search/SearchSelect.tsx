"use client";

import { useEffect, useState } from "react";
import MenuSelect from "../../MenuSelect";

const modes = [
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
        value: "overlays",
        title: "Overlays",
    },
] as const;

type Selects = (typeof modes)[number]["value"];

export default function SearchSelect() {
    const [mode, setMode] = useState<Selects>("tile");

    useEffect(() => {
        (window as any).selection = mode;
        window.dispatchEvent(new Event("executionmodechange"));
    }, [mode]);

    return (
        <MenuSelect
            title="Search Filters"
            value={mode}
            options={modes}
            onChange={setMode}
            className="menu-select"
        />
    );
}