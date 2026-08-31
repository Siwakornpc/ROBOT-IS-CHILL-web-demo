"use client";

import { useState } from "react";

export default function TestingPage() {
    const [username, setUsername] = useState(null);

    async function test() {
        const response = await fetch(
            "/api/username?id=842018963248513074"
        );

        const data = await response.json();

        setUsername(data.username);
    }

    test();

    return (
        <div>
            {username && (
                <p>Username: {username}</p>
            )}
        </div>
    );
}
