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
    cloneElement,
    useId,
} from "react";

export type MenuAnchor = "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br" | "s" | "e" | "st" | "sb" | "et" | "eb";

export interface MenuOption<T extends string = string> {
    value: T;
    label: string;
    description?: string;
    icon?: ReactNode;
    disabled?: boolean;
    children?: MenuOption<T>[];
}

/* Cheap shared hook so every item/menu isn't calling matchMedia on every hover. */
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

interface MenuItemProps<T extends string> {
    item: MenuOption<T>;
    selectedValue: T;
    onChange: (value: T) => void;
    onCloseAll: () => void;
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
    submenuAnchor = "et",
}: MenuItemProps<T>) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const submenuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const isCoarsePointer = useIsCoarsePointer();
    const anchorId = useId().replace(/:/g, "");

    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isSelected = item.value === selectedValue;
    const rawIcon = optionIcon ? optionIcon(item) : item.icon;

    useEffect(() => {
        if (submenuRef.current) {
            if (isSubmenuOpen) {
                submenuRef.current.showPopover();
            } else {
                try {
                    submenuRef.current.hidePopover();
                } catch {}
            }
        }
    }, [isSubmenuOpen]);

    useEffect(() => {
        setIsSubmenuOpen(false);
    }, [closeSignal]);

    const handleItemClick = (e: ReactMouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.disabled) return;

        if (hasChildren) {
            setIsSubmenuOpen((prev) => !prev);
        } else {
            onChange(item.value);
            onCloseAll();
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
            ref={triggerRef}
            className="menu-option-wrapper"
            style={{ anchorName: `--submenu-trigger-${anchorId}` } as CSSProperties}
            onMouseEnter={() => !isCoarsePointer && hasChildren && setIsSubmenuOpen(true)}
            onMouseLeave={(e) => {
                if (isCoarsePointer || !hasChildren) return;
                const related = e.relatedTarget as Node | null;
                if (submenuRef.current && related && submenuRef.current.contains(related)) return;
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
                className={`menu-option ${isSelected ? "selected" : ""} ${isSubmenuOpen ? "hover-active" : ""} ${item.disabled ? "disabled" : ""}`}
            >{renderIcon()}
                <div>
                    <div className="menu-option-label">{item.label}</div>
                    {item.description && <div className="menu-option-desc">{item.description}</div>}
                </div>
                {hasChildren && <i className="icon menu-option-menu-icon">arrow_right</i>}
            </div>

            {hasChildren && (
                <div
                    ref={submenuRef}
                    popover="manual"
                    role="menu"
                    className={`menu submenu-popout ascroll-y inset-scrollbar ${isSubmenuOpen ? "visible" : ""} anchor-${submenuAnchor}`}
                    style={{ positionAnchor: `--submenu-trigger-${anchorId}` } as CSSProperties}
                    onMouseLeave={(e) => {
                        if (isCoarsePointer) return;
                        const related = e.relatedTarget as Node | null;
                        if (triggerRef.current && related && triggerRef.current.contains(related)) return;
                        setIsSubmenuOpen(false);
                    }}
                >
                    {item.children!.map((child) =>
                        <MenuItem
                            key={child.value}
                            item={child}
                            selectedValue={selectedValue}
                            onChange={onChange}
                            onCloseAll={onCloseAll}
                            closeSignal={closeSignal}
                            optionIcon={optionIcon}
                            submenuAnchor={submenuAnchor}
                        />
                    )}
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
    anchor = "eb",
    submenuAnchor = "et",
    pageMargin = 12,
}: MenuSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [closeSignal, setCloseSignal] = useState(0);

    const menuRef = useRef<HTMLDivElement>(null);
    const triggerAnchorId = useId().replace(/:/g, "");
    const anchorNameStyle = {anchorName: `--menu-trigger-${triggerAnchorId}`} as CSSProperties;

    useEffect(() => {
        if (menuRef.current) {
            if (isOpen) {
                menuRef.current.showPopover();
            } else {
                try {
                    menuRef.current.hidePopover();
                } catch {}
            }
        }
    }, [isOpen]);

    const closeMenu = () => {
        setIsOpen(false);
        setCloseSignal((n) => n + 1);
    };
    const openMenu = () => setIsOpen(true);
    const toggleMenu = () => isOpen ? closeMenu() : openMenu();

    const selectedOption = useMemo(() => options.find((item) => item.value === value) ?? options[0], [options, value]);

    const getInputProps = (customProps: Record<string, any> = {}) => {
        const { onFocus, onClick, style: customStyle, ...rest } = customProps;
        return {
            style: { ...anchorNameStyle, ...customStyle },
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

    return (<>
        {trigger ?
            trigger({
                isOpen,
                toggle: toggleMenu,
                open: openMenu,
                close: closeMenu,
                setIsOpen: (open: boolean) => (open ? openMenu() : closeMenu()),
                selectedOption,
                getInputProps,
            })
            : <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className={`menu-trigger ${className || "dropdown-trigger"} ${id || ""} ${isOpen ? "clicked" : ""}`}
                onClick={toggleMenu}
                style={{ ...anchorNameStyle, ...style }}
            >{triggerValue ? triggerValue(selectedOption) : <span>{selectedOption.label}</span>}
            </button>
        }

        <div
            ref={menuRef}
            popover="auto"
            role="menu"
            className={`menu ascroll-y inset-scrollbar anchor-${anchor} ${id ? `${id}-options` : ""} ${isOpen ? "visible" : ""}`}
            style={{ positionAnchor: `--menu-trigger-${triggerAnchorId}` } as CSSProperties}
            onToggle={(e: any) => {if (e.newState === "closed") closeMenu();}}
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
                    submenuAnchor={submenuAnchor}
                    pageMargin={pageMargin}
                />
            )}
        </div>
    </>);
}