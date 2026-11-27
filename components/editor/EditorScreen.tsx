"use client";

import { useRef, useState, useEffect } from "react";
import { useEditorEngine, type HoverState, type HoverControls } from "./useEditorEngine";
import { useEditorSettings } from "./editorSettings";
import { AutocompleteDropdown, SuggestionItem } from "./autocompleteDropdown";
import { HoverTooltip } from "./hoverTooltip";
import "./editorReady";

export function EditorScreen({
    onCodeChange,
    defaultCode = "",
    className = "",
}: {
    onCodeChange?: (code: string) => void;
    defaultCode?: string;
    className?: string;
}) {
    const editorSettings = useEditorSettings();
    const editorAreaRef = useRef<HTMLDivElement | null>(null);
    const gutterElRef = useRef<HTMLDivElement | null>(null);
    const gutterWrapRef = useRef<HTMLDivElement | null>(null);
    const scrollElRef = useRef<HTMLDivElement | null>(null);
    const insertSuggestionRef = useRef<((startIndex: number, text: string, focusEditor: boolean) => void) | null>(null);

    const hoverControlsRef = useRef<HoverControls | null>(null);
    const [hover, setHover] = useState<HoverState>({ isOpen: false });

    const [autoComplete, setAutoComplete] = useState({
        isOpen: false,
        query: "",
        suggestions: [] as SuggestionItem[],
        position: { top: 0, left: 0 },
        startIndex: 0,
        type: "macro" as const,
        triggerChar: undefined as string | undefined,
    });

    const handleSelectSuggestion = (item: SuggestionItem, source: "mouse" | "keyboard") => {
        if (insertSuggestionRef.current)
            insertSuggestionRef.current(autoComplete.startIndex, item.label, source === "mouse");
        setAutoComplete(prev => ({ ...prev, isOpen: false }));
    };

    useEditorEngine({
        editorAreaRef,
        gutterElRef,
        gutterWrapRef,
        scrollElRef,
        defaultCode,
        onCodeChange,
        onAutocompleteChange: (state: any) => setAutoComplete(state),
        onInsertSuggestionRef: insertSuggestionRef,
        onHoverChange: setHover,
        onHoverControlsRef: hoverControlsRef,
    });

    return (
        <div className={`editor-code ${className}`}>
            <div className="editor-body-row ascroll-y" id="editor-text-scroll" ref={scrollElRef}>
                <div
                    className="editor-gutter-wrap"
                    id="editor-gutter-wrap"
                    ref={gutterWrapRef}
                    hidden={!editorSettings.showLineNumbers}
                >
                    <div className="editor-gutter" id="editor-gutter" ref={gutterElRef}></div>
                </div>
                <div className="editor-text" id="editor-text-scroll-inner">
                    <div
                        id="editor-area"
                        className={[
                            "editor-input",
                            editorSettings.showWhitespace && "editor-show-whitespace",
                            editorSettings.showIndentGuides && "editor-indent-guides",
                        ].filter(Boolean).join(" ")}
                        style={{ "--editor-tab-size": editorSettings.tabSize } as React.CSSProperties}
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
                triggerChar={autoComplete.triggerChar}
                onSelect={handleSelectSuggestion}
                onClose={() => setAutoComplete(prev => ({ ...prev, isOpen: false }))}
            />

            {hover.isOpen && (
                <HoverTooltip
                    key={hover.name}
                    isOpen
                    name={hover.name}
                    description={hover.description}
                    value={hover.value}
                    creator={hover.creator}
                    builtin={hover.builtin}
                    anchor={hover.anchor}
                    onMouseEnter={() => hoverControlsRef.current?.hold()}
                    onMouseLeave={() => hoverControlsRef.current?.release()}
                />
            )}
        </div>
    );
}

export default EditorScreen;