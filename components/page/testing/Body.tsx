"use client";

import { useState, useEffect, useRef } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import MenuSelect, { MenuOption } from "@/components/md3/MenuSelect";

import { updateVariantStaticHighlight } from "@/components/highlight/metadata-hightlight.js"
import Slider from "@/components/md3/slider";
import MaterialShape from "@/components/md3/MaterialShape";

const materialShapeNames = [
    "4-leaf_clover",
    "4-sided_cookie",
    "6-sided_cookie",
    "7-sided_cookie",
    "8-leaf_clover",
    "9-sided_cookie",
    "12-sided_cookie",
    "arch",
    "arrow",
    "boom",
    "bun",
    "burst",
    "circle",
    "clamshell",
    "diamond",
    "fan",
    "flower",
    "gem",
    "ghost-ish",
    "heart",
    "oval",
    "pentagon",
    "pill",
    "pixel_circle",
    "pixel_triangle",
    "puffy",
    "puffy_diamond",
    "semicircle",
    "slanted",
    "soft_boom",
    "soft_burst",
    "square",
    "sunny",
    "triangle",
    "very_sunny",
];

const materialShapeOptions: MenuOption[] = materialShapeNames.map((name) => ({
    value: name,
    label: name.replace(/_/g, " "),
}));

const morphEasingOptions: MenuOption[] = [
    { value: "linear", label: "Linear" },
    { value: "ease", label: "Ease" },
    { value: "ease-in", label: "Ease in" },
    { value: "ease-out", label: "Ease out" },
    { value: "ease-in-out", label: "Ease in-out" },
    { value: "cubic-bezier(0.2, 0, 0, 1)", label: "Emphasized" },
];

const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
];

const sampleOptions: MenuOption[] = [
    {
        value: "file",
        label: "File",
        icon: "folder",
        children: [
            {
                value: "new",
                label: "New",
                icon: "add",
                children: [
                    { value: "new_file", label: "Text File", icon: "description" },
                    { value: "new_project", label: "Project Folder", icon: "create_new_folder" },
                ],
            },
            { value: "save", label: "Save", icon: "save", description: "Save current progress" },
            { value: "export", label: "Export As...", icon: "download" },
        ],
    },
    {
        value: "edit",
        label: "Edit",
        icon: "edit",
        children: [
            { value: "undo", label: "Undo", icon: "undo" },
            { value: "redo", label: "Redo", icon: "redo" },
            {
                value: "preferences",
                label: "Preferences",
                icon: "settings",
                children: [
                    { value: "pref_theme", label: "Theme Options", icon: "palette" },
                    { value: "pref_keys", label: "Keyboard Shortcuts", icon: "keyboard" },
                ],
            },
        ],
    },
    {
        value: "view",
        label: "View Mode",
        icon: "visibility",
        description: "Change interface layout",
    },
];

function findOptionWithAncestors(
    options: MenuOption[],
    targetValue: string,
    parents: MenuOption[] = []
): { option: MenuOption; path: MenuOption[] } | null {
    for (const item of options) {
        if (item.value === targetValue) {
            return { option: item, path: parents };
        }
        if (item.children && item.children.length > 0) {
            const found = findOptionWithAncestors(item.children, targetValue, [...parents, item]);
            if (found) return found;
        }
    }
    return null;
}

