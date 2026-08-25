"use client";

import { useEffect, useRef, useState, ReactNode, CSSProperties, FocusEvent, MouseEvent as ReactMouseEvent, cloneElement, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

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
    pageMargin?: number;
}

function MenuItem<T extends string>({
    item,
    selectedValue,
    onChange,
    onCloseAll,
    optionIcon,
    submenuAnchor = "st",
    pageMargin = 12,
}: MenuItemProps<T>) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; flipLeft: boolean; flipUp: boolean }>({ top: 0, left: 0, flipLeft: false, flipUp: false });

    const itemRef = useRef<HTMLDivElement>(null);
    const submenuRef = useRef<HTMLDivElement>(null);

    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isSelected = item.value === selectedValue;
    const rawIcon = optionIcon ? optionIcon(item) : item.icon;

    useLayoutEffect(() => {
        if (isSubmenuOpen && itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            const submenuEl = submenuRef.current;

            const menuWidth = submenuEl?.offsetWidth || 200;
            const menuHeight = submenuEl?.offsetHeight || 156;

            const spaceRight = window.innerWidth - rect.right - pageMargin;
            const spaceLeft = rect.left - pageMargin;
            const spaceBelow = window.innerHeight - rect.bottom - pageMargin;
            const spaceAbove = rect.top - pageMargin;

            const flipUp = spaceBelow < 120 && spaceAbove > spaceBelow;
            const flipLeft = spaceRight < menuWidth && spaceLeft > spaceRight;

            const top = flipUp ? Math.max(pageMargin, rect.bottom - menuHeight) : rect.top;
            const left = flipLeft ? Math.max(pageMargin, rect.left - menuWidth) : rect.right;

            setCoords({ top, left, flipLeft, flipUp });
        }
    }, [isSubmenuOpen, pageMargin]);

    const handleItemClick = (e: ReactMouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (hasChildren) {
            setIsSubmenuOpen((prev) => !prev);
        } else {
            onChange(item.value);
            setIsSubmenuOpen(false);
            onCloseAll();
        }
    };

    const renderIcon = () => {
        if (isSelected) return <i className="icon menu-option-icon">check</i>;
        if (rawIcon) {
            if (typeof rawIcon === "string") return <i className="icon menu-option-icon">{rawIcon}</i>;
            return cloneElement(rawIcon as any, {
                className: `${(rawIcon as any).props?.className || ''} menu-option-icon`.trim()
            });
        }
        return null;
    };

    return (
        <div
            ref={itemRef}
            className="menu-option-wrapper"
            onMouseEnter={() => {
                // ignore hover events for mobile devices
                if (window.matchMedia("(pointer: coarse)").matches) return;
                if (hasChildren) setIsSubmenuOpen(true);
            }}
            onMouseLeave={() => {
                if (window.matchMedia("(pointer: coarse)").matches) return;
                setIsSubmenuOpen(false);
            }}
        >
            <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleItemClick}
                className={`menu-option ${isSelected ? "selected" : ""} ${isSubmenuOpen ? "hover-active" : ""}`}
            >
                {renderIcon()}

                <div>
                    <div className="menu-option-label">{item.label}</div>
                    {item.description && <div className="menu-option-desc">{item.description}</div>}
                </div>

                {hasChildren && <i className="icon menu-option-menu-icon">arrow_right</i>}
            </div>

            {hasChildren && isSubmenuOpen && typeof document !== "undefined" && createPortal(
                <div
                    ref={submenuRef}
                    className={`menu submenu-popout ascroll-y inset-scrollbar visible ${coords.flipUp ? "anchor-sb" : "anchor-st"}`}
                    style={{
                        position: "fixed",
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        zIndex: 9999,
                    }}
                    onMouseEnter={() => setIsSubmenuOpen(true)}
                    onMouseLeave={() => setIsSubmenuOpen(false)}
                >
                    {item.children!.map((child) => (
                        <MenuItem
                            key={child.value}
                            item={child}
                            selectedValue={selectedValue}
                            onChange={onChange}
                            onCloseAll={onCloseAll}
                            optionIcon={optionIcon}
                            submenuAnchor={submenuAnchor}
                            pageMargin={pageMargin}
                        />
                    ))}
                </div>,
                document.body
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
    pageMargin?: number;
    forceDirectionDown?: boolean;
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
    pageMargin = 12,
    forceDirectionDown = false,
}: MenuSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeAnchor, setActiveAnchor] = useState<MenuAnchor>(anchor);
    const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (isOpen && wrapperRef.current && menuRef.current) {
            const anchorRect = wrapperRef.current.getBoundingClientRect();

            // Mobile detection check
            const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768;

            const spaceBelow = window.innerHeight - anchorRect.bottom - pageMargin;
            const spaceAbove = anchorRect.top - pageMargin;

            let shouldFlipUp = !forceDirectionDown && (spaceBelow < 100 && spaceAbove > spaceBelow);

            if (isMobile && forceDirectionDown) shouldFlipUp = false;

            let resolvedAnchor = anchor;
            if (shouldFlipUp) resolvedAnchor = anchor.startsWith("b") ? (anchor.replace("b", "t") as MenuAnchor) : "tl";
            else resolvedAnchor = anchor;

            setActiveAnchor(resolvedAnchor);

            const targetSpace = shouldFlipUp ? spaceAbove : spaceBelow;
            setMaxHeight(Math.max(120, targetSpace));
        }
    }, [isOpen, anchor, pageMargin, options, forceDirectionDown]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                // don't close if clicking inside a submenu
                const isPortalClick = (event.target as HTMLElement).closest(".submenu-popout");
                if (!isPortalClick) {
                    setIsOpen(false);
                }
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
                    className={`menu-trigger ${className} ${id || ""} ${isOpen ? "clicked" : ""}`}
                    onClick={toggleMenu}
                >
                    {triggerValue ? triggerValue(selectedOption) : selectedOption.label}
                </button>
            )}

            <div
                ref={menuRef}
                className={`menu ascroll-y inset-scrollbar anchor-${activeAnchor} ${id ? `${id}-options` : ""} ${isOpen ? "visible" : ""}`}
                style={{
                    maxHeight: maxHeight ? `${maxHeight}px` : undefined,
                }}
            >
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
                        pageMargin={pageMargin}
                    />
                ))}
            </div>
        </div>
    );
}