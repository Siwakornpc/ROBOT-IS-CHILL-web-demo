import type { NextConfig } from "next";

/** @type {import('next').Config} */
const nextConfig = {
    serverExternalPackages: ["discord.js"],
    
    async rewrites() {
        return [
            {
                source: '/api/external-data/:path*',
                destination: 'https://blocked-domain.com*', // The URL throwing CORB
            },
        ];
    },
};

export default nextConfig;
