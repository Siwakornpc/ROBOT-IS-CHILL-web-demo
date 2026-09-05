'use client';

import { useEffect } from 'react';

export interface FontOption {
    value: string;
    label: string;
    fontFamily: string; // must exactly match a family= name in the @import in globals.css
}

export const FONT_SANS_OPTIONS: FontOption[] = [
    { value: "nunito", label: "Nunito", fontFamily: "Nunito" },
    { value: "inter", label: "Inter", fontFamily: "Inter" },
    { value: "ibm-plex-sans", label: "IBM Plex Sans", fontFamily: "IBM Plex Sans" },
    { value: "google-sans", label: "Google Sans", fontFamily: "Google Sans" },
    { value: "valley-sans", label: "Valley Sans", fontFamily: "Valley Sans" },
];

export const FONT_CODE_OPTIONS: FontOption[] = [
    { value: "ibm-plex-mono", label: "IBM Plex Mono", fontFamily: "IBM Plex Mono" },
    { value: "jetbrains-mono", label: "JetBrains Mono", fontFamily: "JetBrains Mono" },
    { value: "geist-mono", label: "Geist Mono", fontFamily: "Geist Mono" },
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

function resolveFontFamily(options: FontOption[], value: string, fallback: string): string {
    return (options.find((o) => o.value === value) ?? options.find((o) => o.value === fallback) ?? options[0]).fontFamily;
}

export default function FontScript() {
    useEffect(() => {
        function setFont(sans: string, code: string, sansSize: number, codeSize: number) {
            const target = document.documentElement;
            const sansFamily = resolveFontFamily(FONT_SANS_OPTIONS, sans, DEFAULT_FONT_STATE.sans);
            const codeFamily = resolveFontFamily(FONT_CODE_OPTIONS, code, DEFAULT_FONT_STATE.code);

            target.style.setProperty('--font-family-sans', `"${sansFamily}", sans-serif`);
            target.style.setProperty('--font-family-code', `"${codeFamily}", monospace`);
            target.style.setProperty('--font-size', `${sansSize}px`);
            target.style.setProperty('--font-size-code', `${codeSize}px`);
        }

        (window as any).setFont = setFont;

        const d = DEFAULT_FONT_STATE;
        setFont(d.sans, d.code, d.sansSize, d.codeSize);
    }, []);

    return null;
}