import { Header } from "@/components/Header";
import type { Metadata } from "next";
import {
    IBM_Plex_Mono,
    Nunito_Sans,
} from "next/font/google";
import "./globals.css";
import ThemeScript from '@/components/themescript';

const nunitoSans = Nunito_Sans({
    subsets: ["latin"],
    variable: "--font-family-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    variable: "--font-family-code",
    weight: "400",
});

export const metadata: Metadata = {
    title: "Robot Is Chill Web Demo",
    description: "A free web demo of the Discord Bot: ROBOT IS CHILL in Vercel App",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${nunitoSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
        >
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=search,description,globe,settings,help,menu,check,close,add,remove,regular_expression"
                />
            </head>
            <body className="min-h-full flex flex-col">
                <ThemeScript />
                <Header />
                {children}
            </body>
        </html>
    );
}
