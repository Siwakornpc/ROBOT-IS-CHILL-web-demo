"use client";

import {
    CSSProperties,
    FocusEvent,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    cloneElement,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useId,
} from "react";
import {createPortal} from "react-dom";

/* ----------
    Types
---------- */

export type MenuPlacement =
    | "bottom-start"
    | "bottom-center"
    | "bottom-end"
    | "top-start"
    | "top-center"
    | "top-end"
    | "right-down"
    | "right-center"
    | "left-down"
    | "left-center";

export interface MenuOption<T extends string = string> {
    value: T;
    label: string;
    description?: string;
    icon?: ReactNode;
    disabled?: boolean;
    children?: MenuOption<T>[];
}

interface PositionOptions {
    placement: MenuPlacement;
    margin: number;
    gap: number;
}

interface PositionResult {
    left: number;
    top: number;
    maxHeight: number;
    actualPlacement: MenuPlacement;
}

/* ------------
    Pointer
------------ */

function useIsCoarsePointer() {
    const [isCoarse, setIsCoarse] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(pointer: coarse)");
        const update = () => setIsCoarse(mediaQuery.matches);

        update();
        mediaQuery.addEventListener("change", update);

        return () => mediaQuery.removeEventListener("change", update)
    }, []);

    return isCoarse;
}

/* ----------------
    Measurement
---------------- */

function measureElement(element: HTMLElement): DOMRect {
    const previousVisibility = element.style.visibility;
    const previousDisplay = element.style.display;
    element.style.visibility = "hidden";
    element.style.display = "block";
    const rect = element.getBoundingClientRect();
    element.style.visibility = previousVisibility;
    element.style.display = previousDisplay;
    return rect;
}

/* ----------------
    Positioning
---------------- */

function calculateMenuPosition(
    boxRect: DOMRect,
    elementRect: DOMRect,
    {
        placement,
        margin,
        gap,
    }: PositionOptions
): PositionResult {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const boxWidth = boxRect.width;
    const boxHeight = boxRect.height;

    const elementWidth = elementRect.width;
    const elementHeight = elementRect.height;

    const spaceAbove = boxRect.top - margin - gap;
    const spaceBelow = viewportHeight - boxRect.bottom - margin - gap;

    const spaceLeft = boxRect.left - margin - gap;
    const spaceRight = viewportWidth - boxRect.right - margin - gap;

    let actualPlacement = placement;

    const shouldFlipUp =
        placement.startsWith("bottom")
        && spaceBelow < elementHeight
        && spaceAbove > spaceBelow;

    const shouldFlipDown =
        placement.startsWith("top")
        && spaceAbove < elementHeight
        && spaceBelow > spaceAbove;

    const shouldFlipRight =
        placement.startsWith("left")
        && spaceLeft < elementWidth
        && spaceRight > spaceLeft;

    const shouldFlipLeft =
        placement.startsWith("right")
        && spaceRight < elementWidth
        && spaceLeft > spaceRight;

    if (shouldFlipUp)
        actualPlacement = placement.replace("bottom", "top") as MenuPlacement;
    else if (shouldFlipDown)
        actualPlacement = placement.replace("top", "bottom") as MenuPlacement;
    else if (shouldFlipRight)
        actualPlacement = placement.replace("left", "right") as MenuPlacement;
    else if (shouldFlipLeft)
        actualPlacement = placement.replace("right", "left") as MenuPlacement;

    let top = boxRect.bottom + gap;
    let left = boxRect.left;
    let maxHeight = Math.max(60, spaceBelow);

    switch (actualPlacement) {
        case "bottom-start":
            top = boxRect.bottom + gap;
            left = boxRect.left;
            break;

        case "bottom-center":
            top = boxRect.bottom + gap;
            left = boxRect.left + (boxWidth - elementWidth) / 2;
            break;

        case "bottom-end":
            top = boxRect.bottom + gap;
            left = boxRect.right - elementWidth;
            maxHeight = Math.max(60, spaceBelow);
            break;

        case "top-start":
            top = boxRect.top - elementHeight - gap;
            left = boxRect.left;
            maxHeight = Math.max(60, spaceAbove);
            break;

        case "top-center":
            top = boxRect.top - elementHeight + gap;
            left = boxRect.left + (boxWidth - elementWidth) / 2;
            maxHeight = Math.max(60, spaceBelow);
            break;

        case "top-end":
            top = boxRect.top - elementHeight - gap;
            left = boxRect.right - elementWidth;
            maxHeight = Math.max(60, spaceAbove);
            break;

        case "right-down":
            top = boxRect.top;
            left = boxRect.right + gap;
            maxHeight = Math.max(60, viewportHeight - boxRect.top - margin);
            break;

        case "right-center":
            top = boxRect.top + (boxHeight - elementHeight) / 2;
            left = boxRect.right + gap;
            maxHeight = Math.max(60, viewportHeight - margin * 2);
            break;

        case "left-down":
            top = boxRect.top;
            left = boxRect.left - elementWidth - gap;
            maxHeight = Math.max(60, viewportHeight - boxRect.top - margin);
            break;

        case "left-center":
            top = boxRect.top + (boxHeight - elementHeight) / 2;
            left = boxRect.left - elementWidth - gap;
            maxHeight = Math.max(60, viewportHeight - margin * 2);
            break;
    }

    /*
     * Keep the menu inside the viewport.
     *
     * The placement calculation above decides which side to use.
     * This part only prevents the menu from overflowing horizontally
     * or vertically.
     */
    left = Math.max(
        margin,
        Math.min(left, viewportWidth - elementWidth - margin)
    );

    top = Math.max(
        margin,
        Math.min(top, viewportHeight - margin)
    );

    return {
        left: Math.round(left),
        top: Math.round(top),
        maxHeight: Math.max(60, Math.round(maxHeight)),
        actualPlacement,
    };
}

