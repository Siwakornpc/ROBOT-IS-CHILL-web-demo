export type LineColumn = {
    lineIndex: number;
    column: number;
};

// converts a global offset into a 'value' into a line/column pair.
export function offsetToLineColumn(lines: string[], offset: number): LineColumn {
    let remaining = offset;

    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length;

        if (remaining <= lineLength) {
            return { lineIndex: i, column: remaining };
        }

        remaining -= lineLength + 1; // + 1 is for "\n" that joins this line to next
    }

    const lastIndex = Math.max(lines.length - 1, 0);
    return { lineIndex: lastIndex, column: lines[lastIndex]?.length ?? 0 };
}

// converts a line/column pair into a global offset into a 'value'
export function lineColumnToOffset(lines: string[], lineIndex: number, column: number) {
    let offset = 0;

    for (let i = 0; i < lineIndex; i++) {
        offset += lines[i]?.length + 1;
    }

    return offset + column;
}
