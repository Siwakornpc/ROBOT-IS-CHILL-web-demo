"use client";

import { useEffect, useState } from "react";
import MenuSelect, { MenuOption } from "./MenuSelect";

const modes = [
    {
        value: "=t",
        label: "=t",
        title: "Render Tiles",
    },
    {
        value: "=r",
        label: "=r",
        title: "Render Texts",
    },
] as const;

type ExecutionMode = (typeof modes)[number]["value"];

export default function ExecutionModeSelect() {
    const [mode, setMode] = useState<ExecutionMode>("=t");

    useEffect(() => {
        (window as any).executionMode = mode;
        window.dispatchEvent(new Event("executionmodechange"));
    }, [mode]);

    const renderBadge = (item: MenuOption<ExecutionMode>) => (
        <>
            =<span className="emph">{(item.label ?? item.value).replace(/^=(.*)/, "$1")}</span>
        </>
    );

    return (
        <MenuSelect
            title="Execution Mode"
            value={mode}
            options={modes}
            onChange={setMode}
            className="execution-mode-select"
            renderTrigger={renderBadge}
            renderOptionIcon={renderBadge}
        />
    );
}