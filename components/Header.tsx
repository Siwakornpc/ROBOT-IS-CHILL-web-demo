"use client";

import Link from "next/link";
import { useMenu } from "./MenuContext";
import { useEffect, useRef } from "react";

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

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className="topbar">
            <div className="flex gap-[8px] items-center">
                <button className="head-btn left" onClick={toggleMenu} aria-label="Open left menu">
                    <span className="icon">menu</span>
                </button>

                <Link href="/" className="title-name">
                    <div ref={titleRef}>
                        <span id="name-1">ROBOT IS CHILL</span>&nbsp;<span id="name-2">web demo</span>
                    </div>
                </Link>
            </div>

            <button className="head-btn right" onClick={toggleRightMenu} aria-label="Open right menu">
                <span className="icon">menu</span>
            </button>
        </div>
    );
}