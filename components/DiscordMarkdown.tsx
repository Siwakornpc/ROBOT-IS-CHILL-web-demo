"use client";

import { unified } from "unified";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import type { ReactNode } from "react";
import type { Root } from "mdast";

/*
 * --------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------
 */

type DiscordToken =
    {
        type: "spoiler";
        content: string;
    } |
    {
        type: "subtext";
        content: string;
    } |
    {
        type: "user";
        id: string;
    } |
    {
        type: "role";
        id: string;
    } |
    {
        type: "channel";
        id: string;
    } |
    {
        type: "emoji";
        name: string;
        id: string;
        animated: boolean;
    } |
    {
        type: "timestamp";
        timestamp: number;
        style?: string;
    } |
    {
        type: "slashCommand";
        name: string;
        id: string;
    } |
    {
        type: "guildNavigation";
        typeName: string;
        id?: string;
    } |
    {
        type: "everyone";
    } |
    {
        type: "here";
    };

type DiscordTokenStore = DiscordToken[];

export type DiscordMarkdownProps = {
    children: string;

    /**
     * Resolve Discord IDs to names.
     *
     * If these aren't provided, the component falls back to:
     * @123456789
     * #123456789
     * @123456789
     */
    resolveUser?: (id: string) => string | undefined;
    resolveRole?: (id: string) => string | undefined;
    resolveChannel?: (id: string) => string | undefined;

    /**
     * Override the default Discord CDN URL for custom emoji.
     */
    resolveEmojiUrl?: (
        id: string,
        animated: boolean
    ) => string | undefined;

    /**
     * Locale used for Discord timestamps.
     *
     * Default is en-US to avoid hydration differences in Next.js.
     *
     * Pass navigator.language from a client-only parent if you want
     * the viewer's exact locale.
     */
    locale?: string;
};

/*
 * --------------------------------------------------------------------------
 * Parser
 * --------------------------------------------------------------------------
 */

const markdown = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks);

/*
 * Private-use Unicode characters.

 * They are extremely unlikely to occur in normal Discord messages and let us
 * temporarily hide Discord-only syntax from remark.
 */
const TOKEN_START = "\uE000";
const TOKEN_END = "\uE001";

function makeToken(
    tokens: DiscordTokenStore,
    token: DiscordToken
): string {
    const index = tokens.push(token) - 1;

    return `${TOKEN_START}${index}${TOKEN_END}`;
}

/*
 * --------------------------------------------------------------------------
 * Discord-specific preprocessing
 * --------------------------------------------------------------------------
 *
 * Discord has syntax that CommonMark/GFM doesn't understand:
 *
 *   ||spoiler||
 *   -# subtext
 *   <@123>
 *   <@&123>
 *   <#123>
 *   <:blob:123>
 *   <a:blob:123>
 *   <t:123:F>
 *   </foo:123>
 *   >>> quote
 *
 * We replace those with tokens before handing the document to remark.
 *
 * This is also where we support your custom list syntax:
 *
 *   - one
 *   - - two
 *   - - - three
 *   - - - - four
 *
 * which gets normalized to standard nested Markdown.
 */

