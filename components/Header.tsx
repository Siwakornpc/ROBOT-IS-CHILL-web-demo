import Link from "next/link";

export function Header() {
    return (
        <div className="topbar">
            <Link href="/" className="title-name">
                <span id="name-1">ROBOT IS CHILL</span>
                &nbsp;
                <span id="name-2">web demo</span>
            </Link>
        </div>
    );
}