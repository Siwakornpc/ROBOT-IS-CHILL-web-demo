"use client";

import { parse } from "discord-markdown-parser";
import type { ReactNode } from "react";

type DiscordNode = {
    type: string;
    [key: string]: unknown;
};

function isChildrenNode(
    node: DiscordNode
): node is DiscordNode & { content: DiscordNode[] } {
    return Array.isArray(node.content);
}

function renderChildren(
    children: DiscordNode[],
    parentKey: string
): ReactNode[] {
    return children.map((child, index) =>
        renderNode(child, `${parentKey}-${index}`)
    );
}

function renderNode(node: DiscordNode, key: string): ReactNode {
    console.log(node.type);
    switch (node.type) {
        /*
         * Plain text
         */
        case "text":
            return node.content as string;

        /*
         * Line break
         */
        case "br":
        case "newline":
            return <br key={key} />;

        /*
         * Bold: **text**
         */
        case "strong":
            return (
                <strong key={key}>
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </strong>
            );

        /*
         * Italic: *text* / _text_
         */
        case "em":
            return (
                <em key={key}>
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </em>
            );

        /*
         * Underline: __text__
         */
        case "u":
        case "underline":
            return (
                <u key={key}>
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </u>
            );

        /*
         * Strikethrough: ~~text~~
         */
        case "strike":
        case "strikethrough":
            return (
                <s key={key}>
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </s>
            );

        /*
         * Spoiler: ||text||
         *
         * CSS controls the visual appearance.
         */
        case "spoiler":
            return (
                <span
                    key={key}
                    className="discord-spoiler"
                    role="button"
                    tabIndex={0}
                >
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </span>
            );

        /*
         * Subtext: -# text
         *
         * CSS controls the visual appearance.
         */
        case "subtext":
            return (
                <p
                    key={key}
                    className="discord-subtext"
                    role="button"
                    tabIndex={0}
                >
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </p>
            );

        /*
         * Inline code: `code`
         */
        case "inlineCode":
            return (
                <code key={key} className="discord-inline-code">
                    {String(node.content ?? "")}
                </code>
            );

        /*
         * Code block:
         *
         * ```js
         * console.log("hello")
         * ```
         */
        case "codeBlock":
            return (
                <pre key={key} className="discord-code-block">
                    <code
                        data-language={
                            typeof node.lang === "string"
                                ? node.lang
                                : undefined
                        }
                    >
                        {String(node.content ?? "")}
                    </code>
                </pre>
            );

        /*
         * Links: [text](url)
         */
        case "link": {
            const href =
                typeof node.href === "string"
                    ? node.href
                    : typeof node.url === "string"
                      ? node.url
                      : undefined;

            return (
                <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : String(node.content ?? "")}
                </a>
            );
        }

        /*
         * Autolink / URL
         */
        case "autolink":
        case "url": {
            const href =
                typeof node.href === "string"
                    ? node.href
                    : typeof node.url === "string"
                      ? node.url
                      : String(node.content ?? "");

            return (
                <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {String(node.content ?? href)}
                </a>
            );
        }

        /*
         * Block quote:
         *
         * > hello
         */
        case "blockQuote":
        case "blockquote":
            return (
                <blockquote key={key} className="discord-blockquote">
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </blockquote>
            );

        /*
         * Heading
         *
         * Discord normally supports heading levels 1-3.
         */
        case "heading": {
            const level =
                typeof node.level === "number"
                    ? Math.min(Math.max(node.level, 1), 6)
                    : 1;

            const children = isChildrenNode(node)
                ? renderChildren(node.content, key)
                : null;

            switch (level) {
                case 1:
                    return <h1 key={key}>{children}</h1>;
                case 2:
                    return <h2 key={key}>{children}</h2>;
                case 3:
                    return <h3 key={key}>{children}</h3>;
                case 4:
                    return <h4 key={key}>{children}</h4>;
                case 5:
                    return <h5 key={key}>{children}</h5>;
                default:
                    return <h6 key={key}>{children}</h6>;
            }
        }

        /*
         * Lists
         */
        case "list": {
            const items = Array.isArray(node.items)
                ? node.items
                : [];

            const ordered = Boolean(node.ordered);

            if (ordered) {
                return (
                    <ol
                        key={key}
                        start={
                            typeof node.start === "number"
                                ? node.start
                                : undefined
                        }
                    >
                        {items.map((item, index) => (
                            <li key={`${key}-${index}`}>
                                {Array.isArray(item)
                                    ? renderChildren(
                                          item as DiscordNode[],
                                          `${key}-${index}`
                                      )
                                    : null}
                            </li>
                        ))}
                    </ol>
                );
            }

            return (
                <ul key={key}>
                    {items.map((item, index) => (
                        <li key={`${key}-${index}`}>
                            {Array.isArray(item)
                                ? renderChildren(
                                      item as DiscordNode[],
                                      `${key}-${index}`
                                  )
                                : null}
                        </li>
                    ))}
                </ul>
            );
        }

        /*
         * User / role / channel / everyone / here mentions.
         *
         * The parser gives us the resolved content when available,
         * otherwise we fall back to the parsed content.
         */
        case "mention": {
            const content = isChildrenNode(node)
                ? renderChildren(node.content, key)
                : String(node.content ?? "");

            const context =
                typeof node.context === "string"
                    ? node.context
                    : "user";

            return (
                <span
                    key={key}
                    className={`discord-mention discord-mention-${context}`}
                    data-id={
                        typeof node.id === "string"
                            ? node.id
                            : undefined
                    }
                >
                    {content}
                </span>
            );
        }

        /*
         * Emoji
         */
        case "emoji": {
            const custom = Boolean(node.custom);

            if (custom && typeof node.url === "string") {
                return (
                    <img
                        key={key}
                        className="discord-emoji discord-custom-emoji"
                        src={node.url}
                        alt={
                            typeof node.name === "string"
                                ? `:${node.name}:`
                                : "emoji"
                        }
                    />
                );
            }

            return (
                <span
                    key={key}
                    className="discord-emoji"
                    data-name={
                        typeof node.name === "string"
                            ? node.name
                            : undefined
                    }
                >
                    {typeof node.content === "string"
                        ? node.content
                        : typeof node.name === "string"
                          ? `:${node.name}:`
                          : ""}
                </span>
            );
        }

        /*
         * Discord timestamps:
         * <t:1234567890:F>
         */
        case "timestamp":
            return (
                <time
                    key={key}
                    className="discord-timestamp"
                    dateTime={
                        node.date instanceof Date
                            ? node.date.toISOString()
                            : undefined
                    }
                    title={
                        typeof node.full === "string"
                            ? node.full
                            : undefined
                    }
                >
                    {typeof node.formatted === "string"
                        ? node.formatted
                        : String(node.timestamp ?? "")}
                </time>
            );

        /*
         * Paragraph
         */
        case "paragraph":
            return (
                <p key={key}>
                    {isChildrenNode(node)
                        ? renderChildren(node.content, key)
                        : null}
                </p>
            );

        /*
         * Horizontal rule
         */
        case "hr":
        case "horizontalRule":
            return <hr key={key} />;

        /*
         * Anything we don't explicitly understand:
         *
         * Don't crash the entire message. If it has children,
         * recursively render them.
         */
        default:
            if (isChildrenNode(node)) {
                return (
                    <span key={key}>
                        {renderChildren(node.content, key)}
                    </span>
                );
            }

            if (typeof node.content === "string") {
                return node.content;
            }

            return null;
    }
}

export function DiscordMarkdown({
    children,
}: {
    children: string;
}) {
    const ast = parse(children, "normal") as DiscordNode[];

    return (
        <span className="discord-markdown">
            {ast.map((node, index) =>
                renderNode(node, `discord-${index}`)
            )}
        </span>
    );
}