/* ------------
    Helpers
------------ */

function findNestedOption<T extends string>(
    options: readonly MenuOption<T>[] | MenuOption<T>[],
    value: T
): MenuOption<T> | null {
    for (const option of options) {
        if (option.value === value) return option;
        if (option.children && option.children.length > 0) {
            const found = findNestedOption(option.children, value);
            if (found) return found;
        }
    }
    return null;
}

/* -------------
    MenuItem
------------- */

interface MenuItemProps<T extends string> {
    item: MenuOption<T>;
    selectedValue: T;
    onChange: (value: T) => void;
    onCloseAll: () => void;
    closeSignal: number;
    optionIcon?: (option: MenuOption<T>) => ReactNode;
    submenuPlacement?: MenuPlacement;
    pageMargin?: number;
    menuGap?: number;
    instanceId: string;
    closeOnSelect?: boolean;
}

function MenuItem<T extends string>({
    item,
    selectedValue,
    onChange,
    onCloseAll,
    closeSignal,
    optionIcon,
    submenuPlacement = "right-down",
    pageMargin = 12,
    menuGap = 4,
    instanceId,
    closeOnSelect = true,
}: MenuItemProps<T>) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const [submenuStyle, setSubmenuStyle] = useState<CSSProperties>({
        position: "fixed",
        visibility: "hidden",
    });
    const [placementClass, setPlacementClass] = useState("anchor-tr");
    const triggerRef = useRef<HTMLDivElement>(null);
    const submenuRef = useRef<HTMLDivElement>(null);
    const isCoarsePointer = useIsCoarsePointer();
    const hasChildren = Boolean(item.children?.length);
    const isSelected = item.value === selectedValue;
    const rawIcon = optionIcon ? optionIcon(item) : item.icon;

    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => setIsMounted(true), []);

    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const scheduleClose = (delay = 200) => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsSubmenuOpen(false);
            closeTimerRef.current = null;
        }, delay);
    };

    useEffect(() => () => clearCloseTimer(), []);

    /* ------------------------
        Submenu positioning
    ------------------------ */

    const updateSubmenuPosition = () => {
        const box = triggerRef.current;
        const submenu = submenuRef.current;

        if (!box || !submenu) return null;

        const boxRect = box.getBoundingClientRect();
        const elementRect = measureElement(submenu);
        const position = calculateMenuPosition(boxRect, elementRect, {
            placement: submenuPlacement,
            margin: pageMargin,
            gap: menuGap,
        });

        if (position.actualPlacement.startsWith("left"))
            if (position.actualPlacement.endsWith("down"))
                setPlacementClass("anchor-tl");
            else
                setPlacementClass("anchor-l");
        else if (position.actualPlacement.startsWith("right"))
            if (position.actualPlacement.endsWith("down"))
                setPlacementClass("anchor-tr");
            else
                setPlacementClass("anchor-r");

        setSubmenuStyle({
            position: "fixed",
            left: position.left,
            top: position.top,
            maxHeight: position.maxHeight,
            visibility: "visible",
        });
    };

    useLayoutEffect(() => {
        if (!isSubmenuOpen) {
            setSubmenuStyle((prev) => ({...prev, visibility: "hidden"}));
            return;
        }

        updateSubmenuPosition();
        let animationFrame = 0;
        const update = (e: Event) => {
            if (e.type === "scroll") {
                const target = e.target as Node | null;
                if (target && submenuRef.current?.contains(target)) return;
            }
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(updateSubmenuPosition);
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, { passive: true, capture: true });

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
            cancelAnimationFrame(animationFrame);
        };
    }, [isSubmenuOpen, submenuPlacement, pageMargin, menuGap]);

    useLayoutEffect(() => {
        setIsSubmenuOpen(false);
        clearCloseTimer();
    }, [closeSignal]);

    /* -----------
        Events
    ----------- */

    const handleItemClick = (event: ReactMouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (item.disabled) return;

        if (hasChildren) {
            if (isCoarsePointer) {
                setIsSubmenuOpen((open) => !open);
            } else {
                clearCloseTimer();
                setIsSubmenuOpen(true);
            }
            return;
        }
        onChange(item.value);
        if (closeOnSelect) onCloseAll();
    };

    const renderIcon = () => {
        if (isSelected) return <i className="icon menu-option-icon">check</i>;
        if (!rawIcon) return null;
        if (typeof rawIcon === "string") return <i className="icon menu-option-icon">{rawIcon}</i>;
        return cloneElement(rawIcon as any, {
            className: [
                (rawIcon as any).props?.className,
                "menu-option-icon",
            ].filter(Boolean).join(" "),
        });
    };

    return (
        <div
            ref={triggerRef}
            className="menu-option-wrapper"
            onMouseEnter={() => {
                if (isCoarsePointer || !hasChildren) return;
                clearCloseTimer();
                setIsSubmenuOpen(true);
            }}
            onMouseLeave={(event) => {
                if (isCoarsePointer || !hasChildren) return;
                const relatedTarget = event.relatedTarget as Node | null;
                if (
                    submenuRef.current &&
                    relatedTarget &&
                    submenuRef.current.contains(relatedTarget)
                ) return;
                scheduleClose();
            }}
        >
            <div
                role={hasChildren ? "menuitem" : "menuitemradio"}
                aria-haspopup={hasChildren || undefined}
                aria-expanded={hasChildren ? isSubmenuOpen : undefined}
                aria-checked={!hasChildren ? isSelected : undefined}
                aria-disabled={item.disabled || undefined}
                tabIndex={item.disabled ? -1 : 0}
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleItemClick}
                className={[
                    "menu-option",
                    isSelected ? "selected" : "",
                    isSubmenuOpen ? "hover-active" : "",
                    item.disabled ? "disabled" : "",
                ].filter(Boolean).join(" ")}
            >
                {renderIcon()}
                <div>
                    <div className="menu-option-label">{item.label}</div>
                    {item.description && <div className="menu-option-desc">{item.description}</div>}
                </div>
                {hasChildren && <i className="icon menu-option-menu-icon">arrow_right</i>}
            </div>

            {hasChildren && isMounted && createPortal(
                <div
                    ref={submenuRef}
                    role="menu"
                    data-menu-instance={instanceId}
                    className={[
                        "menu",
                        "submenu-popout",
                        placementClass,
                        "ascroll-y",
                        "inset-scrollbar",
                        isSubmenuOpen ? "visible" : "",
                    ].filter(Boolean).join(" ")}
                    style={submenuStyle}
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={(event) => {
                        if (isCoarsePointer) return;
                        const relatedTarget = event.relatedTarget as Node | null;
                        if (
                            triggerRef.current &&
                            relatedTarget &&
                            triggerRef.current.contains(relatedTarget)
                        ) return;
                        scheduleClose();
                    }}
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
                            submenuPlacement={submenuPlacement}
                            pageMargin={pageMargin}
                            menuGap={menuGap}
                            instanceId={instanceId}
                            closeOnSelect={closeOnSelect}
                        />
                    ))}
                </div>, document.body
            )}
        </div>
    );
}

