"use client";

import Body from "@/components/page/render/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        const render_btn = document.querySelector(".nav-btn[aria-label='render']");

        render_btn?.classList.add("selected");
        render_btn?.querySelector(".icon.render")?.classList.add("selected");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
            <RightBar />
        </main>
    );
}
