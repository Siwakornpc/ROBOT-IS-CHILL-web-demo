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
} from "react";
import {createPortal} from "react-dom";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type MenuPlacement =
    | "bottom-start"
    | "bottom-end"
    | "top-start"
    | "top-end"
    | "right-start"
    | "right-center"
    | "left-start"
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

/* -------------------------------------------------------------------------- */
/* Pointer                                                                    */
/* -------------------------------------------------------------------------- */

function useIsCoarsePointer() {
    const [isCoarse, setIsCoarse] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(pointer: coarse)");

        const update = () => {
            setIsCoarse(mediaQuery.matches);
        };

        update();
        mediaQuery.addEventListener("change", update);

        return () => {
            mediaQuery.removeEventListener("change", update);
        };
    }, []);

    return isCoarse;
}

/* -------------------------------------------------------------------------- */
/* Measurement                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Measures an element without displaying it to the user.
 *
 * The menu is already in the DOM because it is rendered through a portal,
 * so this gives us its natural size before positioning it.
 */
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

/* -------------------------------------------------------------------------- */
/* Positioning                                                                */
/* -------------------------------------------------------------------------- */

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

    /*
     * Space available around the trigger box.
     *
     * These are deliberately expressed in terms of the box edges rather
     * than using intermediate "top - bottom" style calculations.
     */
    const spaceAbove = boxRect.top - margin - gap;
    const spaceBelow = viewportHeight - boxRect.bottom - margin - gap;

    const spaceLeft = boxRect.left - margin - gap;
    const spaceRight = viewportWidth - boxRect.right - margin - gap;

    /*
     * Decide whether the requested side should flip.
     *
     * A flip only happens when the requested side cannot contain the menu
     * and the opposite side has more room.
     */
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

    if (shouldFlipUp) {
        actualPlacement = placement.replace("bottom", "top") as MenuPlacement;
    } else if (shouldFlipDown) {
        actualPlacement = placement.replace("top", "bottom") as MenuPlacement;
    } else if (shouldFlipRight) {
        actualPlacement = placement.replace("left", "right") as MenuPlacement;
    } else if (shouldFlipLeft) {
        actualPlacement = placement.replace("right", "left") as MenuPlacement;
    }

    let left = boxRect.left;
    let top = boxRect.bottom + gap;
    let maxHeight = Math.max(60, spaceBelow);

    switch (actualPlacement) {
        case "bottom-start":
            left = boxRect.left;
            top = boxRect.bottom + gap;
            maxHeight = Math.max(60, spaceBelow);
            break;

        case "bottom-end":
            left = boxRect.right - elementWidth;
            top = boxRect.bottom + gap;
            maxHeight = Math.max(60, spaceBelow);
            break;

        case "top-start":
            left = boxRect.left;
            top = boxRect.top - elementHeight - gap;
            maxHeight = Math.max(60, spaceAbove);
            break;

        case "top-end":
            left = boxRect.right - elementWidth;
            top = boxRect.top - elementHeight - gap;
            maxHeight = Math.max(60, spaceAbove);
            break;

        case "right-start":
            left = boxRect.right + gap;
            top = boxRect.top;
            maxHeight = Math.max(60, viewportHeight - boxRect.top - margin);
            break;

        case "right-center":
            left = boxRect.right + gap;
            top = boxRect.top + (boxHeight - elementHeight) / 2;
            maxHeight = Math.max(60, viewportHeight - margin * 2);
            break;

        case "left-start":
            left = boxRect.left - elementWidth - gap;
            top = boxRect.top;
            maxHeight = Math.max(60, viewportHeight - boxRect.top - margin);
            break;

        case "left-center":
            left = boxRect.left - elementWidth - gap;
            top = boxRect.top + (boxHeight - elementHeight) / 2;
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
    left = Math.max(margin,  Math.min(left, viewportWidth - elementWidth - margin));

    top = Math.max(margin, Math.min(top, viewportHeight - margin));

    return {
        left: Math.round(left),
        top: Math.round(top),
        maxHeight: Math.max(60, Math.round(maxHeight)),
        actualPlacement,
    };
}

/* -------------------------------------------------------------------------- */
/* MenuItem                                                                   */
/* -------------------------------------------------------------------------- */

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
}

