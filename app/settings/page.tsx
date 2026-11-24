"use client";

import Body from "@/components/page/settings/Body";
import { LeftBar } from "@/components/page/SideBars";
import { useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";

export default function Home() {
    useEffect(() => {
        nav_btn_select("Settings");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
        </main>
    );
}