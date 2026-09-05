"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEFAULT_FONT_STATE } from "@/components/fontscript";
import type { FontState } from "@/components/fontscript";

const FontContext = createContext<{
    font: FontState;
    updateFont: (updates: Partial<FontState>) => void;
    resetDefault: () => void;
} | null>(null);

export function FontProvider({ children }: { children: ReactNode }) {
    const [font, setFont] = useState<FontState>(DEFAULT_FONT_STATE);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedFontRaw = localStorage.getItem("font");
            if (savedFontRaw) {
                const parsed = JSON.parse(savedFontRaw);
                setFont({
                    sans: parsed?.sans ?? DEFAULT_FONT_STATE.sans,
                    code: parsed?.code ?? DEFAULT_FONT_STATE.code,
                    sansSize: parsed?.sansSize ?? DEFAULT_FONT_STATE.sansSize,
                    codeSize: parsed?.codeSize ?? DEFAULT_FONT_STATE.codeSize,
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoaded(true);
        }
    }, []);

    const updateFont = (updates: Partial<FontState>) => {
        setFont((prev) => {
            const updated = { ...prev, ...updates };
            localStorage.setItem("font", JSON.stringify(updated));
            return updated;
        });
    };

    const resetDefault = () => updateFont(DEFAULT_FONT_STATE);

    useEffect(() => {
        if (!loaded) return;
        const applyFont = (window as any).setFont;
        if (typeof applyFont !== "function") return;
        applyFont(font.sans, font.code, font.sansSize, font.codeSize);
    }, [font, loaded]);

    return (
        <FontContext.Provider value={{ font, updateFont, resetDefault }}>
            {children}
        </FontContext.Provider>
    );
}

export const useFont = () => {
    const context = useContext(FontContext);
    if (!context) throw new Error("useFont must be used within a FontProvider");
    return context;
};