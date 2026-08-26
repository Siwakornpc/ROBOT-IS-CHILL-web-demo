export type SwatchItem = {
    label?: string;
    color: string;
    value: [number, number];
};

export const DEFAULT_PALETTE: SwatchItem[] = [
    { color: "#242424", value: [0, 0] },
    { color: "#737373", value: [0, 1] },
    { color: "#c3c3c3", value: [0, 2] },
    { color: "#ffffff", value: [0, 3], label: "white" },
    { color: "#080808", value: [0, 4] },
    { color: "#15181f", value: [1, 0] },
    { color: "#293141", value: [1, 1] },
    { color: "#3e7688", value: [1, 2], label: "teal" },
    { color: "#5f9dd1", value: [1, 3] },
    { color: "#83c8e5", value: [1, 4] },
    { color: "#421910", value: [2, 0] },
    { color: "#82261c", value: [2, 1] },
    { color: "#e5533b", value: [2, 2], label: "red" },
    { color: "#e49950", value: [2, 3], label: "orange" },
    { color: "#ede285", value: [2, 4] },
    { color: "#603981", value: [3, 0] },
    { color: "#8e5e9c", value: [3, 1] },
    { color: "#4759b1", value: [3, 2], label: "blue" },
    { color: "#557ae0", value: [3, 3] },
    { color: "#ffbd47", value: [3, 4] },
    { color: "#682e4c", value: [4, 0] },
    { color: "#d9396a", value: [4, 1], label: "pink" },
    { color: "#eb91ca", value: [4, 2], label: "rosy" },
    { color: "#294891", value: [4, 3] },
    { color: "#73abf3", value: [4, 4] },
    { color: "#303824", value: [5, 0] },
    { color: "#4b5c1c", value: [5, 1] },
    { color: "#5c8339", value: [5, 2], label: "green" },
    { color: "#a5b13f", value: [5, 3], label: "lime" },
    { color: "#b6d340", value: [5, 4] },
    { color: "#503f24", value: [6, 0] },
    { color: "#90673e", value: [6, 1] },
    { color: "#c29e46", value: [6, 2] },
    { color: "#362e22", value: [6, 3] },
    { color: "#0b0b0e", value: [6, 4] },
];

type SingleSelectProps = {
    multiple?: false;
    selectedColor: [number, number] | null;
    onChange: (color: [number, number] | null) => void;
    palette?: SwatchItem[];
};

type MultiSelectProps = {
    multiple: true;
    selectedColor: [number, number][];
    onChange: (colors: [number, number][]) => void;
    palette?: SwatchItem[];
};

type PaletteColorPickerProps = SingleSelectProps | MultiSelectProps;

export default function PaletteColorPicker(props: PaletteColorPickerProps) {
    const { palette = DEFAULT_PALETTE } = props;

    const maxColumn = palette.length > 0 ? Math.max(...palette.map((i) => i.value[0])) + 1 : 1;
    const maxRow = palette.length > 0 ? Math.max(...palette.map((i) => i.value[1])) + 1 : 1;

    const isMatch = (A: [number, number], B: [number, number]) => A[0] === B[0] && A[1] === B[1];

    return (
        <div className="palette-color-picker-container">
            <div
                className="color-grid"
                style={{
                    "--columns": maxColumn,
                    "--rows": maxRow,
                } as React.CSSProperties}
            >
                {palette.map((item) => {
                    const isSelected =
                        props.multiple ? (props.selectedColor ?? []).some((c) => isMatch(c, item.value))
                        : props.selectedColor ? isMatch(props.selectedColor, item.value)
                        : false;

                    const handleClick = () => {
                        if (props.multiple) {
                            const current = props.selectedColor ?? [];
                            const exists = current.some((c) => isMatch(c, item.value));
                            if (exists) {
                                props.onChange(current.filter((c) => !isMatch(c, item.value)));
                            } else {
                                props.onChange([...current, item.value]);
                            }
                        } else {
                            props.onChange(isSelected ? null : item.value);
                        }
                    };

                    return (
                        <button
                            key={`${item.value[0]}/${item.value[1]}`}
                            type="button"
                            className={`color-btn ${isSelected ? "selected" : ""}`}
                            style={{
                                gridColumn: item.value[0] + 1,
                                gridRow: item.value[1] + 1,
                                "--color": item.color,
                            } as React.CSSProperties}
                            title={
                                item.label
                                    ? `${item.label} [${item.value[0]}, ${item.value[1]}]`
                                    : `[${item.value[0]}, ${item.value[1]}]`
                            }
                            onClick={handleClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}