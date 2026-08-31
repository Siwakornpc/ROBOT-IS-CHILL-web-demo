import { Client } from "discord.js";

const client = new Client({
    intents: []
});

let loggedIn = false;

async function getClient() {
    if (!loggedIn) {
        await client.login(process.env.BOT_TOKEN);
        loggedIn = true;
    }

    return client;
}

export async function getUser(id: string) {
    const client = await getClient();
    const user = await client.users.fetch(id);

    return {
        username: user.username,
        display_name: user.globalName,
        profile: user.displayAvatarURL({size: 256})
    };
}