"use client";

import Body from "@/components/page/search/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useEffect } from "react";
import { sb_btn_select } from "@/components/sb_select";

export default function Home() {
    useEffect(() => {
        sb_btn_select("search");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
            <RightBar />
        </main>
    );
}