"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

export interface MenuOption<T extends string = string> {
    value: T;
    title: string;
    description?: string;
    label?: string;
    icon?: ReactNode;
}

interface MenuSelectProps<T extends string> {
    id?: string;
    title?: string;
    value: T;
    options: readonly MenuOption<T>[] | MenuOption<T>[];
    onChange: (value: T) => void;
    triggerValue?: (selectedOption: MenuOption<T>) => ReactNode;
    optionIcon?: (option: MenuOption<T>) => ReactNode;
    className?: string;
    anchor?: "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br" | "s" | "e" | "st" | "sb" | "et" | "eb";
}

export default function MenuSelect<T extends string>({
    id,
    title,
    value,
    options,
    onChange,
    triggerValue,
    optionIcon,
    className = "",
    anchor = "st",
}: MenuSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((item) => item.value === value) ?? options[0];

    return (
        <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
            <button
                type="button"
                className={`menu-trigger ${className} ${id} ${isOpen ? "clicked" : ""}`}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                {triggerValue ? triggerValue(selectedOption) : (selectedOption.label ?? selectedOption.title)}
            </button>

            <div className={`menu anchor-${anchor} ${id}-options ${isOpen ? "visible" : ""}`}>
                {title && <div className="menu-title">{title}</div>}
                {options.map((item) => {
                    const hasIcon = Boolean(optionIcon || item.icon);
                    const isSelected = item.value === value;

                    return (
                        <div
                            key={item.value}
                            onClick={() => {
                                onChange(item.value);
                                setIsOpen(false);
                            }}
                            className={`menu-option ${isSelected ? "selected" : ""}`}
                        >
                            {isSelected ? (
                                <span className="menu-option-icon icon">
                                    check
                                </span>
                            ) : hasIcon ? (
                                <span className="menu-option-icon icon">
                                    {optionIcon ? optionIcon(item) : item.icon}
                                </span>
                            ) : null}
                            <div>
                                <div className="menu-option-label">{item.title}</div>
                                {item.description && <div className="menu-option-desc">{item.description}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}