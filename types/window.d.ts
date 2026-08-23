interface Window {
    executionMode?: string;
    searchSelection?: "tile" | "macro" | "filter" | "overlay";
}

declare global {
    interface String {
        toTitleCase(): string;
    }
}

String.prototype.toTitleCase = function (str: string): string {
    return this.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export {};