"use client";

import { useRef } from "react";
import "@/components/highight/macro-highlight.js";
import "@/components/highight/render-highlight.js";
import { useEditorEngine } from "./useEditorEngine";
import "./editorReady";

export function EditorScreen() {
    const editorAreaRef = useRef<HTMLDivElement | null>(null);
    const gutterElRef = useRef<HTMLDivElement | null>(null);
    const gutterWrapRef = useRef<HTMLDivElement | null>(null);
    const scrollElRef = useRef<HTMLDivElement | null>(null);

    useEditorEngine({
        editorAreaRef,
        gutterElRef,
        gutterWrapRef,
        scrollElRef,
    });

    return (
        <div className="editor-container">
            <div className="editor-code">
                <div className="editor-body-row">
                    <div className="editor-gutter-wrap" id="editor-gutter-wrap" ref={gutterWrapRef}>
                        <div className="editor-gutter" id="editor-gutter" ref={gutterElRef}></div>
                    </div>
                    <div className="editor-text-scroll" id="editor-text-scroll" ref={scrollElRef}>
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
            </div>
            <div className="output-panel">
                <div id="output-screen"></div>
            </div>
        </div>
    );
}

export default EditorScreen;