function normalizeDiscordLists(source: string): string {
    /*
     * Discord's list syntax is normal Markdown indentation:
     *
     * - one
     *   - two
     *     - three
     *
     * Do not invent nested-list syntax such as "- - two". Discord does not
     * interpret that as a nested list.
     *
     * Discord also has a special multi-line quote:
     *
     * >>> first
     * second
     *
     * which means that the rest of the message is quoted.
     */
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const output: string[] = [];

    let inFence = false;
    let fenceChar = "";
    let fenceLength = 0;
    let multiLineQuote = false;

    for (const line of lines) {
        const fence = line.match(
            /^ {0,3}(`{3,}|~{3,})(?:.*)?$/
        );

        if (fence) {
            if (!inFence) {
                inFence = true;
                fenceChar = fence[1][0];
                fenceLength = fence[1].length;
            } else if (
                fence[1][0] === fenceChar &&
                fence[1].length >= fenceLength
            ) {
                inFence = false;
                fenceChar = "";
                fenceLength = 0;
            }

            output.push(line);
            continue;
        }

        if (inFence) {
            output.push(line);
            continue;
        }

        if (multiLineQuote) {
            output.push(line === "" ? ">" : `> ${line}`);
            continue;
        }

        if (line.startsWith(">>> ")) {
            multiLineQuote = true;

            const content = line.slice(3).replace(/^ /, "");
            output.push(content === "" ? ">" : `> ${content}`);
            continue;
        }

        output.push(line);
    }

    return output.join("\n");
}

/*
 * --------------------------------------------------------------------------
 * Tokenization
 * --------------------------------------------------------------------------
 */

function protectDiscordSyntax(
    source: string,
    tokens: DiscordTokenStore
): string {
    let result = "";

    let i = 0;
    let inFence = false;
    let fenceChar = "";
    let fenceLength = 0;

    while (i < source.length) {
        /*
         * --------------------------------------------------------------
         * Fenced code blocks
         * --------------------------------------------------------------
         *
         * Discord spoilers/mentions/etc. must not be interpreted inside
         * code blocks.
         */
        if (i === 0 || source[i - 1] === "\n") {
            const rest = source.slice(i);

            // ```lang\ncode``` — Discord (unlike CommonMark) allows the closing
            // fence to sit on the same line as the last line of code, e.g.
            //   ```js
            //   code```
            // remark won't recognize that as closed, so we extract the pieces
            // ourselves and re-emit a fence with the closing marker forced onto
            // its own line, which remark is guaranteed to parse correctly.
            const fence = rest.match(
                /^```(?:(\w+)\n)?([\s\S]*?)```/
            );

            if (fence) {
                const lang = fence[1] ?? "";
                let content = fence[2];

                // When there's no language token, the newline that terminates the
                // opening ``` line ends up captured as a leading "\n" in content
                // instead of being consumed separately — strip it back out.
                if (!lang && content.startsWith("\n")) {
                    content = content.slice(1);
                }

                const normalized =
                    "```" +
                    lang +
                    "\n" +
                    content +
                    (content.endsWith("\n") ? "" : "\n") +
                    "```";

                result += normalized;
                i += fence[0].length;
                continue;
            }
        }

        /*
         * --------------------------------------------------------------
         * Inline code
         * --------------------------------------------------------------
         */
        if (source[i] === "`") {
            // `code` — single backtick delimiters only.
            const inline = source
                .slice(i)
                .match(/^`([^`]*)`/);

            if (inline) {
                result += inline[0];
                i += inline[0].length;
                continue;
            }
        }

        /*
         * --------------------------------------------------------------
         * Spoiler
         * --------------------------------------------------------------
         *
         * ||secret||
         */
        if (source.startsWith("||", i)) {
            const end = source.indexOf("||", i + 2);

            if (end !== -1) {
                const content = source.slice(
                    i + 2,
                    end
                );

                result += makeToken(tokens, {
                    type: "spoiler",
                    content,
                });

                i = end + 2;
                continue;
            }
        }

        const rest = source.slice(i);

        /*
         * --------------------------------------------------------------
         * Custom emoji
         * --------------------------------------------------------------
         *
         * <:name:id>
         * <a:name:id>
         */
        const emoji = rest.match(
            /^<(a?):([A-Za-z0-9_]+):(\d+)>/
        );

        if (emoji) {
            result += makeToken(tokens, {
                type: "emoji",
                animated: emoji[1] === "a",
                name: emoji[2],
                id: emoji[3],
            });

            i += emoji[0].length;
            continue;
        }

        /*
         * --------------------------------------------------------------
         * User mention
         * --------------------------------------------------------------
         *
         * <@123>
         * <@!123>
         */
        const user = rest.match(
            /^<@!?(\d+)>/
        );

        if (user) {
            result += makeToken(tokens, {
                type: "user",
                id: user[1],
            });

            i += user[0].length;
            continue;
        }

        /*
         * --------------------------------------------------------------
         * Role mention
         * --------------------------------------------------------------
         *
         * <@&123>
         */
        const role = rest.match(
            /^<@&(\d+)>/
        );

        if (role) {
            result += makeToken(tokens, {
                type: "role",
                id: role[1],
            });

            i += role[0].length;
            continue;
        }

        /*
         * --------------------------------------------------------------
         * Channel mention
         * --------------------------------------------------------------
         *
         * <#123>
         */
        const channel = rest.match(
            /^<#(\d+)>/
        );

        if (channel) {
            result += makeToken(tokens, {
                type: "channel",
                id: channel[1],
            });

            i += channel[0].length;
            continue;
        }

        /*
         * --------------------------------------------------------------
         * Slash command
         * --------------------------------------------------------------
         *
         * </foo:123>
         * </foo bar:123>
         * </foo bar baz:123>
         */
        const command = rest.match(
            /^<\/([A-Za-z0-9_-]+(?: [A-Za-z0-9_-]+){0,2}):(\d+)>/
        );

        if (command) {
            result += makeToken(tokens, {
                type: "slashCommand",
                name: command[1],
                id: command[2],
            });

            i += command[0].length;
            continue;
        }

        /*
         * --------------------------------------------------------------
         * Timestamp
         * --------------------------------------------------------------
         *
         * <t:1234567890>
         * <t:1234567890:F>
         */
        const timestamp = rest.match(
            /^<t:(-?\d+)(?::([tTdDfFsSR]))?>/
        );

        if (timestamp) {
            result += makeToken(tokens, {
                type: "timestamp",
                timestamp: Number(timestamp[1]),
                style: timestamp[2],
            });

            i += timestamp[0].length;
            continue;
        }

        /*
         * --------------------------------------------------------------
         * Guild navigation
         * --------------------------------------------------------------
         *
         * <id:customize>
         * <id:browse>
         * <id:linked-roles:123>
         */
        const navigation = rest.match(
            /^<id:([a-z-]+)(?::(\d+))?>/i
        );

        if (navigation) {
            result += makeToken(tokens, {
                type: "guildNavigation",
                typeName: navigation[1],
                id: navigation[2],
            });

            i += navigation[0].length;
            continue;
        }

        /*
         * --------------------------------------------------------------
         * @everyone / @here
         * --------------------------------------------------------------
         */
        if (
            source.startsWith("@everyone", i) &&
            !/[A-Za-z0-9_]/.test(
                source[i + "@everyone".length] ?? ""
            )
        ) {
            result += makeToken(tokens, {
                type: "everyone",
            });

            i += "@everyone".length;
            continue;
        }

        if (
            source.startsWith("@here", i) &&
            !/[A-Za-z0-9_]/.test(
                source[i + "@here".length] ?? ""
            )
        ) {
            result += makeToken(tokens, {
                type: "here",
            });

            i += "@here".length;
            continue;
        }

        result += source[i];
        i++;
    }

    return result;
}

/*
 * --------------------------------------------------------------------------
 * Parsing
 * --------------------------------------------------------------------------
 */

function protectUnsupportedGfmSyntax(source: string): string {
    /*
     * Discord supports strikethrough, but not GFM tables, task-list
     * checkboxes, or ordered lists. remark-gfm would otherwise turn those
     * into AST nodes that Discord itself would never render.
     *
     * Escape only syntax that is unambiguously one of those unsupported
     * constructs, and leave ordinary text alone.
     */
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const output = [...lines];

    let inFence = false;
    let fenceChar = "";
    let fenceLength = 0;

    const isFence = (line: string) =>
        line.match(/^ {0,3}(`{3,}|~{3,})(?:.*)?$/);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fence = isFence(line);

        if (fence) {
            if (!inFence) {
                inFence = true;
                fenceChar = fence[1][0];
                fenceLength = fence[1].length;
            } else if (
                fence[1][0] === fenceChar &&
                fence[1].length >= fenceLength
            ) {
                inFence = false;
                fenceChar = "";
                fenceLength = 0;
            }

            continue;
        }

        if (inFence) continue;

        /*
         * Ordered lists are not a Discord Markdown feature.
         *
         * 1. item
         *
         * must remain literal rather than becoming <ol>.
         */
        if (/^ {0,3}\d+[.)]\s+/.test(line)) {
            output[i] = line.replace(
                /^(\s*\d+)([.)])(\s+)/,
                "$1\\$2$3"
            );
            continue;
        }

        /*
         * GFM task-list syntax is not Discord syntax.
         *
         * - [x] item
         * - [ ] item
         */
        if (/^ {0,3}(?:[-*])\s+\[[ xX]\]\s+/.test(line)) {
            output[i] = line.replace(
                /^(\s*[-*]\s+)\[([ xX])\](\s+)/,
                "$1\\[$2\\]$3"
            );
            continue;
        }

        /*
         * GFM tables are detected by a header line followed by a delimiter
         * line. Escape the pipes in the whole contiguous table-looking block
         * so remark cannot construct a table AST.
         */
        const next = lines[i + 1];

        if (
            line.includes("|") &&
            next &&
            /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(
                next
            )
        ) {
            let j = i;

            while (
                j < lines.length &&
                !isFence(lines[j]) &&
                lines[j].trim() !== ""
            ) {
                output[j] = lines[j].replace(/\|/g, "\\|");
                j++;
            }

            i = j - 1;
        }
    }

    return output.join("\n");
}

