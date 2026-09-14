import React, { useState, useEffect, useRef } from "react";
import { updateMacroStaticHighlight } from "@/components/highlight/macro-highlight-static.js";

import { DiscordMarkdown } from '../../DiscordMarkdown';

function MacroCode({ children }: { children: string }) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (elementRef.current) {
            updateMacroStaticHighlight(elementRef.current, children);
        }
    }, [children]);

    return (
        <div
            ref={elementRef}
            className="search-details-detailbox macro"
        />
    );
}

export default function Body() {
    return (
        <main className="ascroll-y w-full">
            <div className="main-body">
                <h2 className="text-label font-bold">About this website</h2>
                <hr />
                <DiscordMarkdown>{
`This website project was made to allow users to use parts of the bot, which includes the basic parts: **Macrosia**, **Render** and **Search**.

It was made on the idea of the existing Macrosia Web Demo by <@581685961205874718>, which by default, only allows you to execute the code. You can also see the docs for Macrosia In Rust (implementation in Rust), what crate they use and how it works. The actual information for the macros was placed directly in the editor, allows you to look up and see the info of that macro.

In this website, we made not just the code stuff, but we also made searching easier by revealing every items from the database, and from GitHub source when possible. We also allow users to search and filter from specific metadatas to make it find much more easier.`
                }</DiscordMarkdown>
                <h3 className="text-label font-bold">History</h3>
                <hr />
                <DiscordMarkdown>{
`It started when I was working on a custom highlighting for Macrosia and Render-exclusive parts (\`:variants\` and \`--flags\`), and so then I need to use the keywords from the source so that it explicitly highlights on the Render-exclusive parts, but not for macros, since Macrosia has 2 parts: 1. The built-ins from Rust 2. Stored macros from database. I eventually make it just check on first index before the slash.

I originally started to write with \`=m x ...\` so that it is similar to what we do in the bot. But while developing for a while, I realised that you don't have to do that.

When I tried to do the rendering, it was on a test page, using \`<canvas>\` + gify library to make it render. But since the rendering from the actual bot is much more complicated, I decided to scrape that kind of code away.`
                }</DiscordMarkdown>
                <h3 className="text-label font-bold">Why this website?</h3>
                <hr />
                <DiscordMarkdown>{
`It uses a syntax highlighting that is easy to read, and makes users understand which part of the Macrosia code is.

Example code:`
                }</DiscordMarkdown>
                <MacroCode>{
`[store/x/0][unescape/[repeat/10/\\[store\\/x\\/\\[add\\/\\[load\\/x\\]\\/1\\]\\]\\[load\\/x\\]/ ]]`
                }</MacroCode>
                <div className="discord-markdown">
                    <p>{`It is has been split into each tokens, for the basic parts, are: `}
                        <code className="discord-inline-code">
                            <span className="macro-name">Macro name</span>
                        </code>{`, `}
                        <code className="discord-inline-code">
                            <span className="macro-value">Macro value</span>
                        </code>{`, `}
                        <code className="discord-inline-code">
                            <span className="macro-variable">Macro variable</span>
                        </code>{`, `}
                        <code className="discord-inline-code">
                            <span className="macro-empty">Empty macro</span>
                        </code>{`, `}
                        <code className="discord-inline-code">
                            <span className="macro-escape">Escaped</span>
                        </code>{` and `}
                        <code className="discord-inline-code">
                            <span className="macro-value-escape">Value Escape</span>
                        </code>.
                    </p>
                </div>
                <DiscordMarkdown>{
`
It also has a syntax for variants and flags:`
                }</DiscordMarkdown>
                <div
                    className="search-details-detailbox macro"
                >
                    <span className="flag-name">-f</span>=
                    <span className="flag-value">png</span>{` `}
                    baba
                    <span className="variant-name">:crop</span>
                    <span className="variant-value">0</span>/
                    <span className="variant-value">0</span>/
                    <span className="variant-value">24</span>/
                    <span className="variant-value">12</span>&belt
                    <span className="variant-name">:crop</span>
                    <span className="variant-value">0</span>/
                    <span className="variant-value">12</span>/
                    <span className="variant-value">24</span>/
                    <span className="variant-value">24</span>
                </div>
                <hr />
                <DiscordMarkdown>{
`It also has a more extended search, and lets you see their details easier to read.

We also found that palettes are stored by source-first, so we have made it to store as \`source:name\` so it wouldn't overwrite with the other palettes, unlike how the bot's system does it.`
                }</DiscordMarkdown>
            </div>
        </main>
    );
}