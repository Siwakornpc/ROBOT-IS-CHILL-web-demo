'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface FontOption {
    value: string;
    label: string;
    cssVar: string;
}

export const FONT_SANS_OPTIONS: FontOption[] = [
    { value: "nunito-sans", label: "Nunito Sans", cssVar: "--font-nunito-sans" },
    { value: "ibm-plex-sans", label: "IBM Plex Sans", cssVar: "--font-ibm-plex-sans" },
    { value: "inter", label: "Inter", cssVar: "--font-inter" },
    { value: "roboto-flex", label: "Roboto Flex", cssVar: "--font-roboto-flex" },
    { value: "google-sans", label: "Google Sans", cssVar: "--font-google-sans" },
    { value: "bytesized", label: "Bytesized", cssVar: "--font-bytesized" },
];

export const FONT_CODE_OPTIONS: FontOption[] = [
    { value: "ibm-plex-mono", label: "IBM Plex Mono", cssVar: "--font-ibm-plex-mono" },
    { value: "jetbrains-mono", label: "JetBrains Mono", cssVar: "--font-jetbrains-mono" },
    { value: "bytesized", label: "Bytesized", cssVar: "--font-bytesized" },
    { value: "cascadia-code", label: "Cascadia Code", cssVar: "--font-cascadia-code" },
];

export interface FontState {
    sans: string;
    code: string;
    sansSize: number;
    codeSize: number;
}

export const DEFAULT_FONT_STATE: FontState = {
    sans: FONT_SANS_OPTIONS[0].value,
    code: FONT_CODE_OPTIONS[0].value,
    sansSize: 16,
    codeSize: 14,
};

function resolveFontVar(
    options: FontOption[],
    value: string, 
    fallback: string
): string {
    return (options.find((o) => o.value === value)
        ?? options.find((o) => o.value === fallback)
        ?? options[0]).cssVar;
}

export default function FontScript() {
    useEffect(() => {
        function setFont(sans: string, code: string, sansSize: number, codeSize: number) {
            const target = document.documentElement;
            const sansVar = resolveFontVar(FONT_SANS_OPTIONS, sans, DEFAULT_FONT_STATE.sans);
            const codeVar = resolveFontVar(FONT_CODE_OPTIONS, code, DEFAULT_FONT_STATE.code);

            target.style.setProperty('--font-family-sans', `var(${sansVar})`);
            target.style.setProperty('--font-family-code', `var(${codeVar})`);
            target.style.setProperty('--font-size', `${sansSize}px`);
            target.style.setProperty('--font-size-code', `${codeSize}px`);
        }

        (window as any).setFont = setFont;

        const d = DEFAULT_FONT_STATE;
        setFont(d.sans, d.code, d.sansSize, d.codeSize);
    }, []);

    return null;
}

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