/* ---------------
    MenuSelect
--------------- */

interface MenuSelectProps<T extends string> {
    id?: string;
    title?: string;
    value: T;
    options: readonly MenuOption<T>[] | MenuOption<T>[];
    onChange: (value: T) => void;
    triggerValue?: (selectedOption: MenuOption<T>) => ReactNode;
    trigger?: (props: any) => ReactNode;
    optionIcon?: (option: MenuOption<T>) => ReactNode;
    className?: string;
    style?: CSSProperties;
    placement?: MenuPlacement;
    submenuPlacement?: MenuPlacement;
    pageMargin?: number;
    menuGap?: number;
    closeOnSelect?: boolean;
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
    placement = "bottom-start",
    submenuPlacement = "right-down",
    pageMargin = 12,
    menuGap = 4,
    closeOnSelect = true,
}: MenuSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({
        position: "fixed",
        visibility: "hidden",
    });

    const [placementClass, setPlacementClass] = useState("anchor-bl");
    const [closeSignal, setCloseSignal] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement>(null);
    const instanceId = useId();

    /* ---------------------
        Menu positioning
    --------------------- */

    const updateMenuPosition = () => {
        const box = triggerRef.current;
        const menu = menuRef.current;
        if (!box || !menu) return;

        const boxRect = box.getBoundingClientRect();
        const elementRect = measureElement(menu);
        const position = calculateMenuPosition(boxRect, elementRect, {
            placement,
            margin: pageMargin,
            gap: menuGap,
        });

        if (position.actualPlacement.startsWith("top"))
            if (position.actualPlacement.endsWith("start"))
                setPlacementClass("anchor-st");
            else if (position.actualPlacement.endsWith("end"))
                setPlacementClass("anchor-et");
            else
                setPlacementClass("anchor-t");
        else if (position.actualPlacement.startsWith("bottom"))
            if (position.actualPlacement.endsWith("start"))
                setPlacementClass("anchor-sb");
            else if (position.actualPlacement.endsWith("end"))
                setPlacementClass("anchor-eb");
            else
                setPlacementClass("anchor-b");
        else if (position.actualPlacement.startsWith("left"))
            if (position.actualPlacement.endsWith("down"))
                setPlacementClass("anchor-tl");
            else
                setPlacementClass("anchor-l");
        else if (position.actualPlacement.startsWith("right"))
            if (position.actualPlacement.endsWith("down"))
                setPlacementClass("anchor-tr");
            else
                setPlacementClass("anchor-r");

        setMenuStyle({
            position: "fixed",
            left: position.left,
            top: position.top,
            maxHeight: position.maxHeight,
            visibility: "visible",
        });
    };

    useLayoutEffect(() => {
        if (!isOpen) {
            setMenuStyle((prev) => ({...prev, visibility: "hidden"}));
            return;
        }

        updateMenuPosition();
        let animationFrame = 0;
        const update = (e: Event) => {
            if (e.type === "scroll") {
                const target = e.target as Node | null;
                if (target && menuRef.current?.contains(target)) return;
            }
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(updateMenuPosition);
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, { passive: true, capture: true });
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
            cancelAnimationFrame(animationFrame);
        };
    }, [isOpen, placement, pageMargin, menuGap]);

    /* -----------------
        Open / close
    ----------------- */

    const closeMenu = () => {
        setIsOpen(false);
        setCloseSignal((signal) => signal + 1);
    };
    const openMenu = () => {
        setIsOpen(true);
    };
    const toggleMenu = () => {
        if (isOpen) closeMenu();
        else openMenu();
    };

    /* --------------------
        Selected option
    -------------------- */

    const selectedOption = useMemo(
        () => findNestedOption(options, value) ?? options[0],
        [options, value]
    );

    /* ------------------
        Trigger props
    ------------------ */

    const getInputProps = (customProps: Record<string, any> = {}) => {
        const {
            onFocus,
            onClick,
            ref,
            style: customStyle,
            ...rest
        } = customProps;

        return {
            ...rest,
            ref: (node: HTMLElement | null) => {
                triggerRef.current = node;

                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
            },

            style: {...customStyle},
            onFocus: (event: FocusEvent<HTMLInputElement>) => {
                openMenu();
                onFocus?.(event);
            },
            onClick: (event: ReactMouseEvent<HTMLInputElement>) => {
                openMenu();
                onClick?.(event);
            },
        };
    };

    /* --------------------------
        Mount + outside click
    -------------------------- */

    useEffect(() => setIsMounted(true), []);

    useEffect(() => {
        if (!isOpen) return;
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (menuRef.current?.contains(target)) return;
            if (triggerRef.current?.contains(target)) return;
            if (
                target instanceof Element &&
                target.closest(`[data-menu-instance="${instanceId}"]`)
            ) return;
            closeMenu();
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [isOpen]);

    /* -----------
        Render
    ----------- */

    const triggerElement = trigger
        ? trigger({
            isOpen,
            toggle: toggleMenu,
            open: openMenu,
            close: closeMenu,
            setIsOpen: (open: boolean) => {
                if (open) openMenu();
                else closeMenu();
            },
            selectedOption,
            getInputProps,
        })
        : <button
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            type="button"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            className={[
                "menu-trigger",
                className || "dropdown-trigger",
                id || "",
                isOpen ? "clicked" : "",
            ].filter(Boolean).join(" ")}
            onClick={toggleMenu}
            style={style}
        >{triggerValue ? triggerValue(selectedOption) : <span>{selectedOption.label}</span>}
        </button>

    return (<>
        {triggerElement}
        {isMounted &&
            createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    data-menu-instance={instanceId}
                    className={[
                        "menu",
                        placementClass,
                        "ascroll-y",
                        "inset-scrollbar",
                        isOpen ? "visible" : "",
                        id ? `${id}-options` : "",
                    ].filter(Boolean).join(" ")}
                    style={menuStyle}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    {title && <div className="menu-title">{title}</div>}
                    {options.map((item) =>
                        <MenuItem
                            key={item.value}
                            item={item}
                            selectedValue={value}
                            onChange={onChange}
                            onCloseAll={closeMenu}
                            closeSignal={closeSignal}
                            optionIcon={optionIcon}
                            submenuPlacement={submenuPlacement}
                            pageMargin={pageMargin}
                            menuGap={menuGap}
                            instanceId={instanceId}
                            closeOnSelect={closeOnSelect}
                        />
                    )}
                </div>,
                document.body
            )}
    </>);
}