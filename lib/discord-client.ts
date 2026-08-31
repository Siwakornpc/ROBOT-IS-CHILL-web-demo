export type DiscordUser = {
    username: string;
    display_name: string | null;
    profile: string;
};

export async function getUser(id: string): Promise<DiscordUser> {
    const response = await fetch(`/api/discord-user?id=${encodeURIComponent(id)}`);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch user (${response.status}): ${error}`);
    }
    return response.json();
}
