"use client";

import {
    useEffect,
    useRef,
    useState,
    useMemo,
    ReactNode,
    CSSProperties,
    FocusEvent,
    MouseEvent as ReactMouseEvent,
    KeyboardEvent as ReactKeyboardEvent,
    cloneElement,
    useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";

export type MenuAnchor = "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br" | "s" | "e" | "st" | "sb" | "et" | "eb";

export interface MenuOption<T extends string = string> {
    value: T;
    label: string;
    description?: string;
    icon?: ReactNode;
    disabled?: boolean;
    children?: MenuOption<T>[];
}

/** Cheap shared hook so every item/menu isn't calling matchMedia on every hover. */
function useIsCoarsePointer() {
    const [isCoarse, setIsCoarse] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia("(pointer: coarse)");
        setIsCoarse(mql.matches);
        const handler = (e: MediaQueryListEvent) => setIsCoarse(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, []);
    return isCoarse;
}

/** Maps a starting anchor to the initial (pre-flip) top/left side, matching the CSS anchor-* rules. */
function initialSideFromAnchor(anchor: MenuAnchor): { side: "right" | "left" | "bottom" | "top" } {
    if (anchor === "l" || anchor === "tl" || anchor === "bl") return { side: "left" };
    if (anchor === "r" || anchor === "tr" || anchor === "br" || anchor === "e" || anchor === "et" || anchor === "eb") return { side: "right" };
    if (anchor === "s" || anchor === "st" || anchor === "sb") return { side: "right" };
    return { side: "right" };
}

interface MenuItemProps<T extends string> {
    item: MenuOption<T>;
    selectedValue: T;
    onChange: (value: T) => void;
    onCloseAll: () => void;
    /** Bumped by an ancestor whenever the whole tree should collapse; lets each item reset its own open state. */
    closeSignal: number;
    optionIcon?: (option: MenuOption<T>) => ReactNode;
    submenuAnchor?: MenuAnchor;
    pageMargin?: number;
}

function MenuItem<T extends string>({
    item,
    selectedValue,
    onChange,
    onCloseAll,
    closeSignal,
    optionIcon,
    submenuAnchor = "st",
    pageMargin = 12,
}: MenuItemProps<T>) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; flipLeft: boolean; flipUp: boolean }>({
        top: 0,
        left: 0,
        flipLeft: initialSideFromAnchor(submenuAnchor).side === "left",
        flipUp: false,
    });

    const itemRef = useRef<HTMLDivElement>(null);
    const submenuRef = useRef<HTMLDivElement>(null);
    const isCoarsePointer = useIsCoarsePointer();

    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isSelected = item.value === selectedValue;
    const rawIcon = optionIcon ? optionIcon(item) : item.icon;

    // Any ancestor (or this menu) closing collapses this item's submenu too,
    // so reopening the tree later doesn't resurrect stale open submenus.
    useEffect(() => {
        setIsSubmenuOpen(false);
    }, [closeSignal]);

    const recalcPosition = () => {
        if (!itemRef.current) return;
        const rect = itemRef.current.getBoundingClientRect();
        const submenuEl = submenuRef.current;

        const menuWidth = submenuEl?.offsetWidth || 200;
        const menuHeight = submenuEl?.offsetHeight || 156;

        const spaceRight = window.innerWidth - rect.right - pageMargin;
        const spaceLeft = rect.left - pageMargin;
        const spaceBelow = window.innerHeight - rect.bottom - pageMargin;
        const spaceAbove = rect.top - pageMargin;

        const preferLeft = initialSideFromAnchor(submenuAnchor).side === "left";
        const flipLeft = preferLeft
            ? !(spaceLeft > menuWidth || spaceLeft > spaceRight)
            : spaceRight < menuWidth && spaceLeft > spaceRight;

        const flipUp = spaceBelow < 120 && spaceAbove > spaceBelow;

        const top = flipUp ? Math.max(pageMargin, rect.bottom - menuHeight) : rect.top;
        const left = flipLeft ? Math.max(pageMargin, rect.left - menuWidth) : rect.right;

        setCoords({ top, left, flipLeft, flipUp });
    };

    useLayoutEffect(() => {
        if (isSubmenuOpen) recalcPosition();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmenuOpen, pageMargin]);

    // Keep the submenu glued to its anchor if the page scrolls/resizes while open.
    useEffect(() => {
        if (!isSubmenuOpen) return;
        const handle = () => recalcPosition();
        window.addEventListener("scroll", handle, true);
        window.addEventListener("resize", handle);
        return () => {
            window.removeEventListener("scroll", handle, true);
            window.removeEventListener("resize", handle);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmenuOpen]);

    const selectItem = () => {
        if (item.disabled) return;
        onChange(item.value);
        setIsSubmenuOpen(false);
        onCloseAll();
    };

    const handleItemClick = (e: ReactMouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.disabled) return;

        if (hasChildren) {
            setIsSubmenuOpen((prev) => !prev);
        } else {
            selectItem();
        }
    };

    const handleKeyDown = (e: ReactKeyboardEvent) => {
        if (item.disabled) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (hasChildren) setIsSubmenuOpen((prev) => !prev);
            else selectItem();
        } else if (e.key === "ArrowRight" && hasChildren) {
            e.preventDefault();
            setIsSubmenuOpen(true);
        } else if (e.key === "Escape" && hasChildren && isSubmenuOpen) {
            e.preventDefault();
            e.stopPropagation();
            setIsSubmenuOpen(false);
        }
    };

    const renderIcon = () => {
        if (isSelected) return <i className="icon menu-option-icon">check</i>;
        if (rawIcon) {
            if (typeof rawIcon === "string") return <i className="icon menu-option-icon">{rawIcon}</i>;
            return cloneElement(rawIcon as any, {
                className: `${(rawIcon as any).props?.className || ""} menu-option-icon`.trim(),
            });
        }
        return null;
    };

    return (
        <div
            ref={itemRef}
            className="menu-option-wrapper"
            onMouseEnter={() => {
                if (isCoarsePointer || item.disabled) return;
                if (hasChildren) setIsSubmenuOpen(true);
            }}
            onMouseLeave={() => {
                if (isCoarsePointer) return;
                setIsSubmenuOpen(false);
            }}
        >
            <div
                role={hasChildren ? "menuitem" : "menuitemradio"}
                aria-haspopup={hasChildren || undefined}
                aria-expanded={hasChildren ? isSubmenuOpen : undefined}
                aria-checked={!hasChildren ? isSelected : undefined}
                aria-disabled={item.disabled || undefined}
                tabIndex={item.disabled ? -1 : 0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleItemClick}
                onKeyDown={handleKeyDown}
                className={`menu-option ${isSelected ? "selected" : ""} ${isSubmenuOpen ? "hover-active" : ""} ${item.disabled ? "disabled" : ""}`}
            >
                {renderIcon()}

                <div>
                    <div className="menu-option-label">{item.label}</div>
                    {item.description && <div className="menu-option-desc">{item.description}</div>}
                </div>

                {hasChildren && <i className="icon menu-option-menu-icon">arrow_right</i>}
            </div>

            {hasChildren &&
                isSubmenuOpen &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={submenuRef}
                        role="menu"
                        className={`menu submenu-popout ascroll-y inset-scrollbar visible ${coords.flipUp ? "anchor-sb" : "anchor-st"}`}
                        style={{
                            position: "fixed",
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            zIndex: "var(--z-menu, 9999)",
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
                                closeSignal={closeSignal}
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
    // Bumped every time the menu (or a submenu tree) should fully collapse its internal state.
    const [closeSignal, setCloseSignal] = useState(0);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const recalcPosition = () => {
        if (!wrapperRef.current || !menuRef.current) return;
        const anchorRect = wrapperRef.current.getBoundingClientRect();
        const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768;

        const spaceBelow = window.innerHeight - anchorRect.bottom - pageMargin;
        const spaceAbove = anchorRect.top - pageMargin;

        let shouldFlipUp = !forceDirectionDown && spaceBelow < 100 && spaceAbove > spaceBelow;
        if (isMobile && forceDirectionDown) shouldFlipUp = false;

        const resolvedAnchor = shouldFlipUp ? (anchor.startsWith("t") ? (anchor.replace("t", "b") as MenuAnchor) : "bl") : anchor;

        setActiveAnchor(resolvedAnchor);
        const targetSpace = shouldFlipUp ? spaceAbove : spaceBelow;
    };

    useLayoutEffect(() => {
        recalcPosition();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, anchor, pageMargin, options, forceDirectionDown]);

    useEffect(() => {
        if (!isOpen) return;
        const handle = () => recalcPosition();
        window.addEventListener("scroll", handle, true);
        window.addEventListener("resize", handle);
        return () => {
            window.removeEventListener("scroll", handle, true);
            window.removeEventListener("resize", handle);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const closeMenu = () => {
        setIsOpen(false);
        // Let every descendant MenuItem reset its own submenu state.
        setCloseSignal((n) => n + 1);
    };
    const openMenu = () => setIsOpen(true);
    const toggleMenu = () => (isOpen ? closeMenu() : openMenu());

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                const isPortalClick = (event.target as HTMLElement).closest(".submenu-popout");
                if (!isPortalClick) closeMenu();
            }
        }
        function handleEscape(event: globalThis.KeyboardEvent) {
            if (event.key === "Escape" && isOpen) closeMenu();
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const selectedOption = useMemo(() => options.find((item) => item.value === value) ?? options[0], [options, value]);

    const handleFocusCapture = (e: FocusEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            openMenu();
        }
    };

    // Compose with any handlers the caller already passed instead of clobbering them.
    const getInputProps = (customProps: Record<string, any> = {}) => {
        const { onFocus, onClick, ...rest } = customProps;
        return {
            onFocus: (e: FocusEvent<HTMLInputElement>) => {
                openMenu();
                onFocus?.(e);
            },
            onClick: (e: ReactMouseEvent<HTMLInputElement>) => {
                openMenu();
                onClick?.(e);
            },
            ...rest,
        };
    };

    return (
        <div className="menu-wrapper" ref={wrapperRef} style={style} onFocusCapture={handleFocusCapture}>
            {trigger ? (
                trigger({
                    isOpen,
                    toggle: toggleMenu,
                    open: openMenu,
                    close: closeMenu,
                    setIsOpen: (open: boolean) => (open ? openMenu() : closeMenu()),
                    selectedOption,
                    getInputProps,
                })
            ) : (
                <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    className={`menu-trigger ${className} ${id || ""} ${isOpen ? "clicked" : ""}`}
                    onClick={toggleMenu}
                >
                    {triggerValue ? triggerValue(selectedOption) : selectedOption.label}
                </button>
            )}

            <div
                ref={menuRef}
                role="menu"
                className={`menu ascroll-y inset-scrollbar anchor-${activeAnchor} ${id ? `${id}-options` : ""} ${isOpen ? "visible" : ""}`}
            >
                {title && <div className="menu-title">{title}</div>}
                {options.map((item) => (
                    <MenuItem
                        key={item.value}
                        item={item}
                        selectedValue={value}
                        onChange={onChange}
                        onCloseAll={closeMenu}
                        closeSignal={closeSignal}
                        optionIcon={optionIcon}
                        submenuAnchor={submenuAnchor}
                        pageMargin={pageMargin}
                    />
                ))}
            </div>
        </div>
    );
}