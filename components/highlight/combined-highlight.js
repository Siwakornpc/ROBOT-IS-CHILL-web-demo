// Merges renderHighlighter (variant/flag syntax) and macroHighlighter
// (bracket syntax) into one highlight pass.
//
// The two highlighters disagree about what "..." means once a "[" shows up
// (render just keeps matching value chars through it; macro doesn't know
// about ":name/value" at all), so we don't run them independently on the
// full string. Instead:
//
//   1. findTopLevelBrackets() tells us where the real (non-escaped) [...]
//      regions are, using the exact same escape-aware scan macroHighlighter
//      already uses internally to find matching brackets.
//   2. Everything OUTSIDE those regions is render syntax -> sliced out and
//      run through renderHighlighter().
//   3. Everything INSIDE those regions is macro syntax -> pulled from
//      macroHighlightSegments(), which tokenizes the *whole* original text
//      once (so data-pos/data-bid stay correct/globally unique) and hands
//      back {start, end, html} pieces we can filter by range.

import { findTopLevelBrackets, macroHighlightSegments } from "./macro-highlight.js";
import { renderHighlighter } from "./render-highlight.js";

export const combinedHighlighter = (text) => {
    const brackets = findTopLevelBrackets(text);
    const segments = macroHighlightSegments(text);

    let result = "";
    let cursor = 0;

    for (const [start, end] of brackets) {
        if (start > cursor) {
            result += renderHighlighter(text.slice(cursor, start));
        }

        result += segments
            .filter((seg) => seg.start >= start && seg.end <= end + 1)
            .map((seg) => seg.html)
            .join("");

        cursor = end + 1;
    }

    if (cursor < text.length) {
        result += renderHighlighter(text.slice(cursor));
    }

    return result;
};
