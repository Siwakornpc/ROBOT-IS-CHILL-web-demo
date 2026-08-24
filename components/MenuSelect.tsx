"use client";

import { useEffect, useRef, useState, ReactNode, CSSProperties, FocusEvent, MouseEvent as ReactMouseEvent, cloneElement } from "react";
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
    const [activeAnchor, setActiveAnchor] = useState<MenuAnchor>(submenuAnchor);
    const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const submenuRef = useRef<HTMLDivElement>(null);

    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isSelected = item.value === selectedValue;
    const rawIcon = optionIcon ? optionIcon(item) : item.icon;

    // compare available space on each side of the menu
    useEffect(() => {
        if (isSubmenuOpen && wrapperRef.current) {
            const anchorRect = wrapperRef.current.getBoundingClientRect();
            const submenuElement = submenuRef.current;

            const menuWidth = submenuElement?.offsetWidth || 240;
            const menuHeight = submenuElement?.offsetHeight || 148;

            // space available on each side
            const spaceRight = window.innerWidth - anchorRect.right - pageMargin;
            const spaceLeft = anchorRect.left - pageMargin;

            const spaceBelow = window.innerHeight - anchorRect.top - pageMargin;
            const spaceAbove = anchorRect.bottom - pageMargin;

            // only flip if overflowing boundary
            const shouldFlipLeft = spaceRight < menuWidth && spaceLeft > spaceRight;
            const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

            let resolvedAnchor = submenuAnchor;
            if (shouldFlipUp && shouldFlipLeft) resolvedAnchor = "eb";
            else if (shouldFlipLeft) resolvedAnchor = "et";
            else if (shouldFlipUp) resolvedAnchor = "sb";
            else resolvedAnchor = "st";

            setActiveAnchor(resolvedAnchor);

            // calculate fixed position on viewport for portal
            const top = shouldFlipUp ? anchorRect.bottom - menuHeight : anchorRect.top;
            const left = shouldFlipLeft ? anchorRect.left - menuWidth : anchorRect.right;

            setCoords({ top, left });

            const targetSpace = shouldFlipUp ? spaceAbove : spaceBelow;
            setMaxHeight(Math.max(100, targetSpace));
        } else {
            setActiveAnchor(submenuAnchor);
            setMaxHeight(undefined);
        }
    }, [isSubmenuOpen, submenuAnchor, pageMargin]);

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
            ref={wrapperRef}
            className="menu-option-wrapper"
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

            {hasChildren && isSubmenuOpen && typeof document !== "undefined" && createPortal(
                <div
                    ref={submenuRef}
                    className={`menu submenu-popout ascroll-y inset-scrollbar anchor-${activeAnchor} visible`}
                    style={{
                        position: "fixed",
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
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
}: MenuSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeAnchor, setActiveAnchor] = useState<MenuAnchor>(anchor);
    const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Compare available space on each side of the top-level menu trigger
    useEffect(() => {
        if (isOpen && wrapperRef.current && menuRef.current) {
            const anchorRect = wrapperRef.current.getBoundingClientRect();
            const menuElement = menuRef.current;

            const menuWidth = menuElement.offsetWidth;
            const menuHeight = menuElement.offsetHeight;

            const spaceRight = window.innerWidth - anchorRect.left - pageMargin;
            const spaceLeft = anchorRect.right - pageMargin;
            const spaceBelow = window.innerHeight - anchorRect.bottom - pageMargin;
            const spaceAbove = anchorRect.top - pageMargin;

            const shouldFlipLeft = spaceRight < menuWidth && spaceLeft > spaceRight;
            const shouldFlipUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

            let resolvedAnchor = anchor;
            if (shouldFlipUp && shouldFlipLeft) resolvedAnchor = "tr";
            else if (shouldFlipLeft) resolvedAnchor = "br";
            else if (shouldFlipUp) resolvedAnchor = "tl";
            else resolvedAnchor = anchor;

            setActiveAnchor(resolvedAnchor);

            const targetSpace = shouldFlipUp ? spaceAbove : spaceBelow;
            setMaxHeight(Math.max(100, targetSpace));
        } else {
            setActiveAnchor(anchor);
            setMaxHeight(undefined);
        }
    }, [isOpen, anchor, pageMargin]);

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
    const selectedOptionLabel = options.find((item) => item.value === value) ?? options[1];
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
                    className={`menu-trigger ${className} ${id || ""} ${isOpen ? "clicked" : ""}`}
                    onClick={toggleMenu}
                >
                    {triggerValue ? <span>triggerValue(selectedOptionLabel)</span> : selectedOptionLabel.label}
                </button>
            )}

            <div
                ref={menuRef}
                className={`menu ascroll-y inset-scrollbar anchor-${activeAnchor} ${id ? `${id}-options` : ""} ${isOpen ? "visible" : ""}`}
                style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
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