function prepareSource(
    source: string,
    tokens: DiscordTokenStore
): string {
    const normalized = protectUnsupportedGfmSyntax(
        normalizeDiscordLists(source)
    );

    /*
     * Discord subtext:
     *
     * -# this is subtext
     *
     * We replace the entire line with a token.
     */
    const lines = normalized.split("\n");

    let inFence = false;

    const withSubtext = lines.map((line) => {
        const fence = line.match(
            /^ {0,3}(`{3,}|~{3,})/
        );

        if (fence) {
            inFence = !inFence;
            return line;
        }

        if (
            !inFence &&
            line.startsWith("-# ")
        ) {
            return makeToken(tokens, {
                type: "subtext",
                content: line.slice(3),
            });
        }

        return line;
    });

    return protectDiscordSyntax(
        withSubtext.join("\n"),
        tokens
    );
}

function parseMarkdown(
    source: string
): {
    tree: Root;
    tokens: DiscordTokenStore;
    prepared: string;
} {
    const tokens: DiscordTokenStore = [];

    const prepared = prepareSource(
        source,
        tokens
    );

    const tree = markdown.parse(prepared) as Root;

    markDiscordUnderline(tree, prepared);

    return {
        tree,
        tokens,
        prepared,
    };
}

/*
 * --------------------------------------------------------------------------
 * Discord underline
 * --------------------------------------------------------------------------
 *
 * Remark interprets __foo__ as "strong", because that is standard Markdown.
 *
 * Discord interprets it as underline.
 *
 * We use source positions to distinguish:
 *
 *   **foo**  -> strong
 *   __foo__  -> underline
 *
 * This also handles:
 *
 *   __*foo*__
 *   __**foo**__
 *   __***foo***__
 */

function markDiscordUnderline(
    root: Root,
    source: string
) {
    function visit(node: any) {
        if (
            node.type === "strong" &&
            node.position?.start?.offset != null &&
            node.position?.end?.offset != null
        ) {
            const raw = source.slice(
                node.position.start.offset,
                node.position.end.offset
            );

            if (
                raw.startsWith("__") &&
                raw.endsWith("__")
            ) {
                node.type = "discordUnderline";
            }
        }

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                visit(child);
            }
        }
    }

    visit(root);
}

/*
 * --------------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------------
 */

function safeUrl(
    value: string | undefined
): string | undefined {
    if (!value) return undefined;

    try {
        const url = new URL(value);

        if (
            url.protocol === "http:" ||
            url.protocol === "https:" ||
            url.protocol === "mailto:" ||
            url.protocol === "tel:"
        ) {
            return value;
        }
    } catch {
        // Invalid URL.
    }

    return undefined;
}

function discordEmojiUrl(
    id: string,
    animated: boolean
): string {
    /*
     * Discord recommends WebP for emoji rendering.
     *
     * Animated emoji can use:
     *   .webp?animated=true
     */
    if (animated) {
        return `https://cdn.discordapp.com/emojis/${id}.webp?animated=true`;
    }

    return `https://cdn.discordapp.com/emojis/${id}.webp`;
}

function formatDiscordTimestamp(
    timestamp: number,
    style: string | undefined,
    locale: string
): string {
    const date = new Date(timestamp * 1000);

    if (Number.isNaN(date.getTime())) {
        return String(timestamp);
    }

    switch (style ?? "f") {
        case "t":
            return new Intl.DateTimeFormat(locale, {
                timeStyle: "short",
            }).format(date);

        case "T":
            return new Intl.DateTimeFormat(locale, {
                timeStyle: "medium",
            }).format(date);

        case "d":
            return new Intl.DateTimeFormat(locale, {
                dateStyle: "short",
            }).format(date);

        case "D":
            return new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
            }).format(date);

        case "f":
            return new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
                timeStyle: "short",
            }).format(date);

        case "F":
            return new Intl.DateTimeFormat(locale, {
                dateStyle: "full",
                timeStyle: "short",
            }).format(date);

        case "s":
            return new Intl.DateTimeFormat(locale, {
                dateStyle: "short",
                timeStyle: "short",
            }).format(date);

        case "S":
            return new Intl.DateTimeFormat(locale, {
                dateStyle: "short",
                timeStyle: "medium",
            }).format(date);

        case "R": {
            const delta =
                timestamp -
                Math.floor(Date.now() / 1000);

            const abs = Math.abs(delta);

            let divisor = 1;
            let unit: Intl.RelativeTimeFormatUnit =
                "second";

            if (abs >= 31536000) {
                divisor = 31536000;
                unit = "year";
            } else if (abs >= 2592000) {
                divisor = 2592000;
                unit = "month";
            } else if (abs >= 86400) {
                divisor = 86400;
                unit = "day";
            } else if (abs >= 3600) {
                divisor = 3600;
                unit = "hour";
            } else if (abs >= 60) {
                divisor = 60;
                unit = "minute";
            }

            const value = Math.round(
                delta / divisor
            );

            return new Intl.RelativeTimeFormat(
                locale,
                {
                    numeric: "always",
                }
            ).format(value, unit);
        }

        default:
            return new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
                timeStyle: "short",
            }).format(date);
    }
}

