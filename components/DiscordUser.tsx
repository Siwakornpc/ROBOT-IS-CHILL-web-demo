"use client";

import { useEffect, useState } from "react";
import type { DiscordUser as DiscordUserData } from "@/lib/discord-client";

type DiscordUserProps = {
    id: string;
};

export function DiscordUser({ id }: DiscordUserProps) {
    const [user, setUser] = useState<DiscordUserData | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(`/api/discord-user?id=${encodeURIComponent(id)}`)
            .then(async (response) => {
                if (!response.ok) throw new Error(`Failed to fetch user (${response.status})`);

                return response.json();
            })
            .then((data) => {
                if (!cancelled) setUser(data);
            })
            .catch((error) => {
                console.error("Failed to fetch Discord user:", error);
                if (!cancelled) setUser(null);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (!user) return null;

    return (
        <a
            className="search-details-user"
            target="_blank"
            href={`https://discord.com/users/${id}`}
        >
            <span className="user-profile"><img src={user.profile} alt=""/></span>
            <span className="display-name">{user.display_name}</span>
            <span className="username">{user.username}</span>
        </a>
    );
}

export function useDiscordUser(id: string) {
    const [user, setUser] = useState<DiscordUserData | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(`/api/discord-user?id=${encodeURIComponent(id)}`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch user (${response.status})`
                    );
                }

                return response.json();
            })
            .then((data) => {
                if (!cancelled) {
                    setUser(data);
                }
            })
            .catch((error) => {
                console.error(
                    "Failed to fetch Discord user:",
                    error
                );

                if (!cancelled) {
                    setUser(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    return user;
}