"use client";

import MenuSelect from "@/components/MenuSelect";

const options = [
    { value: "tiles", label: "Tiles", },
    { value: "macros", label: "Macros", },
    { value: "variants", label: "Variants", },
    { value: "filters", label: "Filters", },
    { value: "levels", label: "Levels", },
    { value: "palettes", label: "Palettes", },
    { value: "overlays", label: "Overlays", },
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
            triggerValue={(selectedOption) => <span>{selectedOption.label}</span>}
            className="btn small btn-filled"
            anchor="et"
            style={{ zIndex: "1" }}
        />
    );
}