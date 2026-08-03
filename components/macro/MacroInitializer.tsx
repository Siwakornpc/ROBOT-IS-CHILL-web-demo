"use client";

import { useEffect } from "react";
import { initMacro } from "@/components/macro/macroscript";

export default function MacroInitializer() {
    useEffect(() => {
        initMacro();
    }, []);

    return null;
}
