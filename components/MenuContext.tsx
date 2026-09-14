"use client";

import { createContext, useContext, useState } from "react";

type MenuContextType = {
    isMenuOpen: boolean;
    isRightMenuOpen: boolean;
    toggleMenu: () => void;
    toggleRightMenu: () => void;
    closeMenu: () => void;
    closeRightMenu: () => void;
};

const MenuContext = createContext<MenuContextType | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);

    function toggleMenu() {
        setIsMenuOpen(prev => !prev);
    }

    function toggleRightMenu() {
        setIsRightMenuOpen(prev => !prev);
    }

    function closeMenu() {
        setIsMenuOpen(false);
    }

    function closeRightMenu() {
        setIsRightMenuOpen(false);
    }

    return (
        <MenuContext.Provider
            value={{
                isMenuOpen,
                isRightMenuOpen,
                toggleMenu,
                toggleRightMenu,
                closeMenu,
                closeRightMenu,
            }}
        >{children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const context = useContext(MenuContext);
    if (!context) throw new Error("useMenu must be used inside MenuProvider");

    return context;
}