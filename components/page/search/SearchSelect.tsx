"use client";

import MenuSelect from "@/components/MenuSelect";

const options = [
    { value: "tiles", label: "Tiles", },
    { value: "macros", label: "Macros", },
    { value: "filters", label: "Filters", },
    { value: "variants", label: "Variants", },
    { value: "flags", label: "Flags", },
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
            className="btn small btn-filled"
            anchor="et"
            style={{ zIndex: "1" }}
        />
    );
}