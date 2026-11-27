"use client";

import { useSyncExternalStore } from "react";

export type EditorSettings = {
    showLineNumbers: boolean;
    showWhitespace: boolean;
    showIndentGuides: boolean;
    tabSize: number;
};

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
    showLineNumbers: true,
    showWhitespace: true,
    showIndentGuides: true,
    tabSize: 4,
};

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
        return {
            showLineNumbers: typeof value.showLineNumbers === "boolean"
                ? value.showLineNumbers
                : DEFAULT_EDITOR_SETTINGS.showLineNumbers,
            showWhitespace: typeof value.showWhitespace === "boolean"
                ? value.showWhitespace
                : DEFAULT_EDITOR_SETTINGS.showWhitespace,
            showIndentGuides: typeof value.showIndentGuides === "boolean"
                ? value.showIndentGuides
                : DEFAULT_EDITOR_SETTINGS.showIndentGuides,
            tabSize: typeof value.tabSize === "number" && [2, 4, 8].includes(value.tabSize)
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
        currentSettings = readStoredSettings();
        notifyListeners();
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
    currentSettings = { ...currentSettings, ...updates };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch (error) {
        console.error("Could not save editor settings:", error);
    }

    notifyListeners();
}
