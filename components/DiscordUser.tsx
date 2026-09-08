"use client";

import { useEffect, useState } from "react";
import type { DiscordUser as DiscordUserData } from "@/lib/discord-client";

type DiscordUserProps = {
    id: string;
};

const userCache = new Map<string, DiscordUserData>();
const userPromises = new Map<string, Promise<DiscordUserData>>();

function fetchDiscordUser(id: string): Promise<DiscordUserData> {
    const cached = userCache.get(id);
    if (cached) return Promise.resolve(cached);

    const existingPromise = userPromises.get(id);
    if (existingPromise) return existingPromise;

    const promise = fetch(
        `/api/discord-user?id=${encodeURIComponent(id)}`
    )
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch user (${response.status})`
                );
            }

            return response.json();
        })
        .then((data: DiscordUserData) => {
            userCache.set(id, data);
            userPromises.delete(id);
            return data;
        })
        .catch((error) => {
            userPromises.delete(id);
            throw error;
        });

    userPromises.set(id, promise);

    return promise;
}

export function DiscordUser({ id }: DiscordUserProps) {
    const [user, setUser] = useState<DiscordUserData | null>(
        () => userCache.get(id) ?? null
    );

    useEffect(() => {
        let cancelled = false;

        fetchDiscordUser(id)
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
            <span className="user-profile">
                <img src={user.profile} alt="" />
            </span>
            <span className="display-name">{user.display_name}</span>
            <span className="username">{user.username}</span>
        </a>
    );
}

export function useDiscordUser(id: string) {
    const [user, setUser] = useState<DiscordUserData | null>(() => userCache.get(id) ?? null);
    const [loading, setLoading] = useState(() => !userCache.has(id));

    useEffect(() => {
        const cached = userCache.get(id);

        if (cached) {
            setUser(cached);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetchDiscordUser(id)
            .then((data) => {
                if (!cancelled) {
                    setUser(data);
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch Discord user:", error);

                if (!cancelled) {
                    setUser(null);
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    return { user, loading };
}