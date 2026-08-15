"use client";

import { useEffect, useState } from "react";
import MenuSelect, { MenuOption } from "@/components/MenuSelect";

const options = [
    {
        value: "=t",
        optionIcon: "=t",
        title: "Render Tiles",
    },
    {
        value: "=r",
        optionIcon: "=r",
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
            =<span className="emph">{(item.optionIcon ?? item.value).replace(/^=(.*)/, "$1")}</span>
        </>
    );

    return (
        <MenuSelect
            title="Execution Mode"
            value={mode}
            options={options}
            onChange={setMode}
            className="menu-select"
            triggerValue={renderBadge}
            optionIcon={renderBadge}
            style={{fontFamily: "var(--font-family-code)"}}
        />
    );
}