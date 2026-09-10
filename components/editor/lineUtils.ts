export function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
}

export function normalizeNewlines(value: string) {
    return value.replace(/\r\n?/g, "\n");
}

export function lineStartOf(value: string, pos: number) {
    return value.lastIndexOf("\n", pos - 1) + 1;
}
