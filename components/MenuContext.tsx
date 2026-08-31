"use client";

import { createContext, useContext, useState } from "react";

type MenuContextType = {
    isMenuOpen: boolean;
    toggleMenu: () => void;
    closeMenu: () => void;
};

const MenuContext = createContext<MenuContextType | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    function toggleMenu() {
        setIsMenuOpen(prev => !prev);
    }

    function closeMenu() {
        setIsMenuOpen(false);
    }

    return (
        <MenuContext.Provider
            value={{
                isMenuOpen,
                toggleMenu,
                closeMenu,
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