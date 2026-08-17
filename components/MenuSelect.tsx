"use client";

import { useEffect, useRef, useState, ReactNode, CSSProperties, FocusEvent, MouseEvent as ReactMouseEvent } from "react";

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
    trigger?: (props: {
        isOpen: boolean;
        toggle: () => void;
        open: () => void;
        close: () => void;
        setIsOpen: (open: boolean) => void;
        selectedOption: MenuOption<T>;
        getInputProps: (customProps?: Record<string, any>) => Record<string, any>;
    }) => ReactNode;
    optionIcon?: (option: MenuOption<T>) => ReactNode;
    className?: string;
    style?: CSSProperties;
    anchor?: "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br" | "s" | "e" | "st" | "sb" | "et" | "eb";
}

export default function MenuSelect<T extends string>({
    id,
    title,
    value,
    options,
    onChange,
    triggerValue,
    trigger,
    optionIcon,
    className = "",
    style,
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
    const toggleMenu = () => setIsOpen((prev) => !prev);
    const openMenu = () => setIsOpen(true);
    const closeMenu = () => setIsOpen(false);

    // open when any child input element receives focus
    const handleFocusCapture = (e: FocusEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            setIsOpen(true);
        }
    };

    // prevents input clicks from toggling the menu closed
    const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            setIsOpen(true);
        }
    };

    // optional thing to spread onto custom input triggers
    const getInputProps = (customProps: Record<string, any> = {}) => ({
        onFocus: openMenu,
        onClick: openMenu,
        ...customProps,
    });

    return (
        <div
            className="menu-wrapper"
            ref={wrapperRef}
            style={style}
            onFocusCapture={handleFocusCapture}
            onClickCapture={handleClickCapture}
        >
            {trigger ? (
                trigger({
                    isOpen,
                    toggle: toggleMenu,
                    open: openMenu,
                    close: closeMenu,
                    setIsOpen,
                    selectedOption,
                    getInputProps,
                })
            ) : (
                <button
                    type="button"
                    className={`menu-trigger ${className} ${id} ${isOpen ? "clicked" : ""}`}
                    onClick={toggleMenu}
                >
                    {triggerValue ? triggerValue(selectedOption) : (selectedOption.label ?? selectedOption.title)}
                </button>
            )}

            <div className={`menu anchor-${anchor} ${id}-options ${isOpen ? "visible" : ""}`}>
                {title && <div className="menu-title">{title}</div>}
                {options.map((item) => {
                    const hasIcon = Boolean(optionIcon || item.icon);
                    const isSelected = item.value === value;

                    return (
                        <div
                            key={item.value}
                            onMouseDown={(e) => e.preventDefault()}
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