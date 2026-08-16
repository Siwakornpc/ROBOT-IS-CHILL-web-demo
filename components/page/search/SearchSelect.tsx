"use client";

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

export type SearchMode = (typeof options)[number]["value"];

export default function SearchSelect({
    value,
    onChange,
}: {
    value: SearchMode;
    onChange: (value: SearchMode) => void;
}) {
    return (
        <MenuSelect
            title="Search Filters"
            value={value}
            options={options}
            onChange={onChange}
            className="menu-select"
        />
    );
}
