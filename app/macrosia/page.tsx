"use client";

import Body from "@/components/page/macrosia/Body";
import { LeftBar, RightBar } from "@/components/page/SideBars";
import { useState, useEffect } from "react";
import { nav_btn_select } from "@/components/nav_select";
import { readSearchUrlState, writeSearchUrlState, } from "@/components/url_state/searchUrlState";

export default function Home() {
    const [code, setCode] = useState<string | null>(null);
    const [mode, setMode] = useState<"tiles" | "macros" | "variants" | "filters" | "overlays">("tiles");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [useRegex, setUseRegex] = useState<boolean>(false);
    const [detailsName, setDetailsName] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [hasInitialHash, setHasInitialHash] = useState<boolean>(false);

    useEffect(() => {
        nav_btn_select("Macrosia");
        
        // Check if URL had a hash initially
        const initialHash = window.location.hash;
        setHasInitialHash(!!initialHash);

        const syncUrlState = () => {
            const nextState = readSearchUrlState();
            setMode(nextState.mode);
            setSearchQuery(nextState.query);
            setUseRegex(nextState.regex);
            setDetailsName(nextState.details);
            setCode(nextState.code);
            setSelected(null);
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
            mode: hasInitialHash ? mode : "tiles",
            query: searchQuery,
            regex: useRegex,
            details: detailsName,
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
