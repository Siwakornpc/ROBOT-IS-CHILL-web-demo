"use client";

import { useEffect, useState } from "react";

export interface SuggestionItem {
    label: string;
    type: "macro" | "variant" | "tile";
}

interface AutocompleteProps {
    isOpen: boolean;
    query: string;
    suggestions: SuggestionItem[];
    position: { top: number; left: number };
    onSelect: (item: SuggestionItem) => void;
    onClose: () => void;
}

export function AutocompleteDropdown({
    isOpen,
    query,
    suggestions,
    position,
    onSelect,
    onClose,
}: AutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filtered = suggestions.filter((item) => item.label
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    useEffect(() => setSelectedIndex(0), [query]);

    if (!isOpen || filtered.length === 0) return null;

    return (
        <div
            className="autocomplete-dropdown"
            style={{ top: position.top, left: position.left }}
        >
            {filtered.slice(0, 50).map((item, index) => (
                <div
                    key={item.label}
                    style={{
                        padding: "6px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: index === selectedIndex ? "var(--surface-hovered)" : "transparent",
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <span style={{ color: item.type === "macro"
                        ? "var(--macro-name)"
                        : item.type === "variant"
                        ? "var(--variant-name)"
                        : undefined }}
                    >{item.type === "variant" && ":"}{item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}