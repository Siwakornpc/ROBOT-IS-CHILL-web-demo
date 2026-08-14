"use client";

import Body from "@/components/page/render/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useEffect } from "react";
import { sb_btn_select } from "@/components/sb_select";

export default function Home() {
    useEffect(() => {
        sb_btn_select("render");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
            <RightBar />
        </main>
    );
}