/*
 * --------------------------------------------------------------------------
 * Renderer context
 * --------------------------------------------------------------------------
 */

type RenderContext = {
    tokens: DiscordTokenStore;
    locale: string;

    resolveUser?: (
        id: string
    ) => string | undefined;

    resolveRole?: (
        id: string
    ) => string | undefined;

    resolveChannel?: (
        id: string
    ) => string | undefined;

    resolveEmojiUrl?: (
        id: string,
        animated: boolean
    ) => string | undefined;

    definitions: Map<
        string,
        {
            url: string;
            title?: string | null;
        }
    >;
};

/*
 * --------------------------------------------------------------------------
 * Token rendering
 * --------------------------------------------------------------------------
 */

function renderToken(
    token: DiscordToken,
    key: string,
    context: RenderContext
): ReactNode {
    switch (token.type) {
        case "spoiler": {
            const nested = parseMarkdown(
                token.content
            );

            const nestedContext: RenderContext = {
                ...context,
                tokens: nested.tokens,
            };

            return (
                <label
                    key={key}
                    className="discord-spoiler"
                    role="button"
                    tabIndex={0}
                >
                    <input type="checkbox" />
                    {renderChildren(
                        nested.tree.children,
                        `${key}-spoiler`,
                        nestedContext
                    )}
                </label>
            );
        }

        case "subtext": {
            const nested = parseMarkdown(
                token.content
            );

            const nestedContext: RenderContext = {
                ...context,
                tokens: nested.tokens,
            };

            return (
                <span
                    key={key}
                    className="discord-subtext"
                >
                    {renderChildren(
                        nested.tree.children,
                        `${key}-subtext`,
                        nestedContext
                    )}
                </span>
            );
        }

        case "user": {
            const name =
                context.resolveUser?.(token.id) ??
                token.id;

            return (
                <span
                    key={key}
                    className="discord-mention discord-mention-user"
                    data-id={token.id}
                >
                    @{name}
                </span>
            );
        }

        case "role": {
            const name =
                context.resolveRole?.(token.id) ??
                token.id;

            return (
                <span
                    key={key}
                    className="discord-mention discord-mention-role"
                    data-id={token.id}
                >
                    @{name}
                </span>
            );
        }

        case "channel": {
            const name =
                context.resolveChannel?.(token.id) ??
                token.id;

            return (
                <span
                    key={key}
                    className="discord-mention discord-mention-channel"
                    data-id={token.id}
                >
                    #{name}
                </span>
            );
        }

        case "everyone":
            return (
                <span
                    key={key}
                    className="discord-mention discord-mention-everyone"
                >
                    @everyone
                </span>
            );

        case "here":
            return (
                <span
                    key={key}
                    className="discord-mention discord-mention-here"
                >
                    @here
                </span>
            );

        case "emoji": {
            const src =
                context.resolveEmojiUrl?.(
                    token.id,
                    token.animated
                ) ??
                discordEmojiUrl(
                    token.id,
                    token.animated
                );

            return (
                <img
                    key={key}
                    className="discord-emoji discord-custom-emoji"
                    src={src}
                    alt={`:${token.name}:`}
                    draggable={false}
                />
            );
        }

        case "timestamp": {
            const date = new Date(
                token.timestamp * 1000
            );

            const formatted =
                formatDiscordTimestamp(
                    token.timestamp,
                    token.style,
                    context.locale
                );

            return (
                <time
                    key={key}
                    className="discord-timestamp"
                    dateTime={
                        Number.isNaN(date.getTime())
                            ? undefined
                            : date.toISOString()
                    }
                    title={`<t:${token.timestamp}${
                        token.style
                            ? `:${token.style}`
                            : ""
                    }>`}
                >
                    {formatted}
                </time>
            );
        }

        case "slashCommand":
            return (
                <span
                    key={key}
                    className="discord-slash-command"
                    data-id={token.id}
                >
                    /{token.name}
                </span>
            );

        case "guildNavigation":
            return (
                <span
                    key={key}
                    className="discord-guild-navigation"
                    data-type={token.typeName}
                    data-id={token.id}
                >
                    &lt;id:{token.typeName}
                    {token.id
                        ? `:${token.id}`
                        : ""}
                    &gt;
                </span>
            );
    }
}

