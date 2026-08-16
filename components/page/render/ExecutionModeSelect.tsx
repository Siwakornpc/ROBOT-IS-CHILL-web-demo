"use client";

import { useEffect, useState } from "react";
import MenuSelect, { MenuOption } from "@/components/MenuSelect";

const options = [
    {
        value: "=t",
        title: "Render Tiles",
    },
    {
        value: "=r",
        title: "Render Texts",
    },
] as const;

type ExecutionMode = (typeof options)[number]["value"];

export default function Executionoptionselect() {
    const [mode, setMode] = useState<ExecutionMode>("=t");

    useEffect(() => {
        (window as any).executionMode = mode;
        window.dispatchEvent(new Event("executionmodechange"));
    }, [mode]);

    const renderBadge = (item: MenuOption<ExecutionMode>) => (
        <>
            =<span className="emph">{item.value.slice(1)}</span>
        </>
    );

    return (
        <MenuSelect
            id="execution-mode-select"
            title="Execution Mode"
            value={mode}
            options={options}
            onChange={setMode}
            className="kill-styling"
            triggerValue={renderBadge}
            optionIcon={renderBadge}
        />
    );
}
