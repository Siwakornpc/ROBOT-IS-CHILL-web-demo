"use client";

import { useState } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";
import MenuSelect from "@/components/MenuSelect";

const options = [
    {
        value: "option1",
        title: "Option 1",
    },
    {
        value: "option2",
        title: "Option 2",
    },
    {
        value: "option3",
        title: "Option 3",
    }
];

export default function Body() {
    const [value, setValue] = useState("option1");

    const filteredOptions = options.filter((option) =>
        option.title.toLowerCase().includes(value.toLowerCase())
    );

    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <p className="text-label">Settings</p>
                <hr />
                <EditorScreen />
                <MenuSelect
                    value={value}
                    options={options}
                    onChange={(newValue) => {
                        setValue(newValue);
                        const selected = options.find((o) => o.value === newValue);
                        if (selected) setValue(selected.title);
                    }}
                    trigger={({ open }) => (
                        <input
                            type="text"
                            placeholder="Search options..."
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                open();
                            }}
                            onFocus={open}
                            className="my-text-input"
                        />
                    )}
                />
            </div>
        </main>
    );
}
