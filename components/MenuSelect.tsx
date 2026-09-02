"use client";

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useMemo,
    ReactNode,
    CSSProperties,
    FocusEvent,
    MouseEvent as ReactMouseEvent,
    cloneElement,
} from "react";

import { createPortal } from "react-dom";

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

/* -------------------------------------------------------------------------- */
/* Shared positioning                                                         */
/* -------------------------------------------------------------------------- */

interface PositionOptions {
    placement: MenuPlacement;
    margin: number;
    gap: number;
}

interface PositionResult {
    left: number;
    top: number;
}

function calculateMenuPosition(
    triggerRect: DOMRect,
    menuRect: DOMRect,
    {
        placement,
        margin,
        gap,
    }: PositionOptions
): PositionResult {
    let left = triggerRect.left;
    let top = triggerRect.bottom + gap;

    switch (placement) {
        case "bottom-start":
            left = triggerRect.left;
            top = triggerRect.bottom + gap;
            break;

        case "bottom-end":
            left =
                triggerRect.right -
                menuRect.width;
            top = triggerRect.bottom + gap;
            break;

        case "top-start":
            left = triggerRect.left;
            top =
                triggerRect.top -
                menuRect.height -
                gap;
            break;

        case "top-end":
            left =
                triggerRect.right -
                menuRect.width;
            top =
                triggerRect.top -
                menuRect.height -
                gap;
            break;

        case "right-start":
            left = triggerRect.right + gap;
            top = triggerRect.top;
            break;

        case "right-center":
            left = triggerRect.right + gap;
            top =
                triggerRect.top +
                (triggerRect.height -
                    menuRect.height) /
                    2;
            break;

        case "left-start":
            left =
                triggerRect.left -
                menuRect.width -
                gap;
            top = triggerRect.top;
            break;

        case "left-center":
            left =
                triggerRect.left -
                menuRect.width -
                gap;
            top =
                triggerRect.top +
                (triggerRect.height -
                    menuRect.height) /
                    2;
            break;
    }

    /*
     * Clamp horizontally.
     */
    left = Math.max(
        margin,
        Math.min(
            left,
            window.innerWidth -
                menuRect.width -
                margin
        )
    );

    /*
     * Clamp vertically.
     */
    top = Math.max(
        margin,
        Math.min(
            top,
            window.innerHeight -
                menuRect.height -
                margin
        )
    );

    return {
        left: Math.round(left),
        top: Math.round(top),
    };
}

/**
 * Measures an element without making it visible.
 *
 * The menu must already be mounted. We temporarily make it measurable,
 * calculate its size, then restore the original visibility.
 */
function measureElement(
    element: HTMLElement
): DOMRect {
    const previousVisibility =
        element.style.visibility;

    const previousDisplay =
        element.style.display;

    element.style.visibility = "hidden";
    element.style.display = "block";

    const rect =
        element.getBoundingClientRect();

    element.style.visibility =
        previousVisibility;

    element.style.display =
        previousDisplay;

    return rect;
}

/* -------------------------------------------------------------------------- */
/* Coarse pointer                                                             */
/* -------------------------------------------------------------------------- */

