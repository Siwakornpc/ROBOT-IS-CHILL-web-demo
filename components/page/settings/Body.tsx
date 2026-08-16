"use client";

import { EditorScreen } from "@/components/editor/EditorScreen";

export default function Body() {
    return (
        <main style={{ width: "stretch" }}>
            <div className="main-body">
                <p className="text-label">Settings</p>
                <hr />
                <EditorScreen />
            </div>
        </main>
    );
}