/*
 * --------------------------------------------------------------------------
 * Text rendering
 * --------------------------------------------------------------------------
 */

function renderText(
    value: string,
    key: string,
    context: RenderContext
): ReactNode {
    const tokenRegex =
        /\uE000(\d+)\uE001/g;

    const parts: ReactNode[] = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let partIndex = 0;

    while (
        (match = tokenRegex.exec(value)) !== null
    ) {
        if (match.index > lastIndex) {
            parts.push(
                value.slice(
                    lastIndex,
                    match.index
                )
            );
        }

        const tokenIndex = Number(match[1]);
        const token = context.tokens[tokenIndex];

        if (token) {
            parts.push(
                renderToken(
                    token,
                    `${key}-token-${partIndex}`,
                    context
                )
            );
        } else {
            parts.push(match[0]);
        }

        partIndex++;
        lastIndex =
            match.index + match[0].length;
    }

    if (lastIndex < value.length) {
        parts.push(value.slice(lastIndex));
    }

    if (parts.length === 0) {
        return value;
    }

    return parts.map((part, index) => (
        <span
            key={`${key}-${index}`}
            className="discord-text-part"
        >
            {part}
        </span>
    ));
}

/*
 * --------------------------------------------------------------------------
 * Child rendering
 * --------------------------------------------------------------------------
 */

