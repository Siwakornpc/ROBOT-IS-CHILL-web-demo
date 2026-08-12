"use client";

import Body from "@/components/page/macrosia/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        const macrosia_btn = document.querySelector(".sb-btn:has(.icon.macrosia)");

        macrosia_btn?.classList.add("selected");
        macrosia_btn?.querySelector(".icon.macrosia")?.classList.add("selected");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
            <RightBar />
        </main>
    );
}