function useIsCoarsePointer() {
    const [isCoarse, setIsCoarse] =
        useState(false);

    useEffect(() => {
        const mediaQuery =
            window.matchMedia(
                "(pointer: coarse)"
            );

        setIsCoarse(mediaQuery.matches);

        const handler = (
            event: MediaQueryListEvent
        ) => {
            setIsCoarse(event.matches);
        };

        mediaQuery.addEventListener(
            "change",
            handler
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                handler
            );
        };
    }, []);

    return isCoarse;
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
    optionIcon?: (
        option: MenuOption<T>
    ) => ReactNode;
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
    const [isSubmenuOpen, setIsSubmenuOpen] =
        useState(false);

    const [
        submenuStyle,
        setSubmenuStyle,
    ] = useState<CSSProperties>({
        position: "fixed",
        visibility: "hidden",
    });

    const triggerRef =
        useRef<HTMLDivElement>(null);

    const submenuRef =
        useRef<HTMLDivElement>(null);

    const isCoarsePointer =
        useIsCoarsePointer();

    const hasChildren =
        Boolean(
            item.children?.length
        );

    const isSelected =
        item.value === selectedValue;

    const rawIcon = optionIcon
        ? optionIcon(item)
        : item.icon;

    /* ---------------------------------------------------------------------- */
    /* Submenu positioning                                                    */
    /* ---------------------------------------------------------------------- */

    const updateSubmenuPosition = () => {
        const trigger =
            triggerRef.current;

        const submenu =
            submenuRef.current;

        if (!trigger || !submenu) {
            return;
        }

        const triggerRect =
            trigger.getBoundingClientRect();

        const menuRect =
            measureElement(submenu);

        const position =
            calculateMenuPosition(
                triggerRect,
                menuRect,
                {
                    placement:
                        submenuPlacement,
                    margin: pageMargin,
                    gap: menuGap,
                }
            );

        setSubmenuStyle({
            position: "fixed",
            left: position.left,
            top: position.top,
            visibility: "visible",
        });
    };

    useLayoutEffect(() => {
        if (!isSubmenuOpen) {
            return;
        }

        updateSubmenuPosition();

        const update = () => {
            updateSubmenuPosition();
        };

        window.addEventListener(
            "resize",
            update
        );

        /*
         * Capture scrolling from any scrollable
         * parent, not just window.
         */
        window.addEventListener(
            "scroll",
            update,
            true
        );

        return () => {
            window.removeEventListener(
                "resize",
                update
            );

            window.removeEventListener(
                "scroll",
                update,
                true
            );
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

    const handleItemClick = (
        event: ReactMouseEvent
    ) => {
        event.preventDefault();
        event.stopPropagation();

        if (item.disabled) {
            return;
        }

        if (hasChildren) {
            setIsSubmenuOpen(
                (open) => !open
            );
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

        if (!rawIcon) {
            return null;
        }

        if (
            typeof rawIcon === "string"
        ) {
            return (
                <i className="icon menu-option-icon">
                    {rawIcon}
                </i>
            );
        }

        return cloneElement(
            rawIcon as any,
            {
                className: [
                    (rawIcon as any).props
                        ?.className,
                    "menu-option-icon",
                ]
                    .filter(Boolean)
                    .join(" "),
            }
        );
    };

    /* ---------------------------------------------------------------------- */
    /* Render                                                                  */
    /* ---------------------------------------------------------------------- */

    return (
        <div
            ref={triggerRef}
            className="menu-option-wrapper"
            onMouseEnter={() => {
                if (
                    !isCoarsePointer &&
                    hasChildren
                ) {
                    setIsSubmenuOpen(true);
                }
            }}
            onMouseLeave={(event) => {
                if (
                    isCoarsePointer ||
                    !hasChildren
                ) {
                    return;
                }

                const related =
                    event.relatedTarget as
                        | Node
                        | null;

                /*
                 * Keep submenu open while moving
                 * from the trigger into the submenu.
                 */
                if (
                    submenuRef.current &&
                    related &&
                    submenuRef.current.contains(
                        related
                    )
                ) {
                    return;
                }

                setIsSubmenuOpen(false);
            }}
        >
            <div
                role={
                    hasChildren
                        ? "menuitem"
                        : "menuitemradio"
                }
                aria-haspopup={
                    hasChildren || undefined
                }
                aria-expanded={
                    hasChildren
                        ? isSubmenuOpen
                        : undefined
                }
                aria-checked={
                    !hasChildren
                        ? isSelected
                        : undefined
                }
                aria-disabled={
                    item.disabled ||
                    undefined
                }
                tabIndex={
                    item.disabled
                        ? -1
                        : 0
                }
                onMouseDown={(event) =>
                    event.preventDefault()
                }
                onClick={handleItemClick}
                className={[
                    "menu-option",
                    isSelected
                        ? "selected"
                        : "",
                    isSubmenuOpen
                        ? "hover-active"
                        : "",
                    item.disabled
                        ? "disabled"
                        : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                {renderIcon()}

                <div>
                    <div className="menu-option-label">
                        {item.label}
                    </div>

                    {item.description && (
                        <div className="menu-option-desc">
                            {
                                item.description
                            }
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
                        "ascroll-y",
                        "inset-scrollbar",
                        isSubmenuOpen
                            ? "visible"
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    style={submenuStyle}
                    onMouseLeave={(event) => {
                        if (
                            isCoarsePointer
                        ) {
                            return;
                        }

                        const related =
                            event.relatedTarget as
                                | Node
                                | null;

                        if (
                            triggerRef.current &&
                            related &&
                            triggerRef.current.contains(
                                related
                            )
                        ) {
                            return;
                        }

                        setIsSubmenuOpen(
                            false
                        );
                    }}
                >
                    {item.children!.map(
                        (child) => (
                            <MenuItem
                                key={
                                    child.value
                                }
                                item={child}
                                selectedValue={
                                    selectedValue
                                }
                                onChange={
                                    onChange
                                }
                                onCloseAll={
                                    onCloseAll
                                }
                                closeSignal={
                                    closeSignal
                                }
                                optionIcon={
                                    optionIcon
                                }
                                submenuPlacement={
                                    submenuPlacement
                                }
                                pageMargin={
                                    pageMargin
                                }
                                menuGap={
                                    menuGap
                                }
                            />
                        )
                    )}
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

    options:
        | readonly MenuOption<T>[]
        | MenuOption<T>[];

    onChange: (
        value: T
    ) => void;

    triggerValue?: (
        selectedOption: MenuOption<T>
    ) => ReactNode;

    trigger?: (props: {
        isOpen: boolean;
        toggle: () => void;
        open: () => void;
        close: () => void;
        setIsOpen: (
            open: boolean
        ) => void;
        selectedOption: MenuOption<T>;
        getInputProps: (
            customProps?: Record<
                string,
                any
            >
        ) => Record<
            string,
            any
        >;
    }) => ReactNode;

    optionIcon?: (
        option: MenuOption<T>
    ) => ReactNode;

    className?: string;
    style?: CSSProperties;

    placement?: MenuPlacement;

    submenuPlacement?: MenuPlacement;

    pageMargin?: number;

    menuGap?: number;
}

/* -------------------------------------------------------------------------- */
/* MenuSelect                                                                 */
/* -------------------------------------------------------------------------- */

export default function MenuSelect<
    T extends string
>({
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
    const [isOpen, setIsOpen] =
        useState(false);

    const [
        menuStyle,
        setMenuStyle,
    ] = useState<CSSProperties>({
        position: "fixed",
        visibility: "hidden",
    });

    const [closeSignal, setCloseSignal] =
        useState(0);

    const menuRef =
        useRef<HTMLDivElement>(null);

    const triggerRef =
        useRef<HTMLElement>(null);

    /* ---------------------------------------------------------------------- */
    /* Main menu positioning                                                  */
    /* ---------------------------------------------------------------------- */

    const updateMenuPosition = () => {
        const trigger =
            triggerRef.current;

        const menu =
            menuRef.current;

        if (!trigger || !menu) {
            return;
        }

        const triggerRect =
            trigger.getBoundingClientRect();

        const menuRect =
            measureElement(menu);

        const position =
            calculateMenuPosition(
                triggerRect,
                menuRect,
                {
                    placement,
                    margin: pageMargin,
                    gap: menuGap,
                }
            );

        setMenuStyle({
            position: "fixed",
            left: position.left,
            top: position.top,
            visibility: "visible",
            ...style,
        });
    };

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        updateMenuPosition();

        const update = () => {
            updateMenuPosition();
        };

        window.addEventListener(
            "resize",
            update
        );

        /*
         * Capture scrolling from window
         * and nested scroll containers.
         */
        window.addEventListener(
            "scroll",
            update,
            true
        );

        return () => {
            window.removeEventListener(
                "resize",
                update
            );

            window.removeEventListener(
                "scroll",
                update,
                true
            );
        };
    }, [
        isOpen,
        placement,
        pageMargin,
        menuGap,
        style,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Open / close                                                            */
    /* ---------------------------------------------------------------------- */

    const closeMenu = () => {
        setIsOpen(false);

        setCloseSignal(
            (signal) => signal + 1
        );
    };

    const openMenu = () => {
        setIsOpen(true);
    };

    const toggleMenu = () => {
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Selected option                                                         */
    /* ---------------------------------------------------------------------- */

    const selectedOption =
        useMemo(
            () =>
                options.find(
                    (item) =>
                        item.value ===
                        value
                ) ??
                options[0],
            [options, value]
        );

    /* ---------------------------------------------------------------------- */
    /* Custom trigger props                                                    */
    /* ---------------------------------------------------------------------- */

    const getInputProps = (
        customProps: Record<
            string,
            any
        > = {}
    ) => {
        const {
            onFocus,
            onClick,
            ref,
            style: customStyle,
            ...rest
        } = customProps;

        return {
            ...rest,

            ref: (
                node: HTMLElement | null
            ) => {
                triggerRef.current =
                    node;

                if (
                    typeof ref ===
                    "function"
                ) {
                    ref(node);
                } else if (ref) {
                    ref.current =
                        node;
                }
            },

            style: {
                ...customStyle,
            },

            onFocus: (
                event: FocusEvent<HTMLInputElement>
            ) => {
                openMenu();
                onFocus?.(event);
            },

            onClick: (
                event: ReactMouseEvent<HTMLInputElement>
            ) => {
                openMenu();
                onClick?.(event);
            },
        };
    };

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (menuRef.current?.contains(target)) {
                return;
            }

            if (triggerRef.current?.contains(target)) {
                return;
            }

            closeMenu();
        };

        document.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
        };
    }, [isOpen]);

    /* ---------------------------------------------------------------------- */
    /* Render                                                                  */
    /* ---------------------------------------------------------------------- */

    return (
        <>
            {trigger ? (
                trigger({
                    isOpen,
                    toggle: toggleMenu,
                    open: openMenu,
                    close: closeMenu,
                    setIsOpen: (
                        open: boolean
                    ) => {
                        if (open) {
                            openMenu();
                        } else {
                            closeMenu();
                        }
                    },
                    selectedOption,
                    getInputProps,
                })
            ) : (
                <button
                    ref={
                        triggerRef as React.RefObject<HTMLButtonElement>
                    }
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    className={[
                        "menu-trigger",
                        className ||
                            "dropdown-trigger",
                        id || "",
                        isOpen
                            ? "clicked"
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    onClick={toggleMenu}
                    style={style}
                >
                    {triggerValue ? (
                        triggerValue(
                            selectedOption
                        )
                    ) : (
                        <span>
                            {
                                selectedOption.label
                            }
                        </span>
                    )}
                </button>
            )}

            {createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    className={[
                        "menu",
                        "ascroll-y",
                        "inset-scrollbar",
                        isOpen
                            ? "visible"
                            : "",
                        id
                            ? `${id}-options`
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    style={menuStyle}
                    onMouseDown={(event) =>
                        event.stopPropagation()
                    }
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
                            selectedValue={
                                value
                            }
                            onChange={
                                onChange
                            }
                            onCloseAll={
                                closeMenu
                            }
                            closeSignal={
                                closeSignal
                            }
                            optionIcon={
                                optionIcon
                            }
                            submenuPlacement={
                                submenuPlacement
                            }
                            pageMargin={
                                pageMargin
                            }
                            menuGap={
                                menuGap
                            }
                        />
                    ))}
                </div>, window.document.body
            )}
        </>
    );
}
