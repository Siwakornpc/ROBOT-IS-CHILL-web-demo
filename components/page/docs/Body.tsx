import React, { useState, useEffect, useRef } from "react";
import { updateMacroStaticHighlight } from "@/components/highlight/macro-highlight-static.js";

import { DiscordMarkdown } from '../../DiscordMarkdown';

function MacroCode({ children }: { children: string }) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (elementRef.current) {
            updateMacroStaticHighlight(elementRef.current, children);
        }
    }, [children]);

    return (
        <div
            ref={elementRef}
            className="search-details-detailbox macro"
        />
    );
}

export default function Body() {
    return (
        <main className="ascroll-y w-full">
            <div className="main-body">
            </div>
        </main>
    );
}