function renderChildren(
    children: any[],
    parentKey: string,
    context: RenderContext
): ReactNode[] {
    return children.map((child, index) =>
        renderNode(
            child,
            `${parentKey}-${index}`,
            context
        )
    );
}

/*
 * --------------------------------------------------------------------------
 * Node renderer
 * --------------------------------------------------------------------------
 */

function renderNode(
    node: any,
    key: string,
    context: RenderContext
): ReactNode {
    switch (node.type) {
        /*
         * --------------------------------------------------------------
         * Text
         * --------------------------------------------------------------
         */
        case "text":
            return renderText(
                node.value ?? "",
                key,
                context
            );

        /*
         * --------------------------------------------------------------
         * Break
         * --------------------------------------------------------------
         */
        case "break":
            return <br key={key} />;

        /*
         * --------------------------------------------------------------
         * Strong
         * --------------------------------------------------------------
         */
        case "strong":
            return (
                <strong key={key}>
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </strong>
            );

        /*
         * --------------------------------------------------------------
         * Italic
         * --------------------------------------------------------------
         */
        case "emphasis":
            return (
                <em key={key}>
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </em>
            );

        /*
         * --------------------------------------------------------------
         * Discord underline
         * --------------------------------------------------------------
         */
        case "discordUnderline":
            return (
                <u key={key}>
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </u>
            );

        /*
         * --------------------------------------------------------------
         * GFM strikethrough
         * --------------------------------------------------------------
         */
        case "delete":
            return (
                <s key={key}>
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </s>
            );

        /*
         * --------------------------------------------------------------
         * Inline code
         * --------------------------------------------------------------
         */
        case "inlineCode":
            return (
                <code
                    key={key}
                    className="discord-inline-code"
                >
                    {node.value}
                </code>
            );

        /*
         * --------------------------------------------------------------
         * Code block
         * --------------------------------------------------------------
         */
        case "code":
            return (
                <pre
                    key={key}
                    className="discord-code-block"
                >
                    <code
                        data-language={
                            node.lang ?? undefined
                        }
                    >
                        {node.value}
                    </code>
                </pre>
            );

        /*
         * --------------------------------------------------------------
         * Link
         * --------------------------------------------------------------
         */
        case "link": {
            const href = safeUrl(node.url);

            if (!href) {
                return (
                    <span key={key}>
                        {renderChildren(
                            node.children,
                            key,
                            context
                        )}
                    </span>
                );
            }

            return (
                <a
                    key={key}
                    href={href}
                    title={node.title ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </a>
            );
        }

        /*
         * --------------------------------------------------------------
         * Link reference
         * --------------------------------------------------------------
         */
        case "linkReference": {
            const definition =
                context.definitions.get(
                    String(node.identifier).toLowerCase()
                );

            if (!definition) {
                return (
                    <span key={key}>
                        {renderChildren(
                            node.children,
                            key,
                            context
                        )}
                    </span>
                );
            }

            const href = safeUrl(
                definition.url
            );

            if (!href) {
                return (
                    <span key={key}>
                        {renderChildren(
                            node.children,
                            key,
                            context
                        )}
                    </span>
                );
            }

            return (
                <a
                    key={key}
                    href={href}
                    title={
                        definition.title ??
                        undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </a>
            );
        }

        /*
         * --------------------------------------------------------------
         * Image
         * --------------------------------------------------------------
         */
        case "image": {
            const src = safeUrl(node.url);

            if (!src) {
                return null;
            }

            return (
                <img
                    key={key}
                    className="discord-image"
                    src={src}
                    alt={node.alt ?? ""}
                    title={node.title ?? undefined}
                />
            );
        }

        /*
         * --------------------------------------------------------------
         * Image reference
         * --------------------------------------------------------------
         */
        case "imageReference": {
            const definition =
                context.definitions.get(
                    String(node.identifier).toLowerCase()
                );

            const src = safeUrl(
                definition?.url
            );

            if (!src) {
                return null;
            }

            return (
                <img
                    key={key}
                    className="discord-image"
                    src={src}
                    alt={node.alt ?? ""}
                    title={
                        definition?.title ??
                        undefined
                    }
                />
            );
        }

        /*
         * --------------------------------------------------------------
         * Paragraph
         * --------------------------------------------------------------
         */
        case "paragraph": {
            /*
             * A -# line becomes a single token inside
             * a paragraph. Give the paragraph the Discord
             * subtext class.
             */
            const onlyChild =
                node.children?.length === 1
                    ? node.children[0]
                    : undefined;

            if (
                onlyChild?.type === "text" &&
                /^\uE000\d+\uE001$/.test(
                    onlyChild.value
                )
            ) {
                const tokenIndex = Number(
                    onlyChild.value.match(
                        /\uE000(\d+)\uE001/
                    )?.[1]
                );

                const token =
                    context.tokens[tokenIndex];

                if (token?.type === "subtext") {
                    return (
                        <p
                            key={key}
                            className="discord-subtext"
                        >
                            {renderToken(
                                token,
                                key,
                                context
                            )}
                        </p>
                    );
                }
            }

            return (
                <p key={key}>
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </p>
            );
        }

        /*
         * --------------------------------------------------------------
         * Heading
         * --------------------------------------------------------------
         */
        case "heading": {
            /*
             * Discord currently documents #, ## and ###.
             *
             * We still safely render deeper Markdown headings.
             */
            const level = Number(node.depth) || 1;

            const children = renderChildren(
                node.children,
                key,
                context
            );

            /*
             * Discord documents only #, ## and ### headings.
             * Deeper ATX headings are therefore treated as ordinary text.
             */
            if (level > 3) {
                return (
                    <p key={key}>
                        {"#".repeat(level)}{" "}
                        {children}
                    </p>
                );
            }

            switch (level) {
                case 1:
                    return <h1 key={key}>{children}</h1>;
                case 2:
                    return <h2 key={key}>{children}</h2>;
                default:
                    return <h3 key={key}>{children}</h3>;
            }
        }

        /*
         * --------------------------------------------------------------
         * Block quote
         * --------------------------------------------------------------
         */
        case "blockquote":
            return (
                <blockquote
                    key={key}
                    className="discord-blockquote"
                >
                    {renderChildren(
                        node.children,
                        key,
                        context
                    )}
                </blockquote>
            );

        /*
         * --------------------------------------------------------------
         * Lists
         * --------------------------------------------------------------
         *
         * Remark has already built the correct nested tree.
         *
         * Example:
         *
         * - one
         *   - two
         *
         * becomes:
         *
         * list
         *   listItem
         *     paragraph
         *     list
         *       listItem
         */
        case "list": {
            const Tag = node.ordered
                ? "ol"
                : "ul";

            return (
                <Tag
                    key={key}
                    start={
                        node.ordered &&
                        typeof node.start === "number" &&
                        node.start !== 1
                            ? node.start
                            : undefined
                    }
                >
                    {node.children.map(
                        (
                            item: any,
                            index: number
                        ) =>
                            renderListItem(
                                item,
                                `${key}-${index}`,
                                context
                            )
                    )}
                </Tag>
            );
        }

        /*
         * --------------------------------------------------------------
         * Thematic break
         * --------------------------------------------------------------
         */
        case "thematicBreak":
            return <hr key={key} />;

        /*
         * --------------------------------------------------------------
         * GFM task list item
         * --------------------------------------------------------------
         */
        case "listItem": {
            return renderListItem(
                node,
                key,
                context
            );
        }

        /*
         * --------------------------------------------------------------
         * GFM table
         * --------------------------------------------------------------
         */
        case "table": {
            /*
             * protectUnsupportedGfmSyntax() normally prevents this node.
             * Keep a defensive fallback in case the parser receives an AST
             * containing a table anyway: Discord does not render HTML tables.
             */
            return (
                <span key={key}>
                    {node.children.map(
                        (row: any, rowIndex: number) => (
                            <span key={`${key}-row-${rowIndex}`}>
                                {row.children.map(
                                    (cell: any, cellIndex: number) => (
                                        <span
                                            key={`${key}-${rowIndex}-${cellIndex}`}
                                        >
                                            {cellIndex > 0 ? " | " : ""}
                                            {renderChildren(
                                                cell.children,
                                                `${key}-${rowIndex}-${cellIndex}`,
                                                context
                                            )}
                                        </span>
                                    )
                                )}
                                {rowIndex < node.children.length - 1
                                    ? <br />
                                    : null}
                            </span>
                        )
                    )}
                </span>
            );
        }

        /*
         * --------------------------------------------------------------
         * HTML
         * --------------------------------------------------------------
         *
         * Do NOT use dangerouslySetInnerHTML.
         *
         * Discord messages are user-controlled content and this renderer
         * intentionally treats raw HTML as text.
         */
        case "html":
            return node.value ?? "";

        /*
         * --------------------------------------------------------------
         * Unknown/custom nodes
         * --------------------------------------------------------------
         */
        default:
            if (
                Array.isArray(node.children)
            ) {
                return (
                    <span key={key}>
                        {renderChildren(
                            node.children,
                            key,
                            context
                        )}
                    </span>
                );
            }

            if (
                typeof node.value === "string"
            ) {
                return node.value;
            }

            return null;
    }
}

/*
 * --------------------------------------------------------------------------
 * List item renderer
 * --------------------------------------------------------------------------
 */

function renderListItem(
    node: any,
    key: string,
    context: RenderContext
): ReactNode {
    const children = node.children ?? [];

    /*
     * Discord does not render GFM task-list checkboxes. The source has
     * already been escaped before parsing, so this is just a normal <li>.
     */
    return (
        <li key={key}>
            {renderChildren(
                children,
                key,
                context
            )}
        </li>
    );
}

/*
 * --------------------------------------------------------------------------
 * Main component
 * --------------------------------------------------------------------------
 */

export function DiscordMarkdown({
    children,
    resolveUser,
    resolveRole,
    resolveChannel,
    resolveEmojiUrl,
    locale = "en-US",
}: DiscordMarkdownProps) {
    const {
        tree,
        tokens,
    } = parseMarkdown(children);

    /*
     * Reference definitions are global to the document.
     */
    const definitions = new Map<
        string,
        {
            url: string;
            title?: string | null;
        }
    >();

    function collectDefinitions(
        node: any
    ) {
        if (node.type === "definition") {
            definitions.set(
                String(node.identifier).toLowerCase(),
                {
                    url: node.url,
                    title: node.title,
                }
            );
        }

        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                collectDefinitions(child);
            }
        }
    }

    collectDefinitions(tree);

    const context: RenderContext = {
        tokens,
        locale,
        resolveUser,
        resolveRole,
        resolveChannel,
        resolveEmojiUrl,
        definitions,
    };

    return (
        <div className="discord-markdown">
            {renderChildren(
                tree.children,
                "discord",
                context
            )}
        </div>
    );
}