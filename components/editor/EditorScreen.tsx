"use client";

import { useRef, useState } from "react";
import { useEditorEngine } from "./useEditorEngine";
import { AutocompleteDropdown, SuggestionItem } from "./autocompleteDropdown";
import "./editorReady";

export function EditorScreen({ onCodeChange }: { onCodeChange?: (code: string) => void }) {
    const editorAreaRef = useRef<HTMLDivElement | null>(null);
    const gutterElRef = useRef<HTMLDivElement | null>(null);
    const gutterWrapRef = useRef<HTMLDivElement | null>(null);
    const scrollElRef = useRef<HTMLDivElement | null>(null);
    const insertSuggestionRef = useRef<((startIndex: number, text: string, type?: "macro" | "variant" | "tile" | undefined) => void) | null>(null);

    const [autoComplete, setAutoComplete] = useState({
        isOpen: false,
        query: "",
        suggestions: [] as SuggestionItem[],
        position: { top: 0, left: 0 },
        startIndex: 0,
        type: "macro" as const,
    });

    const handleSelectSuggestion = (item: SuggestionItem) => {
        if (insertSuggestionRef.current)
            insertSuggestionRef.current(autoComplete.startIndex, item.label, item.type);
        setAutoComplete(prev => ({ ...prev, isOpen: false }));
    };

    useEditorEngine({
        editorAreaRef,
        gutterElRef,
        gutterWrapRef,
        scrollElRef,
        onCodeChange,
        onAutocompleteChange: (state: any) => setAutoComplete(state),
        onInsertSuggestionRef: insertSuggestionRef,
    });

    return (
        <div className="editor-code">
            <div className="editor-body-row">
                <div className="editor-gutter-wrap" id="editor-gutter-wrap" ref={gutterWrapRef}>
                    <div className="editor-gutter" id="editor-gutter" ref={gutterElRef}></div>
                </div>
                <div className="editor-text ascroll-y" id="editor-text-scroll" ref={scrollElRef}>
                    <div
                        id="editor-area"
                        className="editor-input"
                        contentEditable="true"
                        spellCheck="false"
                        autoCapitalize="off"
                        autoCorrect="off"
                        translate="no"
                        role="textbox"
                        aria-multiline="true"
                        ref={editorAreaRef}
                    ></div>
                </div>
            </div>

            <AutocompleteDropdown
                isOpen={autoComplete.isOpen}
                query={autoComplete.query}
                suggestions={autoComplete.suggestions}
                position={autoComplete.position}
                onSelect={handleSelectSuggestion}
                onClose={() => setAutoComplete(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

export default EditorScreen;