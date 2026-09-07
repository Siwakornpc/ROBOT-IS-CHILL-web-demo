"use client";

import { isCI } from "next/dist/server/ci-info";
import { useEffect, useState, useRef } from "react";

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
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const filtered = suggestions.filter((item) => 
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    const visibleSuggestions = filtered.slice(0, 12);

    useEffect(() => setSelectedIndex(0), [query, suggestions]);

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (visibleSuggestions.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => 
                    (prev + 1) % visibleSuggestions.length
                );
            }
            else if (e.key == "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => 
                    (prev - 1 + visibleSuggestions.length) % visibleSuggestions.length
                );
            }
            else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (visibleSuggestions[selectedIndex]) {
                    onSelect(visibleSuggestions[selectedIndex]);
                }
            }
            else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown, true);
        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [isOpen, visibleSuggestions, selectedIndex, onSelect, onClose])

    useEffect(() => {
        if (!isOpen) return;
        
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current
                && !dropdownRef.current.contains(e.target as Node)
            ) onClose();
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen || visibleSuggestions.length === 0) return null;

    return (
        <div
            ref={dropdownRef}
            className="autocomplete-dropdown"
            style={{ top: position.top, left: position.left }}
        >
            {visibleSuggestions.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <div
                        key={`${index}-${item.type}-${item.label}`}
                        className={`autocomplete-dropdown-option ${isSelected ? "selected" : ""}`}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onSelect(item);
                        }}
                    >
                        <span style={{ color: item.type === "macro"
                            ? "var(--macro-name)"
                            : item.type === "variant"
                            ? "var(--variant-name)"
                            : undefined }}
                        >{item.type === "variant" && ":"}{item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}