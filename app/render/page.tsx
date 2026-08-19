"use client";

import Body from "@/components/page/render/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useState, useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";
import { readSearchUrlState, writeSearchUrlState } from "@/components/url_state/searchUrlState";

export default function Home() {
    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        nav_btn_select("Render");

        const syncUrlState = () => {
            const nextState = readSearchUrlState();
            setCode(nextState.code);
        };

        syncUrlState();
        window.addEventListener("hashchange", syncUrlState);
        window.addEventListener("popstate", syncUrlState);
        
        // Load code into editor
        const loadCode = async () => {
            try {
                const api = await (window as any).editorReady;
                const nextState = readSearchUrlState();
                if (nextState.code) {
                    api.value = nextState.code;
                }
            } catch (e) {
                // Editor not ready yet
            }
        };
        
        loadCode();
        
        return () => {
            window.removeEventListener("hashchange", syncUrlState);
            window.removeEventListener("popstate", syncUrlState);
        };
    }, []);
    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        writeSearchUrlState({
            query: "",
            regex: false,
            details: null,
            code: newCode || null,
        });
    };

    return (
        <main className="align-layout">
            <LeftBar />
            <Body onCodeChange={handleCodeChange} />
            <RightBar />
        </main>
    );
}