export default function Body() {
    const [textFieldSelected, setTextFieldSelected] = useState("option1");
    const [recurSelected, setRecurSelected] = useState("new_file");
    const [searchQuery, setSearchQuery] = useState("");

    // Look up the active option label based on current selection
    const activeSelection = findOptionWithAncestors(sampleOptions, recurSelected);
    const activeLabel = activeSelection?.option.label ?? recurSelected;

    // Filter using searchQuery instead of selected value
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (newValue: string) => {
        setRecurSelected(newValue);

        const result = findOptionWithAncestors(sampleOptions, newValue);
        if (result) {
            const pathLabels = result.path.map((parent) => parent.label);
            
            console.log("--- Menu Selection ---");
            console.log("Selected Value:", newValue);
            console.log("Selected Item:", result.option);
            console.log("Ancestor Path:", pathLabels);
            console.log("Full Hierarchy:", [...pathLabels, result.option.label].join(" > "));
        }
    };

    const variantText = '<wave><axis: Literal["x", "y"]>/<amplitude: int>/<offset: float>/<frequency: float>';
    const variantElementRef = useRef<HTMLDivElement>(null);

    const [sliderValue, setSliderValue] = useState(5);
    const [sliderValue2, setSliderValue2] = useState(5);
    const [sliderValue3, setSliderValue3] = useState(0);
    const [sliderValue4, setSliderValue4] = useState(-5);
    const [shapeName, setShapeName] = useState("circle");
    const [morphDuration, setMorphDuration] = useState(400);
    const [morphEasing, setMorphEasing] = useState("cubic-bezier(0.2, 0, 0, 1)");
    const [outlined, setOutlined] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);

    useEffect(() => {
        const element = variantElementRef.current;
        if (!element) return;
        updateVariantStaticHighlight(element, variantText);
    }, []);

    useEffect(() => {
        if (!autoPlay) return;

        const interval = window.setInterval(() => {
            setShapeName((currentName) => {
                const currentIndex = materialShapeNames.indexOf(currentName);
                return materialShapeNames[(currentIndex + 1) % materialShapeNames.length];
            });
        }, Math.max(850, morphDuration + 300));

        return () => window.clearInterval(interval);
    }, [autoPlay, morphDuration]);

    const stepShape = (step: number) => {
        setShapeName((currentName) => {
            const currentIndex = materialShapeNames.indexOf(currentName);
            return materialShapeNames[
                (currentIndex + step + materialShapeNames.length) % materialShapeNames.length
            ];
        });
    };

    const shapeLabel = shapeName.replace(/_/g, " ");

    return (
        <main className="ascroll-y" style={{ width: "stretch" }}>
            <div className="main-body">
                <p className="text-label">hi lol</p>
                <hr />
                <EditorScreen />
                <MenuSelect
                    value={textFieldSelected}
                    options={filteredOptions}
                    placement="bottom-start"
                    onChange={(newValue) => {
                        setTextFieldSelected(newValue);
                        const matched = options.find((opt) => opt.value === newValue);
                        if (matched) setSearchQuery(matched.label);
                    }}
                    trigger={({ getInputProps }) => (
                        <label className="text-field">
                            <span className="text-field-label">test thing idk</span>
                            <input
                                {...getInputProps({
                                    type: "text",
                                    value: searchQuery,
                                    placeholder: " ",
                                    required: true,
                                    autoComplete: "off",
                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                        setSearchQuery(e.target.value);
                                    },
                                })}
                            />
                        </label>
                    )}
                />

                <div>
                    <strong>Active Selection:</strong> <code>{activeLabel}</code>
                </div>

                <MenuSelect
                    id="test-recursive-menu"
                    title="Action Menu"
                    value={recurSelected}
                    options={sampleOptions}
                    onChange={handleSelect}
                    placement="bottom-start"
                />

                <div
                    ref={variantElementRef}
                    className="search-details-detailbox variant"
                />

                <hr />
                
                <div className="row-group flex-col">
                    <Slider
                        value={sliderValue}
                        min={0}
                        max={10}
                        step={1}
                        onChange={(value) => {
                            setSliderValue(value);
                            console.log("Slider Value:", value);
                        }}
                    />
                    <Slider
                        value={sliderValue2}
                        min={-10}
                        max={10}
                        step={1}
                        onChange={(value) => {
                            setSliderValue2(value);
                            console.log("Slider Value:", value);
                        }}
                        size="small"
                        showTicks
                    />
                    <Slider
                        value={sliderValue3}
                        min={-1}
                        max={1}
                        onChange={(value) => {
                            setSliderValue3(value);
                            console.log("Slider Value:", value);
                        }}
                        size="medium"
                    />
                    <Slider
                        value={sliderValue4}
                        min={-10}
                        max={-1}
                        onChange={(value) => {
                            setSliderValue4(value);
                            console.log("Slider Value:", value);
                        }}
                        size="xlarge"
                    />
                </div>

                <div className="row-group flex flex-wrap items-center">
                    <div style={{
                        display: "grid",
                        placeItems: "center",
                        width: 240,
                        height: 240,
                        borderRadius: 16,
                        background: "var(--md-color-surface-container)",
                    }}>
                        <MaterialShape
                            name={shapeName}
                            morphDuration={morphDuration}
                            morphEasing={morphEasing}
                            outlined={outlined}
                            background="rgb(var(--md-color-primary))"
                            size={180}
                            role="img"
                            aria-label={`${shapeLabel} shape`}
                        />
                    </div>

                    <div style={{ display: "grid", gap: 14, minWidth: 240, maxWidth: 400, flex: 1 }}>
                        <div>
                            <p className="text-label text-main-name">Shape</p>
                            <MenuSelect
                                id="material-shape-morph-select"
                                title="Shape"
                                value={shapeName}
                                options={materialShapeOptions}
                                onChange={setShapeName}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <button
                                type="button"
                                className="btn small btn-tonal"
                                onClick={() => stepShape(-1)}
                            >
                                <i className="icon">skip_previous</i>Previous
                            </button>
                            <button
                                className="btn small btn-tonal"
                                onClick={() => stepShape(1)}
                            >
                                <i className="icon">skip_next</i>Next
                            </button>
                            <label
                                className={`btn small btn-filled`}
                                onClick={() => setAutoPlay((playing) => !playing)}
                                aria-pressed={autoPlay}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={autoPlay}
                                    onChange={() => setAutoPlay((playing) => !playing)}
                                />
                                <span className="btn-false"><i className="icon">play_arrow</i>Play</span>
                                <span className="btn-true"><i className="icon">pause</i>Pause</span>
                            </label>
                        </div>

                        <div style={{ display: "grid", gap: 6 }}>
                            <p className="text-label text-main-name">Morph duration</p>
                            <Slider
                                value={morphDuration}
                                min={0}
                                max={1600}
                                step={50}
                                size="medium"
                                showTicks
                                thumbLabel={`${morphDuration} ms`}
                                onChange={setMorphDuration}
                            />
                        </div>

                        <div>
                            <p className="text-label text-main-name">Easing</p>
                            <MenuSelect
                                id="material-shape-morph-easing"
                                title="Easing"
                                value={morphEasing}
                                options={morphEasingOptions}
                                onChange={setMorphEasing}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <label className="checkbox">
                            <input
                                type="checkbox"
                                checked={outlined}
                                onChange={(event) => setOutlined(event.target.checked)}
                            />
                            <span>Outlined</span>
                        </label>
                    </div>
                </div>
            </div>
        </main>
    );
}