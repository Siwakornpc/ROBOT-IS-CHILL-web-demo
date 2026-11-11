"use client";

import { useState, useEffect } from "react";

type Contributor = {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
};

export function Contributors() {
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("https://api.github.com/repos/Siwakornpc/ROBOT-IS-CHILL-web-demo/contributors")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setContributors(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading contributors...</p>;
    }

    if (contributors.length === 0) {
        return <p className="text-sm text-muted-foreground">No contributors found or rate limit reached.</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {contributors.map((user) => (
                <a
                    key={user.id}
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contributor"
                >
                    <img
                        src={user.avatar_url}
                        alt={user.login}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    <div className="overflow-hidden">
                        <p className="font-medium text-sm truncate">{user.login}</p>
                        <p className="text-xs text-muted-foreground">
                            {user.contributions} {user.contributions === 1 ? "contribution" : "contributions"}
                        </p>
                    </div>
                </a>
            ))}
        </div>
    );
}

export default Contributors;