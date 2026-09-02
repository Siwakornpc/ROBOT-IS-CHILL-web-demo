"use client";

import { useState, useEffect, useRef } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import MenuSelect, { MenuOption } from "@/components/MenuSelect";

import { updateVariantStaticHighlight } from "@/components/highlight/metadata-hightlight.js"
import Slider from "@/components/slider";

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

    const [sliderValue, setSliderValue] = useState(50);
    const [sliderValue2, setSliderValue2] = useState(50);
    const [sliderValue3, setSliderValue3] = useState(-50);
    useEffect(() => {
        const element = variantElementRef.current;

        if (!element) return;

        updateVariantStaticHighlight(element, variantText);
    }, []);

    return (
        <main style={{ width: "stretch" }}>
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

                <hr />

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
                
                <Slider
                    value={sliderValue}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(value) => {
                        setSliderValue(value);
                        console.log("Slider Value:", value);
                    }}
                />
                <Slider
                    value={sliderValue2}
                    min={-100}
                    max={100}
                    onChange={(value) => {
                        setSliderValue2(value);
                        console.log("Slider Value:", value);
                    }}
                    size="small"
                />
                <Slider
                    value={sliderValue3}
                    min={-100}
                    max={-50}
                    onChange={(value) => {
                        setSliderValue3(value);
                        console.log("Slider Value:", value);
                    }}
                    size="large"
                />
            </div>
        </main>
    );
}