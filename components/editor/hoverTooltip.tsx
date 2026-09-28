"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { updateMacroStaticHighlight } from "@/components/highlight/macro-highlight-static.js";
import { useDiscordUser } from "../DiscordUser";
import { DiscordMarkdown } from "../DiscordMarkdown";

function MacroCreator({ id }: { id: string }) {
    const { user, loading } = useDiscordUser(id);

    return <p className="hover-tooltip-creator">@{loading ? "loading..." : user?.username ?? id}</p>;
}

export interface HoverTooltipProps {
    isOpen: boolean;
    name: string;
    description: string;
    value?: string;
    creator: string | null;
    builtin?: boolean;
    /** Viewport-space rectangle of the hovered token. */
    anchor: { top: number; bottom: number; left: number };
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function HoverTooltip({
    isOpen,
    description,
    value,
    creator,
    builtin,
    anchor,
    onMouseEnter,
    onMouseLeave,
}: HoverTooltipProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const valueRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (valueRef.current && value) updateMacroStaticHighlight(valueRef.current, value);
    }, [value, isOpen]);

    useLayoutEffect(() => {
        if (!isOpen || !ref.current) return;

        const { width, height } = ref.current.getBoundingClientRect();
        const gap = 2; // keep this small so the mouse can cross onto the tooltip
        const above = anchor.top - height - gap;

        setPos({
            top: above >= gap ? above : anchor.bottom + gap,
            left: Math.max(gap, Math.min(anchor.left, window.innerWidth - width - gap)),
        });
    }, [isOpen, anchor, description]);

    if (!isOpen || !description) return null;

    return (
        <div
            ref={ref}
            className="hover-tooltip inset-scrollbar flex flex-col gap-[8px]"
            style={{
                position: "fixed",
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                visibility: pos ? "visible" : "hidden", // hidden until measured, avoids a flash at 0,0
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {!builtin && value && (
                <>
                    <div ref={valueRef} className="macro hover-tooltip-value" />
                </>
            )}
            <div className="text-label select-none">
                {!builtin ? creator && (
                    <>
                        <MacroCreator id={creator} />
                    </>
                ) : (
                    <>
                        <span className="icon !text-[1.42em] absolute">
                            check
                        </span><span className="pl-[2.02em]">Valid Macrosia macro</span>
                    </>
                )}
            </div>
            <hr/>
            <DiscordMarkdown>{description}</DiscordMarkdown>
        </div>
    );
}