"use client";

import Link from "next/link";
import { useMenu } from "./MenuContext";

export function Header() {
    const { toggleMenu, toggleRightMenu } = useMenu();

    return (
        <div className="topbar">
            <div className="flex gap-[8px] items-center">
                <button className="head-btn left" onClick={toggleMenu} aria-label="Open left menu">
                    <span className="icon">menu</span>
                </button>

                <Link href="/" className="title-name">
                    <span id="name-1">ROBOT IS CHILL</span>&nbsp;<span id="name-2">web demo</span>
                </Link>
            </div>

            <button className="head-btn right" onClick={toggleRightMenu} aria-label="Open right menu">
                <span className="icon">menu</span>
            </button>
        </div>
    );
}