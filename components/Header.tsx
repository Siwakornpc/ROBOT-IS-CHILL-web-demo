"use client";

import Link from "next/link";
import { useMenu } from "./md3/MenuContext";
import { useEffect, useRef } from "react";
import { buildSearchUrlHash, readSearchUrlState } from "@/components/url_state/searchUrlState";

function navigateWithCode(
    event: React.MouseEvent<HTMLAnchorElement>,
    path: string
) {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) {return}

    event.preventDefault();

    const target = new URL(path, window.location.href);
    const state = readSearchUrlState();
    target.hash = buildSearchUrlHash({ ...state, details: null }, target.pathname, false);

    window.location.href = target.toString();
}

export function Header() {
    const { toggleMenu, toggleRightMenu } = useMenu();
    const titleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const title_element = titleRef.current;
        if (!title_element) return;

        const handleResize = () => {
            const n1 = title_element.querySelector("#name-1");
            const n2 = title_element.querySelector("#name-2");

            if (n1) n1.textContent = (window.innerWidth < 400) ? "RIC" : "ROBOT IS CHILL";
            if (n2) n2.textContent = (window.innerWidth < 270) ? "wd" : "web demo";
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className="header w-full">
            <div className="flex gap-[8px] items-center">
                <button className="header-btn left" onClick={toggleMenu} aria-label="Open left menu">
                    <span className="icon">menu</span>
                </button>

                <Link href="/" className="title-name">
                    <div ref={titleRef}>
                        <span id="name-1">ROBOT IS CHILL</span>&nbsp;<span id="name-2">web demo</span>
                    </div>
                </Link>
            </div>

            <div style={{ flex: 1 }} />

            <Link
                href="../about"
                className="header-link"
                aria-label="About"
                onClick={(e) => navigateWithCode(e, "/about")}
            >
                <i className="icon">info</i>
                <span className="header-link-label">About</span>
            </Link>
            <Link
                href="../docs"
                className="header-link"
                aria-label="Docs"
                onClick={(e) => navigateWithCode(e, "/docs")}
            >
                <i className="icon">description</i>
                <span className="header-link-label">Docs</span>
            </Link>
        </div>
    );
}