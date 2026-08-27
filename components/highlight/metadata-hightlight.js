const escapeHtml = (str) => str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const span = (className, textValue, kind = "", id = -1, depth = 0, pos = -1) => {
    if (kind === "open" || kind === "close") {
        return `<span class="${className} ${kind}-bracket bracket-level-${depth % 3}" data-bid="${id}" data-pos="${pos}">${escapeHtml(textValue)}</span>`;
    }

    const position = pos >= 0 ? ` data-pos="${pos}"` : "";
    return `<span class="${className}"${position}>${escapeHtml(textValue)}</span>`;
};

// Nothing currently