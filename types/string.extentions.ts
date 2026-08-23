declare global {
    interface String {
        toTitleCase(): string;
    }
}

String.prototype.toTitleCase = function (): string {
    return this.toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
};

export {};