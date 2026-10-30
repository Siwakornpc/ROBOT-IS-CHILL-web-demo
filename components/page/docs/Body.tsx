import { useState, useEffect } from "react";
import { DiscordMarkdown } from "@/components/DiscordMarkdown";

export default function Body() {
    const [files, setFiles] = useState<string[] | null>(null);
    const [fileText, setFileText] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const docsPath = 'docs';
    const [initialized, setInitialized] = useState(false);

    async function read(file: string) {
        setError(null);
        setFileText(null);

        try {
            const response = await fetch(`/api/read-files?path=${encodeURIComponent(file)}`);

            if (!response.ok) {
                throw new Error('Could not read file');
            }

            setSelectedFile(file.split('/').pop() ?? file);
            setFileText(await response.text());
        } catch {
            setError('Could not read file');
        }
    }

    useEffect(() => {
        const url = new URL(window.location.href);
        const page = url.searchParams.get("page");

        console.log(page);

        fetch(`/api/read-files?path=${encodeURIComponent(docsPath)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Could not list files');
                }
                return response.json();
            })
            .then(data => {
                setFiles(data.files);

                const selectedPage = page && data.files.includes(page)
                    ? page
                    : data.files[0];


                if (selectedPage) {
                    void read(`${docsPath}/${selectedPage}`);
                }

                setInitialized(true);
            })
            .catch(() => {
                setFiles([]);
                setInitialized(true);
            });
    }, []);

    useEffect(() => {
    if (!initialized) return;
        const url = new URL(window.location.href);

        if (selectedFile) {
            url.searchParams.set("page", selectedFile);
        } else {
            url.searchParams.delete("page");
        }

        window.history.replaceState({}, "", url.toString());
    }, [selectedFile, initialized]);

    return (
        <main className="ascroll-y w-full">
            {files !== null && (
                <div className="bg-[rgb(var(--md-color-surface-container))] w-full box-content ascroll-x h-[40px] scale-y-[-1] pb-[12px]">
                    <div className="flex scale-y-[-1]">
                        {files.map(file => (
                            <button
                                key={file} 
                                type="button" 
                                onClick={() => selectedFile !== file ? void read(`${docsPath}/${file}`) : ""}
                                className={`tab ${selectedFile === file ? "selected" : ""}`}
                            >
                                {file}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="main-body">
                {error !== null &&
                    (<p role="alert">
                        {error}
                    </p>)
                }
                {selectedFile !== null &&
                    (<>
                        <h2 className="text-label font-bold">
                            {selectedFile}
                        </h2>
                        <hr/>
                    </>)
                }
                {fileText !== null &&
                    (<DiscordMarkdown>
                        {fileText}
                    </DiscordMarkdown>)
                }
            </div>
        </main>
    );
}