'use client';

import { useEffect } from 'react';

export interface FontOption {
    value: string;
    label: string;
    cssVar: string;
}

export const FONT_SANS_OPTIONS: FontOption[] = [
    { value: "nunito-sans", label: "Nunito Sans", cssVar: "--font-nunito-sans" },
    { value: "ibm-plex-sans", label: "IBM Plex Sans", cssVar: "--font-ibm-plex-sans" },
    { value: "inter", label: "Inter", cssVar: "--font-inter" },
    { value: "google-sans", label: "Google Sans", cssVar: "--font-google-sans" },
];

export const FONT_CODE_OPTIONS: FontOption[] = [
    { value: "ibm-plex-mono", label: "IBM Plex Mono", cssVar: "--font-ibm-plex-mono" },
    { value: "jetbrains-mono", label: "JetBrains Mono", cssVar: "--font-jetbrains-mono" },
    { value: "bytesized", label: "Bytesized", cssVar: "--font-bytesized" },
    { value: "cascadia-code", label: "Cascadia Code", cssVar: "--font-cascadia-code" },
];

export interface FontState {
    sans: string;       // e.g. "nunito-sans" | "inter"
    code: string;        // e.g. "ibm-plex-mono" | "jetbrains-mono"
    sansSize: number;    // px
    codeSize: number;    // px
}

export const DEFAULT_FONT_STATE: FontState = {
    sans: FONT_SANS_OPTIONS[0].value,
    code: FONT_CODE_OPTIONS[0].value,
    sansSize: 16,
    codeSize: 14,
};

function resolveFontVar(options: FontOption[], value: string, fallback: string): string {
    return (options.find((o) => o.value === value) ?? options.find((o) => o.value === fallback) ?? options[0]).cssVar;
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