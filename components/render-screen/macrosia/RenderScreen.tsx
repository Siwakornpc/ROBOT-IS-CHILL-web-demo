import applyOverflowFade from "@/components/OverflowFade";

export function RenderScreen() {
    return (
        <div
            ref={(el) => applyOverflowFade(el, "y")}
            className="render-screen ascroll-y"
        >
            <div id="render-output"></div>
        </div>
    );
}
