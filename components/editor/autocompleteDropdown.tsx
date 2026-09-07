"use client";

import { isCI } from "next/dist/server/ci-info";
import { useEffect, useState, useRef } from "react";
import { useDiscordUser } from "../DiscordUser";

export interface SuggestionItem {
    label: string;
    type: "macro" | "variant" | "flag" | "tile";
    builtin?: boolean;
    detail: string | null;
}

interface AutocompleteProps {
    isOpen: boolean;
    query: string;
    suggestions: SuggestionItem[];
    position: { top: number; left: number };
    triggerChar?: string;
    onSelect: (item: SuggestionItem) => void;
    onClose: () => void;
}

function MacroCreator({ id }: { id: string }) {
    const user = useDiscordUser(id);
    return <p>@{user?.username ?? id}</p>;
}

export function AutocompleteDropdown({
    isOpen,
    query,
    suggestions,
    position,
    triggerChar,
    onSelect,
    onClose,
}: AutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const filtered = suggestions.filter((item) => 
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    const visibleSuggestions = filtered.slice(0, 12);
    
    useEffect(() => setSelectedIndex(0), [query, suggestions]);

        useEffect(() => {
        if (!isOpen) return;
        const activeEl = itemRefs.current[selectedIndex];
        const container = dropdownRef.current;

        if (activeEl && container) {
            const elTop = activeEl.offsetTop;
            const elBottom = elTop + activeEl.offsetHeight;
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            if (elTop < containerTop) {
                container.scrollTop = elTop;
            } else if (elBottom > containerBottom) {
                container.scrollTop = elBottom - container.clientHeight;
            }
        }
    }, [selectedIndex, isOpen]);

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
                if (visibleSuggestions[selectedIndex])
                    onSelect(visibleSuggestions[selectedIndex]);
            }
            else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen || visibleSuggestions.length === 0) return null;

    return (
        <div
            ref={dropdownRef}
            className="ac-dropdown inset-scrollbar"
            style={{ top: position.top, left: position.left }}
        >
            {visibleSuggestions.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <div
                        key={`${index}-${item.type}-${item.label}`}
                        ref={(el) => {
                            itemRefs.current[index] = el;
                        }}
                        className={`ac-dropdown-option ${item.type}-name ${isSelected ? "selected" : ""}`}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onSelect(item);
                        }}
                    >
                        <span className="flex gap-[4px]">
                            {item.type === "macro"
                                ? <span className="custom icon ac-icon">macrosia</span>
                                : item.type === "variant"
                                ? <span className="icon ac-icon">format_paint</span>
                                : item.type === "flag"
                                ? <span className="icon ac-icon">flag</span>
                                : ""
                            }
                            <span>
                                {item.type === "variant" ? (triggerChar || ":") : ""}
                                {item.label}
                            </span>
                        </span>
                        {item.detail && (item.type === "macro" && !item.builtin
                            ? <MacroCreator id={item.detail} />
                            : <p>{item.detail}</p>)}
                    </div>
                );
            })}
        </div>
    );
}