"use client";

import { useState } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import MenuSelect from "@/components/MenuSelect";

const options = [
    { value: "option1", title: "Option 1" },
    { value: "option2", title: "Option 2" },
    { value: "option3", title: "Option 3" },
];

export default function Body() {
    const [selected, setSelected] = useState("option1");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter using searchQuery instead of selected value
    const filteredOptions = options.filter((option) =>
        option.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <p className="text-label">Settings</p>
                <hr />
                <EditorScreen />
                <MenuSelect
                    value={selected}
                    options={filteredOptions}
                    onChange={(newValue) => {
                        setSelected(newValue);
                        const matched = options.find((opt) => opt.value === newValue);
                        if (matched) setSearchQuery(matched.title);
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
                    anchor="t"
                />
            </div>
        </main>
    );
}