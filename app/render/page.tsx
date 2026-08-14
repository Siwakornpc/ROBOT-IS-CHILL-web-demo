"use client";

import Body from "@/components/page/render/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";

export default function Home() {
    useEffect(() => {
        nav_btn_select("Render");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
            <RightBar />
        </main>
    );
}
