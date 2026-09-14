"use client";

import Body from "@/components/page/macrosia/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useState, useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";
import { readSearchUrlState, writeSearchUrlState, } from "@/components/url_state/searchUrlState";


export default function Home() {
    return (
        <main className="align-layout">
            <LeftBar />
            <Body />
            <RightBar />
        </main>
    );
}