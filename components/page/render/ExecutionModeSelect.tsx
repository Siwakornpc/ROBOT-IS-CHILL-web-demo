"use client";

import { useEffect } from "react";
import MenuSelect, { MenuOption } from "@/components/MenuSelect";
import type { RenderMode } from "@/components/page/render/get_render";
import type { WindowWithEditor } from "@/components/editor/types";

const options = [
    { value: "=t", label: "Render Tiles" },
    { value: "=r", label: "Render Texts" },
] as const;

type ExecutionMode = (typeof options)[number]["value"];

export default function Executionoptionselect({
    mode,
    onModeChange,
}: {
    mode: RenderMode;
    onModeChange: (mode: RenderMode) => void;
}) {
    const selectedMode: ExecutionMode = mode === "t" ? "=t" : "=r";

    useEffect(() => {
        (window as WindowWithEditor).executionMode = selectedMode;
        window.dispatchEvent(new Event("executionmodechange"));
    }, [selectedMode]);

    const renderBadge = (item: MenuOption<ExecutionMode>) => <span>=<span className="emph">{item.value.slice(1)}</span></span>;

    return (
        <MenuSelect
            id="execution-mode-select"
            title="Execution Mode"
            value={selectedMode}
            options={options}
            onChange={(nextMode) => {
                onModeChange(nextMode === "=t" ? "t" : "r");
            }}
            className="kill-styling"
            triggerValue={renderBadge}
            optionIcon={renderBadge}
        />
    );
}