function MenuItem<T extends string>({
    item,
    selectedValue,
    onChange,
    onCloseAll,
    closeSignal,
    optionIcon,
    submenuPlacement = "right-start",
    pageMargin = 12,
    menuGap = 4,
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

    /* ---------------------------------------------------------------------- */
    /* Submenu positioning                                                    */
    /* ---------------------------------------------------------------------- */

    const updateSubmenuPosition = () => {
        const box = triggerRef.current;
        const submenu = submenuRef.current;

        if (!box || !submenu) return null;

        const boxRect = box.getBoundingClientRect();
        const elementRect = measureElement(submenu);

        const position = calculateMenuPosition(
            boxRect,
            elementRect,
            {
                placement: submenuPlacement,
                margin: pageMargin,
                gap: menuGap,
            }
        );

        if (position.actualPlacement.startsWith("top")) {
            setPlacementClass("anchor-br");
        } else if (position.actualPlacement.startsWith("right")) {
            setPlacementClass("anchor-l");
        } else if (position.actualPlacement.startsWith("left")) {
            setPlacementClass("anchor-r");
        } else {
            setPlacementClass("anchor-tr");
        }

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
            return;
        }

        updateSubmenuPosition();

        let animationFrame = 0;

        const update = () => {
            cancelAnimationFrame(animationFrame);

            animationFrame = requestAnimationFrame(() => {
                updateSubmenuPosition();
            });
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, {
            passive: true,
            capture: true,
        });

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
            cancelAnimationFrame(animationFrame);
        };
    }, [
        isSubmenuOpen,
        submenuPlacement,
        pageMargin,
        menuGap,
    ]);

    useEffect(() => {
        setIsSubmenuOpen(false);
    }, [closeSignal]);

    /* ---------------------------------------------------------------------- */
    /* Events                                                                 */
    /* ---------------------------------------------------------------------- */

    const handleItemClick = (event: ReactMouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (item.disabled) return null;

        if (hasChildren) {
            setIsSubmenuOpen((open) => !open);
            return;
        }

        onChange(item.value);
        onCloseAll();
    };

    /* ---------------------------------------------------------------------- */
    /* Icon                                                                    */
    /* ---------------------------------------------------------------------- */

    const renderIcon = () => {
        if (isSelected) {
            return (
                <i className="icon menu-option-icon">
                    check
                </i>
            );
        }

        if (!rawIcon) return null;

        if (typeof rawIcon === "string") {
            return (
                <i className="icon menu-option-icon">
                    {rawIcon}
                </i>
            );
        }

        return cloneElement(rawIcon as any, {
            className: [
                (rawIcon as any).props?.className,
                "menu-option-icon",
            ].filter(Boolean).join(" "),
        });
    };

    /* ---------------------------------------------------------------------- */
    /* Render                                                                  */
    /* ---------------------------------------------------------------------- */

    return (
        <div
            ref={triggerRef}
            className="menu-option-wrapper"
            onMouseEnter={() => {
                if (!isCoarsePointer && hasChildren) {
                    setIsSubmenuOpen(true);
                }
            }}
            onMouseLeave={(event) => {
                if (isCoarsePointer || !hasChildren) return;

                const relatedTarget = event.relatedTarget as Node | null;

                if (
                    submenuRef.current &&
                    relatedTarget &&
                    submenuRef.current.contains(relatedTarget)
                ) return;

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
                    <div className="menu-option-label">
                        {item.label}
                    </div>

                    {item.description && (
                        <div className="menu-option-desc">
                            {item.description}
                        </div>
                    )}
                </div>

                {hasChildren && (
                    <i className="icon menu-option-menu-icon">
                        arrow_right
                    </i>
                )}
            </div>

            {hasChildren && (
                <div
                    ref={submenuRef}
                    role="menu"
                    className={[
                        "menu",
                        "submenu-popout",
                        placementClass,
                        "ascroll-y",
                        "inset-scrollbar",
                        isSubmenuOpen ? "visible" : "",
                    ].filter(Boolean).join(" ")}
                    style={submenuStyle}
                    onMouseLeave={(event) => {
                        if (isCoarsePointer)  return;

                        const relatedTarget =
                            event.relatedTarget as Node | null;

                        if (
                            triggerRef.current &&
                            relatedTarget &&
                            triggerRef.current.contains(relatedTarget)
                        ) return;

                        setIsSubmenuOpen(false);
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* MenuSelect                                                                 */
/* -------------------------------------------------------------------------- */

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
    submenuPlacement = "right-start",
    pageMargin = 12,
    menuGap = 4,
}: MenuSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const [menuStyle, setMenuStyle] = useState<CSSProperties>({
        position: "fixed",
        visibility: "hidden",
    });

    const [placementClass, setPlacementClass] =
        useState("anchor-bl");

    const [closeSignal, setCloseSignal] = useState(0);

    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement>(null);

    /* ---------------------------------------------------------------------- */
    /* Menu positioning                                                       */
    /* ---------------------------------------------------------------------- */

    const updateMenuPosition = () => {
        const box = triggerRef.current;
        const menu = menuRef.current;

        if (!box || !menu) return;

        const boxRect = box.getBoundingClientRect();
        const elementRect = measureElement(menu);

        const position = calculateMenuPosition(
            boxRect,
            elementRect,
            {
                placement,
                margin: pageMargin,
                gap: menuGap,
            }
        );

        if (position.actualPlacement.startsWith("top")) {
            setPlacementClass("anchor-bl");
        } else {
            setPlacementClass("anchor-tl");
        }

        setMenuStyle({
            position: "fixed",
            left: position.left,
            top: position.top,
            maxHeight: position.maxHeight,
            visibility: "visible",
        });
    };

    useLayoutEffect(() => {
        if (!isOpen) return;

        updateMenuPosition();

        let animationFrame = 0;

        const update = () => {
            cancelAnimationFrame(animationFrame);

            animationFrame = requestAnimationFrame(() => {
                updateMenuPosition();
            });
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, {
            passive: true,
        });

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
            cancelAnimationFrame(animationFrame);
        };
    }, [
        isOpen,
        placement,
        pageMargin,
        menuGap,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Open / close                                                           */
    /* ---------------------------------------------------------------------- */

    const closeMenu = () => {
        setIsOpen(false);
        setCloseSignal((signal) => signal + 1);
    };

    const openMenu = () => {
        setIsOpen(true);
    };

    const toggleMenu = () => {isOpen ? closeMenu() : openMenu()};

    /* ---------------------------------------------------------------------- */
    /* Selected option                                                        */
    /* ---------------------------------------------------------------------- */

    const selectedOption = useMemo(() =>
        options.find(
            (item) => item.value === value
        ) ?? options[0],
        [options, value]
    );

    /* ---------------------------------------------------------------------- */
    /* Trigger props                                                          */
    /* ---------------------------------------------------------------------- */

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

                if (typeof ref === "function") {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            },

            style: { ...customStyle },

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

    /* ---------------------------------------------------------------------- */
    /* Mount + outside click                                                  */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (menuRef.current?.contains(target)) return;
            if (triggerRef.current?.contains(target)) return;

            closeMenu();
        };

        document.addEventListener("pointerdown", handlePointerDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [isOpen]);

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    const triggerElement = trigger
        ? trigger({
            isOpen,
            toggle: toggleMenu,
            open: openMenu,
            close: closeMenu,
            setIsOpen: (open: boolean) => {open ? openMenu() : closeMenu()},
            selectedOption,
            getInputProps,
        })
        : (
            <button
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
            >
                {triggerValue
                    ? triggerValue(selectedOption)
                    : (
                        <span>
                            {selectedOption.label}
                        </span>
                    )
                }
            </button>
        );

    return (
        <>
            {triggerElement}

            {isMounted &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        className={[
                            "menu",
                            placementClass,
                            "ascroll-y",
                            "inset-scrollbar",
                            isOpen ? "visible" : "",
                            id ? `${id}-options` : "",
                        ].filter(Boolean).join(" ")}
                        style={menuStyle}
                        onMouseDown={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        {title && (
                            <div className="menu-title">
                                {title}
                            </div>
                        )}

                        {options.map((item) => (
                            <MenuItem
                                key={item.value}
                                item={item}
                                selectedValue={value}
                                onChange={onChange}
                                onCloseAll={closeMenu}
                                closeSignal={closeSignal}
                                optionIcon={optionIcon}
                                submenuPlacement={
                                    submenuPlacement
                                }
                                pageMargin={pageMargin}
                                menuGap={menuGap}
                            />
                        ))}
                    </div>,
                    document.body
                )}
        </>
    );
}