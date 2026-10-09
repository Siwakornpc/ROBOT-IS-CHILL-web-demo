import MenuSelect from "@/components/MenuSelect";

function formatMs(value?: number) {
    return value == null
        ? "0ms"
        : `${value.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        })}ms`;
}

export function StatusBar({
    small = false,
    collapse = false,
    isRunning = false,
    onRun,
    startupMs,
    renderMs,
}: {
    small?: boolean;
    collapse?: boolean;
    isRunning?: boolean;
    onRun?: () => void;
    startupMs?: number;
    renderMs?: number;
}) {
    return (
        <div className="status-bar">
            {!collapse
                ?<>
                    <div className="status">
                        {small
                            ? <span className="status-label icon">speed</span>
                            : <span className="status-label">Startup Time</span>
                        }
                        <span className="status-value">{formatMs(startupMs)}</span>
                    </div>
                    <div className="status">
                        {small
                            ? <span className="status-label icon">layers</span>
                            : <span className="status-label">Render Time</span>
                        }
                        <span className="status-value">{formatMs(renderMs)}</span>
                    </div>
                </>
                :
                <MenuSelect
                    id="status-collapsed"
                    title="Status:"
                    value=""
                    options={[]}
                    content={
                        <div
                            className="flex flex-col ps-[4px]"
                            style={{ color: "rgb(var(--md-color-outline))" }}
                        >
                            <div
                                className="flex gap-[8px] items-center p-[12px]"
                            >
                                <i className="icon menu-option-icon">speed</i>
                                <div>
                                    <span className="status-value">{formatMs(startupMs)}</span>
                                </div>
                            </div>

                            <div
                                className="flex gap-[8px] items-center p-[12px]"
                            >
                                <i className="icon menu-option-icon">layers</i>
                                <div>
                                    <span className="status-value">{formatMs(renderMs)}</span>
                                </div>
                            </div>

                        </div>
                    }
                    trigger={({getInputProps}) => (
                        <button
                            {...getInputProps()}
                            type="button"
                            className="menu-trigger status status-btn"
                        ><i className="icon">more_horiz</i>
                        </button>
                    )}
                    onChange={() => {}}
                />
            }
            <button
                type="button"
                id="run-button"
                className="status status-btn"
                onClick={onRun}
                aria-label={isRunning ? "Stop render" : "Run render"}
                title={isRunning ? "Stop render" : "Run render"}
            ><i className="icon">{isRunning ? "stop" : "play_arrow"}</i>
            </button>
        </div>
    );
}