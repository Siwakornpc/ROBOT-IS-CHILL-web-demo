"use client";

import MenuSelect from "@/components/MenuSelect";

const options = [
    {
        value: "tile",
        label: "Tiles",
    },
    {
        value: "macro",
        label: "Macros",
    },
    {
        value: "filter",
        label: "Filters",
    },
    {
        value: "overlay",
        label: "Overlays",
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
            id={"search-type-select"}
            value={value}
            options={options}
            onChange={onChange}
            triggerValue={(selectedOption) => <span className="btn-label">{selectedOption.label}</span>}
            className="btn small btn-filled"
            style={{ zIndex: "1" }}
        />
    );
}