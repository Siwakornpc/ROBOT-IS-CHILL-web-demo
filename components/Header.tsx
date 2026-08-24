"use client";

import Link from "next/link";
import { useMenu } from "./MenuContext";

export function Header() {
    const { toggleMenu } = useMenu();

    return (
        <div className="topbar">
            <button className="head-btn" onClick={toggleMenu}>
                <span className="icon">menu</span>
            </button>

            <Link href="/" className="title-name">
                <span id="name-1">ROBOT IS CHILL</span>
                &nbsp;
                <span id="name-2">web demo</span>
            </Link>
        </div>
    );
}