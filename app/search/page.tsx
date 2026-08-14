"use client";

import { Body, FilterPanel } from "@/components/page/search/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";

export default function Home() {
    useEffect(() => {
        nav_btn_select("Search");
    }, []);
    return (
        <main className="align-layout">
            <LeftBar />
            <FilterPanel />
            <Body />
            <RightBar />
        </main>
    );
}