interface Window {
    executionMode?: string;
    searchSelection?: "tile" | "macro" | "filter" | "overlay";
}

export {};

declare global {
    interface Window {
        updateMacroStaticHighlight: (
            element: HTMLElement,
            value: string
        ) => void;
    }
}