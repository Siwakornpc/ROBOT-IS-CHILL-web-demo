"use client";

import { useState } from "react";
import { EditorScreen } from "@/components/editor/EditorScreen";

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <p className="text-label">Settings</p>
                <hr />

                {
                    // Fonts Section
                }

                <p className="text-label text-xl">Fonts</p>

                <div className="box-hole">

                    <span className="row-group">
                        <p className="text-label text-main-name">Sans Serif Font</p>

                        <button
                            type="button"
                            className="drop-down"
                        >
                            PLACEHOLDER
                        </button>
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font</p>

                        <button
                            type="button"
                            className="drop-down"
                        >
                            PLACEHOLDER
                        </button>
                    </span>

                    <span className="row-group">
                        <p className="text-label text-main-name">Monospace Font Size</p>

                        <button
                            type="button"
                            className="drop-down"
                        >
                            PLACEHOLDER
                        </button>
                    </span>

                </div>

                <hr />

                {
                    // Theme Section
                }

                <p className="text-label text-xl">Theme</p>

                <div className="box-hole">

                    PLACEHOLDER

                </div>

            </div>
        </main>
    );
}