import MenuSelect from "@/components/MenuSelect";

export function StatusBar({
    small = false,
    collapse = false,
}: {
    small?: boolean;
    collapse?: boolean;
}) {
    return (
        <div className="status-bar">
            {!collapse
                ?<>
                    <div className="status">
                        {small
                            ? <span className="status-label icon emph">directions_walk</span>
                            : <span className="status-label emph">Steps</span>
                        }
                        <span className="status-value" id="status-steps">0</span>
                    </div>
                    <div className="status">
                        {small
                            ? <span className="status-label icon">speed</span>
                            : <span className="status-label">Time</span>
                        }
                        <span className="status-value" id="status-time">0ms</span>
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
                                <i className="icon menu-option-icon">directions_walk</i>
                                <div>
                                    <span className="status-value" id="status-steps">0</span>
                                </div>
                            </div>

                            <div
                                className="flex gap-[8px] items-center p-[12px]"
                            >
                                <i className="icon menu-option-icon">speed</i>
                                <div>
                                <span className="status-value" id="status-time">0ms</span>
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
                id="run-button"
                className="status status-btn"
            ><i className="icon">play_arrow</i>
            </button>
        </div>
    );
}