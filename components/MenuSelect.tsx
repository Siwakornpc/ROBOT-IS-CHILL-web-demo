"use client";

import { useEffect, useRef, useState, ReactNode, CSSProperties, FocusEvent, MouseEvent as ReactMouseEvent } from "react";

export type MenuAnchor = "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br" | "s" | "e" | "st" | "sb" | "et" | "eb";

export interface MenuOption<T extends string = string> {
    value: T;
    label: string;
    description?: string;
    icon?: ReactNode;
    children?: MenuOption<T>[];
}

interface MenuItemProps<T extends string> {
    item: MenuOption<T>;
    selectedValue: T;
    onChange: (value: T) => void;
    onCloseAll: () => void;
    optionIcon?: (option: MenuOption<T>) => ReactNode;
    submenuAnchor?: MenuAnchor;
}

// recursive component for rendering individual menu items and their submenus
function MenuItem<T extends string>({
    item,
    selectedValue,
    onChange,
    onCloseAll,
    optionIcon,
    submenuAnchor = "st",
}: MenuItemProps<T>) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isSelected = item.value === selectedValue;

    const rawIcon = optionIcon ? optionIcon(item) : item.icon;

    const renderIcon = () => {
        if (isSelected) {
            return <i className="icon menu-option-icon">check</i>;
        }

        if (rawIcon) {
            if (typeof rawIcon === "string") {
                return <i className="icon menu-option-icon">{rawIcon}</i>;
            }
            return rawIcon;
        }

        return null;
    };

    return (
        <div
            className="menu-option-wrapper"
            style={{ position: "relative" }}
            onMouseEnter={() => hasChildren && setIsSubmenuOpen(true)}
            onMouseLeave={() => hasChildren && setIsSubmenuOpen(false)}
        >
            <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                    if (hasChildren) {
                        setIsSubmenuOpen((prev) => !prev);
                    } else {
                        onChange(item.value);
                        onCloseAll();
                    }
                }}
                className={`menu-option ${isSelected ? "selected" : ""}`}
            >
                {renderIcon()}
                
                <div>
                    <div className="menu-option-label">{item.label}</div>
                    {item.description && <div className="menu-option-desc">{item.description}</div>}
                </div>

                {hasChildren && <i className="icon menu-option-menu-icon">arrow_right</i>}
            </div>

            {/* Render nested children recursively */}
            {hasChildren && isSubmenuOpen && (
                <div className={`menu submenu-popout anchor-${submenuAnchor} visible`}>
                    {item.children!.map((child) => (
                        <MenuItem
                            key={child.value}
                            item={child}
                            selectedValue={selectedValue}
                            onChange={onChange}
                            onCloseAll={onCloseAll}
                            optionIcon={optionIcon}
                            submenuAnchor={submenuAnchor}
                        />
                    ))}
                </div>
            )}
        </div>
    );
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
    anchor?: MenuAnchor;
    submenuAnchor?: MenuAnchor;
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
    submenuAnchor = "st",
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

    // prevents input clicks from toggling the menu closed for text input menus
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
                    {triggerValue ? triggerValue(selectedOption) : selectedOption.label}
                </button>
            )}

            <div className={`menu anchor-${anchor} ${id}-options ${isOpen ? "visible" : ""}`}>
                {title && <div className="menu-title">{title}</div>}
                {options.map((item) => (
                    <MenuItem
                        key={item.value}
                        item={item}
                        selectedValue={value}
                        onChange={onChange}
                        onCloseAll={() => setIsOpen(false)}
                        optionIcon={optionIcon}
                        submenuAnchor={submenuAnchor}
                    />
                ))}
            </div>
        </div>
    );
}