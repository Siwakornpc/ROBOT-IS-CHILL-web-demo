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

    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <p className="text-label">Settings</p>
                <hr />
                <EditorScreen />
                <MenuSelect
                    value={value}
                    options={options}
                    onChange={setValue}
                    trigger={({ open, selectedOption }) => (
                        <input
                            type="text"
                            placeholder="Search options..."
                            value={selectedOption.title}
                            onClick={open}
                            onFocus={open}
                            className="my-text-input"
                        />
                    )}
                />
            </div>
        </main>
    );
}
