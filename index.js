// Cloudflare Worker: thin Discord user-lookup proxy
// Deploy with: wrangler deploy
// Requires one secret: DISCORD_BOT_TOKEN (set via `wrangler secret put DISCORD_BOT_TOKEN`)

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/users\/(\d{17,20})$/);

    if (!match) {
      return json({ error: "Use /users/:id with a valid Discord snowflake" }, 400);
    }

    const userId = match[1];

    // Basic in-memory rate limit could go here (per-IP), omitted for brevity.

    const discordRes = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (discordRes.status === 404) {
      return json({ error: "No user with that ID" }, 404);
    }

    if (!discordRes.ok) {
      // Bot tokens can only fetch bots + users that share a guild with the bot,
      // or any user in newer API versions depending on intents/scopes.
      return json(
        { error: "Discord API error", status: discordRes.status },
        502
      );
    }

    const user = await discordRes.json();

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png`;

    return json({
      id: user.id,
      username: user.username,
      displayName: user.global_name || user.username,
      avatarUrl,
      publicFlags: user.public_flags,
    });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // tighten to your domain in production
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}