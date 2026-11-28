"use client";

import { useSyncExternalStore } from "react";

export const WHITESPACE_ICONS = ["space", "tab", "line-break"] as const;
export type WhitespaceIcon = typeof WHITESPACE_ICONS[number];

export type EditorSettings = {
    showLineNumbers: boolean;
    showWhitespace: boolean;
    whitespaceIcons: WhitespaceIcon[];
    showIndentGuides: boolean;
    tabSize: number;
};

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
    showLineNumbers: true,
    showWhitespace: false,
    whitespaceIcons: [...WHITESPACE_ICONS],
    showIndentGuides: true,
    tabSize: 4,
};

export const EDITOR_TAB_SIZE_CHANGE_EVENT = "editortabsizechange";

const STORAGE_KEY = "editorSettings";
const listeners = new Set<() => void>();
let currentSettings = DEFAULT_EDITOR_SETTINGS;
let initialized = false;

function readStoredSettings(): EditorSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_EDITOR_SETTINGS;

        const parsed: unknown = JSON.parse(stored);
        if (!parsed || typeof parsed !== "object") return DEFAULT_EDITOR_SETTINGS;

        const value = parsed as Partial<EditorSettings>;
        const storedSettings = parsed as Record<string, unknown>;
        const storedWhitespace = storedSettings.showWhitespace;
        const storedWhitespaceIcons = storedSettings.whitespaceIcons;
        return {
            showLineNumbers: typeof value.showLineNumbers === "boolean"
                ? value.showLineNumbers
                : DEFAULT_EDITOR_SETTINGS.showLineNumbers,
            showWhitespace: typeof storedWhitespace === "boolean"
                ? storedWhitespace
                : true,
            whitespaceIcons: Array.isArray(storedWhitespaceIcons)
                ? WHITESPACE_ICONS.filter((icon) => storedWhitespaceIcons.includes(icon))
                : Array.isArray(storedWhitespace)
                    ? WHITESPACE_ICONS.filter((icon) => storedWhitespace.includes(icon))
                    : [...WHITESPACE_ICONS],
            showIndentGuides: typeof value.showIndentGuides === "boolean"
                ? value.showIndentGuides
                : DEFAULT_EDITOR_SETTINGS.showIndentGuides,
            tabSize: typeof value.tabSize === "number" && Number.isInteger(value.tabSize) && value.tabSize >= 1 && value.tabSize <= 8
                ? value.tabSize
                : DEFAULT_EDITOR_SETTINGS.tabSize,
        };
    } catch (error) {
        console.error("Could not read editor settings:", error);
        return DEFAULT_EDITOR_SETTINGS;
    }
}

function notifyListeners() {
    listeners.forEach((listener) => listener());
}

function initialize() {
    if (initialized) return;
    initialized = true;
    currentSettings = readStoredSettings();
}

function subscribe(listener: () => void) {
    initialize();
    listeners.add(listener);

    const handleStorage = (event: StorageEvent) => {
        if (event.key !== STORAGE_KEY) return;
        const previousTabSize = currentSettings.tabSize;
        currentSettings = readStoredSettings();
        notifyListeners();
        if (currentSettings.tabSize !== previousTabSize)
            window.dispatchEvent(new Event(EDITOR_TAB_SIZE_CHANGE_EVENT));
    };
    window.addEventListener("storage", handleStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", handleStorage);
    };
}

function getSnapshot() {
    return currentSettings;
}

export function getEditorSettings() {
    initialize();
    return currentSettings;
}

function getServerSnapshot() {
    return DEFAULT_EDITOR_SETTINGS;
}

export function useEditorSettings() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateEditorSettings(updates: Partial<EditorSettings>) {
    initialize();
    const previousTabSize = currentSettings.tabSize;
    currentSettings = { ...currentSettings, ...updates };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch (error) {
        console.error("Could not save editor settings:", error);
    }

    notifyListeners();
    if (currentSettings.tabSize !== previousTabSize)
        window.dispatchEvent(new Event(EDITOR_TAB_SIZE_CHANGE_EVENT));
}
